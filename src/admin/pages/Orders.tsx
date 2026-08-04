import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminCountOrders, adminListOrders, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, orderStatusBadgeProps, statusBadgeProps } from '../components/Badge';
import { deliveryMethodLabel, paymentMethodLabel } from '../lib/orderLabels';
import { downloadOrdersCsv } from '../lib/ordersCsv';
import { dateTimeInputValue, filterOrdersByDateTime, formatOrderDateTime, orderDateRange } from '../lib/orderDateRange';
import { t } from '../i18n';

const STATUSES = ['new', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export function Orders() {
  const { lang } = useApp();
  const [allOrders, setAllOrders] = useState<ApiOrder[] | null>(null);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dashboard drill-downs use inclusive YYYY-MM-DD values. The controls on
  // this page use datetime-local values so an admin can narrow to an exact
  // operational window; the shared parser supports both forms.
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const marketFilter = searchParams.get('market');
  const statusFilter = searchParams.get('status') ?? '';
  const paymentFilter = searchParams.get('payment');
  const attentionFilter = searchParams.get('attention');
  const excludeCancelled = searchParams.get('excludeCancelled') === '1';
  const dashboardContext = searchParams.get('context');
  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set('status', status);
    else next.delete('status');
    next.delete('attention');
    setSearchParams(next);
  };
  // Free-text search (2026-08-01 request: "no way to jump straight to the
  // order Maria just messaged about") -- order number, customer name,
  // phone, or email. Stored in the URL like the other filters, so a search
  // is shareable/survives a back-navigation.
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase();
  const setSearchQuery = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    // replace: true -- this fires on every keystroke; pushing a new history
    // entry per character would make the browser Back button useless here.
    setSearchParams(next, { replace: true });
  };

  // Fetches the full list ONCE, unfiltered by status (2026-07-31 fix -- see
  // countFor below for why). Previously re-fetched from the server with
  // `{ status: statusFilter }` every time a filter pill was clicked, which
  // is where the pill-count bug actually came from: every OTHER pill's
  // count was then computed from a list the server had already narrowed
  // down to just the active filter. Also fetches the true total order count
  // (2026-08-01) -- adminListOrders itself is capped (see its own comment
  // in lib/api.ts); if the real count ever exceeds what came back, a
  // warning below tells the admin instead of orders silently going missing.
  useEffect(() => {
    adminListOrders()
      .then((rows) => {
        setError(false);
        setAllOrders(rows);
      })
      .catch(() => setError(true));
    adminCountOrders()
      .then(setTotalOrders)
      .catch(() => {}); // Non-fatal: the order list itself already loaded fine above.
  }, []);

  // Date-range drill-down only, shared by everything below -- pulled out on
  // its own (2026-08-01, adding a persistent market filter to this page)
  // rather than re-implementing the same date-range check three times.
  const dateFiltered = useMemo(() => {
    if (!allOrders) return allOrders;
    return filterOrdersByDateTime(allOrders, fromDate, toDate);
  }, [allOrders, fromDate, toDate]);

  // Search, applied right after the date filter and before market/status --
  // search has no per-value pills of its own to protect (unlike status/
  // market below), so it's safe to fold into the base of the chain every
  // other memo derives from, rather than needing its own "exclude this
  // dimension" variant the way countFor/marketCountFor do.
  const dateSearchFiltered = useMemo(() => {
    if (!dateFiltered) return dateFiltered;
    if (!searchQuery) return dateFiltered;
    return dateFiltered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(searchQuery) ||
        o.customerName.toLowerCase().includes(searchQuery) ||
        o.customerPhone.toLowerCase().includes(searchQuery) ||
        o.customerEmail.toLowerCase().includes(searchQuery),
    );
  }, [dateFiltered, searchQuery]);

  const operationalFiltered = useMemo(() => {
    if (!dateSearchFiltered) return dateSearchFiltered;
    return dateSearchFiltered.filter((order) => {
      if (excludeCancelled && order.status === 'cancelled') return false;
      if (paymentFilter && order.paymentStatus !== paymentFilter) return false;
      if (attentionFilter === 'confirmation' && !['new', 'payment_review'].includes(order.status)) return false;
      if (attentionFilter === 'refund' && !(order.status === 'cancelled' && order.paymentStatus === 'paid')) return false;
      return true;
    });
  }, [attentionFilter, dateSearchFiltered, excludeCancelled, paymentFilter]);

  // Date + search + market -- this is the base the STATUS pill counts are
  // computed from (countFor below), so a date/search/market filter still
  // scopes what those counts mean, but clicking a status pill doesn't also
  // collapse every other status pill's number to whatever's left in that
  // one status.
  const dateMarketFiltered = useMemo(() => {
    if (!operationalFiltered) return operationalFiltered;
    return marketFilter ? operationalFiltered.filter((o) => o.market === marketFilter) : operationalFiltered;
  }, [marketFilter, operationalFiltered]);

  // Date + search + status -- the same idea, mirrored for the MARKET pills'
  // own counts (added 2026-08-01): a market pill's count must never be
  // derived from a list already filtered by market itself, same lesson as
  // the status-pill count bugs above.
  const dateStatusFiltered = useMemo(() => {
    if (!operationalFiltered) return operationalFiltered;
    return statusFilter ? operationalFiltered.filter((o) => o.status === statusFilter) : operationalFiltered;
  }, [operationalFiltered, statusFilter]);

  // Table rows: date + market + status. Previously the status half of this
  // was implicit (the server had already applied it before this ever ran)
  // -- now applied explicitly, client-side, same as the other two filters,
  // since the fetch above is always unfiltered.
  const orders = useMemo(() => {
    if (!dateMarketFiltered) return dateMarketFiltered;
    return statusFilter ? dateMarketFiltered.filter((o) => o.status === statusFilter) : dateMarketFiltered;
  }, [dateMarketFiltered, statusFilter]);

  // Adjust state during render (not an effect) when the filtered `orders`
  // list changes reference -- avoids the cascading-render lint error a
  // `useEffect` calling setState synchronously would trigger. Same pattern
  // used in useProducts.ts for the market-cache follow-up (2026-07-27).
  const [ordersForSelection, setOrdersForSelection] = useState<ApiOrder[] | null>(null);
  if (orders !== ordersForSelection) {
    setOrdersForSelection(orders);
    setSelected(orders?.[0] ?? null);
  }

  // Was also triggered by marketFilter alone, with a "Clear" button that
  // reset BOTH date and market together (2026-08-01 fix, while adding the
  // market pills below): now that market has its own persistent pills with
  // their own "Both markets" reset, this banner only needs to cover the
  // date range, which has no other UI control on this page. Otherwise
  // clicking "Clear" after deliberately picking a market pill would also
  // silently reset that pill.
  const hasDateFilter = Boolean(fromDate || toDate);
  const dateRangeValid = orderDateRange(fromDate, toDate).valid;
  const setDateBoundary = (key: 'from' | 'to', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const clearDateFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('from');
    next.delete('to');
    setSearchParams(next);
  };
  const hasOperationalFilter = Boolean(paymentFilter || attentionFilter || excludeCancelled || dashboardContext);
  const clearOperationalFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('payment');
    next.delete('attention');
    next.delete('excludeCancelled');
    next.delete('context');
    setSearchParams(next);
  };
  const dashboardContextMessage = dashboardContext === 'revenue'
    ? t('dashboardRevenueContext', lang)
    : dashboardContext === 'confirmation'
      ? t('dashboardConfirmationContext', lang)
      : dashboardContext === 'market'
        ? t('dashboardMarketContext', lang)
        : t('dashboardOrdersContext', lang);
  const dateRangeLabel = useMemo(() => {
    const range = orderDateRange(fromDate, toDate);
    const fmt = (d: Date) => formatOrderDateTime(d, lang);
    if (range.start && range.end) return `${fmt(range.start)} – ${fmt(range.end)}`;
    if (range.start) return t('fromDateTimeLabel', lang, { value: fmt(range.start) });
    if (range.end) return t('toDateTimeLabel', lang, { value: fmt(range.end) });
    return null;
  }, [fromDate, lang, toDate]);

  // Computed from dateMarketFiltered (NOT `orders`, which already has the
  // status pill applied) -- otherwise every pill's count reflects only
  // whichever single status is currently selected (2026-07-31 admin
  // report: "the navigation tab shows 0 orders, even if orders tab shows
  // 2" turned out to be one instance of this same bug -- clicking any
  // filter pill here collapsed every OTHER pill's count to 0 the same way).
  const countFor = (status: string) => dateMarketFiltered?.filter((o) => (status ? o.status === status : true)).length ?? 0;

  // Market filter pills (2026-08-01 request: "separate both markets" --
  // previously the only way to scope this page to one market was arriving
  // via a Dashboard chart drill-down link, which set the same `market` URL
  // param this reads/writes but had no control ON this page itself). Mirrors
  // the market filter Invoices.tsx already has (bothMarkets/angolaOption/
  // portugalOption), reusing the same three i18n keys for consistency.
  // Counts come from dateStatusFiltered, NOT dateMarketFiltered -- same
  // reasoning as countFor above, just for the other dimension.
  const setMarket = (m: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (m) next.set('market', m);
    else next.delete('market');
    setSearchParams(next);
  };
  const marketCountFor = (m: string) => dateStatusFiltered?.filter((o) => (m ? o.market === m : true)).length ?? 0;

  // Export (2026-08-01 request) -- downloads whatever's currently on
  // screen, i.e. respecting the status pill, market pill, and any
  // Dashboard date drill-down already applied. Filename reflects the
  // active filters so a repeated export (e.g. "Angola, Processing" every
  // morning) doesn't just overwrite the same generic orders-<date>.csv.
  const handleExport = () => {
    const parts = ['orders', marketFilter, statusFilter, new Date().toISOString().slice(0, 10)].filter(Boolean);
    downloadOrdersCsv(orders ?? [], lang, `${parts.join('-')}.csv`);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* The manual "WhatsApp update" CTA that used to live here is gone
          (2026-08-01 request: "we don't need it, since updates will be sent
          automatically") -- notifyOrderEvent.ts on the CMS side now sends
          both an email and a WhatsApp message automatically at every stage
          of the NEXT_STEP pipeline OrderDetail.tsx's own CTA drives (confirm
          payment, mark as shipped, mark as delivered, plus a tracking-code
          notice). There's nothing left for a manual per-order "send an
          update" button to cover that the automatic pipeline doesn't
          already handle. */}
      <PageHeader eyebrow={t('navOrders', lang)} title={t('orderQueue', lang)} subtitle={t('orderQueueSubtitle', lang)} />

      {totalOrders !== null && allOrders !== null && totalOrders > allOrders.length && (
        <div style={{ margin: '12px 28px 0', padding: '8px 14px', background: '#FBEFE4', border: '1px solid #E8C89A', borderRadius: 8, fontSize: 11, color: '#8A5A2B', width: 'fit-content' }}>
          {t('ordersTruncatedWarning', lang, { shown: allOrders.length, total: totalOrders })}
        </div>
      )}

      <div style={{ margin: '16px 28px 0', padding: 14, background: C.paper, border: `1px solid ${dateRangeValid ? C.ruleLight : '#E1B3AA'}`, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'grid', gap: 5, minWidth: 220, flex: '1 1 220px', color: C.inkSoft, fontSize: 10, fontWeight: 800 }}>
            {t('dateTimeFrom', lang)}
            <input
              type="datetime-local"
              value={dateTimeInputValue(fromDate, 'start')}
              max={dateTimeInputValue(toDate, 'end') || undefined}
              onChange={(event) => setDateBoundary('from', event.target.value)}
              style={{ padding: '9px 10px', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink, font: 'inherit' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 5, minWidth: 220, flex: '1 1 220px', color: C.inkSoft, fontSize: 10, fontWeight: 800 }}>
            {t('dateTimeTo', lang)}
            <input
              type="datetime-local"
              value={dateTimeInputValue(toDate, 'end')}
              min={dateTimeInputValue(fromDate, 'start') || undefined}
              onChange={(event) => setDateBoundary('to', event.target.value)}
              style={{ padding: '9px 10px', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink, font: 'inherit' }}
            />
          </label>
          <button
            type="button"
            onClick={clearDateFilter}
            disabled={!hasDateFilter}
            style={{ padding: '9px 14px', border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: hasDateFilter ? C.ink : C.disabledFg, fontSize: 11, fontWeight: 800 }}
          >
            {t('clearDateFilter', lang)}
          </button>
        </div>
        {dateRangeLabel && dateRangeValid && (
          <div style={{ marginTop: 9, fontSize: 10.5, fontWeight: 700, color: C.goldDeep }}>
            {t('filteredToRangeLabel', lang, { range: dateRangeLabel })}
          </div>
        )}
        {!dateRangeValid && (
          <div role="alert" style={{ marginTop: 9, fontSize: 10.5, fontWeight: 700, color: '#B95545' }}>
            {t('invalidDateTimeRange', lang)}
          </div>
        )}
      </div>

      {hasOperationalFilter && (
        <div style={{ margin: '10px 28px 0', display: 'flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '8px 12px', borderRadius: 8, background: C.tagBg, border: '1px solid #E8D28D' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: C.goldDeep }}>
            {dashboardContext ? dashboardContextMessage : t('dashboardFilterActive', lang)}
          </div>
          <button type="button" onClick={clearOperationalFilters} style={{ fontSize: 10.5, fontWeight: 900, color: C.goldDeep, textDecoration: 'underline' }}>{t('clearDateFilter', lang)}</button>
        </div>
      )}

      {/* Market pills (2026-08-01 request: "separate both markets") --
          previously the only way to view just one market's orders was
          arriving via a Dashboard chart link; there was no control here. */}
      <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <FilterPill label={`${t('bothMarkets', lang)} ${marketCountFor('')}`} active={!marketFilter} onClick={() => setMarket(null)} />
          <FilterPill label={`${t('angolaOption', lang)} ${marketCountFor('AO')}`} active={marketFilter === 'AO'} onClick={() => setMarket('AO')} />
          <FilterPill label={`${t('portugalOption', lang)} ${marketCountFor('PT')}`} active={marketFilter === 'PT'} onClick={() => setMarket('PT')} />
        </div>
        {/* Search (2026-08-01 request) -- order number, customer name, phone,
            or email. Matches against dateFiltered client-side (see
            dateSearchFiltered above), same "already in memory" approach as
            every other filter on this page. */}
        <input
          type="search"
          value={searchParams.get('q') ?? ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchOrdersPlaceholder', lang)}
          style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink, width: 240, maxWidth: '100%' }}
        />
      </div>

      <div style={{ padding: '16px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Was orders?.length (2026-07-31 follow-up report): `orders` already
              has the status pill applied, so once ANY other pill was active,
              "All" silently showed that pill's own count instead of the true
              total -- the exact same bug class as countFor below, just missed
              here because this one line uses a literal .length instead of
              going through countFor(''). dateMarketFiltered is the same base
              countFor uses, so this now actually means "all". */}
          <FilterPill label={t('filterAll', lang, { n: dateMarketFiltered?.length ?? 0 })} active={!statusFilter} onClick={() => setStatusFilter('')} />
          {STATUSES.map((s) => (
            <FilterPill key={s} label={`${statusBadgeProps(s, lang).label} ${countFor(s)}`} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
        {/* Export (2026-08-01 request) -- downloads exactly what's currently
            filtered/visible below (market pill + status pill + any
            Dashboard date drill-down), not just today's orders the way
            Dashboard's own "Export summary" button is scoped. */}
        <button
          onClick={handleExport}
          disabled={!orders || orders.length === 0}
          style={{
            padding: '7px 14px',
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            border: `1px solid ${C.rule}`,
            background: C.paper,
            color: !orders || orders.length === 0 ? C.disabledFg : C.ink,
            flexShrink: 0,
          }}
        >
          {t('exportOrders', lang)}
        </button>
      </div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}
      {orders && orders.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noOrdersFound', lang)}</div>}

      {orders && orders.length > 0 && (
        <div style={{ padding: '16px 28px 0' }} className="ump-admin-orders-grid">
          <div className="ump-admin-table-wrap" style={{ minWidth: 0 }}>
            <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
              <TableRow
                header
                cells={[
                  t('tableHeaderOrder', lang),
                  t('tableHeaderOrderedAt', lang),
                  t('tableHeaderCustomer', lang),
                  t('tableHeaderMarket', lang),
                  t('tableHeaderPayment', lang),
                  t('tableHeaderDelivery', lang),
                  t('tableHeaderStatus', lang),
                  t('tableHeaderTotal', lang),
                ]}
              />
              {orders.map((o) => (
                // Clicking anywhere on the row opens the order (2026-07-30
                // user report: the row only highlighted a summary panel, and
                // the detail view needed a second click on a button). The
                // summary panel still updates, so it stays useful when
                // navigating back.
                <div
                  key={o.id}
                  role="button"
                  tabIndex={0}
                  aria-label={t('openOrderDetail', lang)}
                  onClick={() => {
                    setSelected(o);
                    navigate(`/admin/encomendas/${o.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/encomendas/${o.id}`);
                    }
                  }}
                  style={{ cursor: 'pointer', background: selected?.id === o.id ? '#FFF7DD' : 'transparent' }}
                >
                  <TableRow
                    cells={[
                      `#${o.orderNumber}`,
                      formatOrderDateTime(o.createdAt, lang),
                      o.customerName,
                      o.market,
                      paymentMethodLabel(o.paymentMethod, lang),
                      deliveryMethodLabel(o.deliveryMethod, lang),
                      <Badge key="b" {...orderStatusBadgeProps(o, lang)} />,
                      `${o.total.toLocaleString('en-US')} ${o.currency}`,
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
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

function TableRow({ cells, header }: { cells: (string | React.ReactNode)[]; header?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '0.75fr 1fr 1.2fr 0.55fr 0.9fr 0.8fr 1fr 0.85fr',
        gap: 8,
        alignItems: 'center',
        padding: '11px 16px',
        fontSize: 11.5,
        color: header ? C.goldDeep : C.ink,
        fontWeight: header ? 800 : 500,
        textTransform: header ? 'uppercase' : 'none',
        borderBottom: `1px solid ${C.ruleLight}`,
      }}
    >
      {cells.map((c, i) => (
        <div key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c}
        </div>
      ))}
    </div>
  );
}
