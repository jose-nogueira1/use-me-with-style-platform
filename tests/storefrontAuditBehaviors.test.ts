import assert from 'node:assert/strict';
import test from 'node:test';

import { cartItemImage } from '../src/lib/cartPresentation.ts';
import { usableProductImageAlt, verifiedProductType } from '../src/lib/productImageAlt.ts';
import { normalizeLocalizedProductName } from '../src/lib/productCopy.ts';
import { formatMoney } from '../src/theme/i18n.ts';
import { otherMarketCartSummary } from '../src/lib/marketCart.ts';
import { wrappedDialogFocusIndex } from '../src/lib/dialogFocus.ts';

test('cart imagery follows the stable variant colour after navigation or reload', () => {
  const product = {
    images: [
      { url: 'nude.webp', alt: 'Bloom & Pearl Nude', colorId: 'nude' },
      { url: 'pink.webp', alt: 'Bloom & Pearl Rosa', colorId: 'pink' },
    ],
    variants: [
      { id: 'nude-s', color: 'nude', optionValue: 'S', stock: 2 },
      { id: 'pink-s', color: 'pink', optionValue: 'S', stock: 2 },
    ],
  };

  assert.equal(cartItemImage(product, { id: 'bloom', variantId: 'pink-s', size: 'S', color: 'pink', qty: 1 })?.url, 'pink.webp');
  assert.equal(cartItemImage(product, { id: 'bloom', size: 'S', color: 'pink', qty: 1 })?.url, 'pink.webp');
});

test('money formatting includes the active market currency in each locale', () => {
  assert.equal(formatMoney(29_592, 'AO', 'pt'), '29\u00a0592\u00a0Kz');
  assert.equal(formatMoney(29_592, 'AO', 'en'), 'Kz\u00a029,592');
  assert.equal(formatMoney(42.5, 'PT', 'pt'), '42,50\u00a0€');
  assert.equal(formatMoney(42.5, 'PT', 'en'), '€42.50');
});

test('the other market cart summary is isolated and identifies the retained store', () => {
  const storage = new Map<string, string>([
    ['ump-cart-v1:AO', JSON.stringify([{ id: 'dress', variantId: 'pink-s', size: 'S', color: 'pink', qty: 2 }])],
    ['ump-cart-v1:PT', '[]'],
  ]);
  const fakeStorage = { getItem: (key: string) => storage.get(key) ?? null };

  assert.deepEqual(otherMarketCartSummary(fakeStorage, 'PT'), { market: 'AO', itemCount: 2 });
  assert.deepEqual(otherMarketCartSummary(fakeStorage, 'AO'), { market: 'PT', itemCount: 0 });
});

test('dialog focus wraps at both edges for Tab and Shift+Tab', () => {
  assert.equal(wrappedDialogFocusIndex(2, 3, false), 0);
  assert.equal(wrappedDialogFocusIndex(0, 3, true), 2);
  assert.equal(wrappedDialogFocusIndex(1, 3, false), null);
  assert.equal(wrappedDialogFocusIndex(0, 0, false), -1);
});

test('technical and contradictory product image descriptions use localized structured metadata', () => {
  const fallback = { productName: 'Conjunto Fresh Fit', colorName: 'Branco', productType: 'Conjuntos' };
  assert.equal(usableProductImageAlt('blob:https://cms.invalid/abc', fallback), 'Conjunto Fresh Fit Branco Conjuntos — Use Me With Style');
  assert.equal(usableProductImageAlt('Fresh Fit Set Sets — Use Me With Style', fallback), 'Conjunto Fresh Fit Branco Conjuntos — Use Me With Style');
});

test('reviewed Active Court and Aura records override incorrect CMS categories in image text', () => {
  const activeCourtType = verifiedProductType(31, 'pt', 'Conjuntos');
  const auraType = verifiedProductType(25, 'en', 'Dresses');

  assert.equal(activeCourtType, 'Vestidos');
  assert.equal(auraType, 'Sets');
  assert.equal(
    usableProductImageAlt('Vestido Active Court Conjuntos — Use Me With Style', {
      productName: 'Vestido Active Court', colorName: 'Vermelho', productType: activeCourtType,
    }),
    'Vestido Active Court Vermelho Vestidos — Use Me With Style',
  );
  assert.equal(
    usableProductImageAlt('Aura Dress Dresses — Use Me With Style', {
      productName: 'Aura Set', colorName: 'Pink', productType: auraType,
    }),
    'Aura Set Pink Sets — Use Me With Style',
  );
});

test('documented Fresh Fit typo is corrected at the storefront boundary', () => {
  assert.equal(normalizeLocalizedProductName('Freash Fit Set'), 'Fresh Fit Set');
});
