import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCountedOrder,
  isRecognizedRevenue,
  ordersOnLocalDay,
} from '../src/admin/lib/orderMetrics.ts';
import {
  dateTimeInputValue,
  filterOrdersByDateTime,
  orderDateRange,
} from '../src/admin/lib/orderDateRange.ts';
import {
  summarizeAppyPay,
  summarizeFulfilment,
  summarizeMarket,
} from '../src/admin/lib/dashboardMetrics.ts';
import type { ApiOrder } from '../src/lib/api.ts';

test('cancelled orders do not count as orders or recognized revenue', () => {
  assert.equal(isCountedOrder({ status: 'cancelled' }), false);
  assert.equal(isRecognizedRevenue({ status: 'cancelled', paymentStatus: 'paid' }), false);
});

test('revenue requires a paid non-cancelled order', () => {
  assert.equal(isRecognizedRevenue({ status: 'processing', paymentStatus: 'paid' }), true);
  assert.equal(isRecognizedRevenue({ status: 'processing', paymentStatus: 'pending' }), false);
});

test('today selection uses the administrator local calendar day', () => {
  const day = new Date('2026-08-04T12:00:00');
  const rows = [
    { createdAt: '2026-08-04T08:15:00' },
    { createdAt: '2026-08-03T23:59:59' },
  ];
  assert.deepEqual(ordersOnLocalDay(rows, day), [rows[0]]);
});

test('date-time filtering supports exact open and closed timeframes', () => {
  const rows = [
    { createdAt: '2026-08-04T09:00:00' },
    { createdAt: '2026-08-04T12:30:00' },
    { createdAt: '2026-08-04T18:00:00' },
  ];
  assert.deepEqual(
    filterOrdersByDateTime(rows, '2026-08-04T10:00', '2026-08-04T17:00'),
    [rows[1]],
  );
  assert.deepEqual(filterOrdersByDateTime(rows, '2026-08-04T12:00', null), [rows[1], rows[2]]);
});

test('dashboard date-only links remain inclusive and invalid ranges are rejected', () => {
  const rows = [
    { createdAt: '2026-08-04T00:00:00' },
    { createdAt: '2026-08-04T23:59:59' },
  ];
  assert.deepEqual(filterOrdersByDateTime(rows, '2026-08-04', '2026-08-04'), rows);
  assert.equal(orderDateRange('2026-08-05T10:00', '2026-08-04T10:00').valid, false);
  assert.equal(dateTimeInputValue('2026-08-04', 'end'), '2026-08-04T23:59');
});

const baseOrder = {
  id: '1',
  orderNumber: 'AO-1',
  market: 'AO',
  currency: 'Kz',
  paymentMethod: 'multicaixa_express',
  paymentStatus: 'paid',
  status: 'processing',
  total: 20_000,
  createdAt: '2026-08-04T08:00:00Z',
  updatedAt: '2026-08-04T08:00:00Z',
} as unknown as ApiOrder;

test('market summaries keep currencies separate and use paid orders for AOV', () => {
  const rows = [
    baseOrder,
    { ...baseOrder, id: '2', paymentStatus: 'pending', total: 99_000 },
    { ...baseOrder, id: '3', status: 'cancelled', paymentStatus: 'failed', total: 50_000 },
  ];
  assert.deepEqual(summarizeMarket(rows, 'AO'), {
    orders: 2,
    cancelled: 1,
    paid: 1,
    revenue: 20_000,
    averageOrderValue: 20_000,
  });
});

test('AppyPay health separates paid, failed, pending and abandoned attempts', () => {
  const rows = [
    baseOrder,
    { ...baseOrder, id: '2', paymentStatus: 'pending', status: 'new' },
    { ...baseOrder, id: '3', paymentStatus: 'failed', status: 'payment_review', appyPayStatus: 'Failed' },
    { ...baseOrder, id: '4', paymentStatus: 'failed', status: 'cancelled' },
  ];
  assert.deepEqual(summarizeAppyPay(rows), {
    attempts: 4,
    paid: 1,
    failed: 1,
    pending: 1,
    abandoned: 1,
    successRate: 25,
  });
});

test('fulfilment health detects overdue paid work and average time to ship', () => {
  const now = new Date('2026-08-05T12:00:00Z').getTime();
  const rows = [
    baseOrder,
    {
      ...baseOrder,
      id: '2',
      status: 'shipped',
      statusHistory: [
        { status: 'processing', changedAt: '2026-08-04T08:00:00Z' },
        { status: 'shipped', changedAt: '2026-08-04T14:00:00Z' },
      ],
    },
  ];
  assert.deepEqual(summarizeFulfilment(rows, now), {
    active: 1,
    overdue: 1,
    shipped: 1,
    averageHoursToShip: 6,
  });
});
