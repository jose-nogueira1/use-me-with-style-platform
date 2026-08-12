import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C } from '../../theme';
import { useApp } from '../../state/AppContext';
import { adminListCustomers, adminListOrders, type ApiCustomer, type ApiOrder } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import { customersCsv, downloadText, reportFilename } from '../lib/reportExports';

export function Customers() {
  const { lang } = useApp();
  const [customers, setCustomers] = useState<ApiCustomer[] | null>(null);
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([adminListCustomers(), adminListOrders()])
      .then(([customerRows, orderRows]) => {
        setCustomers(customerRows);
        setOrders(orderRows);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader
        eyebrow={t('navCustomers', lang)}
        title={t('contactLog', lang)}
        subtitle={t('contactLogSubtitle', lang)}
        cta={t('exportCustomers', lang)}
        ctaDisabled={!customers || !orders || customers.length === 0}
        onCta={() => downloadText(customersCsv(customers ?? [], orders ?? []), reportFilename('customers'))}
      />
      <div style={{ margin: '12px 28px 0', textAlign: 'right', fontSize: 10.5, color: C.inkSoft }}>{t('customersExportScopeNote', lang, { n: customers?.length ?? 0 })} {t('phase2ReportingNote', lang)}</div>

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>{t('couldntConnectBackend', lang)}</div>}
      {customers && customers.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>{t('noCustomersYet', lang)}</div>}

      {customers && customers.length > 0 && (
        <div style={{ padding: '20px 28px 0' }} className="ump-admin-table-wrap">
          <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
            <Row header cells={[t('tableHeaderName', lang), t('tableHeaderEmail', lang), t('tableHeaderPhone', lang), t('tableHeaderMarket', lang), t('tableHeaderOrdersCount', lang)]} />
            {customers.map((c) => (
              <Link key={c.id} to={`/admin/clientes/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <Row cells={[c.name, c.email, c.phone ?? '—', c.market, String(c.orderCount)]} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ cells, header }: { cells: string[]; header?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1.4fr 1fr 0.6fr 0.6fr',
        padding: '11px 16px',
        fontSize: header ? 10 : 12.5,
        color: header ? C.goldDeep : C.ink,
        fontWeight: header ? 800 : 400,
        textTransform: header ? 'uppercase' : 'none',
        borderBottom: `1px solid ${C.ruleLight}`,
      }}
    >
      {cells.map((c, i) => (
        <div key={i}>{c}</div>
      ))}
    </div>
  );
}
