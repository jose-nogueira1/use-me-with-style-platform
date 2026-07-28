import assert from 'node:assert/strict';
import test from 'node:test';

import { apexToMarketUrl, isMarketLockedByHostname, marketFromHostname, siblingMarketUrl } from '../src/lib/market.ts';

const page = {
  protocol: 'https:',
  port: '',
  pathname: '/catalogo/vestido',
  search: '?cor=azul',
  hash: '#tamanhos',
};

test('only AO and PT subdomains authoritatively select a market', () => {
  assert.equal(marketFromHostname('ao.usemewithstyle.com'), 'AO');
  assert.equal(marketFromHostname('PT.usemewithstyle.com'), 'PT');
  assert.equal(marketFromHostname('usemewithstyle.com'), null);
  assert.equal(marketFromHostname('use-me-with-style-platform.vercel.app'), null);
  assert.equal(isMarketLockedByHostname('ao.usemewithstyle.com'), true);
});

test('market switching preserves the complete route on the sibling domain', () => {
  assert.equal(
    siblingMarketUrl('PT', { hostname: 'ao.usemewithstyle.com', ...page }),
    'https://pt.usemewithstyle.com/catalogo/vestido?cor=azul#tamanhos',
  );
  assert.equal(siblingMarketUrl('AO', { hostname: 'usemewithstyle.com', ...page }), null);
});

test('apex and www route to the selected market without creating ao.www', () => {
  assert.equal(
    apexToMarketUrl('AO', { hostname: 'usemewithstyle.com', ...page }),
    'https://ao.usemewithstyle.com/catalogo/vestido?cor=azul#tamanhos',
  );
  assert.equal(
    apexToMarketUrl('PT', { hostname: 'www.usemewithstyle.com', ...page }),
    'https://pt.usemewithstyle.com/catalogo/vestido?cor=azul#tamanhos',
  );
});
