import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import {
  createOrder,
  createStripeCheckoutSession,
  fetchMarketSettings,
  type CreateOrderInput,
  type MarketSettings,
} from '../../lib/api';
import { PaypalButton } from '../components/PaypalButton';

const SHIPPING_COST = { AO: 0, PT_ctt: 4, PT_courier_pt: 6 } as const;

const DEFAULT_MARKET_SETTINGS: MarketSettings = {
  angolaPaymentLive: false,
  angolaBankTransferInstructions:
    'Bank transfer (BAI) -- details are sent by WhatsApp once the order is confirmed.',
  portugalPaymentMethods: ['paypal', 'stripe', 'mbway'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  returnsPolicyText: '',
};

const PAYMENT_LABEL_KEYS: Record<string, string> = {
  paypal: 'paymentPaypal',
  stripe: 'paymentStripe',
  mbway: 'paymentMbway',
  bank_transfer_ao: 'paymentBankTransfer',
};

const DELIVERY_LABEL_KEYS: Record<string, string> = {
  ctt: 'deliveryCtt',
  courier_pt: 'deliveryCourier',
  manual_ao: 'deliveryManual',
};

export function Checkout() {
  const { market, setMarket, lang, cart, dispatchCart } = useApp();
  const { products } = useProducts(market);
  const navigate = useNavigate();

  const [settings, setSettings] = useState<MarketSettings>(DEFAULT_MARKET_SETTINGS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: market === 'AO' ? 'Angola' : 'Portugal',
    notes: '',
  });

  const deliveryOptions = market === 'AO' ? ['manual_ao'] : settings.portugalDeliveryMethods;
  const paymentOptions = market === 'AO' ? ['bank_transfer_ao'] : settings.portugalPaymentMethods;

  const [deliveryMethod, setDeliveryMethod] = useState(deliveryOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]);

  useEffect(() => {
    fetchMarketSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_MARKET_SETTINGS));
  }, []);

  // Stripe redirects back here (cancel_url) if the buyer backs out of
  // Checkout without paying -- surface that instead of silently landing on
  // an empty form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'cancelled') {
      setError(t('paymentCancelled', lang));
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDeliveryMethod(deliveryOptions[0]);
    setPaymentMethod(paymentOptions[0]);
    setForm((f) => ({ ...f, country: market === 'AO' ? 'Angola' : 'Portugal' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, settings]);

  if (cart.length === 0) {
    navigate('/carrinho');
    return null;
  }

  const items = cart
    .map((item) => {
      const p = products.find((p) => p.id === item.id);
      if (!p) return null;
      return {
        product: p.id,
        productName: p.name,
        size: item.size,
        color: item.color,
        qty: item.qty,
        unitPrice: market === 'AO' ? p.priceKz : p.priceEur,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const shippingCost =
    market === 'AO' ? SHIPPING_COST.AO : deliveryMethod === 'ctt' ? SHIPPING_COST.PT_ctt : SHIPPING_COST.PT_courier_pt;
  const total = subtotal + shippingCost;
  const fmt = (n: number) => (market === 'AO' ? `${n.toLocaleString('en-US')} Kz` : `€${n.toFixed(2)}`);

  const buildOrderInput = (): CreateOrderInput => ({
    market,
    customerName: form.name,
    customerPhone: form.phone,
    customerEmail: form.email,
    address: form.address,
    city: form.city,
    country: form.country,
    notes: form.notes || undefined,
    items,
    currency: market === 'AO' ? 'Kz' : 'EUR',
    subtotal,
    shippingCost,
    total,
    paymentMethod,
    deliveryMethod,
  });

  const validateRequiredFields = (): boolean => {
    if (!form.name || !form.phone || !form.email || !form.address || !form.city) {
      setError(t('fillRequiredFields', lang));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // PayPal has its own button/flow (see buildOrderInputForPaypal below) --
    // guards against an implicit form submit (e.g. pressing Enter in a
    // field) bypassing it, since no submit button is rendered in that case.
    if (paymentMethod === 'paypal') return;
    setError(null);
    if (!validateRequiredFields()) return;

    setSubmitting(true);
    try {
      if (paymentMethod === 'stripe') {
        const { sessionUrl } = await createStripeCheckoutSession(buildOrderInput());
        dispatchCart({ type: 'CLEAR' });
        window.location.href = sessionUrl;
        return; // navigating away -- no need to clear `submitting`
      }

      const order = await createOrder(buildOrderInput());
      dispatchCart({ type: 'CLEAR' });
      navigate(`/encomenda-confirmada/${order.orderNumber}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Order/payment creation failed', err);
      setError(paymentMethod === 'stripe' ? t('stripeUnavailable', lang) : t('orderFailed', lang));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaypalSuccess = (orderNumber: string) => {
    dispatchCart({ type: 'CLEAR' });
    navigate(`/encomenda-confirmada/${orderNumber}`);
  };

  /** PayPal's button fires its own createOrder callback on click, outside
   * the form's onSubmit -- so required-field validation has to happen here
   * too, not just in handleSubmit. */
  const buildOrderInputForPaypal = (): CreateOrderInput => {
    setError(null);
    if (!validateRequiredFields()) {
      throw new Error('Missing required fields');
    }
    return buildOrderInput();
  };

  return (
    <div className="ump-narrow" style={{ background: C.paper, paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: F.display, fontSize: 24, color: C.ink, fontWeight: 800, marginBottom: 12 }}>{t('checkout', lang)}</div>
        <div style={{ display: 'flex', background: C.subtleBg, borderRadius: 8, padding: 4, gap: 4 }}>
          {(['AO', 'PT'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                background: market === m ? C.black : 'transparent',
                color: market === m ? C.onDarkGold : C.inkSoft,
              }}
            >
              {t(m === 'AO' ? 'angola' : 'portugal', lang)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
        <Section title={t('contact', lang)}>
          <Field label={t('name', lang)} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label={t('phoneWhatsapp', lang)} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
          <Field label={t('email', lang)} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        </Section>

        <Section title={t('address', lang)}>
          <Field label={t('address', lang)} value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <Field label={t('city', lang)} value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          <Field label={t('country', lang)} value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
          <Field label={t('notesOptional', lang)} value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </Section>

        <Section title={t('delivery', lang)}>
          {deliveryOptions.map((opt) => (
            <RadioRow key={opt} checked={deliveryMethod === opt} onSelect={() => setDeliveryMethod(opt)} label={DELIVERY_LABEL_KEYS[opt] ? t(DELIVERY_LABEL_KEYS[opt], lang) : opt} />
          ))}
        </Section>

        <Section title={t('payment', lang)}>
          {paymentOptions.map((opt) => (
            <RadioRow key={opt} checked={paymentMethod === opt} onSelect={() => setPaymentMethod(opt)} label={PAYMENT_LABEL_KEYS[opt] ? t(PAYMENT_LABEL_KEYS[opt], lang) : opt} />
          ))}
          {market === 'AO' && (
            <div style={{ marginTop: 8, padding: 12, background: C.subtleBg, borderRadius: 6, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>
              {settings.angolaBankTransferInstructions}
            </div>
          )}
        </Section>

        <div style={{ background: C.subtleBg, borderRadius: 8, padding: 16, marginTop: 20, border: `1px solid ${C.ruleLight}` }}>
          <Row label={t('subtotal', lang)} value={fmt(subtotal)} />
          <Row label={t('shipping', lang)} value={shippingCost === 0 ? t('free', lang) : fmt(shippingCost)} />
          <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 8, paddingTop: 8 }}>
            <Row label={t('total', lang)} value={fmt(total)} bold />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#FBEAE4', color: '#A6483A', fontSize: 12, borderRadius: 6 }}>{error}</div>
        )}

        {paymentMethod === 'paypal' ? (
          <PaypalButton
            buildOrderInput={buildOrderInputForPaypal}
            onSuccess={handlePaypalSuccess}
            onError={(message) => setError(message)}
          />
        ) : (
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 14,
              background: submitting ? C.inkSoft : C.black,
              color: C.onDarkGold,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderRadius: 8,
            }}
          >
            {submitting ? (paymentMethod === 'stripe' ? t('stripeRedirecting', lang) : '…') : `${t('payNow', lang)} · ${fmt(total)}`}
          </button>
        )}
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 4 }}>
        {label}
        {required && ' *'}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink }}
      />
    </label>
  );
}

function RadioRow({ checked, onSelect, label }: { checked: boolean; onSelect: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${checked ? C.gold : C.rule}`,
        borderRadius: 6,
        background: checked ? C.tagBg : C.paper,
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${checked ? C.gold : C.rule}`, background: checked ? C.gold : 'transparent' }} />
      <span style={{ fontSize: 13, color: C.ink }}>{label}</span>
    </button>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 400, color: bold ? C.ink : C.inkSoft, padding: '3px 0' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
