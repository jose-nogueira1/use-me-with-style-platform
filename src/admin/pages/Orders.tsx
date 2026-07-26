import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListOrders, adminSendMessage, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge, statusBadgeProps } from '../components/Badge';
import { t } from '../i18n';

const STATUSES = ['new', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export function Orders() {
  const { lang } = useApp();
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  const [error, setError] = useState(false);
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [updateNote, setUpdateNote] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminListOrders(statusFilter ? { status: statusFilter } : {})
      .then((rows) => {
        setError(false);
        setOrders(rows);
        setSelected(rows[0] ?? null);
      })
      .catch(() => setError(true));
  }, [statusFilter]);

  const countFor = (status: string) => orders?.filter((o) => (status ? o.status === status : true)).length ?? 0;

  // Real "WhatsApp update" behavior for the currently selected order --
  // previously this CTA had no onCta and did nothing when clicked. Sends a
  // manual status-update message through the same Messages/adminSendMessage
  // pipeline the Mensagens page uses, so it shows up in that conversation log.
  const handleWhatsAppUpdate = async () => {
    if (!selected) return;
    setSendingUpdate(true);
    setUpdateNote(null);
    try {
      await adminSendMessage({
        channel: 'whatsapp',
        contactHandle: selected.customerPhone,
        customerName: selected.customerName,
        body: `Order #${selected.orderNumber} update: ${statusBadgeProps(selected.status, lang).label}.`,
        relatedOrder: selected.id,
      });
      setUpdateNote(t('sentToCustomer', lang, { name: selected.customerName }));
    } catch {
      setUpdateNote(t('couldntSendCheckBackend', lang));
    } finally {
      setSendingUpdate(false);
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('navOrders', lang)}
        title={t('orderQueue', lang)}
        subtitle={t('orderQueueSubtitle', lang)}
        cta={selected ? (sendingUpdate ? t('sendingEllipsis', lang) : t('whatsappUpdate', lang)) : undefined}
        onCta={handleWhatsAppUpdate}
      />
      {updateNote && <div style={{ margin: '8px 28px 0', fontSize: 12, color: C.inkSoft }}>{updateNote}</div>}

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterPill label={t('filterAll', lang, { n: orders?.length ?? 0 })} active={!statusFilter} onClick={() => setStatusFilter('')} />
        {STATUSES.map((s) => (
          <FilterPill key={s} label={`${statusBadgeProps(s, lang).label} ${countFor(s)}`} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}
      {orders && orders.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noOrdersFound', lang)}</div>}

      {orders && orders.length > 0 && (
        <div style={{ padding: '16px 28px 0', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }} className="ump-admin-orders-grid">
          <div className="ump-admin-table-wrap" style={{ minWidth: 0 }}>
            <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
              <TableRow
                header
                cells={[
                  t('tableHeaderOrder', lang),
                  t('tableHeaderCustomer', lang),
                  t('tableHeaderMarket', lang),
                  t('tableHeaderPayment', lang),
                  t('tableHeaderDelivery', lang),
                  t('tableHeaderStatus', lang),
                  t('tableHeaderTotal', lang),
                ]}
              />
              {orders.map((o) => (
                <div key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer', background: selected?.id === o.id ? '#FFF7DD' : 'transparent' }}>
                  <TableRow
                    cells={[
                      `#${o.orderNumber}`,
                      o.customerName,
                      o.market,
                      o.paymentMethod,
                      o.deliveryMethod,
                      <Badge key="b" {...statusBadgeProps(o.status, lang)} />,
                      `${o.total.toLocaleString('en-US')} ${o.currency}`,
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 8 }}>{t('selectedOrder', lang)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 14, lineHeight: 1.3 }}>
                #{selected.orderNumber} {statusBadgeProps(selected.status, lang).label.toLowerCase()}
              </div>
              <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.6, marginBottom: 16 }}>
                {t('orderSummaryLine', lang, {
                  name: selected.customerName,
                  market: selected.market === 'AO' ? t('angolaOption', lang) : t('portugalOption', lang),
                  method: selected.paymentMethod,
                  notes: selected.notes || t('noneNotes', lang),
                })}
              </div>
              <button
                onClick={() => navigate(`/admin/encomendas/${selected.id}`)}
                style={{ width: '100%', padding: 12, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, borderRadius: 6 }}
              >
                {t('openOrderDetail', lang)}
              </button>
            </div>
          )}
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
        gridTemplateColumns: '0.8fr 1.3fr 0.6fr 0.9fr 0.8fr 1fr 0.9fr',
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
