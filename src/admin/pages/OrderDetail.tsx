import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { adminGetOrder, adminUpdateOrderStatus, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';

const STATUSES = ['new', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetOrder(id)
      .then(setOrder)
      .catch(() => setError(true));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await adminUpdateOrderStatus(order.id, status);
      setOrder(updated);
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

  if (!order) {
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

      <div style={{ padding: '18px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
        <Field label="Name" value={order.customerName} />
        <Field label="Phone / WhatsApp" value={order.customerPhone} />
        <Field label="Email" value={order.customerEmail} />
        <Field label="Address" value={order.address} />
        <Field label="City / Country" value={`${order.city}, ${order.country}`} />
        <Field label="Notes" value={order.notes || '—'} />
      </div>

      <div style={{ padding: '18px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
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

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 16 }}>
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
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
