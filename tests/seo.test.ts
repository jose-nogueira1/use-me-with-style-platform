import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { canonicalUrl, routeSeoMetadata, SITE_TITLE } from '../src/lib/seoMetadata.ts';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('every storefront route receives dedicated localized metadata', () => {
  const paths = [
    '/',
    '/catalogo',
    '/produto/example-product',
    '/carrinho',
    '/checkout',
    '/encomenda-confirmada/UMP-123',
    '/conta',
    '/ajuda',
    '/sobre',
    '/shop-instagram',
    '/shop-instagram/example-look',
    '/politica-privacidade',
    '/termos-condicoes',
    '/eliminacao-de-dados',
    '/missing-page',
  ];

  for (const path of paths) {
    for (const lang of ['pt', 'en'] as const) {
      const metadata = routeSeoMetadata(path, lang);
      assert.ok(metadata.title.includes(SITE_TITLE), `${path} (${lang}) should include the brand in its title`);
      assert.ok(metadata.description.length >= 40, `${path} (${lang}) should have a useful description`);
      assert.ok(metadata.description.length <= 160, `${path} (${lang}) description should fit search snippets`);
    }
  }

  assert.notEqual(routeSeoMetadata('/carrinho', 'pt').title, routeSeoMetadata('/checkout', 'pt').title);
  assert.notEqual(routeSeoMetadata('/ajuda', 'en').title, routeSeoMetadata('/sobre', 'en').title);
  assert.match(routeSeoMetadata('/missing-page', 'pt').title, /não encontrada/i);
});

test('crawler-visible HTML contains complete branded social metadata', () => {
  const html = projectFile('index.html');
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<meta property="og:title" content="[^"]+"/);
  assert.match(html, /<meta property="og:description" content="[^"]+"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /<meta name="twitter:title" content="[^"]+"/);
  assert.match(html, /<meta name="twitter:description" content="[^"]+"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/[^"]+"/);
});

test('canonical URLs use the active market origin and a clean route path', () => {
  assert.equal(canonicalUrl('https://ao.usemewithstyle.shop', '/'), 'https://ao.usemewithstyle.shop/');
  assert.equal(canonicalUrl('https://pt.usemewithstyle.shop/', '/catalogo/'), 'https://pt.usemewithstyle.shop/catalogo');
  assert.equal(
    canonicalUrl('https://ao.usemewithstyle.shop', '/catalogo?cat=leggings&sort=price-asc'),
    'https://ao.usemewithstyle.shop/catalogo',
  );
  assert.equal(
    canonicalUrl('https://ao.usemewithstyle.shop', '/produto/vestido-move/'),
    'https://ao.usemewithstyle.shop/produto/vestido-move',
  );
});

test('the canonical implementation excludes query filters and keeps og:url aligned', () => {
  const source = projectFile('src/lib/seo.ts');
  const layout = projectFile('src/storefront/StorefrontLayout.tsx');
  assert.match(source, /canonicalUrl\(origin, pathname\)/);
  assert.match(source, /ensureCanonical\(canonical\)/);
  assert.match(source, /ensureMeta\('property', 'og:url', canonical\)/);
  assert.match(layout, /useSeoDefaults\(lang, location\.pathname, location\.search\)/);
});

test('page-specific SEO reruns after pathname and query-string navigation', () => {
  const source = projectFile('src/lib/seo.ts');
  assert.match(source, /location\.pathname, location\.search/);
  assert.match(source, /\[title, description, image, location\.pathname, location\.search\]/);
});

test('the document language follows the stored storefront language', () => {
  const html = projectFile('index.html');
  const context = projectFile('src/state/AppContext.tsx');
  assert.match(html, /<html lang="pt">/);
  assert.match(context, /document\.documentElement\.lang = lang/);
  assert.match(context, /\}, \[lang\]\)/);
});
