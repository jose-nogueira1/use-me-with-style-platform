import type { ApiOrder } from '../../lib/api';
import type { Lang } from '../i18n';

const DATE_TIME_FORMATTERS: Record<Lang, Intl.DateTimeFormat> = {
  pt: new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }),
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' }),
};

export function formatOrderDateTime(value: string | Date, lang: Lang): string {
  return DATE_TIME_FORMATTERS[lang].format(typeof value === 'string' ? new Date(value) : value);
}

function boundary(value: string | null, edge: 'start' | 'end'): Date | null {
  if (!value) return null;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}`
      : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function orderDateRange(
  from: string | null,
  to: string | null,
): { start: Date | null; end: Date | null; valid: boolean } {
  const start = boundary(from, 'start');
  const end = boundary(to, 'end');
  return { start, end, valid: !(start && end && start > end) };
}

export function filterOrdersByDateTime<T extends Pick<ApiOrder, 'createdAt'>>(
  orders: T[],
  from: string | null,
  to: string | null,
): T[] {
  const range = orderDateRange(from, to);
  if (!range.valid) return [];
  return orders.filter((order) => {
    const created = new Date(order.createdAt);
    return (!range.start || created >= range.start) && (!range.end || created <= range.end);
  });
}

export function dateTimeInputValue(value: string | null, edge: 'start' | 'end'): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T${edge === 'start' ? '00:00' : '23:59'}`;
  }
  return value.slice(0, 16);
}
