import type { ApiOrder } from '../../lib/api';
import type { Lang } from '../i18n';
import { downloadText, ordersCsv } from './reportExports';

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
  void lang; // CSV headers and stored category values remain stable English identifiers.
  downloadText(ordersCsv(rows), filename);
}
