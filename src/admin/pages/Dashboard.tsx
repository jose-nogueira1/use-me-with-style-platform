import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListOrders, adminListProducts, productIsLowStock, productIsOutOfStock, type ApiOrder, type ApiProduct } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, orderStatusBadgeProps } from '../components/Badge';
import { t, type Lang } from '../i18n';
import { deliveryMethodLabel, paymentMethodLabel } from '../lib/orderLabels';
import { dashboardSummaryCsv, downloadDashboardPdf, downloadText, reportFilename } from '../lib/reportExports';
import { isCountedOrder, isRecognizedRevenue, ordersOnLocalDay } from '../lib/orderMetrics';
import { formatOrderDateTime } from '../lib/orderDateRange';
import {
  ordersInWindow,
  summarizeAppyPay,
  summarizeFulfilment,
  summarizeMarket,
  type MarketSummary,
} from '../lib/dashboardMetrics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, p]) => {
        setOrders(o);
        setProducts(p);
      })
      .catch(() => setError(true));
  }, []);

  const allTodayOrders = ordersOnLocalDay(orders ?? [], new Date());
  const todayISO = localISODate(new Date());
  const todayOrders = allTodayOrders.filter(isCountedOrder);
  const cancelledToday = allTodayOrders.length - todayOrders.length;
  const todayAO = todayOrders.filter((o) => o.market === 'AO').length;
  const todayPT = todayOrders.filter((o) => o.market === 'PT').length;
  const paidTodayOrders = allTodayOrders.filter(isRecognizedRevenue);
  const revenueTodayKz = paidTodayOrders.filter((o) => o.currency === 'Kz').reduce((s, o) => s + o.total, 0);
  const revenueTodayEur = paidTodayOrders.filter((o) => o.currency === 'EUR').reduce((s, o) => s + o.total, 0);
  // Was status === 'payment_review' only (2026-07-31 follow-up report:
  // notifications and this "needs confirmation" metric were both missing
  // the common case -- a fresh order sits at status 'new', not
  // 'payment_review', which is only reached later via an automated AppyPay
  // failure). See PageHeader.tsx's NotificationsButton for the same fix.
  const reviewCount = orders?.filter((o) => o.status === 'new' || o.status === 'payment_review').length ?? 0;
  const processingCount = orders?.filter((o) => o.status === 'processing').length ?? 0;
  const lowStockCount = products?.filter(productIsLowStock).length ?? 0;

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
        return c >= startMs && c <= endMs && isCountedOrder(o);
      });
      const paidBucketOrders = bucketOrders.filter(isRecognizedRevenue);
      const kzRevenue = paidBucketOrders.filter((o) => o.currency === 'Kz').reduce((s, o) => s + o.total, 0);
      const eurRevenue = paidBucketOrders.filter((o) => o.currency === 'EUR').reduce((s, o) => s + o.total, 0);
      const aoCount = bucketOrders.filter((o) => o.market === 'AO').length;
      const ptCount = bucketOrders.filter((o) => o.market === 'PT').length;
      const label = size === 1 ? DAY_LABELS[start.getDay()] : `${start.getDate()}/${start.getMonth() + 1}–${end.getDate()}/${end.getMonth() + 1}`;
      // Full numeric date range for the hover tooltip -- the axis `label`
      // above is a compact day-name/date-range caption, but a bare "Tue"
      // isn't enough context on its own when you're reading the exact
      // figures for that bar.
      const rangeLabel = size === 1 ? `${start.getDate()}/${start.getMonth() + 1}` : `${start.getDate()}/${start.getMonth() + 1}–${end.getDate()}/${end.getMonth() + 1}`;
      return { label, rangeLabel, fromISO: localISODate(start), toISO: localISODate(end), kzRevenue, eurRevenue, aoCount, ptCount };
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
      return c >= prevStart && c <= prevEnd && isCountedOrder(o);
    });
    const currentTotals = {
      kz: withPct.reduce((s, b) => s + b.kzRevenue, 0),
      eur: withPct.reduce((s, b) => s + b.eurRevenue, 0),
      ao: withPct.reduce((s, b) => s + b.aoCount, 0),
      pt: withPct.reduce((s, b) => s + b.ptCount, 0),
    };
    const prevTotals = {
      kz: prevOrders.filter((o) => o.currency === 'Kz' && isRecognizedRevenue(o)).reduce((s, o) => s + o.total, 0),
      eur: prevOrders.filter((o) => o.currency === 'EUR' && isRecognizedRevenue(o)).reduce((s, o) => s + o.total, 0),
      ao: prevOrders.filter((o) => o.market === 'AO').length,
      pt: prevOrders.filter((o) => o.market === 'PT').length,
    };
    const delta = (curr: number, prev: number): { pct: number | null; isNew: boolean } =>
      prev === 0 ? { pct: null, isNew: curr > 0 } : { pct: Math.round(((curr - prev) / prev) * 100), isNew: false };

    return {
      buckets: withPct,
      currentWindow: {
        start: new Date(starts[0]),
        end: new Date(ends[ends.length - 1].getFullYear(), ends[ends.length - 1].getMonth(), ends[ends.length - 1].getDate(), 23, 59, 59, 999),
      },
      previousWindow: { start: prevStart, end: prevEnd },
      deltas: {
        kz: delta(currentTotals.kz, prevTotals.kz),
        eur: delta(currentTotals.eur, prevTotals.eur),
        ao: delta(currentTotals.ao, prevTotals.ao),
        pt: delta(currentTotals.pt, prevTotals.pt),
      },
    };
  }, [orders, rangeDays]);

  const currentPeriodOrders = useMemo(
    () => ordersInWindow(orders ?? [], chart.currentWindow.start, chart.currentWindow.end),
    [chart.currentWindow.end, chart.currentWindow.start, orders],
  );
  const previousPeriodOrders = useMemo(
    () => ordersInWindow(orders ?? [], chart.previousWindow.start, chart.previousWindow.end),
    [chart.previousWindow.end, chart.previousWindow.start, orders],
  );
  const periodAO = useMemo(() => summarizeMarket(currentPeriodOrders, 'AO'), [currentPeriodOrders]);
  const periodPT = useMemo(() => summarizeMarket(currentPeriodOrders, 'PT'), [currentPeriodOrders]);
  const previousAO = useMemo(() => summarizeMarket(previousPeriodOrders, 'AO'), [previousPeriodOrders]);
  const previousPT = useMemo(() => summarizeMarket(previousPeriodOrders, 'PT'), [previousPeriodOrders]);
  const appyPayHealth = useMemo(() => summarizeAppyPay(currentPeriodOrders), [currentPeriodOrders]);
  const fulfilmentHealth = useMemo(
    () => summarizeFulfilment(currentPeriodOrders, new Date().getTime()),
    [currentPeriodOrders],
  );

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
      (m) => !checkDates.some((ds) => (orders ?? []).some((o) => isCountedOrder(o) && o.market === m && new Date(o.createdAt).toDateString() === ds)),
    );
  }, [orders]);

  // SLA flag (2026-08-01 request) -- orders waiting 48h+ in New/Payment
  // Review now surface first and read differently from a fresh one. Two
  // things changed together here: previously this sliced straight off
  // `orders` (sorted newest-first, same as the table), so the queue always
  // showed the 2 MOST RECENT orders needing confirmation -- the opposite of
  // useful for an "attention queue", which should surface whatever's been
  // waiting longest, not whatever just came in. Sorting oldest-first before
  // slicing fixes both: the queue now naturally leads with what needs
  // attention most, and the ones that have actually breached the SLA get a
  // distinct red badge instead of blending in with a brand-new order.
  // 24h matches PageHeader.tsx's NotificationsButton, which already treats
  // a review-needed order as "urgent" past the same threshold -- one SLA
  // number for the concept, not a different one per screen.
  const REVIEW_SLA_HOURS = 24;
  // `new Date().getTime()`, not `Date.now()` -- the latter trips the React
  // Compiler's purity lint rule (react-hooks/purity: "Date.now is an
  // impure function") even called directly in the render body; `new
  // Date()` doesn't, and is what the rest of this file (todayOrders,
  // quietMarkets) already uses for the same "current moment" purpose.
  const now = new Date().getTime();
  const attentionItems = [
    ...(orders ?? [])
      .filter((o) => o.status === 'cancelled' && o.paymentStatus === 'paid')
      .map((o) => ({
        category: t('attentionPayment', lang),
        title: t('dashAttnRefundTitle', lang, { orderNumber: o.orderNumber }),
        detail: t('dashAttnRefundDetail', lang),
        badge: t('urgentBadge', lang),
        tone: 'red' as const,
        priority: '#B95545',
        to: `/admin/encomendas/${o.id}`,
      })),
    ...(orders ?? [])
      .filter((o) => o.status === 'new' || o.status === 'payment_review')
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 2)
      .map((o) => {
        const hoursWaiting = (now - new Date(o.createdAt).getTime()) / 3_600_000;
        const overdue = hoursWaiting >= REVIEW_SLA_HOURS;
        const daysWaiting = Math.floor(hoursWaiting / 24);
        return {
          category: t('attentionPayment', lang),
          title: t('dashAttnReviewTitle', lang, { orderNumber: o.orderNumber, customerName: o.customerName }),
          detail: overdue
            ? t('dashAttnReviewOverdueDetail', lang, { days: daysWaiting })
            : t('dashAttnReviewDetail', lang, { market: o.market === 'AO' ? t('angolaOption', lang) : t('portugalOption', lang), paymentMethod: paymentMethodLabel(o.paymentMethod, lang) }),
          badge: overdue ? t('overdueBadge', lang) : t('reviewBadge', lang),
          tone: overdue ? ('red' as const) : ('gold' as const),
          priority: overdue ? '#B95545' : C.gold,
          to: `/admin/encomendas/${o.id}`,
        };
      }),
    ...(orders ?? [])
      .filter((o) => o.status === 'processing' && o.paymentStatus === 'paid')
      .filter((o) => now - new Date(o.updatedAt || o.createdAt).getTime() >= 24 * 3_600_000)
      .map((o) => ({
        category: t('attentionFulfilment', lang),
        title: t('dashAttnFulfilmentTitle', lang, { orderNumber: o.orderNumber }),
        detail: t('dashAttnFulfilmentDetail', lang),
        badge: t('overdueBadge', lang),
        tone: 'red' as const,
        priority: '#B95545',
        to: `/admin/encomendas/${o.id}`,
      })),
    ...quietMarkets.map((m) => ({
      category: t('attentionMarket', lang),
      title: t('dashAttnQuietMarketTitle', lang, { market: m === 'AO' ? t('angolaOption', lang) : t('portugalOption', lang) }),
      detail: t('dashAttnQuietMarketDetail', lang),
      badge: t('openBadge', lang),
      tone: 'gold' as const,
      priority: C.gold,
      to: `/admin/encomendas?market=${m}`,
    })),
    ...(products ?? [])
      .filter(productIsOutOfStock)
      .slice(0, 2)
      .map((p) => ({
        category: t('attentionInventory', lang),
        title: t('dashAttnStockoutTitle', lang, { name: p.name }),
        detail: t('dashAttnStockoutDetail', lang),
        badge: t('openBadge', lang),
        tone: 'blue' as const,
        priority: C.sage,
        to: `/admin/produtos/${p.id}`,
      })),
  ].slice(0, 5);

  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        title={t('morningCheck', lang)}
        subtitle={t('morningCheckSubtitle', lang)}
        cta={t('exportSummary', lang)}
        onCta={() => downloadDashboardPdf({ from: chart.currentWindow.start, to: chart.currentWindow.end, orders: currentPeriodOrders, products: products ?? [] })}
        ctaDisabled={!orders || !products}
      />

      <div style={{ margin: '12px 28px 0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={!orders || !products}
          onClick={() => downloadText(
            dashboardSummaryCsv({ from: chart.currentWindow.start, to: chart.currentWindow.end, orders: currentPeriodOrders, products: products ?? [] }),
            reportFilename('dashboard-data', `${localISODate(chart.currentWindow.start)}-to-${localISODate(chart.currentWindow.end)}`),
          )}
          style={{ padding: '7px 12px', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: !orders || !products ? C.disabledFg : C.ink, fontSize: 11, fontWeight: 800 }}
        >
          {t('exportDashboardCsv', lang)}
        </button>
        <span style={{ fontSize: 10.5, color: C.inkSoft }}>{t('phase2ReportingNote', lang)}</span>
      </div>

      {error && (
        <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>
          {t('couldntConnectBackendDashboard', lang)}
        </div>
      )}

      <div style={{ padding: '20px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }} className="ump-admin-metric-grid">
        <Metric linkLabel={t('viewDetailsAction', lang)} to={`/admin/encomendas?from=${todayISO}&to=${todayISO}&context=orders`} label={t('ordersToday', lang)} value={String(todayOrders.length)} sub={`${todayAO} ${t('angolaOption', lang)}, ${todayPT} ${t('portugalOption', lang)}`} />
        <Metric linkLabel={t('viewDetailsAction', lang)} to={`/admin/encomendas?from=${todayISO}&to=${todayISO}&context=revenue`} label={t('revenueToday', lang)} value={`${revenueTodayKz.toLocaleString('en-US')} Kz`} sub={t('paidRevenueNote', lang, { amount: revenueTodayEur.toFixed(0) })} />
        <Metric linkLabel={t('viewDetailsAction', lang)} to={`/admin/encomendas?from=${todayISO}&to=${todayISO}&status=cancelled`} label={t('cancelledToday', lang)} value={String(cancelledToday)} sub={t('excludedFromMetrics', lang)} tone={cancelledToday > 0 ? 'red' : undefined} />
        {/* Was labelled with the 'statusPaymentReview' status name -- now
            that reviewCount also counts 'new' orders, that label would
            misrepresent most of what it's showing (2026-07-31 follow-up
            fix). 'statusPaymentReview' is still used correctly elsewhere,
            for the literal status badge/pill -- this is a separate,
            broader "needs confirmation" metric. */}
        <Metric linkLabel={t('viewDetailsAction', lang)} to="/admin/encomendas?context=confirmation" label={t('needsConfirmationMetric', lang)} value={String(reviewCount)} sub={t('manualConfirmationNeeded', lang)} tone="gold" />
        <Metric linkLabel={t('viewDetailsAction', lang)} to="/admin/encomendas?status=processing" label={t('statusProcessing', lang)} value={String(processingCount)} sub={t('ordersBeingFulfilled', lang)} />
        <Metric linkLabel={t('viewDetailsAction', lang)} to="/admin/produtos?filter=low" label={t('lowStockMetric', lang)} value={String(lowStockCount)} sub={t('sizesWithFewUnits', lang)} tone="red" />
      </div>

      <section style={{ padding: '20px 28px 0' }} aria-labelledby="market-performance-heading">
        <SectionHeading
          id="market-performance-heading"
          title={t('marketPerformance', lang)}
          detail={t('selectedPeriodDays', lang, { n: rangeDays })}
          actions={<RangeSelector value={rangeDays} onChange={setRangeDays} />}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <MarketPerformanceCard
            market="AO"
            title={t('angolaOption', lang)}
            currency="Kz"
            summary={periodAO}
            previous={previousAO}
            rangeDays={rangeDays}
            lang={lang}
          />
          <MarketPerformanceCard
            market="PT"
            title={t('portugalOption', lang)}
            currency="EUR"
            summary={periodPT}
            previous={previousPT}
            rangeDays={rangeDays}
            lang={lang}
          />
        </div>
      </section>

      <section style={{ padding: '20px 28px 0' }} aria-labelledby="operations-health-heading">
        <SectionHeading
          id="operations-health-heading"
          title={t('operationsHealth', lang)}
          detail={t('selectedPeriodDays', lang, { n: rangeDays })}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <HealthPanel
            title={t('appyPayHealth', lang)}
            detail={t('appyPayHealthDetail', lang)}
            to={`/admin/encomendas?from=${localISODate(chart.currentWindow.start)}&to=${localISODate(chart.currentWindow.end)}&market=AO`}
            lang={lang}
            stats={[
              { label: t('successRate', lang), value: appyPayHealth.successRate === null ? '—' : `${appyPayHealth.successRate}%`, tone: appyPayHealth.successRate !== null && appyPayHealth.successRate < 80 ? 'red' : 'green' },
              { label: t('paymentAttempts', lang), value: String(appyPayHealth.attempts) },
              { label: t('paidLabel', lang), value: String(appyPayHealth.paid), tone: 'green' },
              { label: t('failedLabel', lang), value: String(appyPayHealth.failed), tone: appyPayHealth.failed ? 'red' : undefined },
              { label: t('pendingLabel', lang), value: String(appyPayHealth.pending), tone: appyPayHealth.pending ? 'gold' : undefined },
              { label: t('abandonedLabel', lang), value: String(appyPayHealth.abandoned), tone: appyPayHealth.abandoned ? 'red' : undefined },
            ]}
          />
          <HealthPanel
            title={t('fulfilmentHealth', lang)}
            detail={t('fulfilmentHealthDetail', lang)}
            to="/admin/encomendas?status=processing&payment=paid"
            lang={lang}
            stats={[
              { label: t('activeFulfilment', lang), value: String(fulfilmentHealth.active) },
              { label: t('overdue24h', lang), value: String(fulfilmentHealth.overdue), tone: fulfilmentHealth.overdue ? 'red' : 'green' },
              { label: t('averageTimeToShip', lang), value: fulfilmentHealth.averageHoursToShip === null ? '—' : t('hoursShort', lang, { n: Math.round(fulfilmentHealth.averageHoursToShip) }) },
              { label: t('shippedSample', lang), value: String(fulfilmentHealth.shipped) },
            ]}
          />
        </div>
      </section>

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
                <div style={{ fontSize: 8.5, fontWeight: 900, color: item.priority, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{item.category}</div>
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
            const b = orderStatusBadgeProps(o, lang);
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
                  {/* Was o.paymentMethod/o.deliveryMethod raw (2026-07-31 QA
                      follow-up) -- same "mbway"/"courier_pt" bug already
                      fixed on the Orders table and detail screen. */}
                  {formatOrderDateTime(o.createdAt, lang)} · {o.city}, {paymentMethodLabel(o.paymentMethod, lang)}, {deliveryMethodLabel(o.deliveryMethod, lang)}
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
            <RangeSelector value={rangeDays} onChange={setRangeDays} />
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
          <div style={{ margin: '-6px 0 14px', fontSize: 9.5, lineHeight: 1.45, color: C.inkSoft }}>
            {t('dashboardMetricDefinition', lang)}
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
                onMouseEnter={() => setHoveredBucket(i)}
                onMouseLeave={() => setHoveredBucket(null)}
                onFocus={() => setHoveredBucket(i)}
                onBlur={() => setHoveredBucket(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none', position: 'relative' }}
              >
                {/* Custom hover/focus tooltip (2026-07-27) -- replaces the
                    native `title` attribute, which was easy to miss (delayed,
                    plain browser styling, one value at a time). Anchored to
                    the Link's own box (not the bar), so it sits at the same
                    height above every column regardless of that day's bar
                    height. pointerEvents: 'none' so it never itself blocks
                    the click-through to Orders. */}
                {hoveredBucket === i && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: 8,
                      background: C.black,
                      color: C.onDark,
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 800, color: C.onDarkGold, marginBottom: 4, textTransform: 'uppercase' }}>{b.rangeLabel}</div>
                    {metric === 'revenue' ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{t('revenueTrendAngolaLegend', lang)}: {b.kzRevenue.toLocaleString('en-US')} Kz</div>
                        <div style={{ fontWeight: 700 }}>{t('revenueTrendPortugalLegend', lang)}: €{b.eurRevenue.toLocaleString('en-US')}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700 }}>{t('angolaOption', lang)}: {b.aoCount} {t('ordersCountLegend', lang)}</div>
                        <div style={{ fontWeight: 700 }}>{t('portugalOption', lang)}: {b.ptCount} {t('ordersCountLegend', lang)}</div>
                      </>
                    )}
                  </div>
                )}
                {/* Fixed-height track so each bar's percentage height has a
                    real (non-auto) parent to resolve against -- previously
                    this container had no explicit height (the flex row's
                    alignItems: 'flex-end' let it shrink-wrap instead of
                    stretching to the row's height), so height: X% always
                    collapsed to 0 per how CSS percentage heights work. */}
                <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  {metric === 'revenue' ? (
                    <>
                      <div style={{ flex: 1, height: `${Math.max(6, b.kzPct * 100)}%`, borderRadius: 5, background: C.gold }} />
                      <div style={{ flex: 1, height: `${Math.max(6, b.eurPct * 100)}%`, borderRadius: 5, background: C.blue }} />
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, height: `${Math.max(6, b.aoCountPct * 100)}%`, borderRadius: 5, background: C.gold }} />
                      <div style={{ flex: 1, height: `${Math.max(6, b.ptCountPct * 100)}%`, borderRadius: 5, background: C.blue }} />
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
  let deltaColor: string = C.inkSoft;
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

function Metric({ label, value, sub, tone, to, linkLabel }: { label: string; value: string; sub: string; tone?: 'gold' | 'red'; to: string; linkLabel: string }) {
  const bg = tone === 'gold' ? C.tagBg : tone === 'red' ? '#FFF0EB' : C.paper;
  const border = tone === 'gold' ? '#E8D28D' : tone === 'red' ? '#E1B3AA' : C.ruleLight;
  return (
    <Link to={to} style={{ display: 'block', background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 14, textDecoration: 'none' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: C.ink, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 6 }}>{sub}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, marginTop: 9 }}>{linkLabel} →</div>
    </Link>
  );
}

function SectionHeading({ id, title, detail, actions }: { id: string; title: string; detail: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <h2 id={id} style={{ margin: 0, fontFamily: F.display, fontSize: 20, color: C.ink }}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.inkSoft }}>{detail}</div>
        {actions}
      </div>
    </div>
  );
}

function RangeSelector({ value, onChange }: { value: 7 | 30 | 90; onChange: (value: 7 | 30 | 90) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }} aria-label="Dashboard period">
      {([7, 30, 90] as const).map((days) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
          style={{
            padding: '5px 10px',
            fontSize: 10,
            fontWeight: 800,
            borderRadius: 6,
            border: `1px solid ${value === days ? C.black : C.rule}`,
            background: value === days ? C.black : C.paper,
            color: value === days ? C.onDarkGold : C.inkSoft,
          }}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}

function comparisonText(current: number, previous: number, lang: Lang): string {
  if (previous === 0) return current > 0 ? t('newActivityBadge', lang) : t('noChangeLabel', lang);
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? '+' : ''}${change}% ${t('vsPreviousPeriod', lang)}`;
}

function MarketPerformanceCard({
  market,
  title,
  currency,
  summary,
  previous,
  rangeDays,
  lang,
}: {
  market: 'AO' | 'PT';
  title: string;
  currency: 'Kz' | 'EUR';
  summary: MarketSummary;
  previous: MarketSummary;
  rangeDays: number;
  lang: Lang;
}) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (rangeDays - 1));
  const ordersUrl = `/admin/encomendas?from=${localISODate(start)}&to=${localISODate(end)}&market=${market}&context=market`;
  return (
    <Link to={ordersUrl} style={{ display: 'block', padding: 16, border: `1px solid ${C.ruleLight}`, borderRadius: 8, background: C.paper, textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, color: C.goldDeep, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{market}</div>
          <div style={{ marginTop: 3, fontFamily: F.display, fontSize: 20, fontWeight: 800, color: C.ink }}>{title}</div>
        </div>
        <div style={{ padding: '5px 8px', borderRadius: 999, background: C.subtleBg, color: C.inkSoft, fontSize: 9, fontWeight: 900 }}>{currency}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
        <MiniMetric label={t('recognizedRevenue', lang)} value={currency === 'EUR' ? `€${summary.revenue.toLocaleString('en-US')}` : `${summary.revenue.toLocaleString('en-US')} Kz`} detail={comparisonText(summary.revenue, previous.revenue, lang)} />
        <MiniMetric label={t('validOrders', lang)} value={String(summary.orders)} detail={comparisonText(summary.orders, previous.orders, lang)} />
        <MiniMetric label={t('averageOrderValue', lang)} value={currency === 'EUR' ? `€${Math.round(summary.averageOrderValue).toLocaleString('en-US')}` : `${Math.round(summary.averageOrderValue).toLocaleString('en-US')} Kz`} />
        <MiniMetric label={t('cancelledLabel', lang)} value={String(summary.cancelled)} tone={summary.cancelled ? 'red' : undefined} />
      </div>
    </Link>
  );
}

type HealthTone = 'red' | 'green' | 'gold' | undefined;

function MiniMetric({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: HealthTone }) {
  const color = tone === 'red' ? '#B95545' : tone === 'green' ? C.successText : tone === 'gold' ? C.goldDeep : C.ink;
  return (
    <div style={{ minWidth: 0, padding: 10, borderRadius: 7, background: C.subtleBg }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: F.display, fontSize: 18, fontWeight: 800, color }}>{value}</div>
      {detail && <div style={{ marginTop: 3, fontSize: 8.5, color: C.inkSoft }}>{detail}</div>}
    </div>
  );
}

function HealthPanel({
  title,
  detail,
  stats,
  to,
  lang,
}: {
  title: string;
  detail: string;
  stats: { label: string; value: string; tone?: HealthTone }[];
  to: string;
  lang: Lang;
}) {
  return (
    <div style={{ padding: 16, border: `1px solid ${C.ruleLight}`, borderRadius: 8, background: C.paper }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: C.ink }}>{title}</div>
          <div style={{ marginTop: 3, fontSize: 9.5, lineHeight: 1.45, color: C.inkSoft }}>{detail}</div>
        </div>
        <Link to={to} style={{ flexShrink: 0, fontSize: 9, fontWeight: 900, color: C.goldDeep, textDecoration: 'none' }}>{t('viewDetailsAction', lang)} →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginTop: 14 }}>
        {stats.map((stat) => <MiniMetric key={stat.label} {...stat} />)}
      </div>
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
