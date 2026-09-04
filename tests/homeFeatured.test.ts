import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const homeSource = readFileSync(new URL('../src/storefront/pages/Home.tsx', import.meta.url), 'utf8');
const browseSource = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');

test('homepage featured products are curated per market in admin order', () => {
  assert.match(homeSource, /featuredProductsForMarket/);
  assert.match(homeSource, /featuredProductsAO/);
  assert.match(homeSource, /featuredProductsPT/);
  assert.match(homeSource, /featuredShelf/);
});

test('storefront admin exposes featured product selection and ordering controls', () => {
  assert.match(settingsSource, /Featured products/);
  assert.match(settingsSource, /featuredProductsAO/);
  assert.match(settingsSource, /featuredProductsPT/);
  assert.match(settingsSource, /Move up/);
  assert.match(settingsSource, /Move down/);
});

test('home collections API shape carries market-specific featured selections', () => {
  assert.match(apiSource, /featuredProductsAO/);
  assert.match(apiSource, /featuredProductsPT/);
});

test('featured product relationships serialize numeric CMS ids as numbers', () => {
  assert.match(apiSource, /export function normalizeRelationshipIds/);
  assert.match(apiSource, /Number\(id\)/);
  assert.match(settingsSource, /normalizeRelationshipIds/);
});

test('featured product picker resolves labels for numeric selected ids', () => {
  assert.match(settingsSource, /String\(item\.id\) === String\(id\)/);
});

test('featured product picker hides products already selected', () => {
  assert.match(settingsSource, /!selectedIds\.includes\(normalizeRelationshipIds\(\[product\.id\]\)\[0\]\)/);
});

test('homepage shelf view-all links preserve their catalogue filters', () => {
  assert.match(homeSource, /to="\/catalogo\?featured=1"/);
  assert.match(homeSource, /to="\/catalogo\?cat=new"/);
  assert.match(homeSource, /to=\{`\/catalogo\?tag=\$\{encodeURIComponent\(shelf\.tagSlug\)\}`\}/);
  assert.match(browseSource, /searchParams\.get\('featured'\)/);
  assert.match(browseSource, /featuredProductsForMarket/);
});
