import assert from 'node:assert/strict';
import test from 'node:test';

import { apexToMarketUrl, isMarketLockedByHostname, marketAlternateUrls, marketFromHostname, siblingMarketUrl } from '../src/lib/market.ts';

const page = {
  protocol: 'https:',
  port: '',
  pathname: '/catalogo/vestido',
  search: '?cor=azul',
  hash: '#tamanhos',
};

test('only AO and PT subdomains authoritatively select a market', () => {
  assert.equal(marketFromHostname('ao.usemewithstyle.shop'), 'AO');
  assert.equal(marketFromHostname('PT.usemewithstyle.shop'), 'PT');
  assert.equal(marketFromHostname('usemewithstyle.shop'), null);
  assert.equal(marketFromHostname('use-me-with-style-platform.vercel.app'), null);
  assert.equal(isMarketLockedByHostname('ao.usemewithstyle.shop'), true);
});

test('market switching preserves the complete route on the sibling domain', () => {
  assert.equal(
    siblingMarketUrl('PT', { hostname: 'ao.usemewithstyle.shop', ...page }),
    'https://pt.usemewithstyle.shop/catalogo/vestido?cor=azul#tamanhos',
  );
  assert.equal(siblingMarketUrl('AO', { hostname: 'usemewithstyle.shop', ...page }), null);
});

test('apex and www route to the selected market without creating ao.www', () => {
  assert.equal(
    apexToMarketUrl('AO', { hostname: 'usemewithstyle.shop', ...page }),
    'https://ao.usemewithstyle.shop/catalogo/vestido?cor=azul#tamanhos',
  );
  assert.equal(
    apexToMarketUrl('PT', { hostname: 'www.usemewithstyle.shop', ...page }),
    'https://pt.usemewithstyle.shop/catalogo/vestido?cor=azul#tamanhos',
  );
});

test('hreflang alternates link clean AO/PT equivalents plus the geo-routing apex', () => {
  assert.deepEqual(marketAlternateUrls({ hostname: 'ao.usemewithstyle.shop', ...page }), {
    'pt-AO': 'https://ao.usemewithstyle.shop/catalogo/vestido',
    'pt-PT': 'https://pt.usemewithstyle.shop/catalogo/vestido',
    'x-default': 'https://usemewithstyle.shop/catalogo/vestido',
  });
  assert.deepEqual(marketAlternateUrls({ hostname: 'pt.usemewithstyle.shop', ...page }), {
    'pt-AO': 'https://ao.usemewithstyle.shop/catalogo/vestido',
    'pt-PT': 'https://pt.usemewithstyle.shop/catalogo/vestido',
    'x-default': 'https://usemewithstyle.shop/catalogo/vestido',
  });
  assert.equal(marketAlternateUrls({ hostname: 'usemewithstyle.shop', ...page }), null);
  assert.deepEqual(marketAlternateUrls({
    hostname: 'ao.usemewithstyle.shop',
    ...page,
    pathname: '/catalogo',
    search: '?cat=leggings&sort=price-asc',
  }), {
    'pt-AO': 'https://ao.usemewithstyle.shop/catalogo?cat=leggings',
    'pt-PT': 'https://pt.usemewithstyle.shop/catalogo?cat=leggings',
    'x-default': 'https://usemewithstyle.shop/catalogo?cat=leggings',
  });
});
