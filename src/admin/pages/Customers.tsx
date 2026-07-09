import { useEffect, useState } from 'react';
import { C } from '../../theme';
import { adminListCustomers, type ApiCustomer } from '../../lib/api';
import { PageHeader } from '../components/PageHeader';

export function Customers() {
  const [customers, setCustomers] = useState<ApiCustomer[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminListCustomers()
      .then(setCustomers)
      .catch(() => setError(true));
  }, []);

  return (
    <div style={{ paddingBottom: 32 }}>
      <PageHeader eyebrow="Customers" title="Contact log" subtitle="Lightweight contact and order history -- no full accounts yet (Phase 2)." />

      {error && <div style={{ margin: '20px 28px', fontSize: 13, color: '#B95545' }}>Couldn't connect to the backend.</div>}
      {customers && customers.length === 0 && <div style={{ margin: '20px 28px', fontSize: 13, color: C.inkSoft }}>No customers yet.</div>}

      {customers && customers.length > 0 && (
        <div style={{ padding: '20px 28px 0' }} className="ump-admin-table-wrap">
          <div style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 8, overflow: 'hidden' }}>
            <Row header cells={['Name', 'Email', 'Phone', 'Market', 'Orders']} />
            {customers.map((c) => (
              <Row key={c.id} cells={[c.name, c.email, c.phone ?? '—', c.market, String(c.orderCount)]} />
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
