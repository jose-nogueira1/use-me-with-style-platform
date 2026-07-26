import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminInvoicePdfUrl, adminListInvoices, type ApiInvoice } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { t } from '../i18n';

// Read-only viewer for issued internal (non-fiscal) invoices -- the CMS's
// Invoices collection is intentionally immutable once generated (see
// use-me-with-style-cms/src/collections/Invoices.ts: `update: () => false`),
// so there's nothing to edit here, only list + download the PDF. Added
// 2026-07-25 for storefront-admin/Payload-admin parity; previously this
// collection had no storefront-admin UI at all.
export function Invoices() {
  const { lang } = useApp();
  const [invoices, setInvoices] = useState<ApiInvoice[] | null>(null);
  const [error, setError] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'' | 'AO' | 'PT'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'issued' | 'failed'>('');

  useEffect(() => {
    adminListInvoices()
      .then(setInvoices)
      .catch(() => setError(true));
  }, []);

  const filtered = (invoices ?? []).filter((inv) => {
    if (marketFilter && inv.market !== marketFilter) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    all: invoices?.length ?? 0,
    issued: invoices?.filter((i) => i.status === 'issued').length ?? 0,
    failed: invoices?.filter((i) => i.status === 'failed').length ?? 0,
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('settingsInvoices', lang)}
        title={t('internalInvoicesTitle', lang)}
        subtitle={t('internalInvoicesSubtitle', lang)}
      />

      <div style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterPill label={t('filterAll', lang, { n: counts.all })} active={!statusFilter} onClick={() => setStatusFilter('')} />
        <FilterPill label={`${t('issuedBadge', lang)} ${counts.issued}`} active={statusFilter === 'issued'} onClick={() => setStatusFilter('issued')} />
        <FilterPill label={`${t('failedBadge', lang)} ${counts.failed}`} active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} />
        <div style={{ width: 1, background: C.ruleLight, margin: '4px 4px' }} />
        <FilterPill label={t('bothMarkets', lang)} active={!marketFilter} onClick={() => setMarketFilter('')} />
        <FilterPill label={t('angolaOption', lang)} active={marketFilter === 'AO'} onClick={() => setMarketFilter('AO')} />
        <FilterPill label={t('portugalOption', lang)} active={marketFilter === 'PT'} onClick={() => setMarketFilter('PT')} />
      </div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}
      {invoices && filtered.length === 0 && !error && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noInvoicesYet', lang)}</div>}

      {filtered.length > 0 && (
        <div style={{ padding: '20px 28px 0' }} className="ump-admin-table-wrap">
          <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
            <Row
              header
              cells={[
                t('tableHeaderInvoiceNumber', lang),
                t('tableHeaderMarket', lang),
                t('tableHeaderCustomer', lang),
                t('tableHeaderOrderShort', lang),
                t('tableHeaderStatus', lang),
                t('tableHeaderTotal', lang),
                t('tableHeaderIssued', lang),
                '',
              ]}
            />
            {filtered.map((inv) => (
              <Row
                key={inv.id}
                cells={[
                  inv.invoiceNumber,
                  inv.market,
                  `${inv.customerName} · ${inv.customerEmail}`,
                  <Link key="order" to={`/admin/encomendas/${typeof inv.relatedOrder === 'object' ? inv.relatedOrder.id : inv.relatedOrder}`} style={{ color: C.ink, textDecoration: 'underline' }}>
                    #{inv.orderNumber}
                  </Link>,
                  <Badge key="status" label={inv.status === 'issued' ? t('issuedBadge', lang) : t('failedBadge', lang)} tone={inv.status === 'issued' ? 'green' : 'red'} />,
                  `${inv.total.toLocaleString('en-US')} ${inv.currency}`,
                  new Date(inv.issuedAt).toLocaleDateString(),
                  inv.status === 'issued' ? (
                    <a key="pdf" href={adminInvoicePdfUrl(inv.id)} target="_blank" rel="noopener noreferrer" style={{ color: C.goldDeep, fontWeight: 800, textDecoration: 'underline' }}>
                      PDF
                    </a>
                  ) : (
                    <span key="pdf" title={inv.errorMessage} style={{ color: C.inkSoft, cursor: inv.errorMessage ? 'help' : 'default' }}>
                      —
                    </span>
                  ),
                ]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ cells, header }: { cells: (string | React.ReactNode)[]; header?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 0.6fr 1.6fr 0.8fr 0.9fr 1fr 0.9fr 0.5fr',
        padding: '11px 16px',
        alignItems: 'center',
        fontSize: header ? 10 : 12.5,
        color: header ? C.goldDeep : C.ink,
        fontWeight: header ? 800 : 400,
        textTransform: header ? 'uppercase' : 'none',
        borderBottom: `1px solid ${C.ruleLight}`,
        gap: 8,
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
