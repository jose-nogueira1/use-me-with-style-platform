import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { publicSizeGuideName, sizeGuideRows, usableSizeGuides } from '../src/lib/sizeGuide.ts';

const categories = [
  { id: 1, slug: 'leggings', namePT: 'Leggings', nameEN: 'Leggings' },
  { id: 2, slug: 'vestidos', namePT: 'Vestidos', nameEN: 'Dresses' },
];

test('internal guide suffixes stay private and category names are localized', () => {
  assert.equal(publicSizeGuideName('Vestidos — padrão', categories, 'en'), 'Dresses');
  assert.equal(publicSizeGuideName('Leggings — padrão', categories, 'pt'), 'Leggings');
  assert.equal(publicSizeGuideName('Macacões — novo guia', categories, 'en'), 'Macacões');
});

test('only populated guide rows become public charts', () => {
  const guides = [
    { id: 1, name: 'Leggings — padrão', rows: [{ size: 'S', waist: 66, hip: 90 }] },
    { id: 2, name: 'Empty', rows: [{ size: '  ' }] },
  ];
  assert.deepEqual(usableSizeGuides(guides), [guides[0]]);
  assert.deepEqual(sizeGuideRows(guides[0].rows), [{ size: 'S', waist: 66, hip: 90 }]);
});

test('size-guide route is linked and uses the shared product table', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');
  const product = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
  const table = readFileSync(new URL('../src/storefront/components/SizeGuideTable.tsx', import.meta.url), 'utf8');
  assert.match(app, /path="guia-de-tamanhos" element={<SizeGuide \/>}/);
  assert.match(footer, /to: '\/guia-de-tamanhos'/);
  assert.match(product, /<SizeGuideTable rows={product\.sizeGuide}/);
  assert.match(app, /\.ump-size-guide-table \{ table-layout: fixed; \}/);
  assert.match(table, /ump-size-guide-label-short/);
  assert.match(table, /aria-label={t\(columnLabel\[key\], lang\)}/);
});
