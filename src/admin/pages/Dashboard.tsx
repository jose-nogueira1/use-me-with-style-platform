import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListOrders, adminListProducts, type ApiOrder, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';
import { t, type Lang } from '../i18n';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function csvValue(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Real "Export summary" behavior -- previously this CTA had no onCta at
 * all and did nothing when clicked. Downloads today's orders as a CSV.
 * The CSV itself is an admin export file, not on-screen UI copy, so its
 * column headers stay in English regardless of the admin's language toggle
 * (consistent with how spreadsheet exports are usually kept in one
 * language for anyone downstream who opens the file). */
function downloadOrdersCsv(rows: ApiOrder[], lang: Lang) {
  const headers = ['Order', 'Customer', 'Market', 'Status', 'Payment', 'Delivery', 'City', 'Total', 'Currency', 'Created At'];
  const lines = [headers.join(',')];
  for (const o of rows) {
    lines.push(
      [
        o.orderNumber,
        o.customerName,
        o.market,
        statusBadgeProps(o.status, lang).label,
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
  const { lang } = useApp();
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
  const lowStockCount = products?.filter((p) => p.variants.some((v) => v.stockAO + v.stockPT <= 2)).length ?? 0;

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
        title: t('dashAttnReviewTitle', lang, { orderNumber: o.orderNumber, customerName: o.customerName }),
        detail: t('dashAttnReviewDetail', lang, { market: o.market === 'AO' ? t('angolaOption', lang) : t('portugalOption', lang), paymentMethod: o.paymentMethod }),
        badge: t('reviewBadge', lang),
        tone: 'gold' as const,
        priority: C.gold,
        to: `/admin/encomendas/${o.id}`,
      })),
    ...(products ?? [])
      .filter((p) => p.variants.some((v) => v.stockAO + v.stockPT === 0))
      .slice(0, 2)
      .map((p) => ({
        title: t('dashAttnStockoutTitle', lang, { name: p.name }),
        detail: t('dashAttnStockoutDetail', lang),
        badge: t('openBadge', lang),
        tone: 'blue' as const,
        priority: C.sage,
        to: `/admin/produtos/${p.id}`,
      })),
  ].slice(0, 3);

  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        title={t('morningCheck', lang)}
        subtitle={t('morningCheckSubtitle', lang)}
        cta={t('exportSummary', lang)}
        onCta={() => downloadOrdersCsv(todayOrders, lang)}
      />

      {error && (
        <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>
          {t('couldntConnectBackendDashboard', lang)}
        </div>
      )}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }} className="ump-admin-metric-grid">
        <Metric label={t('ordersToday', lang)} value={String(todayOrders.length)} sub={`${todayAO} ${t('angolaOption', lang)}, ${todayPT} ${t('portugalOption', lang)}`} />
        <Metric label={t('revenueToday', lang)} value={`${revenueTodayKz.toLocaleString('en-US')} Kz`} sub={t('separatelyNote', lang, { amount: revenueTodayEur.toFixed(0) })} />
        <Metric label={t('statusPaymentReview', lang)} value={String(reviewCount)} sub={t('manualConfirmationNeeded', lang)} tone="gold" />
        <Metric label={t('statusProcessing', lang)} value={String(processingCount)} sub={t('ordersBeingFulfilled', lang)} />
        <Metric label={t('lowStockMetric', lang)} value={String(lowStockCount)} sub={t('sizesWithFewUnits', lang)} tone="red" />
      </div>

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="ump-admin-dashboard-grid">
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>{t('attentionQueue', lang)}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.inkSoft }}>{t('nextBestActions', lang)}</div>
          </div>
          {attentionItems.length === 0 && <div style={{ fontSize: 12, color: C.inkSoft }}>{t('nothingNeedsAttention', lang)}</div>}
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

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, marginBottom: 14 }}>{t('recentOrders', lang)}</div>
          {recentOrders.map((o, i) => {
            const b = statusBadgeProps(o.status, lang);
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
        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>{t('revenueTrend', lang)}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.inkSoft }}>{t('last7Days', lang)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {trend.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {/* Fixed-height track so the bar's percentage height has a
                    real (non-auto) parent to resolve against -- previously
                    this container had no explicit height (the flex row's
                    alignItems: 'flex-end' let it shrink-wrap instead of
                    stretching to the row's height), so height: X% always
                    collapsed to 0 per how CSS percentage heights work. */}
                <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${Math.max(6, d.pct * 100)}%`, borderRadius: 5, background: i === trend.length - 1 ? C.gold : C.ruleLight }} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{t('marketSetup', lang)}</div>
          <SetupRow title={t('portugalPayments', lang)} detail={t('portugalPaymentsDetail', lang)} badge={t('readyBadge', lang)} tone="green" />
          <SetupRow title={t('angolaPayments', lang)} detail={t('angolaPaymentsDetail', lang)} badge={t('openBadge', lang)} tone="gold" />
          <SetupRow title={t('messagingAutomation', lang)} detail={t('messagingAutomationDetail', lang)} badge={t('readyBadge', lang)} tone="blue" last />
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
