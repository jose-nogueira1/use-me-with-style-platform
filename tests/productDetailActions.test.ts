import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('product detail keeps mobile actions sticky and places desktop actions below shipping', () => {
  assert.match(source, /className="ump-pd-desktop-actions"/);
  assert.match(source, /className="[^"]*ump-pd-mobile-actions/);
  assert.match(source, /className="ump-product-info"/);

  const shippingEnd = source.indexOf('product-returns-details');
  const desktopActions = source.indexOf('ump-pd-desktop-actions');
  assert.ok(shippingEnd >= 0, 'shipping and returns section should exist');
  assert.ok(desktopActions > shippingEnd, 'desktop actions should follow shipping and returns');

  assert.match(styles, /\.ump-pd-desktop-actions[\s\S]*display: none/);
  assert.match(styles, /@media \(min-width: 720px\)[\s\S]*\.ump-pd-desktop-actions[\s\S]*display: flex/);
  assert.match(styles, /@media \(min-width: 720px\)[\s\S]*\.ump-pd-mobile-actions[\s\S]*display: none/);
  assert.match(styles, /@media \(min-width: 720px\)[\s\S]*\.ump-product-info[\s\S]*flex-direction: column/);
  assert.match(styles, /@media \(min-width: 720px\)[\s\S]*\.ump-product-info[\s\S]*padding-bottom: 0 !important/);
  assert.match(styles, /\.ump-pd-desktop-actions[\s\S]*margin-top: auto/);
});
