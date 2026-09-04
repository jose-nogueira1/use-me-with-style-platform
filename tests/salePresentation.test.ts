import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { saleDiscountLabel, saleDiscountPercent, saleUrgencyLabel } from '../src/lib/salePresentation.ts';

const cardSource = readFileSync(new URL('../src/storefront/components/ProductCard.tsx', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/storefront/StorefrontLayout.tsx', import.meta.url), 'utf8');
const browseSource = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8');

test('sale presentation creates a clear discount cue', () => {
  assert.equal(saleDiscountLabel(100, 80, 'pt'), '20% DESCONTO');
  assert.equal(saleDiscountLabel(100, 80, 'en'), '20% OFF');
  assert.equal(saleDiscountPercent(100, 80), 20);
});

test('sale urgency uses the end date without inventing a countdown', () => {
  const now = new Date('2026-09-04T12:00:00Z');
  assert.equal(saleUrgencyLabel('2026-09-07T12:00:00Z', 'en', now), 'Ends in 3 days');
  assert.equal(saleUrgencyLabel('2026-09-07T12:00:00Z', 'pt', now), 'Termina em 3 dias');
  assert.equal(saleUrgencyLabel(null, 'en', now), null);
});

test('sale cues and navbar link use the shared sale filter', () => {
  assert.match(cardSource, /\{saleLabel\}/);
  assert.match(cardSource, /saleUrgency/);
  assert.match(detailSource, /saleDiscountLabel/);
  assert.match(detailSource, /saleUrgency/);
  assert.match(layoutSource, /to: '\/catalogo\?sale=1'/);
  assert.match(layoutSource, /item\.to\.includes\('sale=1'\) \? C\.dangerStrong/);
  assert.match(browseSource, /searchParams\.get\('sale'\) === '1'/);
  assert.match(browseSource, /p\.set\('sale', '1'\)/);
});

test('sale and stock badges have deterministic image placement', () => {
  assert.match(cardSource, /product\.marketStatus === 'low_stock' \? 'ump-stock-image-badge-low' : undefined/);
  assert.match(cardSource, /product\.marketStatus === 'low_stock' && !saleLabel/);
  assert.match(cardSource, /top: 0,\n\s+right: 0/);
  assert.match(cardSource, /right: 0/);
});

test('sale cards use one priority badge and stronger price cues', () => {
  assert.match(cardSource, /saleLabel && product\.marketStatus !== 'sold_out'/);
  assert.match(cardSource, /product\.marketStatus === 'low_stock' && product\.onSale/);
  assert.match(cardSource, /product\.marketStatus === 'low_stock' && product\.onSale[\s\S]*Only \$\{product\.marketStock\} left/);
  assert.match(cardSource, /saleDiscountPercent/);
  assert.match(cardSource, /Clock/);
  assert.match(cardSource, /background: product\.onSale \? C\.dangerBg/);
  assert.doesNotMatch(cardSource, /className="ump-stock-mobile-badge"/);
  assert.match(cardSource, /display: 'inline-block'.*whiteSpace: 'nowrap'/);
});

test('sale cards use the ribbon treatment without the rejected glow', () => {
  assert.doesNotMatch(cardSource, /boxShadow: product\.onSale/);
  assert.match(cardSource, /transform: 'rotate\(45deg\)'/);
  assert.match(cardSource, /top: 20, right: -42/);
  assert.match(cardSource, /width: 160/);
  assert.match(cardSource, /fontSize: 10/);
  assert.match(cardSource, /aria-label=\{lang === 'pt' \? `Promoção: \$\{saleLabel\}` : `Sale: \$\{saleLabel\}`\}/);
  assert.match(cardSource, /\{saleLabel\}/);
});
