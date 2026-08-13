import type { ApiCustomer, ApiOrder, ApiProduct, ApiReturn } from '../../lib/api.ts';
import { isCountedOrder, isRecognizedRevenue } from './orderMetrics.ts';

function populated<T extends object>(value: T | string | number | null | undefined): T | null {
  return value && typeof value === 'object' ? value : null;
}

function reportProductStocks(product: ApiProduct): number[] {
  if (product.productType === 'bundle') {
    return (product.bundleComponents ?? []).flatMap((component) => {
      const child = populated(component.product);
      const variant = child?.variants?.find((row) => String(row.id) === String(component.variantId));
      return variant ? [Math.floor((Number(variant.stockAO) + Number(variant.stockPT)) / Math.max(1, Number(component.qty)))] : [];
    });
  }
  return product.variants.map((variant) => Number(variant.stockAO) + Number(variant.stockPT));
}

const reportProductIsLowStock = (product: ApiProduct) => {
  const stocks = reportProductStocks(product);
  return stocks.length > 0 && Math.min(...stocks) <= 2;
};
const reportProductIsOutOfStock = (product: ApiProduct) => reportProductStocks(product).some((stock) => stock === 0);

export type CsvCell = string | number | boolean | null | undefined;

export function csvValue(value: CsvCell): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvDocument(headers: string[], rows: CsvCell[][]): string {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n')}`;
}

export function downloadText(content: string, filename: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const dateStamp = () => new Date().toISOString().slice(0, 10);
export const reportFilename = (type: string, detail?: string, extension = 'csv') =>
  ['use-me', type, detail, dateStamp()].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9.-]+/g, '-') + `.${extension}`;

export function ordersCsv(orders: ApiOrder[]): string {
  const headers = [
    'Order number', 'Created at', 'Updated at', 'Market', 'Currency', 'Customer name', 'Email', 'Phone',
    'Address line 1', 'Address line 2', 'Postal code', 'City', 'Country', 'Tax ID', 'Items', 'Variant IDs',
    'Subtotal', 'Discount', 'Coupon', 'Shipping', 'Total', 'Payment method', 'Payment status', 'Order status',
    'Delivery method', 'Tracking number', 'Customer notes',
  ];
  const rows = orders.map((order) => [
    order.orderNumber, order.createdAt, order.updatedAt, order.market, order.currency, order.customerName,
    order.customerEmail, order.customerPhone, order.address, order.addressLine2, order.postalCode, order.city,
    order.country, order.taxId,
    order.items.map((item) => `${item.qty}x ${item.productName}${item.color ? ` / ${item.color}` : ''}${item.size ? ` / ${item.size}` : ''}`).join(' | '),
    order.items.map((item) => item.variantId ?? '').filter(Boolean).join(' | '), order.subtotal,
    order.discountAmount ?? 0, order.couponCode, order.shippingCost, order.total, order.paymentMethod,
    order.paymentStatus, order.status, order.deliveryMethod, order.cttTrackingCode, order.notes,
  ]);
  return csvDocument(headers, rows);
}

export function inventoryCsv(products: ApiProduct[]): string {
  const headers = [
    'Product', 'Product slug', 'Product type', 'Category', 'Active', 'Available AO', 'Available PT',
    'Colour', 'Size / option', 'Variant SKU', 'Stock AO', 'Stock PT', 'Total stock', 'Stock status',
    'Price AO (Kz)', 'Price PT (EUR)',
  ];
  const rows: CsvCell[][] = [];
  for (const product of products) {
    const category = populated(product.category);
    const categoryName = category ? category.namePT : String(product.category ?? '');
    if (product.productType === 'bundle' || !product.variants?.length) {
      rows.push([
        product.name, product.slug, product.productType ?? 'standard', categoryName, product.active,
        product.availableAO, product.availablePT, '', product.productType === 'bundle' ? 'Bundle' : '', '', '', '', '',
        reportProductIsOutOfStock(product) ? 'Out of stock' : reportProductIsLowStock(product) ? 'Low stock' : 'In stock',
        product.priceAOKz, product.pricePTEur,
      ]);
      continue;
    }
    for (const variant of product.variants) {
      const colour = populated(variant.color);
      const total = Number(variant.stockAO) + Number(variant.stockPT);
      rows.push([
        product.name, product.slug, product.productType ?? 'standard', categoryName, product.active,
        product.availableAO, product.availablePT, colour ? (colour.nameEN && colour.nameEN !== colour.namePT ? `${colour.namePT} / ${colour.nameEN}` : colour.namePT) : '', variant.size ?? variant.optionValueEN ?? 'One size',
        variant.sku, variant.stockAO, variant.stockPT, total, total === 0 ? 'Out of stock' : total <= 2 ? 'Low stock' : 'In stock',
        product.priceAOKz, product.pricePTEur,
      ]);
    }
  }
  return csvDocument(headers, rows);
}

export function customersCsv(customers: ApiCustomer[], orders: ApiOrder[]): string {
  const headers = [
    'Customer name', 'Email', 'Phone', 'Market', 'Customer since', 'Valid orders', 'First order', 'Last order',
    'Spend AO (Kz)', 'Spend PT (EUR)', 'Average order AO (Kz)', 'Average order PT (EUR)', 'Latest status',
    'Latest delivery city', 'Latest delivery country', 'Marketing consent recorded',
  ];
  const rows = customers.map((customer) => {
    const history = orders
      .filter((order) => order.customerEmail.toLowerCase() === customer.email.toLowerCase() && isCountedOrder(order))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const paidAO = history.filter((order) => order.market === 'AO' && isRecognizedRevenue(order));
    const paidPT = history.filter((order) => order.market === 'PT' && isRecognizedRevenue(order));
    const spendAO = paidAO.reduce((sum, order) => sum + order.total, 0);
    const spendPT = paidPT.reduce((sum, order) => sum + order.total, 0);
    const latest = history.at(-1);
    return [
      customer.name, customer.email, customer.phone, customer.market, customer.createdAt, history.length,
      history[0]?.createdAt, latest?.createdAt, spendAO, spendPT, paidAO.length ? spendAO / paidAO.length : 0,
      paidPT.length ? spendPT / paidPT.length : 0, latest?.status, latest?.city, latest?.country,
      history.some((order) => order.analyticsConsent === true) ? 'Yes' : history.some((order) => order.analyticsConsent === false) ? 'No' : 'Not recorded',
    ];
  });
  return csvDocument(headers, rows);
}

export function returnsCsv(returns: ApiReturn[]): string {
  const headers = ['Return number','Order number','Created at','Updated at','Market','Customer','Email','Status','Resolution','Reason','Items','Requested amount','Approved amount','Currency','Refund status','Refund reference','Store credit code','Restocked at','Resolved at','Replacement order'];
  return csvDocument(headers, returns.map((row) => [row.returnNumber,row.orderNumber,row.createdAt,row.updatedAt,row.market,row.customerName,row.customerEmail,row.status,row.resolution,row.reason,row.items.map((item)=>`${item.quantity}x ${item.productName} (${item.inspection||'pending'}; restock ${item.restockQuantity||0})`).join(' | '),row.requestedAmount,row.approvedAmount,row.currency,row.refundStatus,row.refundReference,row.storeCreditCode,row.inventoryRestockedAt,row.resolvedAt,typeof row.replacementOrder==='object'?row.replacementOrder.orderNumber:row.replacementOrder]));
}

export type DashboardReport = {
  from: Date;
  to: Date;
  orders: ApiOrder[];
  products: ApiProduct[];
};

export function dashboardSummaryCsv({ from, to, orders, products }: DashboardReport): string {
  const rows: CsvCell[][] = [];
  for (const market of ['AO', 'PT'] as const) {
    const marketOrders = orders.filter((order) => order.market === market);
    const valid = marketOrders.filter(isCountedOrder);
    const paid = marketOrders.filter(isRecognizedRevenue);
    const revenue = paid.reduce((sum, order) => sum + order.total, 0);
    rows.push([
      market, valid.length, paid.length, revenue, paid.length ? revenue / paid.length : 0,
      marketOrders.filter((order) => order.status === 'cancelled').length,
      marketOrders.filter((order) => order.paymentStatus === 'failed').length,
      marketOrders.filter((order) => order.status === 'processing').length,
      marketOrders.filter((order) => order.status === 'shipped').length,
      marketOrders.filter((order) => order.status === 'delivered').length,
      products.filter((product) => market === 'AO' ? product.availableAO : product.availablePT).filter(reportProductIsLowStock).length,
      products.filter((product) => market === 'AO' ? product.availableAO : product.availablePT).filter(reportProductIsOutOfStock).length,
      from.toISOString(), to.toISOString(),
    ]);
  }
  return csvDocument([
    'Market', 'Valid orders', 'Paid orders', 'Recognized revenue', 'Average order value', 'Cancelled',
    'Failed payments', 'Processing', 'Shipped', 'Delivered', 'Low-stock products', 'Out-of-stock products',
    'Period start', 'Period end',
  ], rows);
}

export async function buildDashboardPdf({ from, to, orders, products }: DashboardReport) {
  // PDF generation is only needed after an explicit click; keep jsPDF out
  // of the normal admin bundle and load it on demand.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generated = new Date();
  doc.setFillColor(18, 17, 15);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setTextColor(211, 166, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('Use Me with style', 16, 19);
  doc.setFontSize(10);
  doc.setTextColor(245, 239, 226);
  doc.text('Management summary', 16, 28);
  doc.text(`${from.toLocaleDateString()} - ${to.toLocaleDateString()}`, 16, 35);
  doc.setTextColor(32, 29, 25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${generated.toLocaleString()}`, 194, 49, { align: 'right' });

  let y = 62;
  for (const market of ['AO', 'PT'] as const) {
    const currency = market === 'AO' ? 'Kz' : 'EUR';
    const marketOrders = orders.filter((order) => order.market === market);
    const valid = marketOrders.filter(isCountedOrder);
    const paid = marketOrders.filter(isRecognizedRevenue);
    const revenue = paid.reduce((sum, order) => sum + order.total, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(market === 'AO' ? 'Angola' : 'Portugal', 16, y);
    y += 9;
    const metrics: [string, string][] = [
      ['Valid orders', String(valid.length)], ['Paid orders', String(paid.length)],
      ['Recognized revenue', `${revenue.toLocaleString('en-US')} ${currency}`],
      ['Average order value', `${(paid.length ? revenue / paid.length : 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`],
      ['Cancelled', String(marketOrders.filter((order) => order.status === 'cancelled').length)],
      ['Processing / Shipped / Delivered', `${marketOrders.filter((o) => o.status === 'processing').length} / ${marketOrders.filter((o) => o.status === 'shipped').length} / ${marketOrders.filter((o) => o.status === 'delivered').length}`],
    ];
    metrics.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 16 + col * 92;
      const boxY = y + row * 19;
      doc.setFillColor(249, 245, 237);
      doc.roundedRect(x, boxY, 84, 15, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(116, 99, 61);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), x + 4, boxY + 5);
      doc.setTextColor(32, 29, 25);
      doc.setFontSize(10.5);
      doc.text(value, x + 4, boxY + 11);
    });
    y += 65;
  }

  const low = products.filter(reportProductIsLowStock);
  const out = products.filter(reportProductIsOutOfStock);
  doc.setDrawColor(219, 206, 180);
  doc.line(16, y, 194, y);
  y += 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory attention', 16, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Low-stock products: ${low.length}     Out-of-stock products: ${out.length}`, 16, y);
  y += 8;
  [...new Set([...out, ...low])].slice(0, 8).forEach((product) => {
    doc.text(`- ${product.name} (${reportProductIsOutOfStock(product) ? 'out of stock' : 'low stock'})`, 18, y);
    y += 6;
  });
  doc.setFontSize(8);
  doc.setTextColor(110, 104, 96);
  doc.text('Phase 1 operational report. Scheduled reports, saved templates, multi-sheet workbooks and email delivery are planned for Phase 2.', 16, 287);
  return doc;
}

export async function downloadDashboardPdf(report: DashboardReport): Promise<void> {
  const doc = await buildDashboardPdf(report);
  doc.save(reportFilename('dashboard-summary', `${report.from.toISOString().slice(0, 10)}-to-${report.to.toISOString().slice(0, 10)}`, 'pdf'));
}
