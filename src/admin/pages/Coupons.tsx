import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminUpdateCoupon,
  taxonomyErrorMessage,
  type ApiCoupon,
  type CouponInput,
} from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t, type Lang } from '../i18n';

// Discounts phase 2 (2026-07-25): admin CRUD for coupon codes, standalone
// page + route (same pattern as Invoices/Media) rather than a Settings tab,
// since a coupon needs meaningfully more fields (type, per-market amounts,
// date window, usage limits) than the compact two-field taxonomy rows
// (Categories/MerchTags/Colors) already living in Settings.
const emptyDraft: CouponInput = {
  code: '',
  active: true,
  description: '',
  type: 'percent',
  percentOff: 10,
  fixedOffAOKz: null,
  fixedOffPTEur: null,
  minOrderValueAOKz: null,
  minOrderValuePTEur: null,
  startDate: null,
  endDate: null,
  usageLimit: null,
  maxRedemptionsPerEmail: null,
  availableAO: true,
  availablePT: true,
};

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function fmtDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

// Status badge (2026-07-31 fix): previously read only the stored `active`
// flag, so a coupon like SUMMER10 with `active: true` but a past `endDate`
// still showed green "Active" -- checkout already rejects it correctly
// (see couponPricing.ts's resolveCoupon), this was purely a display bug.
// Dates take priority over the flag either direction: an expired or
// not-yet-started coupon reads as such even if someone left `active` on,
// and a coupon inside its date window still reads "Inactive" if the admin
// explicitly turned it off.
type CouponStatus = 'active' | 'inactive' | 'expired' | 'scheduled';

function couponStatus(c: ApiCoupon): CouponStatus {
  if (c.active === false) return 'inactive';
  const now = new Date();
  if (c.endDate && new Date(c.endDate) < now) return 'expired';
  if (c.startDate && new Date(c.startDate) > now) return 'scheduled';
  return 'active';
}

const couponStatusColor: Record<CouponStatus, string> = {
  active: '#3C8A5E',
  inactive: C.inkSoft,
  expired: '#B95545',
  scheduled: C.goldDeep,
};

function couponStatusLabel(status: CouponStatus, lang: Lang): string {
  switch (status) {
    case 'inactive':
      return t('inactiveStatus', lang);
    case 'expired':
      return t('expiredStatus', lang);
    case 'scheduled':
      return t('scheduledStatus', lang);
    default:
      return t('activeStatusSingular', lang);
  }
}

export function Coupons() {
  const { lang } = useApp();
  const [coupons, setCoupons] = useState<ApiCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | number | 'new' | null>(null);
  const [draft, setDraft] = useState<CouponInput>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminListCoupons()
      .then(setCoupons)
      .catch(() => setError(t('couldntConnectBackend', lang)));
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setDraft(emptyDraft);
    setEditing('new');
    setError(null);
  };

  const startEdit = (c: ApiCoupon) => {
    setDraft({
      code: c.code,
      active: c.active ?? true,
      description: c.description || '',
      type: c.type,
      percentOff: c.percentOff ?? null,
      fixedOffAOKz: c.fixedOffAOKz ?? null,
      fixedOffPTEur: c.fixedOffPTEur ?? null,
      minOrderValueAOKz: c.minOrderValueAOKz ?? null,
      minOrderValuePTEur: c.minOrderValuePTEur ?? null,
      startDate: c.startDate ?? null,
      endDate: c.endDate ?? null,
      usageLimit: c.usageLimit ?? null,
      maxRedemptionsPerEmail: c.maxRedemptionsPerEmail ?? null,
      availableAO: c.availableAO ?? true,
      availablePT: c.availablePT ?? true,
    });
    setEditing(c.id);
    setError(null);
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  const save = async () => {
    if (!draft.code.trim()) {
      setError(t('codeRequiredError', lang));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: CouponInput = {
        ...draft,
        code: draft.code.trim().toUpperCase(),
        description: draft.description || undefined,
      };
      if (editing === 'new') {
        await adminCreateCoupon(input);
      } else if (editing !== null) {
        await adminUpdateCoupon(editing, input);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(taxonomyErrorMessage(err, t('couldntSaveCoupon', lang)));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: ApiCoupon) => {
    if (!window.confirm(t('deleteCouponConfirm', lang, { code: c.code }))) return;
    setError(null);
    try {
      await adminDeleteCoupon(c.id);
      setCoupons((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
    } catch {
      setError(t('couldntDeleteCoupon', lang));
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('settingsDiscounts', lang)}
        title={t('couponCodesTitle', lang)}
        subtitle={t('couponCodesSubtitle', lang)}
        cta={t('newCoupon', lang)}
        onCta={startCreate}
      />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}

      {editing !== null && (
        <CouponForm draft={draft} setDraft={setDraft} busy={busy} onSave={save} onCancel={cancel} isNew={editing === 'new'} lang={lang} />
      )}

      {coupons && coupons.length === 0 && editing === null && (
        <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noCouponsYet', lang)}</div>
      )}

      <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(coupons ?? []).map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              background: C.paper,
              border: `1px solid ${C.ruleLight}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}
          >
            <div style={{ minWidth: 120 }}>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 800, color: C.ink }}>{c.code}</div>
              <div style={{ fontSize: 10, color: couponStatusColor[couponStatus(c)], fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                {couponStatusLabel(couponStatus(c), lang)}
              </div>
              {/* Market scoping (2026-07-27): only shown when the coupon is
                  actually restricted, so an unrestricted (default, both
                  true) coupon's row looks exactly like it did before this
                  field existed. */}
              {(c.availableAO === false || c.availablePT === false) && (
                <div style={{ fontSize: 10, color: C.goldDeep, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                  {t('marketRestrictedBadge', lang)}: {[c.availableAO !== false && 'AO', c.availablePT !== false && 'PT'].filter(Boolean).join(' + ') || '—'}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.ink, minWidth: 140 }}>
              {c.type === 'percent'
                ? t('percentOffLabel', lang, { pct: c.percentOff ?? 0 })
                : c.type === 'fixed'
                  ? t('fixedOffLabel', lang, { kz: c.fixedOffAOKz ?? 0, eur: c.fixedOffPTEur ?? 0 })
                  : t('freeShippingOffLabel', lang)}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, minWidth: 160 }}>
              {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, minWidth: 100 }}>
              {c.usageLimit ? t('usedCountOfLimit', lang, { n: c.usageCount ?? 0, limit: c.usageLimit }) : t('usedCountLabel', lang, { n: c.usageCount ?? 0 })}
            </div>
            {c.description && (
              <div style={{ fontSize: 11, color: C.inkSoft, flex: 1, minWidth: 140 }}>{c.description}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={() => startEdit(c)}
                style={{ padding: '7px 14px', fontSize: 10, fontWeight: 800, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, background: 'transparent' }}
              >
                {t('editAction', lang)}
              </button>
              <button
                onClick={() => remove(c)}
                style={{ padding: '7px 14px', fontSize: 10, fontWeight: 800, color: '#B95545', border: '1px solid #E1B3AA', borderRadius: 6, background: 'transparent' }}
              >
                {t('deleteAction', lang)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponForm({
  draft,
  setDraft,
  busy,
  onSave,
  onCancel,
  isNew,
  lang,
}: {
  draft: CouponInput;
  setDraft: (d: CouponInput) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
  lang: Lang;
}) {
  return (
    <div style={{ margin: '20px 28px 0', background: C.subtleBg, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 14 }}>{isNew ? t('newCouponHeading', lang) : t('editCouponHeading', lang, { code: draft.code })}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <TextField label={t('codeLabel', lang)} value={draft.code} onChange={(v) => setDraft({ ...draft, code: v.toUpperCase() })} placeholder="SUMMER10" />
        <SelectField
          label={t('typeLabel', lang)}
          value={draft.type}
          onChange={(v) => setDraft({ ...draft, type: v as 'percent' | 'fixed' | 'free_shipping' })}
          options={[
            { value: 'percent', label: t('percentageOffOption', lang) },
            { value: 'fixed', label: t('fixedAmountOffOption', lang) },
            { value: 'free_shipping', label: t('freeShippingOption', lang) },
          ]}
        />
        <CheckboxField label={t('activeCheckboxLabel', lang)} checked={draft.active ?? true} onChange={(v) => setDraft({ ...draft, active: v })} />
        <CheckboxField label={t('availableAngolaCheckboxLabel', lang)} checked={draft.availableAO ?? true} onChange={(v) => setDraft({ ...draft, availableAO: v })} />
        <CheckboxField label={t('availablePortugalCheckboxLabel', lang)} checked={draft.availablePT ?? true} onChange={(v) => setDraft({ ...draft, availablePT: v })} />
      </div>

      {draft.type === 'percent' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
          <NumberField label={t('percentOffFieldLabel', lang)} value={draft.percentOff} onChange={(v) => setDraft({ ...draft, percentOff: v })} />
        </div>
      ) : draft.type === 'fixed' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
          <NumberField label={t('fixedOffAngolaKz', lang)} value={draft.fixedOffAOKz} onChange={(v) => setDraft({ ...draft, fixedOffAOKz: v })} />
          <NumberField label={t('fixedOffPortugalEur', lang)} value={draft.fixedOffPTEur} onChange={(v) => setDraft({ ...draft, fixedOffPTEur: v })} />
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 11, color: C.inkSoft }}>{t('freeShippingNote', lang)}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <NumberField label={t('minOrderAngolaKz', lang)} value={draft.minOrderValueAOKz} onChange={(v) => setDraft({ ...draft, minOrderValueAOKz: v })} />
        <NumberField label={t('minOrderPortugalEur', lang)} value={draft.minOrderValuePTEur} onChange={(v) => setDraft({ ...draft, minOrderValuePTEur: v })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <DateField label={t('startDateOptional', lang)} value={toDateInputValue(draft.startDate)} onChange={(v) => setDraft({ ...draft, startDate: v || null })} />
        <DateField label={t('endDateOptional', lang)} value={toDateInputValue(draft.endDate)} onChange={(v) => setDraft({ ...draft, endDate: v || null })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <NumberField label={t('totalUsageLimit', lang)} value={draft.usageLimit} onChange={(v) => setDraft({ ...draft, usageLimit: v })} />
        <NumberField label={t('perCustomerLimit', lang)} value={draft.maxRedemptionsPerEmail} onChange={(v) => setDraft({ ...draft, maxRedemptionsPerEmail: v })} />
      </div>

      <div style={{ marginTop: 12 }}>
        <TextField label={t('internalNoteOptional', lang)} value={draft.description || ''} onChange={(v) => setDraft({ ...draft, description: v })} placeholder={t('internalNotePlaceholder', lang)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={onSave}
          disabled={busy}
          style={{ padding: '9px 18px', fontSize: 11, fontWeight: 800, color: C.onDarkGold, background: C.black, borderRadius: 6 }}
        >
          {busy ? t('savingEllipsis', lang) : t('saveAction', lang)}
        </button>
        <button onClick={onCancel} disabled={busy} style={{ padding: '9px 18px', fontSize: 11, fontWeight: 800, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, background: 'transparent' }}>
          {t('cancelAction', lang)}
        </button>
      </div>
    </div>
  );
}

const fieldLabelStyle: CSSProperties = { fontSize: 11, color: C.inkSoft, marginBottom: 4 };
const inputStyle: CSSProperties = { width: '100%', padding: '9px 11px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink };

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value?: number | null; onChange: (v: number | null) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        style={inputStyle}
      />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: C.gold, width: 16, height: 16 }} />
      <span style={{ fontSize: 12, color: C.ink }}>{label}</span>
    </label>
  );
}
