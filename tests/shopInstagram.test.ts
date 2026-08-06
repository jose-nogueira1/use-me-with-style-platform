import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');
const feedSource = readFileSync(new URL('../src/storefront/components/InstagramFeed.tsx', import.meta.url), 'utf8');
const shopPageSource = readFileSync(new URL('../src/storefront/pages/ShopInstagram.tsx', import.meta.url), 'utf8');
const productCardSource = readFileSync(new URL('../src/storefront/components/InstagramProductCard.tsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('Instagram feed requests are market-aware and expose resolved catalogue facts', () => {
  assert.match(apiSource, /instagram-feed\?limit=\$\{limit\}&market=\$\{market\}/);
  assert.match(apiSource, /availableSizes: string\[\]/);
  assert.match(apiSource, /selectedColorId: string \| null/);
  assert.match(apiSource, /regularPrice: number/);
});

test('Instagram feed settings manage up to four products and exact colours per post', () => {
  assert.match(settingsSource, /Products in this look|Produtos neste look/);
  assert.match(settingsSource, /up to four products|máximo quatro produtos/);
  assert.match(settingsSource, /variantSelections/);
  assert.match(settingsSource, /selectColour/);
  assert.match(settingsSource, /adminListProducts/);
});

test('homepage and dedicated page render shoppable product cards', () => {
  assert.match(feedSource, /InstagramProductCard/);
  assert.match(feedSource, /ShopTheLookOpen/);
  assert.match(feedSource, /to="\/shop-instagram"/);
  assert.match(shopPageSource, /Shop Instagram/);
  assert.match(shopPageSource, /shop-instagram\/\$\{encodeURIComponent\(post.lookSlug\)\}/);
  assert.match(productCardSource, /ShopTheLookProductClick/);
  assert.match(productCardSource, /Sold out — view similar/);
});

test('shop look routes are public and exact colours preselect on product pages', () => {
  assert.match(appSource, /path="shop-instagram"/);
  assert.match(appSource, /path="shop-instagram\/:lookSlug"/);
  assert.match(productDetailSource, /searchParams\.get\('cor'\)/);
  assert.match(productDetailSource, /candidate\.id === requestedColor/);
});
