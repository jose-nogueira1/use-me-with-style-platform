import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminListReturns, type ApiReturn } from '../../lib/api';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { PageHeader } from '../components/PageHeader';
import { returnsCsv, downloadText, reportFilename } from '../lib/reportExports';

export function Returns() {
  const { lang } = useApp(); const pt = lang === 'pt';
  const [rows, setRows] = useState<ApiReturn[]>([]); const [error, setError] = useState(false);
  useEffect(() => { adminListReturns().then(setRows).catch(() => setError(true)); }, []);
  return <div><PageHeader eyebrow={pt ? 'Vendas' : 'Sales'} title={pt ? 'Trocas e devoluções' : 'Returns & exchanges'} subtitle={pt ? 'Inspeção, reposição de stock e resolução financeira.' : 'Inspection, controlled restocking and financial resolution.'} cta={rows.length ? (pt ? 'Exportar CSV' : 'Export CSV') : undefined} onCta={() => downloadText(returnsCsv(rows), reportFilename('returns'))} />
    <div style={{ padding: '20px 28px 40px' }}>{error && <div style={{ color: C.danger }}>Unable to load returns.</div>}
      <div style={{ display: 'grid', gap: 10 }}>{rows.map((row) => <Link key={row.id} to={`/admin/devolucoes/${row.id}`} style={{ textDecoration: 'none', border: `1px solid ${C.ruleLight}`, background: C.paper, borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}><div><div style={{ fontFamily: F.display, fontWeight: 800, color: C.ink }}>{row.returnNumber}</div><div style={{ fontSize: 11, color: C.inkSoft, marginTop: 5 }}>{row.orderNumber} · {row.customerName} · {row.resolution.replace('_', ' ')}</div></div><div style={{ textAlign: 'right', color: C.goldDeep, fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>{row.status.replaceAll('_', ' ')}<div style={{ color: C.ink, marginTop: 5 }}>{row.approvedAmount ?? row.requestedAmount} {row.currency}</div></div></Link>)}</div>
      {!rows.length && !error && <div style={{ color: C.inkSoft, fontSize: 13 }}>{pt ? 'Ainda não existem devoluções.' : 'No returns yet.'}</div>}
    </div></div>;
}
