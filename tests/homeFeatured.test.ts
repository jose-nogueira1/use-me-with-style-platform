import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const homeSource = readFileSync(new URL('../src/storefront/pages/Home.tsx', import.meta.url), 'utf8');
const browseSource = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');

test('featured uses the same merchandising-tag shelf flow as other homepage collections', () => {
  assert.match(homeSource, /customCollections/);
  assert.match(homeSource, /shelf\.tagSlug/);
  assert.doesNotMatch(homeSource, /to="\/catalogo\?featured=1"/);
});

test('storefront admin keeps the featured picker available only as commented future logic', () => {
  assert.match(settingsSource, /Future featured product picker/);
  assert.match(settingsSource, /featuredProductsAO/);
  assert.match(settingsSource, /featuredProductsPT/);
});

test('home collections API shape retains the previous featured selection fields for future reuse', () => {
  assert.match(apiSource, /featuredProductsAO/);
  assert.match(apiSource, /featuredProductsPT/);
});

test('previous featured product relationship helpers remain available for future reuse', () => {
  assert.match(apiSource, /export function normalizeRelationshipIds/);
  assert.match(apiSource, /Number\(id\)/);
  assert.match(settingsSource, /normalizeRelationshipIds/);
});

test('previous featured product picker still resolves labels for numeric selected ids', () => {
  assert.match(settingsSource, /String\(item\.id\) === String\(id\)/);
});

test('previous featured product picker still hides products already selected', () => {
  assert.match(settingsSource, /!selectedIds\.includes\(normalizeRelationshipIds\(\[product\.id\]\)\[0\]\)/);
});

test('homepage shelf view-all links preserve their catalogue filters', () => {
  assert.match(homeSource, /to="\/catalogo\?cat=new"/);
  assert.match(homeSource, /to=\{`\/catalogo\?tag=\$\{encodeURIComponent\(shelf\.tagSlug\)\}`\}/);
  assert.match(browseSource, /searchParams\.get\('tag'\)/);
});

test('featured no longer needs a separate catalogue loading path', () => {
  assert.doesNotMatch(browseSource, /activeFeatured/);
  assert.doesNotMatch(browseSource, /homeCollectionsLoading/);
});

test('catalogue tag labels follow the URL immediately without stale state flicker', () => {
  assert.match(browseSource, /const activeTag = urlTag;/);
  assert.doesNotMatch(browseSource, /const \[activeTag, setActiveTag\]/);
});
