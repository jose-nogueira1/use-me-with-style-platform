import assert from 'node:assert/strict';
import test from 'node:test';

import geoMarketRedirect from '../middleware.ts';

test('the apex geo redirect preserves path and query for Angola', () => {
  const response = geoMarketRedirect(new Request('https://usemewithstyle.shop/catalogo?cat=leggings', {
    headers: { 'x-vercel-ip-country': 'AO' },
  }));
  assert.ok(response);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://ao.usemewithstyle.shop/catalogo?cat=leggings');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
  assert.equal(response.headers.get('vary'), 'x-vercel-ip-country');
});

test('the apex defaults to Portugal and leaves market storefronts untouched', () => {
  const response = geoMarketRedirect(new Request('https://www.usemewithstyle.shop/produto/vestido-teste'));
  assert.ok(response);
  assert.equal(response.headers.get('location'), 'https://pt.usemewithstyle.shop/produto/vestido-teste');
  assert.equal(geoMarketRedirect(new Request('https://ao.usemewithstyle.shop/')), undefined);
});
