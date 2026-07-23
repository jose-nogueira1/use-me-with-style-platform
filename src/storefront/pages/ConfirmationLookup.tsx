import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { lookupOrder, type PublicOrderStatus } from '../../lib/api';

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

export function ConfirmationLookup() {
  const { lang, dispatchCart } = useApp();
  const { orderNumber: routeOrderNumber } = useParams<{ orderNumber: string }>();
  const [orderNumber, setOrderNumber] = useState(routeOrderNumber ?? '');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<PublicOrderStatus | null | 'not_found' | 'service_error'>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div>
      {routeOrderNumber && (
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
            {t('confirmationSentNote', lang)}
          </div>
          <Link to="/" style={{ display: 'inline-block', marginTop: 16, fontSize: 11, color: C.heroAccent, fontWeight: 700, textDecoration: 'underline' }}>
            {t('continueShopping', lang)}
          </Link>
        </div>
      )}

      <div className="ump-narrow" style={{ padding: '32px 20px' }}>
        {activeStatusIdx >= 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>{t('orderStatus', lang)}</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STATUS_STEPS.map((step, i) => (
                <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
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
                    {i < activeStatusIdx ? <Check size={13} /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < activeStatusIdx ? C.gold : C.ruleLight }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 8 }}>
              {STATUS_STEPS.map((step) => (
                <div key={step} style={{ flex: 1, fontSize: 9, color: C.inkSoft, textAlign: 'center' }}>
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
            style={{ padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email', lang)}
            type="email"
            required
            style={{ padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: 12, background: C.black, color: C.onDarkGold, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8 }}
          >
            {loading ? '…' : t('trackOrder', lang)}
          </button>
        </form>

        {result === 'not_found' && (
          <div role="status" style={{ marginTop: 20, fontSize: 13, color: '#A6483A' }}>{t('orderNotFound', lang)}</div>
        )}

        {result === 'service_error' && (
          <div role="alert" style={{ marginTop: 20, fontSize: 13, color: '#A6483A' }}>
            {lang === 'pt'
              ? 'Não foi possível consultar a encomenda agora. Tente novamente dentro de instantes.'
              : 'We could not check the order right now. Please try again shortly.'}
          </div>
        )}

        {result && result !== 'not_found' && result !== 'service_error' && (
          <div style={{ marginTop: 20, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, color: C.ink, fontWeight: 800 }}>{result.orderNumber}</div>
            <div style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>{result.status}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>
              {result.total} {result.currency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
