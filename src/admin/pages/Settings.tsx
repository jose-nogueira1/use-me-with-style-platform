import { useEffect, useState } from 'react';
import { C, F } from '../../theme';
import { adminUpdateMarketSettings, fetchMarketSettings, type MarketSettings } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';

const DEFAULTS: MarketSettings = {
  angolaPaymentLive: false,
  angolaBankTransferInstructions: '',
  angolaPaymentMethods: ['multicaixa_express', 'stripe', 'paypal'],
  angolaDeliveryMethods: ['courier_ao'],
  portugalPaymentMethods: ['paypal', 'stripe', 'mbway'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  angolaReturnsPolicyText: '',
  portugalReturnsPolicyText: '',
};

export function Settings() {
  const [settings, setSettings] = useState<MarketSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMarketSettings()
      .then(setSettings)
      .catch(() => setError("Couldn't load settings -- showing defaults."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateMarketSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch {
      setError("Couldn't save. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>Loading…</div>;

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader eyebrow="Settings" title="Launch configuration" subtitle="Safe placeholders until payment, fulfilment, and client media inputs are final." cta="Save settings" onCta={handleSave} />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {saved && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#3F754D' }}>Saved.</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
        <Card title="Angola" badge="Multicaixa Express" tone="gold">
          <ConfigRow label="Currency" value="Kwanza, prices shown as Kz. Stripe/PayPal charges settle in EUR (neither gateway supports Kz)." />
          <ConfigRow
            label="Payment"
            value={
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input type="checkbox" checked={settings.angolaPaymentLive} onChange={(e) => setSettings((s) => ({ ...s, angolaPaymentLive: e.target.checked }))} />
                  AppyPay (Multicaixa Express) integration live
                </label>
                <input
                  value={settings.angolaPaymentMethods.join(', ')}
                  onChange={(e) => setSettings((s) => ({ ...s, angolaPaymentMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                  style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, marginBottom: 8 }}
                />
                <textarea
                  value={settings.angolaBankTransferInstructions ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, angolaBankTransferInstructions: e.target.value }))}
                  rows={2}
                  placeholder="Multicaixa Express manual instructions (shown until AppyPay integration is live)"
                  style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, fontFamily: 'inherit' }}
                />
              </div>
            }
          />
          <ConfigRow
            label="Delivery"
            value={
              <input
                value={settings.angolaDeliveryMethods.join(', ')}
                onChange={(e) => setSettings((s) => ({ ...s, angolaDeliveryMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
              />
            }
          />
          <ConfigRow label="Order flow" value="New to Payment Review to Processing." last />
        </Card>

        <Card title="Portugal" badge="Configured" tone="green">
          <ConfigRow label="Currency" value="Euro, prices shown as EUR." />
          <ConfigRow
            label="Payment"
            value={
              <input
                value={settings.portugalPaymentMethods.join(', ')}
                onChange={(e) => setSettings((s) => ({ ...s, portugalPaymentMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
              />
            }
          />
          <ConfigRow
            label="Delivery"
            value={
              <input
                value={settings.portugalDeliveryMethods.join(', ')}
                onChange={(e) => setSettings((s) => ({ ...s, portugalDeliveryMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
              />
            }
          />
          <ConfigRow label="Order flow" value="New, Processing, Shipped, Delivered, Cancelled." last />
        </Card>

        <Card title="Messaging" badge="Phase 1" tone="blue">
          <ConfigRow label="WhatsApp" value="Keyword-based auto-replies (order status, payment, delivery FAQs); sensitive topics always escalate to you." />
          <ConfigRow label="Instagram" value="Same rule-based classification via Instagram DM; escalates to you when unmatched." />
          <ConfigRow label="Deferred" value="AI-drafted replies, campaign generation, Meta Ads, segmentation, and analytics." />
          <ConfigRow label="Storefront language" value="Bilingual PT/EN (Portuguese default); admin stays English-only." last />
        </Card>

        <Card title="Order Fields" badge="Required" tone="neutral">
          <ConfigRow label="Customer" value="Name, phone/WhatsApp, email, notes." />
          <ConfigRow label="Address" value="Address, city, country." />
          <ConfigRow label="Methods" value="Payment method and delivery method." />
          <ConfigRow label="Lookup" value="Confirmation and lookup without full accounts." last />
        </Card>
      </div>

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 8 }}>Angola: returns &amp; exchanges policy</div>
          <textarea
            value={settings.angolaReturnsPolicyText ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, angolaReturnsPolicyText: e.target.value }))}
            rows={10}
            placeholder="Client-provided legal copy -- shown on the storefront Help page and at checkout."
            style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 8 }}>Portugal/EU: returns &amp; exchanges policy</div>
          <textarea
            value={settings.portugalReturnsPolicyText ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, portugalReturnsPolicyText: e.target.value }))}
            rows={10}
            placeholder="Client-provided legal copy -- shown on the storefront Help page and at checkout."
            style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, badge, tone, children }: { title: string; badge: string; tone: 'gold' | 'green' | 'blue' | 'neutral'; children: React.ReactNode }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800, color: C.ink }}>{title}</div>
        <Badge label={badge} tone={tone} />
      </div>
      {children}
    </div>
  );
}

function ConfigRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, alignItems: 'start', padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.ruleLight}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.ink }}>{label}</div>
      <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
