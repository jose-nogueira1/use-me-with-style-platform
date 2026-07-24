import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { C, F } from '../../theme';
import {
  adminFetchInvoiceSettings,
  adminUpdateInvoiceSettings,
  adminUpdateLegalContent,
  adminUpdateMarketSettings,
  fetchLegalContent,
  fetchMarketSettings,
  type InvoiceSettings,
  type LegalContent,
  type MarketSettings,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';

const DEFAULTS: MarketSettings = {
  angolaPaymentLive: false,
  angolaBankTransferInstructions: '',
  angolaPaymentMethods: ['multicaixa_express', 'stripe', 'paypal'],
  angolaDeliveryMethods: ['courier_ao'],
  portugalPaymentMethods: ['paypal', 'stripe', 'mbway'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  angolaReturnsPolicyTextPT: '',
  angolaReturnsPolicyTextEN: '',
  portugalReturnsPolicyTextPT: '',
  portugalReturnsPolicyTextEN: '',
  businessHoursTextPT: '',
  businessHoursTextEN: '',
  angolaShippingTextPT: '',
  angolaShippingTextEN: '',
  portugalShippingTextPT: '',
  portugalShippingTextEN: '',
  internationalShippingTextPT: '',
  internationalShippingTextEN: '',
};

const TABS = [
  { key: 'markets', label: 'Markets' },
  { key: 'policies', label: 'Policies & content' },
  { key: 'invoicing', label: 'Invoicing' },
  { key: 'legal', label: 'Legal pages' },
] as const;
type SettingsTab = (typeof TABS)[number]['key'];

const TAB_META: Record<SettingsTab, { title: string; subtitle: string }> = {
  markets: { title: 'Launch configuration', subtitle: 'Safe placeholders until payment, fulfilment, and client media inputs are final.' },
  policies: { title: 'Policies & content', subtitle: 'Returns, business hours, and shipping copy shown on the Help page and at checkout.' },
  invoicing: { title: 'Internal invoicing', subtitle: 'Commercial (non-fiscal) invoice generation, per market.' },
  legal: { title: 'Legal pages', subtitle: "Shown on the storefront's Privacy Policy and Terms & Conditions pages." },
};

// Split into tabs (2026-07-25, user feedback: the previous single-page
// layout stacked Markets + Policies + Invoicing + Legal pages into one very
// long scroll, which read as cluttered rather than organized). Markets and
// Policies still share the MarketSettings global/state and the page-level
// Save button, since they were always saved together; Invoicing and Legal
// pages are separate globals and keep their own self-contained save actions
// (each section already had its own fetch/save before this change).
export function Settings() {
  const [tab, setTab] = useState<SettingsTab>('markets');
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

  const showsMarketSettingsCta = tab === 'markets' || tab === 'policies';

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow="Settings"
        title={TAB_META[tab].title}
        subtitle={TAB_META[tab].subtitle}
        cta={showsMarketSettingsCta ? 'Save settings' : undefined}
        onCta={showsMarketSettingsCta ? handleSave : undefined}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <TabPill key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {showsMarketSettingsCta && error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {showsMarketSettingsCta && saved && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#3F754D' }}>Saved.</div>}

      {tab === 'markets' && (
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
      )}

      {tab === 'policies' && (
        <>
          <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Angola: returns &amp; exchanges policy</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.angolaReturnsPolicyTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaReturnsPolicyTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.angolaReturnsPolicyTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaReturnsPolicyTextEN: v }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Portugal/EU: returns &amp; exchanges policy</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.portugalReturnsPolicyTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalReturnsPolicyTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.portugalReturnsPolicyTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalReturnsPolicyTextEN: v }))}
              />
            </div>
          </div>

          <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Business hours (shared, both markets)</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.businessHoursTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, businessHoursTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.businessHoursTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, businessHoursTextEN: v }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>International shipping (shared, both markets)</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.internationalShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, internationalShippingTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.internationalShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, internationalShippingTextEN: v }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Angola: shipping &amp; delivery info</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.angolaShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaShippingTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.angolaShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaShippingTextEN: v }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Portugal: shipping &amp; delivery info</div>
              <PolicyTextarea
                label="Portuguese"
                value={settings.portugalShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalShippingTextPT: v }))}
              />
              <PolicyTextarea
                label="English"
                value={settings.portugalShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalShippingTextEN: v }))}
              />
            </div>
          </div>
        </>
      )}

      {tab === 'invoicing' && <InvoicingSettingsSection />}
      {tab === 'legal' && <LegalPagesSection />}
    </div>
  );
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 16px',
        fontSize: 11,
        fontWeight: 800,
        borderRadius: 6,
        border: `1px solid ${active ? C.black : C.rule}`,
        background: active ? C.black : C.paper,
        color: active ? C.onDarkGold : C.ink,
      }}
    >
      {label}
    </button>
  );
}

// Internal (non-fiscal) invoicing configuration -- CMS global `invoice-
// settings`, previously only editable directly in Payload admin. Added
// 2026-07-25 for storefront-admin/Payload-admin parity. Self-contained
// (own fetch/save) rather than folded into the page-level Save button above,
// since it's a different global with its own endpoint.
const INVOICE_SETTINGS_DEFAULTS: InvoiceSettings = {
  phaseOneDisclaimer: '',
  invoicingEnabledAO: true,
  issuerNameAO: 'Use Me With Style',
  issuerTaxIdAO: '',
  issuerAddressAO: '',
  vatRateAO: 0,
  taxNoteAO: '',
  invoicePrefixAO: 'UMWS-AO',
  invoiceFooterAO: '',
  invoicingEnabledPT: true,
  issuerNamePT: 'Use Me With Style',
  issuerTaxIdPT: '',
  issuerAddressPT: '',
  vatRatePT: 0,
  taxNotePT: '',
  invoicePrefixPT: 'UMWS-PT',
  invoiceFooterPT: '',
};

function InvoicingSettingsSection() {
  const [settings, setSettings] = useState<InvoiceSettings>(INVOICE_SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchInvoiceSettings()
      .then(setSettings)
      .catch(() => setError("Couldn't load invoicing settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateInvoiceSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch {
      setError("Couldn't save invoicing settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 28px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>
          Snapshotted onto each invoice at issue time -- editing here doesn't rewrite invoices already generated.
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          style={{ padding: '9px 18px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, flexShrink: 0 }}
        >
          {saving ? '…' : 'Save invoicing settings'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>Saved.</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>Loading…</div>
      ) : (
        <>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Required non-fiscal disclaimer</div>
            <textarea
              value={settings.phaseOneDisclaimer}
              onChange={(e) => setSettings((s) => ({ ...s, phaseOneDisclaimer: e.target.value }))}
              rows={2}
              style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <InvoiceMarketCard label="Angola" market="AO" settings={settings} setSettings={setSettings} />
            <InvoiceMarketCard label="Portugal" market="PT" settings={settings} setSettings={setSettings} />
          </div>
        </>
      )}
    </div>
  );
}

function InvoiceMarketCard({
  label,
  market,
  settings,
  setSettings,
}: {
  label: string;
  market: 'AO' | 'PT';
  settings: InvoiceSettings;
  setSettings: Dispatch<SetStateAction<InvoiceSettings>>;
}) {
  const set = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => setSettings((s) => ({ ...s, [key]: value }));
  const enabledKey = `invoicingEnabled${market}` as const;
  const nameKey = `issuerName${market}` as const;
  const taxIdKey = `issuerTaxId${market}` as const;
  const addressKey = `issuerAddress${market}` as const;
  const vatKey = `vatRate${market}` as const;
  const taxNoteKey = `taxNote${market}` as const;
  const prefixKey = `invoicePrefix${market}` as const;
  const footerKey = `invoiceFooter${market}` as const;

  return (
    <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{label}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, fontWeight: 700, color: C.ink }}>
        <input type="checkbox" checked={settings[enabledKey]} onChange={(e) => set(enabledKey, e.target.checked)} />
        Generate internal invoices automatically
      </label>
      <SettingsField label="Issuer name" value={settings[nameKey] ?? ''} onChange={(v) => set(nameKey, v)} />
      <SettingsField label="Issuer tax ID" value={settings[taxIdKey] ?? ''} onChange={(v) => set(taxIdKey, v)} />
      <SettingsTextarea label="Issuer address" value={settings[addressKey] ?? ''} onChange={(v) => set(addressKey, v)} rows={2} />
      <SettingsField label="VAT rate (%) included in prices" value={String(settings[vatKey] ?? 0)} onChange={(v) => set(vatKey, Number(v) || 0)} type="number" />
      <SettingsField label="VAT / exemption note" value={settings[taxNoteKey] ?? ''} onChange={(v) => set(taxNoteKey, v)} />
      <SettingsField label="Invoice prefix" value={settings[prefixKey] ?? ''} onChange={(v) => set(prefixKey, v)} />
      <SettingsTextarea label="PDF footer" value={settings[footerKey] ?? ''} onChange={(v) => set(footerKey, v)} rows={2} />
    </div>
  );
}

function SettingsField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
    </label>
  );
}

function SettingsTextarea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 5 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit', lineHeight: 1.4 }}
      />
    </label>
  );
}

// Privacy Policy + Terms & Conditions -- CMS global `legal-content`,
// previously only editable directly in Payload admin. Added 2026-07-25 for
// storefront-admin/Payload-admin parity. The seeded text is an AI-drafted
// generic template (see LegalContent.ts) -- editable here like everything
// else, but that provenance caveat doesn't change just because there's now a
// storefront UI for it.
function LegalPagesSection() {
  const [content, setContent] = useState<LegalContent>({ privacyPolicyTextPT: '', privacyPolicyTextEN: '', termsTextPT: '', termsTextEN: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchLegalContent()
      .then(setContent)
      .catch(() => setError("Couldn't load legal pages."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateLegalContent(content);
      setContent(updated);
      setSaved(true);
    } catch {
      setError("Couldn't save. Make sure you're logged in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>
          The seeded text is an AI-drafted generic template -- have it reviewed by a lawyer before treating it as final.
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          style={{ padding: '9px 18px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, flexShrink: 0 }}
        >
          {saving ? '…' : 'Save legal pages'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>Saved.</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Privacy Policy</div>
            <PolicyTextarea label="Portuguese" value={content.privacyPolicyTextPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, privacyPolicyTextPT: v }))} />
            <PolicyTextarea label="English" value={content.privacyPolicyTextEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, privacyPolicyTextEN: v }))} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Terms &amp; Conditions</div>
            <PolicyTextarea label="Portuguese" value={content.termsTextPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, termsTextPT: v }))} />
            <PolicyTextarea label="English" value={content.termsTextEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, termsTextEN: v }))} />
          </div>
        </div>
      )}
    </div>
  );
}

function PolicyTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder="Client-provided legal copy -- shown on the storefront Help page and at checkout."
        style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
      />
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
