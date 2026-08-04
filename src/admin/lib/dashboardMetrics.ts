import type { ApiOrder } from '../../lib/api';
import { isCountedOrder, isRecognizedRevenue } from './orderMetrics.ts';

export type MarketSummary = {
  orders: number;
  cancelled: number;
  paid: number;
  revenue: number;
  averageOrderValue: number;
};

export function ordersInWindow<T extends Pick<ApiOrder, 'createdAt'>>(
  orders: T[],
  start: Date,
  end: Date,
): T[] {
  return orders.filter((order) => {
    const created = new Date(order.createdAt);
    return created >= start && created <= end;
  });
}

export function summarizeMarket(
  orders: ApiOrder[],
  market: 'AO' | 'PT',
): MarketSummary {
  const marketOrders = orders.filter((order) => order.market === market);
  const counted = marketOrders.filter(isCountedOrder);
  const paid = marketOrders.filter(isRecognizedRevenue);
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  return {
    orders: counted.length,
    cancelled: marketOrders.filter((order) => order.status === 'cancelled').length,
    paid: paid.length,
    revenue,
    averageOrderValue: paid.length ? revenue / paid.length : 0,
  };
}

export type AppyPayHealth = {
  attempts: number;
  paid: number;
  failed: number;
  pending: number;
  abandoned: number;
  successRate: number | null;
};

export function summarizeAppyPay(orders: ApiOrder[]): AppyPayHealth {
  const attempts = orders.filter((order) => order.paymentMethod === 'multicaixa_express');
  const paid = attempts.filter(isRecognizedRevenue).length;
  const failed = attempts.filter(
    (order) => order.appyPayStatus === 'Failed' || (order.paymentStatus === 'failed' && order.status !== 'cancelled'),
  ).length;
  const pending = attempts.filter(
    (order) => order.paymentStatus === 'pending' && order.status !== 'cancelled',
  ).length;
  const abandoned = attempts.filter(
    (order) => order.status === 'cancelled' && order.paymentStatus !== 'paid',
  ).length;
  return {
    attempts: attempts.length,
    paid,
    failed,
    pending,
    abandoned,
    successRate: attempts.length ? Math.round((paid / attempts.length) * 100) : null,
  };
}

function statusTime(order: ApiOrder, status: string): number | null {
  const match = order.statusHistory?.find((entry) => entry.status === status);
  return match ? new Date(match.changedAt).getTime() : null;
}

export type FulfilmentHealth = {
  active: number;
  overdue: number;
  shipped: number;
  averageHoursToShip: number | null;
};

export function summarizeFulfilment(
  orders: ApiOrder[],
  nowMs: number,
  slaHours = 24,
): FulfilmentHealth {
  const paid = orders.filter(isRecognizedRevenue);
  const active = paid.filter((order) => order.status === 'processing');
  const overdue = active.filter((order) => {
    const started = order.appyPayVerifiedAt
      ? new Date(order.appyPayVerifiedAt).getTime()
      : statusTime(order, 'processing') ?? new Date(order.createdAt).getTime();
    return nowMs - started >= slaHours * 3_600_000;
  });
  const shippedDurations = paid.flatMap((order) => {
    const shippedAt = statusTime(order, 'shipped');
    if (!shippedAt) return [];
    const paidAt = order.appyPayVerifiedAt
      ? new Date(order.appyPayVerifiedAt).getTime()
      : statusTime(order, 'processing') ?? new Date(order.createdAt).getTime();
    return shippedAt >= paidAt ? [(shippedAt - paidAt) / 3_600_000] : [];
  });
  return {
    active: active.length,
    overdue: overdue.length,
    shipped: shippedDurations.length,
    averageHoursToShip: shippedDurations.length
      ? shippedDurations.reduce((sum, hours) => sum + hours, 0) / shippedDurations.length
      : null,
  };
}
