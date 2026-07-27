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

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function Dashboard() {
  const { lang } = useApp();
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState(false);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(7);
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');

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

  // Sales-trend chart (2026-07-27 interactivity pass). Always renders 7
  // columns regardless of the selected range -- each column is a "bucket"
  // covering rangeDays/7 days (1 day per bucket at the default 7-day range,
  // a few days per bucket at 30/90 so the chart stays readable at any
  // range). Buckets are per-currency AND per-market-count so both the
  // revenue view (Kz/EUR, each normalized to its own max -- see the
  // 2026-07-27 currency-split fix below) and the orders view (AO/PT counts,
  // sharing one scale since counts are directly comparable) can read off
  // the same underlying data.
  const chart = useMemo(() => {
    const bucketCount = 7;
    const base = Math.floor(rangeDays / bucketCount);
    const remainder = rangeDays % bucketCount;
    // Spreads any remainder evenly across the most recent buckets rather
    // than lumping it into just the first or last one.
    const sizes = Array.from({ length: bucketCount }, (_, i) => base + (i >= bucketCount - remainder ? 1 : 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const starts: Date[] = new Array(bucketCount);
    const ends: Date[] = new Array(bucketCount);
    let cursorEnd = new Date(today);
    for (let i = bucketCount - 1; i >= 0; i--) {
      const end = new Date(cursorEnd);
      const start = new Date(cursorEnd);
      start.setDate(start.getDate() - (sizes[i] - 1));
      starts[i] = start;
      ends[i] = end;
      cursorEnd = new Date(start);
      cursorEnd.setDate(cursorEnd.getDate() - 1);
    }

    const buckets = sizes.map((size, i) => {
      const start = starts[i];
      const end = ends[i];
      const startMs = new Date(start);
      startMs.setHours(0, 0, 0, 0);
      const endMs = new Date(end);
      endMs.setHours(23, 59, 59, 999);
      const bucketOrders = (orders ?? []).filter((o) => {
        const c = new Date(o.createdAt);
        return c >= startMs && c <= endMs;
      });
      const kzRevenue = bucketOrders.filter((o) => o.currency === 'Kz').reduce((s, o) => s + o.total, 0);
      const eurRevenue = bucketOrders.filter((o) => o.currency === 'EUR').reduce((s, o) => s + o.total, 0);
      const aoCount = bucketOrders.filter((o) => o.market === 'AO').length;
      const ptCount = bucketOrders.filter((o) => o.market === 'PT').length;
      const label = size === 1 ? DAY_LABELS[start.getDay()] : `${start.getDate()}/${start.getMonth() + 1}–${end.getDate()}/${end.getMonth() + 1}`;
      return { label, fromISO: localISODate(start), toISO: localISODate(end), kzRevenue, eurRevenue, aoCount, ptCount };
    });

    const kzMax = Math.max(1, ...buckets.map((b) => b.kzRevenue));
    const eurMax = Math.max(1, ...buckets.map((b) => b.eurRevenue));
    const countMax = Math.max(1, ...buckets.map((b) => Math.max(b.aoCount, b.ptCount)));
    const withPct = buckets.map((b) => ({
      ...b,
      kzPct: b.kzRevenue / kzMax,
      eurPct: b.eurRevenue / eurMax,
      aoCountPct: b.aoCount / countMax,
      ptCountPct: b.ptCount / countMax,
    }));

    // Period-over-period comparison: the rangeDays immediately preceding
    // the current window, same length, so "+18%" means something concrete.
    const earliestStart = starts[0];
    const prevEnd = new Date(earliestStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (rangeDays - 1));
    prevStart.setHours(0, 0, 0, 0);
    const prevOrders = (orders ?? []).filter((o) => {
      const c = new Date(o.createdAt);
      return c >= prevStart && c <= prevEnd;
    });
    const currentTotals = {
      kz: withPct.reduce((s, b) => s + b.kzRevenue, 0),
      eur: withPct.reduce((s, b) => s + b.eurRevenue, 0),
      ao: withPct.reduce((s, b) => s + b.aoCount, 0),
      pt: withPct.reduce((s, b) => s + b.ptCount, 0),
    };
    const prevTotals = {
      kz: prevOrders.filter((o) => o.currency === 'Kz').reduce((s, o) => s + o.total, 0),
      eur: prevOrders.filter((o) => o.currency === 'EUR').reduce((s, o) => s + o.total, 0),
      ao: prevOrders.filter((o) => o.market === 'AO').length,
      pt: prevOrders.filter((o) => o.market === 'PT').length,
    };
    const delta = (curr: number, prev: number): { pct: number | null; isNew: boolean } =>
      prev === 0 ? { pct: null, isNew: curr > 0 } : { pct: Math.round(((curr - prev) / prev) * 100), isNew: false };

    return {
      buckets: withPct,
      deltas: {
        kz: delta(currentTotals.kz, prevTotals.kz),
        eur: delta(currentTotals.eur, prevTotals.eur),
        ao: delta(currentTotals.ao, prevTotals.ao),
        pt: delta(currentTotals.pt, prevTotals.pt),
      },
    };
  }, [orders, rangeDays]);

  // "No orders in 2 days" attention-queue alert -- independent of the chart
  // controls above (always checks the last 2 full calendar days, i.e.
  // yesterday and the day before, since today is still in progress and
  // showing 0 there isn't yet meaningful).
  const quietMarkets = useMemo(() => {
    const checkDates = [1, 2].map((n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toDateString();
    });
    return (['AO', 'PT'] as const).filter(
      (m) => !checkDates.some((ds) => (orders ?? []).some((o) => o.market === m && new Date(o.createdAt).toDateString() === ds)),
    );
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
    ...quietMarkets.map((m) => ({
      title: t('dashAttnQuietMarketTitle', lang, { market: m === 'AO' ? t('angolaOption', lang) : t('portugalOption', lang) }),
      detail: t('dashAttnQuietMarketDetail', lang),
      badge: t('openBadge', lang),
      tone: 'gold' as const,
      priority: C.gold,
      to: `/admin/encomendas?market=${m}`,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink }}>
              {t(metric === 'revenue' ? 'revenueTrend' : 'ordersTrend', lang)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([7, 30, 90] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setRangeDays(n)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 6,
                    border: `1px solid ${rangeDays === n ? C.black : C.rule}`,
                    background: rangeDays === n ? C.black : C.paper,
                    color: rangeDays === n ? C.onDarkGold : C.inkSoft,
                  }}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button
              onClick={() => setMetric('revenue')}
              style={{
                padding: '6px 12px',
                fontSize: 10.5,
                fontWeight: 800,
                borderRadius: 6,
                border: `1px solid ${metric === 'revenue' ? C.goldDeep : C.rule}`,
                background: metric === 'revenue' ? C.tagBg : C.paper,
                color: metric === 'revenue' ? C.goldDeep : C.inkSoft,
              }}
            >
              {t('metricRevenueTab', lang)}
            </button>
            <button
              onClick={() => setMetric('orders')}
              style={{
                padding: '6px 12px',
                fontSize: 10.5,
                fontWeight: 800,
                borderRadius: 6,
                border: `1px solid ${metric === 'orders' ? C.goldDeep : C.rule}`,
                background: metric === 'orders' ? C.tagBg : C.paper,
                color: metric === 'orders' ? C.goldDeep : C.inkSoft,
              }}
            >
              {t('metricOrdersTab', lang)}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <LegendWithDelta
              color={C.gold}
              label={metric === 'revenue' ? t('revenueTrendAngolaLegend', lang) : t('angolaOption', lang)}
              delta={metric === 'revenue' ? chart.deltas.kz : chart.deltas.ao}
              lang={lang}
            />
            <LegendWithDelta
              color={C.blue}
              label={metric === 'revenue' ? t('revenueTrendPortugalLegend', lang) : t('portugalOption', lang)}
              delta={metric === 'revenue' ? chart.deltas.eur : chart.deltas.pt}
              lang={lang}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {chart.buckets.map((b, i) => (
              // Clicking a bucket jumps to Orders pre-filtered to that exact
              // date range (2026-07-27 interactivity pass) -- previously
              // this chart was just a static picture with no way to drill
              // into what it was showing.
              <Link
                key={i}
                to={`/admin/encomendas?from=${b.fromISO}&to=${b.toISO}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none' }}
              >
                {/* Fixed-height track so each bar's percentage height has a
                    real (non-auto) parent to resolve against -- previously
                    this container had no explicit height (the flex row's
                    alignItems: 'flex-end' let it shrink-wrap instead of
                    stretching to the row's height), so height: X% always
                    collapsed to 0 per how CSS percentage heights work. */}
                <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  {metric === 'revenue' ? (
                    <>
                      <div
                        title={`${b.kzRevenue.toLocaleString('en-US')} Kz`}
                        style={{ flex: 1, height: `${Math.max(6, b.kzPct * 100)}%`, borderRadius: 5, background: C.gold }}
                      />
                      <div
                        title={`€${b.eurRevenue.toLocaleString('en-US')}`}
                        style={{ flex: 1, height: `${Math.max(6, b.eurPct * 100)}%`, borderRadius: 5, background: C.blue }}
                      />
                    </>
                  ) : (
                    <>
                      <div
                        title={`${b.aoCount} ${t('ordersCountLegend', lang)}`}
                        style={{ flex: 1, height: `${Math.max(6, b.aoCountPct * 100)}%`, borderRadius: 5, background: C.gold }}
                      />
                      <div
                        title={`${b.ptCount} ${t('ordersCountLegend', lang)}`}
                        style={{ flex: 1, height: `${Math.max(6, b.ptCountPct * 100)}%`, borderRadius: 5, background: C.blue }}
                      />
                    </>
                  )}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.inkSoft, textAlign: 'center' }}>{b.label}</div>
              </Link>
            ))}
          </div>
          <div style={{ fontSize: 9, color: C.inkSoft, marginTop: 10 }}>{t('clickBarToViewOrders', lang)}</div>
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

function LegendWithDelta({
  color,
  label,
  delta,
  lang,
}: {
  color: string;
  label: string;
  delta: { pct: number | null; isNew: boolean };
  lang: Lang;
}) {
  let deltaText: string | null = null;
  let deltaColor = C.inkSoft;
  if (delta.isNew) {
    deltaText = t('newActivityBadge', lang);
    deltaColor = C.successText;
  } else if (delta.pct !== null) {
    deltaText = `${delta.pct > 0 ? '+' : ''}${delta.pct}% ${t('vsPreviousPeriod', lang)}`;
    deltaColor = delta.pct > 0 ? C.successText : delta.pct < 0 ? '#B95545' : C.inkSoft;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft }}>{label}</div>
      {deltaText && <div style={{ fontSize: 10, fontWeight: 700, color: deltaColor }}>· {deltaText}</div>}
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
