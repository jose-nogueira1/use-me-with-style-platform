import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminFetchInvoiceSettings,
  adminListHomeContentVersions,
  adminRestoreHomeContentVersion,
  adminUpdateHomeContent,
  adminUpdateInvoiceSettings,
  adminUpdateLegalContent,
  adminUpdateMarketSettings,
  adminUploadMedia,
  fetchHomeContent,
  fetchLegalContent,
  fetchMarketSettings,
  refId,
  resolveRef,
  type HomeContent,
  type HomeContentVersion,
  type InvoiceSettings,
  type LegalContent,
  type MarketSettings,
} from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { ProductTaxonomySettings } from './ProductSettings';
import { t, type Lang } from '../i18n';
import { DEFAULT_ANGOLA_MUNICIPALITY_PRICES, LUANDA_MUNICIPALITIES } from '../../storefront/shipping';

const DEFAULTS: MarketSettings = {
  angolaPaymentLive: false,
  angolaBankTransferInstructionsPT: '',
  angolaBankTransferInstructionsEN: '',
  angolaPaymentMethods: ['multicaixa_express'],
  angolaDeliveryMethods: ['courier_ao'],
  angolaMunicipalityPrices: DEFAULT_ANGOLA_MUNICIPALITY_PRICES,
  angolaFreeShippingThreshold: 80000,
  portugalPaymentMethods: ['paypal', 'stripe', 'mbway'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  portugalStandardShippingPrice: 4.9,
  portugalTrackedShippingPrice: 6.9,
  portugalFreeShippingThreshold: 75,
  portugalStandardWeightLimitGrams: 2000,
  portugalHeavyMainlandShippingPrice: 9.9,
  portugalHeavyIslandsShippingPrice: 14.9,
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
  { key: 'markets', labelKey: 'tabMarkets' },
  { key: 'policies', labelKey: 'tabPolicies' },
  { key: 'invoicing', labelKey: 'tabInvoicing' },
  { key: 'legal', labelKey: 'tabLegal' },
  // Home hero (2026-07-25 admin request): the "Coleção SS26 / Moda que se
  // move consigo." banner had no admin-editable source at all before this.
  { key: 'home', labelKey: 'tabHome' },
  // Catalogue taxonomies (2026-07-25): categories, merchandising tags,
  // colours, and size guides -- moved here from their own admin page so
  // the product editor's "Product settings" link has one obvious home
  // (was /admin/definicoes-produto; now this tab).
  { key: 'products', labelKey: 'tabProducts' },
] as const;
type SettingsTab = (typeof TABS)[number]['key'];

const TAB_META: Record<SettingsTab, { titleKey: string; subtitleKey: string }> = {
  markets: { titleKey: 'tabMarketsTitle', subtitleKey: 'tabMarketsSubtitle' },
  policies: { titleKey: 'tabPoliciesTitle', subtitleKey: 'tabPoliciesSubtitle' },
  invoicing: { titleKey: 'tabInvoicingTitle', subtitleKey: 'tabInvoicingSubtitle' },
  legal: { titleKey: 'tabLegalTitle', subtitleKey: 'tabLegalSubtitle' },
  home: { titleKey: 'tabHomeTitle', subtitleKey: 'tabHomeSubtitle' },
  products: { titleKey: 'tabProductsTitle', subtitleKey: 'tabProductsSubtitle' },
};

function isSettingsTab(value: string | null): value is SettingsTab {
  return TABS.some((t) => t.key === value);
}

// Split into tabs (2026-07-25, user feedback: the previous single-page
// layout stacked Markets + Policies + Invoicing + Legal pages into one very
// long scroll, which read as cluttered rather than organized). Markets and
// Policies still share the MarketSettings global/state and the page-level
// Save button, since they were always saved together; Invoicing and Legal
// pages are separate globals and keep their own self-contained save actions
// (each section already had its own fetch/save before this change).
export function Settings() {
  const { lang } = useApp();
  // Deep-linkable via ?tab=products so the ProductEditor's "Product
  // settings" link can jump straight to this tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTabState] = useState<SettingsTab>(isSettingsTab(initialTab) ? initialTab : 'markets');
  const setTab = (next: SettingsTab) => {
    setTabState(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', next);
      return params;
    }, { replace: true });
  };
  const [settings, setSettings] = useState<MarketSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMarketSettings()
      .then((value) => setSettings({ ...value, angolaPaymentMethods: ['multicaixa_express'] }))
      .catch(() => setError(t('couldntLoadSettingsDefaults', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateMarketSettings({ ...settings, angolaPaymentMethods: ['multicaixa_express'] });
      setSettings({ ...updated, angolaPaymentMethods: ['multicaixa_express'] });
      setSaved(true);
    } catch {
      setError(t('couldntSaveBackend', lang));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>;

  const showsMarketSettingsCta = tab === 'markets' || tab === 'policies';

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('settingsEyebrow', lang)}
        title={t(TAB_META[tab].titleKey, lang)}
        subtitle={t(TAB_META[tab].subtitleKey, lang)}
        cta={showsMarketSettingsCta ? t('saveSettings', lang) : undefined}
        onCta={showsMarketSettingsCta ? handleSave : undefined}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <TabPill key={tb.key} label={t(tb.labelKey, lang)} active={tab === tb.key} onClick={() => setTab(tb.key)} />
        ))}
      </div>

      {showsMarketSettingsCta && error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {showsMarketSettingsCta && saved && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#3F754D' }}>{t('savedNotice', lang)}</div>}

      {tab === 'markets' && (
        <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
          <Card title={t('angolaOption', lang)} badge={t('multicaixaBadge', lang)} tone="gold">
            <ConfigRow label={t('currencyLabel', lang)} value={t('angolaCurrencyNote', lang)} />
            <ConfigRow
              label={t('paymentLabel', lang)}
              value={
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={settings.angolaPaymentLive} onChange={(e) => setSettings((s) => ({ ...s, angolaPaymentLive: e.target.checked }))} />
                    {t('appyPayLiveLabel', lang)}
                  </label>
                  <input
                    value="multicaixa_express"
                    readOnly
                    style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, marginBottom: 8 }}
                  />
                  <textarea
                    value={settings.angolaBankTransferInstructionsPT ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, angolaBankTransferInstructionsPT: e.target.value }))}
                    rows={2}
                    placeholder={`${t('bankTransferInstructionsPlaceholder', lang)} — ${t('portuguese', lang)}`}
                    style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, fontFamily: 'inherit', marginBottom: 8 }}
                  />
                  <textarea
                    value={settings.angolaBankTransferInstructionsEN ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, angolaBankTransferInstructionsEN: e.target.value }))}
                    rows={2}
                    placeholder={`${t('bankTransferInstructionsPlaceholder', lang)} — ${t('english', lang)}`}
                    style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, fontFamily: 'inherit' }}
                  />
                </div>
              }
            />
            <ConfigRow
              label={t('deliveryLabel', lang)}
              value={
                <input
                  value={settings.angolaDeliveryMethods.join(', ')}
                  onChange={(e) => setSettings((s) => ({ ...s, angolaDeliveryMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                  style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
                />
              }
            />
            <ConfigRow
              label={t('municipalityPrices', lang)}
              value={
                <details style={{ border: `1px solid ${C.ruleLight}`, borderRadius: 7, background: C.subtleBg }}>
                  <summary style={{ cursor: 'pointer', padding: '10px 12px', fontWeight: 800, color: C.ink, userSelect: 'none' }}>
                    {t('editMunicipalityPrices', lang)}
                    <span style={{ display: 'block', marginTop: 2, fontSize: 9, fontWeight: 500, color: C.inkSoft }}>
                      {t('municipalityPricesHint', lang)}
                    </span>
                  </summary>
                  <div style={{ display: 'grid', gap: 8, padding: '4px 12px 12px', borderTop: `1px solid ${C.ruleLight}` }}>
                    {LUANDA_MUNICIPALITIES.map((municipality) => (
                      <NumberSetting
                        key={municipality}
                        label={`${municipality} (Kz)`}
                        value={Number(settings.angolaMunicipalityPrices[municipality] ?? 0)}
                        step={100}
                        onChange={(value) => setSettings((s) => ({ ...s, angolaMunicipalityPrices: { ...s.angolaMunicipalityPrices, [municipality]: value } }))}
                      />
                    ))}
                    <NumberSetting label={t('freeShippingThresholdKz', lang)} value={settings.angolaFreeShippingThreshold} step={1000} onChange={(value) => setSettings((s) => ({ ...s, angolaFreeShippingThreshold: value }))} />
                  </div>
                </details>
              }
            />
            <ConfigRow label={t('orderFlowLabel', lang)} value={t('angolaOrderFlow', lang)} last />
          </Card>

          <Card title={t('portugalOption', lang)} badge={t('configuredBadge', lang)} tone="green">
            <ConfigRow label={t('currencyLabel', lang)} value={t('portugalCurrencyNote', lang)} />
            <ConfigRow
              label={t('paymentLabel', lang)}
              value={
                <input
                  value={settings.portugalPaymentMethods.join(', ')}
                  onChange={(e) => setSettings((s) => ({ ...s, portugalPaymentMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                  style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
                />
              }
            />
            <ConfigRow
              label={t('deliveryLabel', lang)}
              value={
                <input
                  value={settings.portugalDeliveryMethods.join(', ')}
                  onChange={(e) => setSettings((s) => ({ ...s, portugalDeliveryMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                  style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
                />
              }
            />
            <ConfigRow
              label={t('portugalShippingPrices', lang)}
              value={
                <div style={{ display: 'grid', gap: 8 }}>
                  <NumberSetting label={t('cttStandardPrice', lang)} value={settings.portugalStandardShippingPrice} onChange={(value) => setSettings((s) => ({ ...s, portugalStandardShippingPrice: value }))} />
                  <NumberSetting label={t('cttTrackedPrice', lang)} value={settings.portugalTrackedShippingPrice} onChange={(value) => setSettings((s) => ({ ...s, portugalTrackedShippingPrice: value }))} />
                  <NumberSetting label={t('freeShippingThreshold', lang)} value={settings.portugalFreeShippingThreshold} onChange={(value) => setSettings((s) => ({ ...s, portugalFreeShippingThreshold: value }))} />
                  <NumberSetting label={t('standardWeightLimit', lang)} value={settings.portugalStandardWeightLimitGrams} step={100} onChange={(value) => setSettings((s) => ({ ...s, portugalStandardWeightLimitGrams: value }))} />
                  <NumberSetting label={t('heavyMainlandPrice', lang)} value={settings.portugalHeavyMainlandShippingPrice} onChange={(value) => setSettings((s) => ({ ...s, portugalHeavyMainlandShippingPrice: value }))} />
                  <NumberSetting label={t('heavyIslandsPrice', lang)} value={settings.portugalHeavyIslandsShippingPrice} onChange={(value) => setSettings((s) => ({ ...s, portugalHeavyIslandsShippingPrice: value }))} />
                </div>
              }
            />
            <ConfigRow label={t('orderFlowLabel', lang)} value={t('portugalOrderFlow', lang)} last />
          </Card>

          <Card title={t('messagingCardTitle', lang)} badge={t('phase1Badge', lang)} tone="blue">
            <ConfigRow label={t('whatsappLabel', lang)} value={t('messagingAutomationDetail', lang)} />
            <ConfigRow label={t('instagramLabel', lang)} value={t('instagramNote', lang)} />
            <ConfigRow label={t('deferredLabel', lang)} value={t('deferredMessagingNote', lang)} />
            <ConfigRow label={t('storefrontLanguageLabel', lang)} value={t('storefrontLanguageNote', lang)} last />
          </Card>

          <Card title={t('orderFieldsCard', lang)} badge={t('requiredCardBadge', lang)} tone="neutral">
            <ConfigRow label={t('customerFieldLabel', lang)} value={t('orderFieldsCustomer', lang)} />
            <ConfigRow label={t('addressField', lang)} value={t('orderFieldsAddress', lang)} />
            <ConfigRow label={t('methodsLabel', lang)} value={t('orderFieldsMethods', lang)} />
            <ConfigRow label={t('lookupLabel', lang)} value={t('orderFieldsLookup', lang)} last />
          </Card>
        </div>
      )}

      {tab === 'policies' && (
        <>
          <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('returnsAngolaHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.angolaReturnsPolicyTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaReturnsPolicyTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.angolaReturnsPolicyTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaReturnsPolicyTextEN: v }))}
                lang={lang}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('returnsPortugalHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.portugalReturnsPolicyTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalReturnsPolicyTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.portugalReturnsPolicyTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalReturnsPolicyTextEN: v }))}
                lang={lang}
              />
            </div>
          </div>

          <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('businessHoursSharedHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.businessHoursTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, businessHoursTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.businessHoursTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, businessHoursTextEN: v }))}
                lang={lang}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('internationalShippingSharedHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.internationalShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, internationalShippingTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.internationalShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, internationalShippingTextEN: v }))}
                lang={lang}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('angolaShippingHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.angolaShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaShippingTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.angolaShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, angolaShippingTextEN: v }))}
                lang={lang}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('portugalShippingHeading', lang)}</div>
              <PolicyTextarea
                label={t('portuguese', lang)}
                value={settings.portugalShippingTextPT ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalShippingTextPT: v }))}
                lang={lang}
              />
              <PolicyTextarea
                label={t('english', lang)}
                value={settings.portugalShippingTextEN ?? ''}
                onChange={(v) => setSettings((s) => ({ ...s, portugalShippingTextEN: v }))}
                lang={lang}
              />
            </div>
          </div>
        </>
      )}

      {tab === 'invoicing' && <InvoicingSettingsSection />}
      {tab === 'legal' && <LegalPagesSection />}
      {tab === 'home' && <HomeHeroSection />}
      {tab === 'products' && <ProductTaxonomySettings />}
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
  phaseOneDisclaimerPT: '',
  phaseOneDisclaimerEN: '',
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
  const { lang } = useApp();
  const [settings, setSettings] = useState<InvoiceSettings>(INVOICE_SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchInvoiceSettings()
      .then(setSettings)
      .catch(() => setError(t('couldntLoadInvoicingSettings', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateInvoiceSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch {
      setError(t('couldntSaveInvoicingSettings', lang));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 28px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>
          {t('invoicingSnapshotNote', lang)}
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          style={{ padding: '9px 18px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, flexShrink: 0 }}
        >
          {saving ? '…' : t('saveInvoicingSettings', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }} className="ump-admin-orders-grid">
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('requiredDisclaimer', lang)} — {t('portuguese', lang)}</div>
              <textarea
                value={settings.phaseOneDisclaimerPT}
                onChange={(e) => setSettings((s) => ({ ...s, phaseOneDisclaimerPT: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('requiredDisclaimer', lang)} — {t('english', lang)}</div>
              <textarea
                value={settings.phaseOneDisclaimerEN}
                onChange={(e) => setSettings((s) => ({ ...s, phaseOneDisclaimerEN: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: 10, fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <InvoiceMarketCard label={t('angolaOption', lang)} market="AO" settings={settings} setSettings={setSettings} lang={lang} />
            <InvoiceMarketCard label={t('portugalOption', lang)} market="PT" settings={settings} setSettings={setSettings} lang={lang} />
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
  lang,
}: {
  label: string;
  market: 'AO' | 'PT';
  settings: InvoiceSettings;
  setSettings: Dispatch<SetStateAction<InvoiceSettings>>;
  lang: Lang;
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
        {t('generateInvoicesAuto', lang)}
      </label>
      <SettingsField label={t('issuerName', lang)} value={settings[nameKey] ?? ''} onChange={(v) => set(nameKey, v)} />
      <SettingsField label={t('issuerTaxId', lang)} value={settings[taxIdKey] ?? ''} onChange={(v) => set(taxIdKey, v)} />
      <SettingsTextarea label={t('issuerAddress', lang)} value={settings[addressKey] ?? ''} onChange={(v) => set(addressKey, v)} rows={2} />
      <SettingsField label={t('vatRateLabel', lang)} value={String(settings[vatKey] ?? 0)} onChange={(v) => set(vatKey, Number(v) || 0)} type="number" />
      <SettingsField label={t('vatNoteLabel', lang)} value={settings[taxNoteKey] ?? ''} onChange={(v) => set(taxNoteKey, v)} />
      <SettingsField label={t('invoicePrefixLabel', lang)} value={settings[prefixKey] ?? ''} onChange={(v) => set(prefixKey, v)} />
      <SettingsTextarea label={t('pdfFooterLabel', lang)} value={settings[footerKey] ?? ''} onChange={(v) => set(footerKey, v)} rows={2} />
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
  const { lang } = useApp();
  const [content, setContent] = useState<LegalContent>({ privacyPolicyTextPT: '', privacyPolicyTextEN: '', termsTextPT: '', termsTextEN: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchLegalContent()
      .then(setContent)
      .catch(() => setError(t('couldntLoadLegalPages', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateLegalContent(content);
      setContent(updated);
      setSaved(true);
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>
          {t('legalSeededNote', lang)}
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          style={{ padding: '9px 18px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, flexShrink: 0 }}
        >
          {saving ? '…' : t('saveLegalPages', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('privacyPolicyTitle', lang)}</div>
            <PolicyTextarea label={t('portuguese', lang)} value={content.privacyPolicyTextPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, privacyPolicyTextPT: v }))} lang={lang} />
            <PolicyTextarea label={t('english', lang)} value={content.privacyPolicyTextEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, privacyPolicyTextEN: v }))} lang={lang} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('termsTitle', lang)}</div>
            <PolicyTextarea label={t('portuguese', lang)} value={content.termsTextPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, termsTextPT: v }))} lang={lang} />
            <PolicyTextarea label={t('english', lang)} value={content.termsTextEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, termsTextEN: v }))} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

// Storefront home hero -- CMS global `home-content` (added 2026-07-25, user
// report: "no way for admin to edit this section of the storefront"). Same
// self-contained fetch/save pattern as InvoicingSettingsSection/
// LegalPagesSection above. heroImage is the one field that isn't plain
// text: the fetch (depth=1) returns a populated media doc, a fresh upload
// via adminUploadMedia returns one too, and refId() normalizes either back
// down to a bare id before saving (matching how ProductEditor.tsx submits
// its own relationship fields).
const HOME_CONTENT_DEFAULTS: HomeContent = {
  heroEyebrowPT: '',
  heroEyebrowEN: '',
  heroHeadlinePT: '',
  heroHeadlineEN: '',
  heroSubtitlePT: '',
  heroSubtitleEN: '',
  heroCtaLabelPT: '',
  heroCtaLabelEN: '',
  heroCtaHref: '/catalogo',
  heroImage: null,
};

function HomeHeroSection() {
  const { lang } = useApp();
  const [content, setContent] = useState<HomeContent>(HOME_CONTENT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Version history (2026-07-25 follow-up, "save old homepage creations, in
  // case I want to re-activate them later"): Payload auto-snapshots the
  // PREVIOUS doc on every save (versions.max: 20 on the home-content global,
  // no drafts/publish workflow). Loaded alongside the current content and
  // refreshed after every save/restore, since both create a new snapshot.
  const [versions, setVersions] = useState<HomeContentVersion[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadVersions = () => {
    adminListHomeContentVersions()
      .then(setVersions)
      .catch(() => setVersionsError(t('couldntLoadPreviousVersions', lang)));
  };

  useEffect(() => {
    fetchHomeContent()
      .then(setContent)
      .catch(() => setError(t('couldntLoadHomeContent', lang)))
      .finally(() => setLoading(false));
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateHomeContent({ ...content, heroImage: refId(content.heroImage) || null });
      setContent(updated);
      setSaved(true);
      loadVersions();
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (version: HomeContentVersion) => {
    setRestoringId(String(version.id));
    setVersionsError(null);
    setSaved(false);
    try {
      const restored = await adminRestoreHomeContentVersion(version.id);
      setContent(restored);
      setSaved(true);
      loadVersions();
    } catch {
      setVersionsError(t('couldntRestoreVersion', lang));
    } finally {
      setRestoringId(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const media = await adminUploadMedia(file, 'Home hero image');
      setContent((c) => ({ ...c, heroImage: media }));
    } catch {
      setError(t('couldntUploadImage', lang));
    } finally {
      setUploading(false);
    }
  };

  const heroImageDoc = resolveRef(content.heroImage);
  const heroImageUrl = absoluteMediaUrl(heroImageDoc?.url);

  return (
    <div style={{ padding: '20px 28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>
          {t('homeHeroNote', lang)}
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={loading || saving}
          style={{ padding: '9px 18px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6, flexShrink: 0 }}
        >
          {saving ? '…' : t('saveHomePage', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }} className="ump-admin-orders-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('portuguese', lang)}</div>
              <SettingsField label={t('eyebrowLabel', lang)} value={content.heroEyebrowPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroEyebrowPT: v }))} />
              <SettingsField label={t('headlineLabel', lang)} value={content.heroHeadlinePT ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroHeadlinePT: v }))} />
              <SettingsTextarea label={t('subtitleLabel', lang)} value={content.heroSubtitlePT ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroSubtitlePT: v }))} rows={3} />
              <SettingsField label={t('buttonLabelLabel', lang)} value={content.heroCtaLabelPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroCtaLabelPT: v }))} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('english', lang)}</div>
              <SettingsField label={t('eyebrowLabel', lang)} value={content.heroEyebrowEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroEyebrowEN: v }))} />
              <SettingsField label={t('headlineLabel', lang)} value={content.heroHeadlineEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroHeadlineEN: v }))} />
              <SettingsTextarea label={t('subtitleLabel', lang)} value={content.heroSubtitleEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroSubtitleEN: v }))} rows={3} />
              <SettingsField label={t('buttonLabelLabel', lang)} value={content.heroCtaLabelEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroCtaLabelEN: v }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
            <div>
              <SettingsField label={t('buttonLinkLabel', lang)} value={content.heroCtaHref ?? ''} onChange={(v) => setContent((c) => ({ ...c, heroCtaHref: v }))} />
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: -4 }}>
                {t('buttonLinkNote', lang)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{t('heroImageLabel', lang)}</div>
              {heroImageUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <img src={heroImageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: `1px solid ${C.rule}` }} />
                  <button
                    onClick={() => setContent((c) => ({ ...c, heroImage: null }))}
                    style={{ fontSize: 10, fontWeight: 800, color: '#B95545', border: `1px solid #E1B3AA`, borderRadius: 6, padding: '6px 10px', background: 'transparent' }}
                  >
                    {t('removeAction', lang)}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 8 }}>{t('noneSetPlaceholderGraphic', lang)}</div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload(file);
                  e.target.value = '';
                }}
                style={{ fontSize: 11 }}
              />
              {uploading && <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>{t('uploadingEllipsis', lang)}</div>}
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.ruleLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 2 }}>{t('previousVersions', lang)}</div>
            <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 12 }}>
              {t('previousVersionsNote', lang)}
            </div>
            {versionsError && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 10 }}>{versionsError}</div>}
            {versions.length === 0 ? (
              <div style={{ fontSize: 11, color: C.inkSoft }}>{t('noVersionsYet', lang)}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {versions.map((v) => {
                  const preview = v.version.heroHeadlinePT?.trim() || v.version.heroHeadlineEN?.trim() || t('noHeadlinePlaceholder', lang);
                  const isRestoring = restoringId === String(v.id);
                  return (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
                        <div style={{ fontSize: 9, color: C.inkSoft }}>{new Date(v.createdAt).toLocaleString()}</div>
                      </div>
                      <SmallActionButton label={isRestoring ? '…' : t('restoreAction', lang)} disabled={isRestoring} onClick={() => void handleRestore(v)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SmallActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        fontSize: 10,
        fontWeight: 800,
        borderRadius: 6,
        border: `1px solid ${C.rule}`,
        background: 'transparent',
        color: disabled ? C.inkSoft : C.ink,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function PolicyTextarea({ label, value, onChange, lang }: { label: string; value: string; onChange: (value: string) => void; lang: Lang }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder={t('policyPlaceholder', lang)}
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

function NumberSetting({ label, value, onChange, step = 0.01 }: { label: string; value: number; onChange: (value: number) => void; step?: number }) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '1fr 88px', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 10 }}>{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg }}
      />
    </label>
  );
}
