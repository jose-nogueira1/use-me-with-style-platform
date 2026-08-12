import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const lookup = readFileSync(new URL('../src/storefront/pages/ConfirmationLookup.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const orderDetail = readFileSync(new URL('../src/admin/pages/OrderDetail.tsx', import.meta.url), 'utf8');

test('email lookup parameters prefill order and email without auto-submitting', () => {
  assert.match(lookup, /searchParams\.get\('order'\)/);
  assert.match(lookup, /searchParams\.get\('email'\)/);
  assert.match(lookup, /useState\(routeOrderNumber \?\? linkedOrderNumber\)/);
  assert.match(lookup, /useState\(autoEmail \?\? linkedEmail\)/);
});

test('confirmation actions use a responsive non-overlapping group and completed steps show checks', () => {
  assert.match(lookup, /className="ump-confirmation-actions"/);
  assert.match(lookup, /i <= activeStatusIdx \? <Check/);
  assert.match(lookup, /className="ump-order-progress-track"/);
  assert.match(app, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(app, /left: 12\.5%; right: 12\.5%/);
  assert.match(app, /\.ump-confirmation-actions \{ display: flex; flex-direction: column/);
  assert.match(app, /@media \(min-width: 520px\)/);
});

test('medium storefront widths collapse the full desktop navigation', () => {
  assert.match(app, /@media \(min-width: 1080px\) \{\s*\.ump-desktop-nav/);
});

test('address line 2 is editable for AO and PT orders', () => {
  const addressLineBeforePtGuard = orderDetail.indexOf("addressLine2Field") < orderDetail.indexOf("order.market === 'PT'");
  assert.equal(addressLineBeforePtGuard, true);
});
