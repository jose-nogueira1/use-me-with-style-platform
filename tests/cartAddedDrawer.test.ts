import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productDetail = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const drawer = readFileSync(new URL('../src/storefront/components/CartAddedDrawer.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('adding a product opens a localized cart decision drawer with variant details', () => {
  assert.match(productDetail, /setAdded\(true\)/);
  assert.match(productDetail, /activeColorLabel/);
  assert.match(productDetail, /activeSize/);
  assert.match(drawer, /Adicionado ao carrinho/);
  assert.match(drawer, /Added to cart/);
  assert.match(drawer, /Ver carrinho e finalizar/);
  assert.match(drawer, /Continuar a comprar/);
});

test('the cart decision UI is modal, dismissible and responsive', () => {
  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /event\.key === 'Escape'/);
  assert.match(drawer, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(app, /align-items: flex-end/);
  assert.match(app, /justify-content: flex-end/);
});

test('the primary action hands the shopper off to the cart', () => {
  assert.match(productDetail, /navigate\('\/carrinho'\)/);
  assert.match(drawer, /onViewCart/);
});
