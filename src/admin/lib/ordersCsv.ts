import type { ApiOrder } from '../../lib/api';
import { statusBadgeProps } from '../components/Badge';
import type { Lang } from '../i18n';

function csvValue(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Downloads `rows` as a CSV file -- moved here from Dashboard.tsx (which
 * had the only "Export summary" button, limited to today's orders) once the
 * Orders page itself also needed an export, of whatever's currently
 * filtered there. Column headers/values stay in English regardless of the
 * admin's language toggle: this is an export file for someone downstream
 * (accounting, a spreadsheet), not on-screen UI copy, so keeping it in one
 * language avoids a report whose columns change depending on who generated
 * it. paymentMethod/deliveryMethod are the raw stored values (not the
 * admin's own translated labels) for the same reason -- stable, consistent
 * category values are more useful in a CSV than a label that varies by
 * language. */
export function downloadOrdersCsv(rows: ApiOrder[], lang: Lang, filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`) {
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
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
