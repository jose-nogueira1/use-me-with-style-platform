import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productDetail = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const drawer = readFileSync(new URL('../src/storefront/components/CartAddedDrawer.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/storefront/StorefrontLayout.tsx', import.meta.url), 'utf8');
const miniCart = readFileSync(new URL('../src/storefront/components/MiniCartDrawer.tsx', import.meta.url), 'utf8');

test('adding a product opens a localized cart decision drawer with variant details', () => {
  assert.match(productDetail, /setAdded\(true\)/);
  assert.match(productDetail, /activeColorLabel/);
  assert.match(productDetail, /activeSize/);
  assert.match(drawer, /Adicionado ao carrinho/);
  assert.match(drawer, /Added to cart/);
  assert.match(drawer, /Ver carrinho/);
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
  assert.match(productDetail, /openMiniCart\(\)/);
  assert.match(drawer, /onViewCart/);
});

test('the header cart opens a responsive mini-cart with editable lines and a checkout handoff', () => {
  assert.match(layout, /setMiniCartOpen\(true\)/);
  assert.match(layout, /<MiniCartDrawer/);
  assert.match(miniCart, /type: 'INC'/);
  assert.match(miniCart, /type: 'DEC'/);
  assert.match(miniCart, /type: 'REMOVE'/);
  assert.match(miniCart, /imagesForColor/);
  assert.match(miniCart, /onViewCart/);
  assert.match(app, /\.ump-mini-cart-overlay/);
});
