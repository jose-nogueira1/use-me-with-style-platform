import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ApiCustomer, ApiOrder, ApiProduct } from '../src/lib/api.ts';
import { customersCsv, dashboardSummaryCsv, inventoryCsv, ordersCsv } from '../src/admin/lib/reportExports.ts';

const order = (overrides: Partial<ApiOrder> = {}): ApiOrder => ({
  id: '1', orderNumber: 'AO-001', status: 'processing', paymentStatus: 'paid', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T11:00:00Z',
  market: 'AO', customerName: 'Ana Silva', customerPhone: '+244900000000', customerEmail: 'ana@example.com', address: 'Rua 1', addressLine2: 'Apt 2', city: 'Luanda', country: 'Angola',
  items: [{ product: 'p1', productName: 'Vestido', variantId: 'v1', color: 'Preto', size: 'M', qty: 2, unitPrice: 10000 }], currency: 'Kz', subtotal: 20000,
  shippingCost: 2000, total: 22000, paymentMethod: 'whatsapp_manual', deliveryMethod: 'courier', analyticsConsent: true, ...overrides,
});

const product = (overrides: Partial<ApiProduct> = {}): ApiProduct => ({
  id: 'p1', name: 'Vestido', slug: 'vestido', category: { id: 'c1', namePT: 'Vestidos', nameEN: 'Dresses', slug: 'vestidos', active: true }, variants: [
    { id: 'v1', sku: 'VES-PRE-M', color: { id: 'black', namePT: 'Preto', nameEN: 'Black' }, size: 'M', stockAO: 2, stockPT: 3 },
  ], priceAOKz: 25000, pricePTEur: 30, shippingWeightGrams: 300, active: true, availableAO: true, availablePT: true, ...overrides,
});

test('order export contains complete operational and delivery details', () => {
  const csv = ordersCsv([order()]);
  assert.match(csv, /Address line 2/);
  assert.match(csv, /Payment status/);
  assert.match(csv, /Apt 2/);
  assert.match(csv, /2x Vestido \/ Preto \/ M/);
});

test('inventory export emits one row per variant with market stock kept separate', () => {
  const csv = inventoryCsv([product()]);
  assert.match(csv, /Variant SKU,Stock AO,Stock PT,Total stock/);
  assert.match(csv, /Preto \/ Black,M,VES-PRE-M,2,3,5/);
});

test('customer export excludes cancelled orders and separates Kz from EUR spend', () => {
  const customer: ApiCustomer = { id: 'c1', name: 'Ana Silva', email: 'ana@example.com', phone: '+244900000000', market: 'AO', orderCount: 3, createdAt: '2026-07-01T00:00:00Z' };
  const csv = customersCsv([customer], [order(), order({ id: '2', orderNumber: 'PT-1', market: 'PT', currency: 'EUR', total: 40 }), order({ id: '3', status: 'cancelled', total: 99999 })]);
  assert.match(csv, /Spend AO \(Kz\),Spend PT \(EUR\)/);
  assert.match(csv, /22000,40,22000,40/);
  assert.doesNotMatch(csv, /99999/);
});

test('dashboard summary creates independent AO and PT rows and inventory attention', () => {
  const csv = dashboardSummaryCsv({ from: new Date('2026-08-01T00:00:00Z'), to: new Date('2026-08-31T23:59:59Z'), orders: [order(), order({ id: '2', market: 'PT', currency: 'EUR', total: 40 })], products: [product()] });
  assert.match(csv, /AO,1,1,22000/);
  assert.match(csv, /PT,1,1,40/);
});

test('all four admin surfaces expose phase-one exports and a phase-two roadmap note', () => {
  const dashboard = readFileSync(new URL('../src/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');
  const orders = readFileSync(new URL('../src/admin/pages/Orders.tsx', import.meta.url), 'utf8');
  const products = readFileSync(new URL('../src/admin/pages/Products.tsx', import.meta.url), 'utf8');
  const customers = readFileSync(new URL('../src/admin/pages/Customers.tsx', import.meta.url), 'utf8');
  const i18n = readFileSync(new URL('../src/admin/i18n.ts', import.meta.url), 'utf8');
  assert.match(dashboard, /downloadDashboardPdf/);
  assert.match(orders, /ordersExportScopeNote/);
  assert.match(products, /inventoryCsv\(filtered\)/);
  assert.match(customers, /customersCsv/);
  assert.match(i18n, /saved templates, column picker, Excel workbooks, scheduled reports and email delivery/);
});
