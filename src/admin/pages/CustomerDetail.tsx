import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { adminGetCustomer, adminListOrdersByEmail, adminUpdateCustomer, type ApiCustomer, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';

// Customer detail/edit + order history -- previously the Customers list was
// read-only with no detail page at all. Added 2026-07-25 for storefront-
// admin/Payload-admin parity (Payload admin lets you open and edit any
// customer document directly).
export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<ApiCustomer | null>(null);
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', market: 'AO' as 'AO' | 'PT' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminGetCustomer(id)
      .then((c) => {
        setCustomer(c);
        setForm({ name: c.name, email: c.email, phone: c.phone ?? '', market: c.market });
        return adminListOrdersByEmail(c.email);
      })
      .then(setOrders)
      .catch(() => setError("Couldn't load this customer."));
  }, [id]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await adminUpdateCustomer(customer.id, { ...form, phone: form.phone || undefined });
      setCustomer(updated);
      setSaved(true);
    } catch {
      setError("Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '32px 28px', fontSize: 13, color: '#B95545' }}>
        {error} <Link to="/admin/clientes">Back</Link>
      </div>
    );
  }

  if (!customer) {
    return <div style={{ padding: '32px 28px', fontSize: 13, color: C.inkSoft }}>Loading…</div>;
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow="Customers"
        title={customer.name}
        subtitle="Lightweight contact record -- no full accounts yet (Phase 2)."
        cta={saving ? '…' : 'Save changes'}
        onCta={handleSave}
      />

      {error && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#B95545' }}>{error}</div>}
      {saved && <div style={{ margin: '16px 28px 0', fontSize: 13, color: '#3F754D' }}>Saved.</div>}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="ump-admin-fields-grid">
        <EditField label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <EditField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" />
        <EditField label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>Market</div>
          <select
            value={form.market}
            onChange={(e) => setForm((f) => ({ ...f, market: e.target.value as 'AO' | 'PT' }))}
            style={{ width: '100%', padding: '11px 10px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
          >
            <option value="AO">Angola</option>
            <option value="PT">Portugal</option>
          </select>
        </label>
      </div>

      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Order history</div>
        {orders === null && <div style={{ fontSize: 12, color: C.inkSoft }}>Loading…</div>}
        {orders && orders.length === 0 && <div style={{ fontSize: 12, color: C.inkSoft }}>No orders yet.</div>}
        {orders && orders.length > 0 && (
          <div className="ump-admin-table-wrap">
          <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
            {orders.map((o) => {
              const b = statusBadgeProps(o.status);
              return (
                <Link
                  key={o.id}
                  to={`/admin/encomendas/${o.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 0.8fr 0.8fr 0.6fr',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 16px',
                    fontSize: 12.5,
                    color: C.ink,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${C.ruleLight}`,
                  }}
                >
                  <div>#{o.orderNumber}</div>
                  <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                  <div>{o.total.toLocaleString('en-US')} {o.currency}</div>
                  <Badge label={b.label} tone={b.tone} />
                </Link>
              );
            })}
          </div>
          </div>
        )}
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
