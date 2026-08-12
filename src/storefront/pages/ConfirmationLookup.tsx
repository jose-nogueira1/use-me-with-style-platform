import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, Clock3 } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { lookupOrder, type PublicOrderStatus } from '../../lib/api';
import { clearPendingOrderEmail, peekPendingOrderEmail } from '../../lib/pendingOrderEmail';
import { loadManualWhatsappPayload } from '../../lib/manualWhatsapp';

// AppyPay's charge is async (see AppyPayWidget.tsx): the customer's browser
// can land back here before the CMS webhook has verified/rejected the
// charge. Auto-poll while it stays 'pending', capped at this ceiling -- the
// manual lookup form below always remains available if it gives up.
const AUTO_POLL_INTERVAL_MS = 4_000;
const AUTO_POLL_TIMEOUT_MS = 3 * 60 * 1_000;

// Figma's "06. Confirmation and Lookup" combines the order-received hero
// with a status timeline AND an order-lookup form on one screen -- not two
// separate routes as the previous build had it. When arriving via
// /encomenda-confirmada/:orderNumber we pre-fill the hero + timeline for
// that order; when arriving via /conta directly, only the lookup form
// shows (no order in context yet).
const STATUS_STEPS = ['new', 'processing', 'shipped', 'delivered'] as const;
const STATUS_LABEL_KEY: Record<(typeof STATUS_STEPS)[number], string> = {
  new: 'statusReceived',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
};
// Covers the full backend order-status enum (see admin's statusBadgeProps in
// Badge.tsx for the authoritative list) -- STATUS_STEPS/STATUS_LABEL_KEY
// above only covers the 4 statuses that appear in the timeline, but
// 'payment_review' and 'cancelled' orders can also be looked up here, and
// previously fell through to a raw, untranslated `result.status` string
// (e.g. "payment_review") in the result card below.
const ALL_STATUS_LABEL_KEY: Record<string, string> = {
  new: 'statusReceived',
  payment_review: 'statusPaymentReview',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
};

export function ConfirmationLookup() {
  const { lang, dispatchCart } = useApp();
  const { orderNumber: routeOrderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const linkedOrderNumber = searchParams.get('order')?.trim() ?? '';
  const linkedEmail = searchParams.get('email')?.trim() ?? '';
  const [orderNumber, setOrderNumber] = useState(routeOrderNumber ?? linkedOrderNumber);
  // Recovered synchronously (not in an effect, so there's no first-frame
  // flash of the wrong hero) from whatever Checkout stashed right before the
  // AppyPay widget could redirect here. Only ever non-null for that exact
  // flow -- every other checkout path (Stripe/PayPal captured client-side,
  // manual/bank-transfer with no online step) never stashes anything, so
  // this whole auto-poll path is a no-op for them and they render exactly
  // as before. `peekPendingOrderEmail` only reads, so it's safe to call from
  // this lazy initializer even if React invokes it twice in dev StrictMode.
  const [autoEmail] = useState(() => (routeOrderNumber ? peekPendingOrderEmail(routeOrderNumber) : null));
  const [manualWhatsapp] = useState(() => (routeOrderNumber ? loadManualWhatsappPayload(routeOrderNumber) : null));
  const [email, setEmail] = useState(autoEmail ?? linkedEmail);
  const [result, setResult] = useState<PublicOrderStatus | null | 'not_found' | 'service_error'>(null);
  const [loading, setLoading] = useState(false);
  const [autoPolling, setAutoPolling] = useState(Boolean(autoEmail));
  const clearedAutoEmailRef = useRef(false);

  // Cart is cleared here, once we've actually landed on a real order
  // confirmation -- not from Checkout before navigating here. Checkout has
  // its own `if (cart.length === 0) navigate('/carrinho')` guard (for
  // people who land on /checkout with nothing in cart), and clearing the
  // cart there raced with navigating away from it: React 19 batches the
  // route change and the cart-reducer update into the same render pass
  // regardless of which line runs first in the source, so that guard could
  // still fire and send the buyer to "Your cart is empty" instead of this
  // page, even after a real, successfully paid order. Clearing it here
  // instead -- after Checkout is already unmounted -- sidesteps the race
  // entirely.
  useEffect(() => {
    if (routeOrderNumber) dispatchCart({ type: 'CLEAR' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOrderNumber]);

  // One-time consume of the stashed email now that it's actually been used
  // (a page refresh on this same URL later shouldn't re-trigger auto-poll --
  // by then the manual lookup form covers it). The ref guard makes this
  // idempotent under React 18 StrictMode's dev-only mount/cleanup/remount.
  useEffect(() => {
    if (autoEmail && routeOrderNumber && !clearedAutoEmailRef.current) {
      clearedAutoEmailRef.current = true;
      clearPendingOrderEmail(routeOrderNumber);
    }
  }, [autoEmail, routeOrderNumber]);

  // Auto-poll order status while AppyPay's webhook hasn't resolved it yet.
  // paymentStatus (not status) is the right signal here: a successfully
  // webhook-verified AppyPay order can still sit at status 'new'/
  // 'payment_review' pending an admin's manual "Confirm payment" click (see
  // OrderDetail.tsx's NEXT_STEP map) -- paymentStatus is what the webhook
  // itself actually sets to 'paid'/'failed'.
  useEffect(() => {
    if (!routeOrderNumber || !autoEmail) return;
    let cancelled = false;
    let timer: ReturnType<typeof window.setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      if (cancelled) return;
      try {
        const order = await lookupOrder(routeOrderNumber, autoEmail);
        if (cancelled) return;
        if (order) {
          setResult(order);
          if (order.paymentStatus !== 'pending') {
            setAutoPolling(false);
            return;
          }
        }
      } catch (err) {
        console.error('Auto payment-status poll failed', err);
        // Transient (network blip, cold start) -- keep retrying until the
        // timeout below rather than giving up on the first failure.
      }
      if (cancelled) return;
      if (Date.now() - startedAt >= AUTO_POLL_TIMEOUT_MS) {
        setAutoPolling(false);
        return;
      }
      timer = window.setTimeout(poll, AUTO_POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [routeOrderNumber, autoEmail]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const order = await lookupOrder(orderNumber.trim(), email.trim());
      setResult(order ?? 'not_found');
    } catch (err) {
      console.error('Order lookup failed', err);
      setResult('service_error');
    } finally {
      setLoading(false);
    }
  };

  const activeStatusIdx = result && result !== 'not_found' && result !== 'service_error'
    ? STATUS_STEPS.findIndex((s) => s === result.status)
    : -1;

  const resolvedOrder = result && result !== 'not_found' && result !== 'service_error' ? result : null;
  // !autoEmail covers every non-AppyPay checkout path (Stripe/PayPal/manual)
  // -- those already know their outcome by the time they navigate here, so
  // they keep the original unconditional "confirmed" hero. Only an AppyPay
  // redirect (autoEmail present) can land here before payment is verified.
  const heroKind: 'confirmed' | 'pending' | 'failed' =
    !autoEmail || resolvedOrder?.paymentStatus === 'paid'
      ? 'confirmed'
      : resolvedOrder?.paymentStatus === 'failed'
        ? 'failed'
        : 'pending';

  return (
    <div>
      {routeOrderNumber && heroKind === 'confirmed' && (
        <div style={{ background: C.heroBg, color: C.heroText, padding: '48px 24px 40px', textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 30,
              background: C.champagne,
            }}
          >
            <Check size={28} color={C.black} />
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{t('orderConfirmed', lang)}</h1>
          <div style={{ fontSize: 13, color: C.heroSubtitle, marginBottom: 20 }}>{t('thankYou', lang)}</div>
          <div style={{ background: C.heroFieldBg, border: `1px solid ${C.heroFieldBorder}`, borderRadius: 8, padding: 16, display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: C.heroSubtitle, textTransform: 'uppercase', letterSpacing: 1 }}>{t('orderNumber', lang)}</div>
            <div style={{ fontFamily: F.display, fontSize: 20, color: C.heroAccent, marginTop: 4, fontWeight: 800 }}>{routeOrderNumber}</div>
          </div>
          <div style={{ fontSize: 12, color: C.heroSubtitle, marginTop: 20, lineHeight: 1.6, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            {manualWhatsapp ? t('whatsappPendingNote', lang) : t('confirmationSentNote', lang)}
          </div>
          <div className="ump-confirmation-actions">
            {manualWhatsapp && <a className="ump-whatsapp-cta" href={manualWhatsapp.url} target="_blank" rel="noreferrer">{t('continueWhatsapp', lang)}</a>}
            <Link to="/" className="ump-confirmation-secondary">{t('continueShopping', lang)}</Link>
          </div>
        </div>
      )}

      {routeOrderNumber && heroKind === 'pending' && (
        <div role="status" aria-live="polite" style={{ background: C.heroBg, color: C.heroText, padding: '48px 24px 40px', textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 30,
              background: C.champagne,
            }}
          >
            <Clock3 size={26} color={C.black} />
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{t('paymentConfirming', lang)}</h1>
          <div style={{ fontSize: 13, color: C.heroSubtitle, marginBottom: 20 }}>
            {autoPolling ? t('paymentConfirmingNote', lang) : t('paymentStillPendingNote', lang)}
          </div>
          <div style={{ background: C.heroFieldBg, border: `1px solid ${C.heroFieldBorder}`, borderRadius: 8, padding: 16, display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: C.heroSubtitle, textTransform: 'uppercase', letterSpacing: 1 }}>{t('orderNumber', lang)}</div>
            <div style={{ fontFamily: F.display, fontSize: 20, color: C.heroAccent, marginTop: 4, fontWeight: 800 }}>{routeOrderNumber}</div>
          </div>
        </div>
      )}

      {routeOrderNumber && heroKind === 'failed' && (
        <div role="alert" style={{ background: C.heroBg, color: C.heroText, padding: '48px 24px 40px', textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 30,
              background: C.dangerBg,
            }}
          >
            <AlertTriangle size={26} color={C.danger} />
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{t('paymentFailedTitle', lang)}</h1>
          <div style={{ fontSize: 13, color: C.heroSubtitle, marginBottom: 20 }}>{t('paymentFailedNote', lang)}</div>
          <div style={{ background: C.heroFieldBg, border: `1px solid ${C.heroFieldBorder}`, borderRadius: 8, padding: 16, display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: C.heroSubtitle, textTransform: 'uppercase', letterSpacing: 1 }}>{t('orderNumber', lang)}</div>
            <div style={{ fontFamily: F.display, fontSize: 20, color: C.heroAccent, marginTop: 4, fontWeight: 800 }}>{routeOrderNumber}</div>
          </div>
        </div>
      )}

      <div className="ump-form-width" style={{ padding: '32px 20px' }}>
        {activeStatusIdx >= 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>{t('orderStatus', lang)}</div>
            <div className="ump-order-progress-track">
              <div className="ump-order-progress-line" aria-hidden="true">
                <div style={{ width: `${(activeStatusIdx / (STATUS_STEPS.length - 1)) * 100}%`, height: '100%', background: C.gold }} />
              </div>
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="ump-order-progress-step">
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: i <= activeStatusIdx ? C.gold : C.ruleLight,
                      color: i <= activeStatusIdx ? C.black : C.inkSoft,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {i <= activeStatusIdx ? <Check size={13} /> : i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="ump-order-progress-labels">
              {STATUS_STEPS.map((step) => (
                <div key={step} style={{ fontSize: 9, color: C.inkSoft, textAlign: 'center', lineHeight: 1.35 }}>
                  {t(STATUS_LABEL_KEY[step], lang)}
                </div>
              ))}
            </div>
          </div>
        )}

        {routeOrderNumber ? (
          <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, margin: '0 0 4px' }}>{t('trackAnotherOrder', lang)}</h2>
        ) : (
          <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, margin: '0 0 4px' }}>{t('trackAnotherOrder', lang)}</h1>
        )}
        <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 20 }}>{t('lookupOrderStatus', lang)}</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={t('orderNumber', lang)}
            required
            style={{ padding: '10px 12px', fontSize: 13, border: `1px solid ${C.fieldBorder}`, borderRadius: 6, background: C.paper }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email', lang)}
            type="email"
            required
            style={{ padding: '10px 12px', fontSize: 13, border: `1px solid ${C.fieldBorder}`, borderRadius: 6, background: C.paper }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: 12, background: C.ctaBg, border: `1px solid ${C.ctaBorder}`, color: C.onDarkGold, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8 }}
          >
            {loading ? '…' : t('trackOrder', lang)}
          </button>
        </form>

        {result === 'not_found' && (
          <div role="status" style={{ marginTop: 20, fontSize: 13, color: C.danger }}>{t('orderNotFound', lang)}</div>
        )}

        {result === 'service_error' && (
          <div role="alert" style={{ marginTop: 20, fontSize: 13, color: C.danger }}>
            {lang === 'pt'
              ? 'Não foi possível consultar a encomenda agora. Tente novamente dentro de instantes.'
              : 'We could not check the order right now. Please try again shortly.'}
          </div>
        )}

        {result && result !== 'not_found' && result !== 'service_error' && (
          <div style={{ marginTop: 20, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, color: C.ink, fontWeight: 800 }}>{result.orderNumber}</div>
            <div style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>
              {ALL_STATUS_LABEL_KEY[result.status] ? t(ALL_STATUS_LABEL_KEY[result.status], lang) : result.status}
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>
              {result.total} {result.currency}
            </div>
            {result.cttTrackingCode && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.ruleLight}` }}>
                <div style={{ fontSize: 10, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>{t('cttTrackingHeading', lang)}</div>
                <div style={{ fontSize: 13, color: C.ink, fontWeight: 800, marginTop: 5 }}>{result.cttTrackingCode}</div>
                <a
                  href="https://appserver.ctt.pt/CustomerArea/PublicArea"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 9, padding: '9px 13px', borderRadius: 6, background: C.ctaBg, border: `1px solid ${C.ctaBorder}`, color: C.onDarkGold, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
                >
                  {t('trackWithCtt', lang)}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
