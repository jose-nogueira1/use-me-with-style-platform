import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminFetchInstagramSpotlight,
  adminFetchInvoiceSettings,
  adminListCategories,
  adminListHomeHeroVersions,
  adminListHomeCategoriesVersions,
  adminListHomeCollectionsVersions,
  adminListMerchTags,
  adminRestoreHomeHeroVersion,
  adminRestoreHomeCategoriesVersion,
  adminRestoreHomeCollectionsVersion,
  adminDeleteHomeHeroVersion,
  adminDeleteHomeCategoriesVersion,
  adminDeleteHomeCollectionsVersion,
  adminUpdateHomeHero,
  adminUpdateHomeCategories,
  adminUpdateHomeCollections,
  adminUpdateInstagramSpotlight,
  adminUpdateInvoiceSettings,
  adminUpdateLegalContent,
  adminUpdateMarketSettings,
  adminUploadMedia,
  fetchHomeHero,
  fetchHomeCategories,
  fetchHomeCollections,
  fetchInstagramFeed,
  fetchLegalContent,
  fetchMarketSettings,
  refId,
  resolveRef,
  type ApiCategory,
  type ApiInstagramPost,
  type ApiMerchTag,
  type HomeHero,
  type HomeHeroVersion,
  type HomeCategories,
  type HomeCategoriesVersion,
  type HomeCollections,
  type HomeCollectionsVersion,
  type HomeGlobalVersion,
  type InvoiceSettings,
  type LegalContent,
  type MarketSettings,
} from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { useDirty } from '../lib/useDirty';
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
  portugalPaymentsEnabled: false,
  portugalManualCheckoutInstructionsPT: '',
  portugalManualCheckoutInstructionsEN: '',
  portugalPaymentMethods: ['paypal', 'stripe'],
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
  // Instagram feed curation (2026-08-02, "curate instead of latest N" --
  // see CMS globals/InstagramSpotlight.ts). The global existed and was
  // deployed for a while before this tab did -- it's only reachable
  // through Payload's own generic /admin UI otherwise, which nobody on
  // this project actually uses day-to-day (every other global gets its
  // own hand-built section here, same as Legal/Home above).
  { key: 'instagram', labelKey: 'tabInstagram' },
] as const;
type SettingsTab = (typeof TABS)[number]['key'];

const TAB_META: Record<SettingsTab, { titleKey: string; subtitleKey: string }> = {
  markets: { titleKey: 'tabMarketsTitle', subtitleKey: 'tabMarketsSubtitle' },
  policies: { titleKey: 'tabPoliciesTitle', subtitleKey: 'tabPoliciesSubtitle' },
  invoicing: { titleKey: 'tabInvoicingTitle', subtitleKey: 'tabInvoicingSubtitle' },
  legal: { titleKey: 'tabLegalTitle', subtitleKey: 'tabLegalSubtitle' },
  home: { titleKey: 'tabHomeTitle', subtitleKey: 'tabHomeSubtitle' },
  products: { titleKey: 'tabProductsTitle', subtitleKey: 'tabProductsSubtitle' },
  instagram: { titleKey: 'tabInstagramTitle', subtitleKey: 'tabInstagramSubtitle' },
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
  // Snapshot of `settings` exactly as loaded (or last saved), to disable
  // Save until something actually changed (2026-07-31 admin report) -- see
  // admin/lib/useDirty.ts.
  const [originalSettings, setOriginalSettings] = useState<MarketSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(settings, originalSettings);

  useEffect(() => {
    fetchMarketSettings()
      .then((value) => {
        setSettings(value);
        setOriginalSettings(value);
      })
      .catch(() => setError(t('couldntLoadSettingsDefaults', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateMarketSettings(settings);
      setSettings(updated);
      setOriginalSettings(updated);
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
        ctaBusy={showsMarketSettingsCta ? saving : undefined}
        ctaDisabled={showsMarketSettingsCta ? !isDirty : undefined}
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
                    value={settings.angolaPaymentMethods.join(', ')}
                    onChange={(e) => setSettings((s) => ({ ...s, angolaPaymentMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
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

          <Card title={t('portugalOption', lang)} badge={settings.portugalPaymentsEnabled ? t('configuredBadge', lang) : t('deferredBadge', lang)} tone={settings.portugalPaymentsEnabled ? 'green' : 'gold'}>
            <ConfigRow label={t('currencyLabel', lang)} value={t('portugalCurrencyNote', lang)} />
            <ConfigRow
              label={t('portugalPaymentsEnabledLabel', lang)}
              value={<input type="checkbox" checked={settings.portugalPaymentsEnabled} onChange={(e) => setSettings((s) => ({ ...s, portugalPaymentsEnabled: e.target.checked }))} />}
            />
            <ConfigRow
              label={t('manualCheckoutInstructionsLabel', lang)}
              value={
                <div>
                  <textarea
                    value={settings.portugalManualCheckoutInstructionsPT ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, portugalManualCheckoutInstructionsPT: e.target.value }))}
                    rows={2}
                    placeholder={`${t('manualCheckoutInstructionsPlaceholder', lang)} — ${t('portuguese', lang)}`}
                    style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, fontFamily: 'inherit', marginBottom: 8 }}
                  />
                  <textarea
                    value={settings.portugalManualCheckoutInstructionsEN ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, portugalManualCheckoutInstructionsEN: e.target.value }))}
                    rows={2}
                    placeholder={`${t('manualCheckoutInstructionsPlaceholder', lang)} — ${t('english', lang)}`}
                    style={{ width: '100%', padding: 8, fontSize: 11, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, fontFamily: 'inherit' }}
                  />
                </div>
              }
            />
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
            {/* WhatsApp is dormant for now. Restore this row when the channel
                is reactivated in the CMS webhook and storefront admin inbox. */}
            {/* <ConfigRow label={t('whatsappLabel', lang)} value={t('messagingAutomationDetail', lang)} /> */}
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
      {tab === 'home' && (
        <>
          <HomeHeroSection />
          <HomeCategoriesSection />
          <HomeCollectionsSection />
        </>
      )}
      {tab === 'products' && <ProductTaxonomySettings />}
      {tab === 'instagram' && <InstagramSpotlightSection />}
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
  bankNameAO: '',
  accountHolderAO: '',
  bankAccountAO: '',
  swiftBicAO: '',
  paymentInstructionsAO: '',
  vatRateAO: 0,
  taxNoteAO: '',
  invoicePrefixAO: 'UMWS-AO',
  invoiceFooterAO: '',
  invoicingEnabledPT: true,
  issuerNamePT: 'Use Me With Style',
  issuerTaxIdPT: '',
  issuerAddressPT: '',
  bankNamePT: '',
  accountHolderPT: '',
  bankAccountPT: '',
  swiftBicPT: '',
  paymentInstructionsPT: '',
  vatRatePT: 0,
  taxNotePT: '',
  invoicePrefixPT: 'UMWS-PT',
  invoiceFooterPT: '',
};

function InvoicingSettingsSection() {
  const { lang } = useApp();
  const [settings, setSettings] = useState<InvoiceSettings>(INVOICE_SETTINGS_DEFAULTS);
  // Snapshot of `settings` exactly as loaded (or last saved), to disable
  // Save until something actually changed (2026-07-31 admin report) -- see
  // admin/lib/useDirty.ts.
  const [originalSettings, setOriginalSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(settings, originalSettings);

  useEffect(() => {
    adminFetchInvoiceSettings()
      .then((s) => {
        setSettings(s);
        setOriginalSettings(s);
      })
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
      setOriginalSettings(updated);
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
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
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
  const bankNameKey = `bankName${market}` as const;
  const accountHolderKey = `accountHolder${market}` as const;
  const bankAccountKey = `bankAccount${market}` as const;
  const swiftBicKey = `swiftBic${market}` as const;
  const paymentInstructionsKey = `paymentInstructions${market}` as const;
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
      <details style={{ margin: '12px 0', borderTop: `1px solid ${C.ruleLight}`, borderBottom: `1px solid ${C.ruleLight}`, padding: '10px 0' }}>
        <summary style={{ cursor: 'pointer', fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{t('bankPaymentDetails', lang)}</summary>
        <div style={{ paddingTop: 12 }}>
          <SettingsField label={t('bankNameLabel', lang)} value={settings[bankNameKey] ?? ''} onChange={(v) => set(bankNameKey, v)} />
          <SettingsField label={t('accountHolderLabel', lang)} value={settings[accountHolderKey] ?? ''} onChange={(v) => set(accountHolderKey, v)} />
          <SettingsField label={t('bankAccountLabel', lang)} value={settings[bankAccountKey] ?? ''} onChange={(v) => set(bankAccountKey, v)} />
          <SettingsField label={t('swiftBicLabel', lang)} value={settings[swiftBicKey] ?? ''} onChange={(v) => set(swiftBicKey, v)} />
          <SettingsTextarea label={t('paymentInstructionsLabel', lang)} value={settings[paymentInstructionsKey] ?? ''} onChange={(v) => set(paymentInstructionsKey, v)} rows={3} />
        </div>
      </details>
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

function SettingsSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 5 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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
  const [content, setContent] = useState<LegalContent>({
    privacyPolicyTextPT: '',
    privacyPolicyTextEN: '',
    termsTextPT: '',
    termsTextEN: '',
    dataDeletionTextPT: '',
    dataDeletionTextEN: '',
  });
  // Snapshot of `content` exactly as loaded (or last saved), to disable
  // Save until something actually changed (2026-07-31 admin report) -- see
  // admin/lib/useDirty.ts.
  const [originalContent, setOriginalContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(content, originalContent);

  useEffect(() => {
    fetchLegalContent()
      .then((c) => {
        setContent(c);
        setOriginalContent(c);
      })
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
      setOriginalContent(updated);
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
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
        >
          {saving ? '…' : t('saveLegalPages', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="ump-admin-orders-grid">
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
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{t('dataDeletionTitle', lang)}</div>
            <PolicyTextarea label={t('portuguese', lang)} value={content.dataDeletionTextPT ?? ''} onChange={(v) => setContent((c) => ({ ...c, dataDeletionTextPT: v }))} lang={lang} />
            <PolicyTextarea label={t('english', lang)} value={content.dataDeletionTextEN ?? ''} onChange={(v) => setContent((c) => ({ ...c, dataDeletionTextEN: v }))} lang={lang} />
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
// Home page content used to be one combined global with one combined
// "Previous versions" panel -- split into three fully independent globals
// on 2026-08-04 (admin feedback, after living with the combined panel for a
// few hours: "I don't like the previous versions is a global preview of
// the whole home page... it should have previous versions of just each
// individually... creating each thing individually"). Each of the three
// sections below (Hero / Categories / Collections) is now a fully
// self-contained component: its own fetch, its own Save button, its own
// version history with its own restore action -- editing one never touches
// or snapshots the other two. See the CMS repo's HomeHero.ts /
// HomeCategories.ts / HomeCollections.ts and
// src/migrations/20260804_180000_home_content_split.ts.
const HOME_HERO_DEFAULTS: HomeHero = {
  heroEyebrowPT: '',
  heroEyebrowEN: '',
  heroHeadlinePT: '',
  heroHeadlineEN: '',
  heroSubtitlePT: '',
  heroSubtitleEN: '',
  heroCtaLabelPT: '',
  heroCtaLabelEN: '',
  heroCtaType: 'all',
  heroCtaCategorySlug: null,
  heroCtaTagSlug: null,
  heroImage: null,
};
const HOME_CATEGORIES_DEFAULTS: HomeCategories = { homepageCategorySlugs: [] };
const HOME_COLLECTIONS_DEFAULTS: HomeCollections = { collections: [] };

// Shared version-history panel, generic over which of the three home
// globals it's showing. 2026-08-04 follow-up ("there's no way to
// distinguish one version from another... add a collapsible previous
// version so we can just have a look at what is inside"): each row now
// shows a real one-line summary of that snapshot's actual content (not a
// single field shared across all three panels) and expands on click to
// show the full snapshot via the caller-supplied `renderDetail`.
function VersionHistoryPanel<T>({
  lang,
  versions,
  versionsError,
  restoringId,
  onRestore,
  deletingId,
  onDelete,
  summarize,
  renderDetail,
}: {
  lang: Lang;
  versions: HomeGlobalVersion<T>[];
  versionsError: string | null;
  restoringId: string | null;
  onRestore: (version: HomeGlobalVersion<T>) => void;
  // 2026-08-04 follow-up ("Admin should have a way to delete old hero
  // section, old categories and old homepage collections"): per-row delete,
  // gated behind a confirm() same as every other destructive action in this
  // admin -- see the callers' handleDelete for the actual confirm+call.
  deletingId: string | null;
  onDelete: (version: HomeGlobalVersion<T>) => void;
  summarize: (version: T) => string;
  renderDetail: (version: T) => React.ReactNode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.ruleLight}` }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 2 }}>{t('previousVersions', lang)}</div>
      <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 12 }}>{t('previousVersionsNote', lang)}</div>
      {versionsError && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 10 }}>{versionsError}</div>}
      {versions.length === 0 ? (
        <div style={{ fontSize: 11, color: C.inkSoft }}>{t('noVersionsYet', lang)}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {versions.map((v) => {
            const idStr = String(v.id);
            const isExpanded = expandedId === idStr;
            const isRestoring = restoringId === idStr;
            const isDeleting = deletingId === idStr;
            return (
              <div key={v.id} style={{ borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}`, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : idStr)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 9, color: C.inkSoft, flexShrink: 0, width: 10, textAlign: 'center' }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {summarize(v.version)}
                    </div>
                    <div style={{ fontSize: 9, color: C.inkSoft }}>{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <SmallActionButton
                      label={isRestoring ? '…' : t('restoreAction', lang)}
                      disabled={isRestoring || isDeleting}
                      onClick={() => onRestore(v)}
                    />
                    <SmallActionButton
                      label={isDeleting ? '…' : t('deleteVersionAction', lang)}
                      disabled={isRestoring || isDeleting}
                      onClick={() => {
                        if (window.confirm(t('deleteVersionConfirm', lang))) onDelete(v);
                      }}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '2px 12px 12px 30px', borderTop: `1px solid ${C.ruleLight}` }}>
                    <div style={{ paddingTop: 10 }}>{renderDetail(v.version)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Expanded detail for one Hero version snapshot -- 2026-08-04 follow-up
// ("the one page here of photo, the pictures, we should see a preview of
// the picture as well"): shows both languages' copy plus a real thumbnail
// of whatever hero image was live at that point, not just the headline.
function HeroVersionDetail({ lang, version }: { lang: Lang; version: HomeHero }) {
  const imageDoc = resolveRef(version.heroImage);
  const imageUrl = absoluteMediaUrl(imageDoc?.url);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16 }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{t('portuguese', lang)}</div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 2 }}>{version.heroEyebrowPT || '—'}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{version.heroHeadlinePT || '—'}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 2, lineHeight: 1.4 }}>{version.heroSubtitlePT || '—'}</div>
        <div style={{ fontSize: 10, color: C.inkSoft }}>{version.heroCtaLabelPT || '—'}</div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{t('english', lang)}</div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginBottom: 2 }}>{version.heroEyebrowEN || '—'}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{version.heroHeadlineEN || '—'}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 2, lineHeight: 1.4 }}>{version.heroSubtitleEN || '—'}</div>
        <div style={{ fontSize: 10, color: C.inkSoft }}>{version.heroCtaLabelEN || '—'}</div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{t('heroImageLabel', lang)}</div>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: `1px solid ${C.rule}` }} />
        ) : (
          <div style={{ fontSize: 10, color: C.inkSoft }}>{t('versionNoImageLabel', lang)}</div>
        )}
      </div>
    </div>
  );
}

function HomeHeroSection() {
  const { lang } = useApp();
  const [content, setContent] = useState<HomeHero>(HOME_HERO_DEFAULTS);
  // Snapshot of `content` exactly as loaded (or last saved/restored), to
  // disable Save until something actually changed (2026-07-31 admin
  // report) -- see admin/lib/useDirty.ts. A freshly-uploaded hero image
  // (handleImageUpload below) deliberately does NOT update this snapshot,
  // since that upload alone hasn't been saved yet -- it should read as a
  // pending change same as any text edit.
  const [originalContent, setOriginalContent] = useState<HomeHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(content, originalContent);

  // Version history (2026-07-25 follow-up, "save old homepage creations, in
  // case I want to re-activate them later"; split into an independent
  // history per section 2026-08-04). Payload auto-snapshots the PREVIOUS
  // doc on every save (versions.max: 20 on this global). Loaded alongside
  // the current content and refreshed after every save/restore.
  const [versions, setVersions] = useState<HomeHeroVersion[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 2026-07-31 fix (hero pointed at "SS26" but sent shoppers to the full
  // catalogue): the button link is now a picker sourced from the real
  // categories/tags lists instead of a hand-typed URL -- reusing the exact
  // fetchers ProductEditor.tsx already uses for its own category/tag pickers.
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiMerchTag[]>([]);

  const loadVersions = () => {
    adminListHomeHeroVersions()
      .then(setVersions)
      .catch(() => setVersionsError(t('couldntLoadPreviousVersions', lang)));
  };

  useEffect(() => {
    fetchHomeHero()
      .then((c) => {
        setContent(c);
        setOriginalContent(c);
      })
      .catch(() => setError(t('couldntLoadHomeContent', lang)))
      .finally(() => setLoading(false));
    loadVersions();
    Promise.all([adminListCategories(), adminListMerchTags()]).then(([cats, tagDocs]) => {
      setCategories(cats);
      setTags(tagDocs);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateHomeHero({ ...content, heroImage: refId(content.heroImage) || null });
      setContent(updated);
      setOriginalContent(updated);
      setSaved(true);
      loadVersions();
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (version: HomeHeroVersion) => {
    setRestoringId(String(version.id));
    setVersionsError(null);
    try {
      const restored = await adminRestoreHomeHeroVersion(version.id);
      setContent(restored);
      setOriginalContent(restored);
      setSaved(false);
      loadVersions();
    } catch {
      setVersionsError(t('couldntRestoreVersion', lang));
    } finally {
      setRestoringId(null);
    }
  };

  // 2026-08-04 follow-up ("Admin should have a way to delete old hero
  // section... [versions]"): removes just one snapshot, confirm() already
  // shown by VersionHistoryPanel before this is called.
  const handleDelete = async (version: HomeHeroVersion) => {
    setDeletingId(String(version.id));
    setVersionsError(null);
    try {
      await adminDeleteHomeHeroVersion(version.id);
      setVersions((prev) => prev.filter((v) => v.id !== version.id));
    } catch {
      setVersionsError(t('couldntDeleteVersion', lang));
    } finally {
      setDeletingId(null);
    }
  };

  // 2026-08-04 follow-up ("I still don't see a preview of the hero
  // image"): this used to only stage the upload in local `content` state,
  // requiring a separate click on "Save hero" before it actually persisted
  // -- easy to miss, and if that second step never happened the image
  // never made it past this component's own state, so nothing was ever
  // actually saved (confirmed against real data: heroImage had never once
  // been set). Now the upload immediately persists, same pattern as the
  // category tile image upload in ProductSettings.tsx. Saved against
  // `originalContent` (the last-known-saved doc), not the live `content`
  // draft, so an in-progress unsaved text edit elsewhere in the form isn't
  // silently swept into this save -- it stays pending for the normal Save
  // button. The server response is depth=1 populated, so the preview below
  // is guaranteed to have a real, resolved image the moment this resolves.
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const media = await adminUploadMedia(file, 'Home hero image');
      const base = originalContent ?? content;
      const updated = await adminUpdateHomeHero({ ...base, heroImage: media.id });
      setContent((c) => ({ ...c, heroImage: updated.heroImage }));
      setOriginalContent((o) => ({ ...(o ?? updated), heroImage: updated.heroImage }));
      loadVersions();
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
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
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
              <SettingsSelect
                label={t('buttonLinkTypeLabel', lang)}
                value={content.heroCtaType ?? 'all'}
                onChange={(v) => setContent((c) => ({ ...c, heroCtaType: v as HomeHero['heroCtaType'] }))}
                options={[
                  { value: 'all', label: t('buttonLinkTypeAll', lang) },
                  { value: 'category', label: t('buttonLinkTypeCategory', lang) },
                  { value: 'tag', label: t('buttonLinkTypeTag', lang) },
                ]}
              />
              {content.heroCtaType === 'category' && (
                <SettingsSelect
                  label={t('buttonLinkCategoryLabel', lang)}
                  value={content.heroCtaCategorySlug ?? ''}
                  onChange={(v) => setContent((c) => ({ ...c, heroCtaCategorySlug: v }))}
                  options={[
                    { value: '', label: t('chooseEllipsis', lang) },
                    ...categories.filter((cat) => cat.slug).map((cat) => ({ value: cat.slug as string, label: cat.namePT })),
                  ]}
                />
              )}
              {content.heroCtaType === 'tag' && (
                <SettingsSelect
                  label={t('buttonLinkTagLabel', lang)}
                  value={content.heroCtaTagSlug ?? ''}
                  onChange={(v) => setContent((c) => ({ ...c, heroCtaTagSlug: v }))}
                  options={[
                    { value: '', label: t('chooseEllipsis', lang) },
                    ...tags.filter((tag) => tag.slug).map((tag) => ({ value: tag.slug as string, label: tag.labelPT })),
                  ]}
                />
              )}
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

          <VersionHistoryPanel
            lang={lang}
            versions={versions}
            versionsError={versionsError}
            restoringId={restoringId}
            onRestore={(v) => void handleRestore(v)}
            deletingId={deletingId}
            onDelete={(v) => void handleDelete(v)}
            summarize={(v) => v.heroHeadlinePT?.trim() || v.heroHeadlineEN?.trim() || t('noHeadlinePlaceholder', lang)}
            renderDetail={(v) => <HeroVersionDetail lang={lang} version={v} />}
          />
        </>
      )}
    </div>
  );
}

// Which categories appear in the homepage category row, and in what order
// -- CMS global `home-categories` (2026-08-04, "admin should have total
// control here"). Optional/empty by default: Home.tsx falls back to
// showing every category until an admin fills this in. Split into its own
// component with its own save/version-history the same day (see
// HomeHeroSection's header comment for the full reasoning).
function HomeCategoriesSection() {
  const { lang } = useApp();
  const [content, setContent] = useState<HomeCategories>(HOME_CATEGORIES_DEFAULTS);
  const [originalContent, setOriginalContent] = useState<HomeCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(content, originalContent);

  const [versions, setVersions] = useState<HomeCategoriesVersion[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const categoryLabel = (slug: string) => categories.find((c) => c.slug === slug)?.namePT || slug;

  const loadVersions = () => {
    adminListHomeCategoriesVersions()
      .then(setVersions)
      .catch(() => setVersionsError(t('couldntLoadPreviousVersions', lang)));
  };

  useEffect(() => {
    fetchHomeCategories()
      .then((c) => {
        setContent(c);
        setOriginalContent(c);
      })
      .catch(() => setError(t('couldntLoadHomeCategories', lang)))
      .finally(() => setLoading(false));
    loadVersions();
    adminListCategories().then(setCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateHomeCategories({ homepageCategorySlugs: content.homepageCategorySlugs ?? [] });
      setContent(updated);
      setOriginalContent(updated);
      setSaved(true);
      loadVersions();
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (version: HomeCategoriesVersion) => {
    setRestoringId(String(version.id));
    setVersionsError(null);
    try {
      const restored = await adminRestoreHomeCategoriesVersion(version.id);
      setContent(restored);
      setOriginalContent(restored);
      setSaved(false);
      loadVersions();
    } catch {
      setVersionsError(t('couldntRestoreVersion', lang));
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (version: HomeCategoriesVersion) => {
    setDeletingId(String(version.id));
    setVersionsError(null);
    try {
      await adminDeleteHomeCategoriesVersion(version.id);
      setVersions((prev) => prev.filter((v) => v.id !== version.id));
    } catch {
      setVersionsError(t('couldntDeleteVersion', lang));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 28px 32px', borderTop: `1px solid ${C.ruleLight}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{t('homepageCategoriesLabel', lang)}</div>
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2, maxWidth: 560 }}>{t('homepageCategoriesNote', lang)}</div>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
        >
          {saving ? '…' : t('saveCategoriesAction', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginTop: 10 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginTop: 10 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 10 }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, marginBottom: 10 }}>
            {(content.homepageCategorySlugs ?? []).map((entry, index) => {
              const label = categoryLabel(entry.slug);
              const list = content.homepageCategorySlugs ?? [];
              return (
                <div key={`${entry.slug}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
                  <div style={{ flex: 1, fontSize: 12, color: C.ink }}>{label}</div>
                  <SmallActionButton
                    label="↑"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...list];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      setContent((c) => ({ ...c, homepageCategorySlugs: next }));
                    }}
                  />
                  <SmallActionButton
                    label="↓"
                    disabled={index === list.length - 1}
                    onClick={() => {
                      const next = [...list];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      setContent((c) => ({ ...c, homepageCategorySlugs: next }));
                    }}
                  />
                  <SmallActionButton
                    label={t('removeAction', lang)}
                    onClick={() => setContent((c) => ({ ...c, homepageCategorySlugs: list.filter((_, i) => i !== index) }))}
                  />
                </div>
              );
            })}
          </div>
          <SettingsSelect
            label={t('addCategoryAction', lang)}
            value=""
            onChange={(slug) => {
              if (!slug) return;
              setContent((c) => ({ ...c, homepageCategorySlugs: [...(c.homepageCategorySlugs ?? []), { slug }] }));
            }}
            options={[
              { value: '', label: t('chooseEllipsis', lang) },
              ...categories
                .filter((cat) => cat.slug && !(content.homepageCategorySlugs ?? []).some((entry) => entry.slug === cat.slug))
                .map((cat) => ({ value: cat.slug as string, label: cat.namePT })),
            ]}
          />

          <VersionHistoryPanel
            lang={lang}
            versions={versions}
            versionsError={versionsError}
            restoringId={restoringId}
            onRestore={(v) => void handleRestore(v)}
            deletingId={deletingId}
            onDelete={(v) => void handleDelete(v)}
            summarize={(v) => {
              const slugs = v.homepageCategorySlugs ?? [];
              return slugs.length ? slugs.map((entry) => categoryLabel(entry.slug)).join(', ') : t('versionEmptyCategories', lang);
            }}
            renderDetail={(v) => {
              const slugs = v.homepageCategorySlugs ?? [];
              return slugs.length === 0 ? (
                <div style={{ fontSize: 11, color: C.inkSoft }}>{t('versionEmptyCategories', lang)}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {slugs.map((entry, i) => (
                    <div key={entry.id ?? i} style={{ fontSize: 11, color: C.ink }}>
                      {i + 1}. {categoryLabel(entry.slug)}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </>
      )}
    </div>
  );
}

// Tag-driven homepage product shelves -- CMS global `home-collections`
// (2026-08-04 follow-up: "think about me having a new collection, lets say
// summer ss26, I should be able to feature it with the tag SS26, like we
// have featured and new arrivals now"). Optional/empty by default: Home.tsx
// falls back to the previous fixed New Arrivals/Featured sections until an
// admin configures at least one shelf. Split into its own component with
// its own save/version-history the same day (see HomeHeroSection's header
// comment for the full reasoning).
function HomeCollectionsSection() {
  const { lang } = useApp();
  const [content, setContent] = useState<HomeCollections>(HOME_COLLECTIONS_DEFAULTS);
  const [originalContent, setOriginalContent] = useState<HomeCollections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(content, originalContent);

  const [versions, setVersions] = useState<HomeCollectionsVersion[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [tags, setTags] = useState<ApiMerchTag[]>([]);

  const loadVersions = () => {
    adminListHomeCollectionsVersions()
      .then(setVersions)
      .catch(() => setVersionsError(t('couldntLoadPreviousVersions', lang)));
  };

  useEffect(() => {
    fetchHomeCollections()
      .then((c) => {
        setContent(c);
        setOriginalContent(c);
      })
      .catch(() => setError(t('couldntLoadHomeCollections', lang)))
      .finally(() => setLoading(false));
    loadVersions();
    adminListMerchTags().then(setTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateHomeCollections({ collections: content.collections ?? [] });
      setContent(updated);
      setOriginalContent(updated);
      setSaved(true);
      loadVersions();
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (version: HomeCollectionsVersion) => {
    setRestoringId(String(version.id));
    setVersionsError(null);
    try {
      const restored = await adminRestoreHomeCollectionsVersion(version.id);
      setContent(restored);
      setOriginalContent(restored);
      setSaved(false);
      loadVersions();
    } catch {
      setVersionsError(t('couldntRestoreVersion', lang));
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (version: HomeCollectionsVersion) => {
    setDeletingId(String(version.id));
    setVersionsError(null);
    try {
      await adminDeleteHomeCollectionsVersion(version.id);
      setVersions((prev) => prev.filter((v) => v.id !== version.id));
    } catch {
      setVersionsError(t('couldntDeleteVersion', lang));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 28px 32px', borderTop: `1px solid ${C.ruleLight}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{t('homepageCollectionsLabel', lang)}</div>
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2, maxWidth: 560 }}>{t('homepageCollectionsNote', lang)}</div>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
        >
          {saving ? '…' : t('saveCollectionsAction', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginTop: 10 }}>{error}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginTop: 10 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 10 }}>{t('loadingEllipsis', lang)}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, marginBottom: 10 }}>
            {(content.collections ?? []).map((row, index) => {
              const list = content.collections ?? [];
              const updateRow = (patch: Partial<(typeof list)[number]>) => {
                const next = [...list];
                next[index] = { ...next[index], ...patch };
                setContent((c) => ({ ...c, collections: next }));
              };
              return (
                <div key={index} style={{ padding: '10px 12px', borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                    <SettingsSelect
                      label={t('collectionTagLabel', lang)}
                      value={row.tagSlug ?? ''}
                      onChange={(v) => updateRow({ tagSlug: v })}
                      options={[
                        { value: '', label: t('chooseEllipsis', lang) },
                        ...tags.filter((tag) => tag.slug).map((tag) => ({ value: tag.slug as string, label: tag.labelPT })),
                      ]}
                    />
                    <SettingsField label={t('collectionTitlePTLabel', lang)} value={row.titlePT ?? ''} onChange={(v) => updateRow({ titlePT: v })} />
                    <SettingsField label={t('collectionTitleENLabel', lang)} value={row.titleEN ?? ''} onChange={(v) => updateRow({ titleEN: v })} />
                    <SettingsField
                      label={t('collectionItemLimitLabel', lang)}
                      type="number"
                      value={String(row.itemLimit ?? 8)}
                      onChange={(v) => updateRow({ itemLimit: Number(v) || 8 })}
                    />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <SmallActionButton
                      label={t('removeAction', lang)}
                      onClick={() => setContent((c) => ({ ...c, collections: list.filter((_, i) => i !== index) }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <SmallActionButton
            label={t('addCollectionAction', lang)}
            onClick={() =>
              setContent((c) => ({
                ...c,
                collections: [...(c.collections ?? []), { tagSlug: '', titlePT: '', titleEN: '', itemLimit: 8 }],
              }))
            }
          />

          <VersionHistoryPanel
            lang={lang}
            versions={versions}
            versionsError={versionsError}
            restoringId={restoringId}
            onRestore={(v) => void handleRestore(v)}
            deletingId={deletingId}
            onDelete={(v) => void handleDelete(v)}
            summarize={(v) => {
              const cols = v.collections ?? [];
              return cols.length ? cols.map((c) => c.titlePT || c.titleEN || c.tagSlug).join(', ') : t('versionEmptyCollections', lang);
            }}
            renderDetail={(v) => {
              const cols = v.collections ?? [];
              return cols.length === 0 ? (
                <div style={{ fontSize: 11, color: C.inkSoft }}>{t('versionEmptyCollections', lang)}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cols.map((row, i) => (
                    <div key={row.id ?? i} style={{ fontSize: 11, color: C.ink }}>
                      {i + 1}. {row.titlePT || row.titleEN} <span style={{ color: C.inkSoft }}>({row.tagSlug}, max {row.itemLimit ?? 8})</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </>
      )}
    </div>
  );
}

// Instagram feed highlight (2026-08-02, simplified same day from an
// ordered/labelled curation-list version -- Jay-P: "I actually don't like
// this admin instagram feature... just show the most recent 12 posts and
// allow me to choose the highlighted post, the caption should be the post
// caption and tile size for highlighted post is large"). Down to one admin
// choice: click a post to highlight it (large tile on the homepage), click
// it again to clear the highlight. The 12 posts shown here are the same
// live pool the storefront section pulls from (fetchInstagramFeed -- a
// public read, no admin auth needed for that half); only the highlight pick
// itself (CMS global `instagram-spotlight`) needs the authenticated
// fetch/save, same self-contained pattern as every other tab here.
function InstagramSpotlightSection() {
  const { lang } = useApp();
  const [posts, setPosts] = useState<ApiInstagramPost[]>([]);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [highlightedPermalink, setHighlightedPermalink] = useState('');
  const [originalHighlightedPermalink, setOriginalHighlightedPermalink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDirty = useDirty(highlightedPermalink, originalHighlightedPermalink);

  useEffect(() => {
    Promise.all([
      fetchInstagramFeed(12).then((result) => setPosts(result.posts)).catch(() => setPostsError(t('couldntLoadInstagramFeed', lang))),
      adminFetchInstagramSpotlight().then((data) => {
        const loaded = data.highlightedPermalink ?? '';
        setHighlightedPermalink(loaded);
        setOriginalHighlightedPermalink(loaded);
      }),
    ])
      .catch(() => setError(t('couldntLoadInstagramFeed', lang)))
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await adminUpdateInstagramSpotlight({ highlightedPermalink: highlightedPermalink || null });
      // Deliberately not overwriting `highlightedPermalink` from the
      // response here (2026-08-02 bug report: "the pill disappears, and
      // only reappears when I reload the page"). We already know exactly
      // what was just persisted -- it's whatever the tiles were showing
      // right before Save was clicked -- so there's no reason to let a
      // round-tripped server value replace working local state; only the
      // "is this dirty" baseline needs to move.
      setOriginalHighlightedPermalink(highlightedPermalink);
      setSaved(true);
    } catch {
      setError(t('couldntSaveLoggedIn', lang));
    } finally {
      setSaving(false);
    }
  };

  const toggleHighlight = (permalink: string) => {
    setSaved(false);
    setHighlightedPermalink((current) => (current === permalink ? '' : permalink));
  };

  return (
    <div style={{ padding: '20px 28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.inkSoft, maxWidth: 560 }}>{t('instagramFeedHint', lang)}</div>
        <button
          onClick={() => void handleSave()}
          disabled={loading || saving || !isDirty}
          style={{
            padding: '9px 18px',
            background: loading || saving || !isDirty ? C.disabledBg : C.black,
            color: loading || saving || !isDirty ? C.disabledFg : C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            flexShrink: 0,
            cursor: loading || saving || !isDirty ? 'default' : 'pointer',
          }}
        >
          {saving ? '…' : t('saveInstagramFeed', lang)}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{error}</div>}
      {postsError && <div style={{ fontSize: 12, color: '#B95545', marginBottom: 12 }}>{postsError}</div>}
      {saved && <div style={{ fontSize: 12, color: '#3F754D', marginBottom: 12 }}>{t('savedNotice', lang)}</div>}

      {loading ? (
        <div style={{ fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>
      ) : posts.length === 0 ? (
        <div style={{ fontSize: 11, color: C.inkSoft }}>{t('noInstagramPostsYet', lang)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }} className="ump-admin-media-grid">
          {posts.map((post) => {
            const isHighlighted = post.permalink === highlightedPermalink;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => toggleHighlight(post.permalink)}
                style={{
                  position: 'relative',
                  display: 'block',
                  padding: 0,
                  border: `2px solid ${isHighlighted ? C.goldDeep : C.ruleLight}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: C.paper,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ aspectRatio: '4 / 5', overflow: 'hidden' }}>
                  <img src={post.imageUrl} alt={post.captionDisplay} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: C.goldDeep,
                      color: C.onDarkGold,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}
                  >
                    {t('instagramHighlightedBadge', lang)}
                  </div>
                )}
                <div style={{ padding: 8, fontSize: 10, color: C.inkSoft, lineHeight: 1.4, minHeight: 30 }}>
                  {post.captionDisplay || t('instagramNoCaptionPlaceholder', lang)}
                </div>
              </button>
            );
          })}
        </div>
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
