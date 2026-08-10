import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildBreadcrumbStructuredData } from '../src/lib/breadcrumbStructuredData.ts';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('BreadcrumbList uses ordered localized names and absolute market URLs', () => {
  const data = buildBreadcrumbStructuredData('https://ao.usemewithstyle.shop/', [
    { name: 'Início', path: '/' },
    { name: 'Catálogo', path: '/catalogo' },
    { name: 'Leggings', path: '/catalogo?cat=leggings' },
  ]);

  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'BreadcrumbList');
  assert.deepEqual(data.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://ao.usemewithstyle.shop/' },
    { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://ao.usemewithstyle.shop/catalogo' },
    { '@type': 'ListItem', position: 3, name: 'Leggings', item: 'https://ao.usemewithstyle.shop/catalogo?cat=leggings' },
  ]);
});

test('all crawlable page families emit BreadcrumbList structured data', () => {
  assert.match(projectFile('src/storefront/StorefrontLayout.tsx'), /STATIC_BREADCRUMB_LABELS/);
  for (const file of ['Browse.tsx', 'ProductDetail.tsx', 'StyleGuide.tsx', 'StyleArticle.tsx', 'ShopInstagram.tsx']) {
    assert.match(projectFile(`src/storefront/pages/${file}`), /<BreadcrumbJsonLd/);
  }
});
