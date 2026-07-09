import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { adminListOrders, adminListProducts, type ApiOrder, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function csvValue(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Real "Export summary" behavior -- previously this CTA had no onCta at
 * all and did nothing when clicked. Downloads today's orders as a CSV. */
function downloadOrdersCsv(rows: ApiOrder[]) {
  const headers = ['Order', 'Customer', 'Market', 'Status', 'Payment', 'Delivery', 'City', 'Total', 'Currency', 'Created At'];
  const lines = [headers.join(',')];
  for (const o of rows) {
    lines.push(
      [
        o.orderNumber,
        o.customerName,
        o.market,
        statusBadgeProps(o.status).label,
        o.paymentMethod,
        o.deliveryMethod,
        o.city,
        o.total,
        o.currency,
        new Date(o.createdAt).toLocaleString('en-US'),
      ]
        .map(csvValue)
        .join(','),
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, p]) => {
        setOrders(o);
        setProducts(p);
      })
      .catch(() => setError(true));
  }, []);

  const today = new Date().toDateString();
  const todayOrders = orders?.filter((o) => new Date(o.createdAt).toDateString() === today) ?? [];
  const todayAO = todayOrders.filter((o) => o.market === 'AO').length;
  const todayPT = todayOrders.filter((o) => o.market === 'PT').length;
  const revenueTodayKz = todayOrders.filter((o) => o.currency === 'Kz').reduce((s, o) => s + o.total, 0);
  const revenueTodayEur = todayOrders.filter((o) => o.currency === 'EUR').reduce((s, o) => s + o.total, 0);
  const reviewCount = orders?.filter((o) => o.status === 'payment_review').length ?? 0;
  const processingCount = orders?.filter((o) => o.status === 'processing').length ?? 0;
  const lowStockCount = products?.filter((p) => p.sizes.some((s) => s.stockAO + s.stockPT <= 2)).length ?? 0;

  const trend = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const totals = days.map((d) =>
      (orders ?? []).filter((o) => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0),
    );
    const max = Math.max(1, ...totals);
    return days.map((d, i) => ({ label: DAY_LABELS[d.getDay()], value: totals[i], pct: totals[i] / max }));
  }, [orders]);

  const attentionItems = [
    ...(orders ?? [])
      .filter((o) => o.status === 'payment_review')
      .slice(0, 2)
      .map((o) => ({
        title: `#${o.orderNumber} ${o.customerName} needs payment review`,
        detail: `${o.market === 'AO' ? 'Angola' : 'Portugal'} order, ${o.paymentMethod}, manual confirmation pending.`,
        badge: 'Review' as const,
        tone: 'gold' as const,
        priority: C.gold,
        to: `/admin/encomendas/${o.id}`,
      })),
    ...(products ?? [])
      .filter((p) => p.sizes.some((s) => s.stockAO + s.stockPT === 0))
      .slice(0, 2)
      .map((p) => ({
        title: `${p.name} has a size stockout`,
        detail: 'Keep published for in-stock sizes and mark the rest unavailable.',
        badge: 'Open' as const,
        tone: 'blue' as const,
        priority: C.sage,
        to: `/admin/produtos/${p.id}`,
      })),
  ].slice(0, 3);

  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        title="Morning check"
        subtitle="Angola and Portugal orders, payment review, low stock, and launch setup gaps."
        cta="Export summary"
        onCta={() => downloadOrdersCsv(todayOrders)}
      />

      {error && (
        <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>
          Couldn't connect to the backend (use-me-with-style-cms). Make sure it's running on localhost:3000.
        </div>
      )}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Metric label="Orders today" value={String(todayOrders.length)} sub={`${todayAO} Angola, ${todayPT} Portugal`} />
        <Metric label="Revenue today" value={`${revenueTodayKz.toLocaleString('en-US')} Kz`} sub={`EUR ${revenueTodayEur.toFixed(0)} separately`} />
        <Metric label="Payment review" value={String(reviewCount)} sub="Manual confirmation needed" tone="gold" />
        <Metric label="Processing" value={String(processingCount)} sub="Orders being fulfilled" />
        <Metric label="Low stock" value={String(lowStockCount)} sub="Sizes with 2 units or less" tone="red" />
      </div>

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="ump-admin-dashboard-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>Attention queue</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.inkSoft }}>Next best actions</div>
          </div>
          {attentionItems.length === 0 && <div style={{ fontSize: 12, color: C.inkSoft }}>Nothing needs attention right now.</div>}
          {attentionItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', border: `1px solid ${C.ruleLight}`, borderRadius: 8, marginBottom: 8, textDecoration: 'none' }}
            >
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: item.priority, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{item.title}</div>
                <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{item.detail}</div>
              </div>
              <Badge label={item.badge} tone={item.tone} />
            </Link>
          ))}
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Recent orders</div>
          {recentOrders.map((o, i) => {
            const b = statusBadgeProps(o.status);
            return (
              <Link
                key={o.id}
                to={`/admin/encomendas/${o.id}`}
                style={{ display: 'block', padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.ruleLight}` : 'none', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>#{o.orderNumber} {o.customerName}</div>
                  <Badge label={b.label} tone={b.tone} />
                </div>
                <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>
                  {o.city}, {o.paymentMethod}, {o.deliveryMethod}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px 28px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }} className="ump-admin-dashboard-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>Revenue trend</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.inkSoft }}>Last 7 days</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
            {trend.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: `${Math.max(6, d.pct * 100)}%`, borderRadius: 5, background: i === trend.length - 1 ? C.gold : C.ruleLight }} />
                <div style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Market setup</div>
          <SetupRow title="Portugal payments" detail="PayPal, Stripe, MBWay placeholders ready." badge="Ready" tone="green" />
          <SetupRow title="Angola payments" detail="Appy Pay team response pending." badge="Open" tone="gold" />
          <SetupRow title="Messaging automation" detail="Keyword-based auto-replies for order/payment/delivery FAQs; sensitive topics always escalate to you." badge="Ready" tone="blue" last />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'gold' | 'red' }) {
  const bg = tone === 'gold' ? C.tagBg : tone === 'red' ? '#FFF0EB' : C.paper;
  const border = tone === 'gold' ? '#E8D28D' : tone === 'red' ? '#E1B3AA' : C.ruleLight;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: C.ink, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function SetupRow({
  title,
  detail,
  badge,
  tone,
  last,
}: {
  title: string;
  detail: string;
  badge: string;
  tone: 'green' | 'gold' | 'blue';
  last?: boolean;
}) {
  return (
    <div style={{ padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${C.ruleLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4, maxWidth: 220 }}>{detail}</div>
      </div>
      <Badge label={badge} tone={tone} />
    </div>
  );
}
