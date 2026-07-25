import { useEffect, useState, type CSSProperties } from 'react';
import { C, F } from '../../theme';
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
};

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function fmtDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function Coupons() {
  const [coupons, setCoupons] = useState<ApiCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | number | 'new' | null>(null);
  const [draft, setDraft] = useState<CouponInput>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const load = () => {
    adminListCoupons()
      .then(setCoupons)
      .catch(() => setError("Couldn't connect to the backend."));
  };

  useEffect(load, []);

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
      setError('A code is required.');
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
      setError(taxonomyErrorMessage(err, "Couldn't save this coupon."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: ApiCoupon) => {
    if (!window.confirm(`Delete "${c.code}"? Past orders that used it keep their discount -- this only removes the code itself.`)) return;
    setError(null);
    try {
      await adminDeleteCoupon(c.id);
      setCoupons((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
    } catch {
      setError("Couldn't delete this coupon.");
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow="Settings / Discounts"
        title="Coupon codes"
        subtitle="Percentage or fixed-amount discounts shoppers apply at checkout. Editing or deleting a code never changes past orders that already used it."
        cta="New coupon"
        onCta={startCreate}
      />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}

      {editing !== null && (
        <CouponForm draft={draft} setDraft={setDraft} busy={busy} onSave={save} onCancel={cancel} isNew={editing === 'new'} />
      )}

      {coupons && coupons.length === 0 && editing === null && (
        <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>No coupons yet.</div>
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
              <div style={{ fontSize: 10, color: c.active === false ? '#B95545' : '#3C8A5E', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                {c.active === false ? 'Inactive' : 'Active'}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.ink, minWidth: 140 }}>
              {c.type === 'percent'
                ? `${c.percentOff ?? 0}% off`
                : `Kz ${c.fixedOffAOKz ?? 0} / €${c.fixedOffPTEur ?? 0} off`}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, minWidth: 160 }}>
              {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, minWidth: 100 }}>
              Used {c.usageCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
            </div>
            {c.description && (
              <div style={{ fontSize: 11, color: C.inkSoft, flex: 1, minWidth: 140 }}>{c.description}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={() => startEdit(c)}
                style={{ padding: '7px 14px', fontSize: 10, fontWeight: 800, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, background: 'transparent' }}
              >
                Edit
              </button>
              <button
                onClick={() => remove(c)}
                style={{ padding: '7px 14px', fontSize: 10, fontWeight: 800, color: '#B95545', border: '1px solid #E1B3AA', borderRadius: 6, background: 'transparent' }}
              >
                Delete
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
}: {
  draft: CouponInput;
  setDraft: (d: CouponInput) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  return (
    <div style={{ margin: '20px 28px 0', background: C.subtleBg, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 14 }}>{isNew ? 'New coupon' : `Edit ${draft.code}`}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <TextField label="Code" value={draft.code} onChange={(v) => setDraft({ ...draft, code: v.toUpperCase() })} placeholder="SUMMER10" />
        <SelectField
          label="Type"
          value={draft.type}
          onChange={(v) => setDraft({ ...draft, type: v as 'percent' | 'fixed' })}
          options={[{ value: 'percent', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount off' }]}
        />
        <CheckboxField label="Active" checked={draft.active ?? true} onChange={(v) => setDraft({ ...draft, active: v })} />
      </div>

      {draft.type === 'percent' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
          <NumberField label="Percent off (1-100)" value={draft.percentOff} onChange={(v) => setDraft({ ...draft, percentOff: v })} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
          <NumberField label="Fixed off -- Angola (Kz)" value={draft.fixedOffAOKz} onChange={(v) => setDraft({ ...draft, fixedOffAOKz: v })} />
          <NumberField label="Fixed off -- Portugal (EUR)" value={draft.fixedOffPTEur} onChange={(v) => setDraft({ ...draft, fixedOffPTEur: v })} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <NumberField label="Min. order -- Angola (Kz)" value={draft.minOrderValueAOKz} onChange={(v) => setDraft({ ...draft, minOrderValueAOKz: v })} />
        <NumberField label="Min. order -- Portugal (EUR)" value={draft.minOrderValuePTEur} onChange={(v) => setDraft({ ...draft, minOrderValuePTEur: v })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <DateField label="Start date (optional)" value={toDateInputValue(draft.startDate)} onChange={(v) => setDraft({ ...draft, startDate: v || null })} />
        <DateField label="End date (optional)" value={toDateInputValue(draft.endDate)} onChange={(v) => setDraft({ ...draft, endDate: v || null })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
        <NumberField label="Total usage limit" value={draft.usageLimit} onChange={(v) => setDraft({ ...draft, usageLimit: v })} />
        <NumberField label="Per-customer limit" value={draft.maxRedemptionsPerEmail} onChange={(v) => setDraft({ ...draft, maxRedemptionsPerEmail: v })} />
      </div>

      <div style={{ marginTop: 12 }}>
        <TextField label="Internal note (optional)" value={draft.description || ''} onChange={(v) => setDraft({ ...draft, description: v })} placeholder="Which campaign this is for" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={onSave}
          disabled={busy}
          style={{ padding: '9px 18px', fontSize: 11, fontWeight: 800, color: C.onDarkGold, background: C.black, borderRadius: 6 }}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={busy} style={{ padding: '9px 18px', fontSize: 11, fontWeight: 800, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, background: 'transparent' }}>
          Cancel
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
