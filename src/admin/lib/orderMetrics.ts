import type { ApiOrder } from '../../lib/api';

export function isCountedOrder(order: Pick<ApiOrder, 'status'>): boolean {
  return order.status !== 'cancelled';
}

export function isRecognizedRevenue(
  order: Pick<ApiOrder, 'status' | 'paymentStatus'>,
): boolean {
  return isCountedOrder(order) && order.paymentStatus === 'paid';
}

export function ordersOnLocalDay<T extends Pick<ApiOrder, 'createdAt'>>(
  orders: T[],
  day: Date,
): T[] {
  const key = day.toDateString();
  return orders.filter((order) => new Date(order.createdAt).toDateString() === key);
}
