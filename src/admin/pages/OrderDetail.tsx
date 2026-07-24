import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { adminGetOrder, adminUpdateOrder, adminUpdateOrderStatus, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';

const STATUSES = ['new', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'awaiting_manual_review', 'paid', 'failed'] as const;

// Editable core fields (added 2026-07-25 for storefront-admin/Payload-admin
// parity -- previously only the status pipeline below was editable here,
// everything else required going into Payload admin directly). Deliberately
// excludes items/subtotal/total: see adminUpdateOrder's comment in lib/api.ts
// for why that's left out even though Payload's raw admin technically allows it.
type EditableFields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  taxId: string;
  notes: string;
  paymentStatus: string;
  deliveryMethod: string;
};

function toEditable(order: ApiOrder): EditableFields {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    address: order.address,
    addressLine2: order.addressLine2 ?? '',
    postalCode: order.postalCode ?? '',
    city: order.city,
    country: order.country,
    taxId: order.taxId ?? '',
    notes: order.notes ?? '',
    paymentStatus: order.paymentStatus,
    deliveryMethod: order.deliveryMethod,
  };
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [form, setForm] = useState<EditableFields | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetOrder(id)
      .then((o) => {
        setOrder(o);
        setForm(toEditable(o));
      })
      .catch(() => setError(true));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await adminUpdateOrderStatus(order.id, status);
      setOrder(updated);
      setForm(toEditable(updated));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldsSaved(false);
  };

  const handleSaveFields = async () => {
    if (!order || !form) return;
    setSaving(true);
    setFieldsSaved(false);
    try {
      const updated = await adminUpdateOrder(order.id, {
        ...form,
        addressLine2: form.addressLine2 || undefined,
        postalCode: form.postalCode || undefined,
        taxId: form.taxId || undefined,
        notes: form.notes || undefined,
      });
      setOrder(updated);
      setForm(toEditable(updated));
      setFieldsSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '32px 28px', fontSize: 13, color: '#B95545' }}>
        Couldn't load this order. <Link to="/admin/encomendas">Back</Link>
      </div>
    );
  }

  if (!order || !form) {
    return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>Loading…</div>;
  }

  const activeIdx = STATUSES.indexOf(order.status as (typeof STATUSES)[number]);
  const b = statusBadgeProps(order.status);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={`Orders / #${order.orderNumber}`}
        title={b.label}
        subtitle="Manual payment confirmation before processing and manual Angola coordination."
        cta={order.status === 'payment_review' ? 'Confirm payment' : 'Update status'}
        onCta={() => handleStatusChange(order.status === 'payment_review' ? 'processing' : order.status)}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Order summary</div>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 800, color: C.ink }}>#{order.orderNumber} {order.customerName}</div>
        </div>
        <Badge label={b.label} tone={b.tone} />
      </div>

      <div style={{ padding: '18px 28px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {STATUSES.map((s, i) => {
          const current = i === activeIdx;
          return (
            <button
              key={s}
              disabled={saving}
              onClick={() => handleStatusChange(s)}
              style={{
                flex: '1 0 120px',
                textAlign: 'left',
                padding: 14,
                borderRadius: 8,
                background: current ? C.tagBg : C.paper,
                border: `1px solid ${current ? '#E8D28D' : C.ruleLight}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{statusBadgeProps(s).label}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 6 }}>{current ? 'Current' : i < activeIdx ? 'Done' : 'Pending'}</div>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '18px 28px 0' }}>
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>Customer &amp; fulfilment details</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {fieldsSaved && <span style={{ fontSize: 11, color: '#3F754D' }}>Saved.</span>}
              <button
                onClick={handleSaveFields}
                disabled={saving}
                style={{ padding: '8px 16px', background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6 }}
              >
                {saving ? '…' : 'Save changes'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
            <EditField label="Name" value={form.customerName} onChange={(v) => setField('customerName', v)} />
            <EditField label="Phone / WhatsApp" value={form.customerPhone} onChange={(v) => setField('customerPhone', v)} />
            <EditField label="Email" value={form.customerEmail} onChange={(v) => setField('customerEmail', v)} type="email" />
            <EditField label="Address" value={form.address} onChange={(v) => setField('address', v)} />
            <EditField label="Floor / Door (PT)" value={form.addressLine2} onChange={(v) => setField('addressLine2', v)} />
            <EditField label="Postal code (PT)" value={form.postalCode} onChange={(v) => setField('postalCode', v)} />
            <EditField label="City" value={form.city} onChange={(v) => setField('city', v)} />
            <EditField label="Country" value={form.country} onChange={(v) => setField('country', v)} />
            <EditField label="NIF / Tax ID" value={form.taxId} onChange={(v) => setField('taxId', v)} />
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Payment status</div>
              <select
                value={form.paymentStatus}
                onChange={(e) => setField('paymentStatus', e.target.value)}
                style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <EditField label="Delivery method" value={form.deliveryMethod} onChange={(v) => setField('deliveryMethod', v)} />
            <label style={{ display: 'block', gridColumn: 'span 3' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Notes</div>
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '11px 12px', fontSize: 12, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink, fontFamily: 'inherit' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 10 }}>Items ordered</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.ruleLight}` : 'none' }}>
              <div style={{ width: 56, height: 68, flexShrink: 0, borderRadius: 6, background: C.subtleBg, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: C.goldDeep, textAlign: 'center' }}>
                Photo pending
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{item.productName}</div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                  Size {item.size}
                  {item.color ? `, ${item.color}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>Qty {item.qty}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{item.unitPrice.toLocaleString('en-US')} {order.currency}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 8 }}>Payment and delivery</div>
          <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 14, lineHeight: 1.3 }}>
            {order.status === 'payment_review' ? 'Manual confirmation needed' : 'Confirmed'}
          </div>
          <RowKV label="Payment method" value={order.paymentMethod} badge={order.status === 'payment_review' ? 'Review' : undefined} tone="gold" />
          <RowKV label="Delivery method" value={order.deliveryMethod} />
          <RowKV label="Order total" value={`${order.total.toLocaleString('en-US')} ${order.currency}`} last />
          <button
            onClick={() => handleStatusChange('processing')}
            disabled={saving}
            style={{ width: '100%', marginTop: 14, padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6 }}
          >
            Approve and process
          </button>
        </div>
      </div>

      <PaymentDiagnostics order={order} />
    </div>
  );
}

// Provider/troubleshooting fields (payment reference, AppyPay gateway
// echoes, inventory reservation state) -- all admin-read-only in Payload
// (see Orders.ts), so this panel only displays them, matching what Payload
// admin shows. Only rendered when at least one value is actually present,
// since most orders (non-AppyPay) won't have any of these set.
function PaymentDiagnostics({ order }: { order: ApiOrder }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Payment reference', value: order.paymentReference ?? '' },
    { label: 'AppyPay merchant transaction ID', value: order.appyPayMerchantTransactionId ?? '' },
    { label: 'AppyPay transaction ID', value: order.appyPayTransactionId ?? '' },
    { label: 'AppyPay status', value: order.appyPayStatus ?? '' },
    { label: 'AppyPay payment method', value: order.appyPayPaymentMethod ?? '' },
    { label: 'AppyPay response', value: order.appyPayResponseCode ? `${order.appyPayResponseCode} — ${order.appyPayResponseMessage ?? ''}` : '' },
    { label: 'AppyPay reference', value: order.appyPayReferenceEntity ? `${order.appyPayReferenceEntity} / ${order.appyPayReferenceNumber ?? ''}` : '' },
    { label: 'AppyPay reference due date', value: order.appyPayReferenceDueDate ? new Date(order.appyPayReferenceDueDate).toLocaleDateString() : '' },
    { label: 'AppyPay verified at', value: order.appyPayVerifiedAt ? new Date(order.appyPayVerifiedAt).toLocaleString() : '' },
    { label: 'Inventory reservation', value: order.inventoryReservationStatus ?? '' },
    { label: 'Reservation expires', value: order.inventoryReservationExpiresAt ? new Date(order.inventoryReservationExpiresAt).toLocaleString() : '' },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div style={{ padding: '18px 28px 0' }}>
      <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 10 }}>Payment diagnostics (read-only)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="ump-admin-fields-grid">
          {rows.map((r) => (
            <div key={r.label}>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft, marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, wordBreak: 'break-all' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
    </label>
  );
}

function RowKV({ label, value, badge, tone, last }: { label: string; value: string; badge?: string; tone?: 'gold'; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.ruleLight}` }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 3 }}>{value}</div>
      </div>
      {badge && <Badge label={badge} tone={tone ?? 'neutral'} />}
    </div>
  );
}
