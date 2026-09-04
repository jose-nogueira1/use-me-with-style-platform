import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');

test('product detail shipping and returns are independent accordions', () => {
  assert.match(source, /shippingOpen/);
  assert.match(source, /returnsOpen/);
  assert.match(source, /aria-expanded=\{shippingOpen\}/);
  assert.match(source, /aria-expanded=\{returnsOpen\}/);
  assert.match(source, /setShippingOpen/);
  assert.match(source, /setReturnsOpen/);
});
