import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildMediaUsageIndex } from '../src/admin/mediaUsage.ts';
import type { ApiCategory, ApiColor, ApiProduct, HomeHero } from '../src/lib/api.ts';

test('media usage index covers product, category, colour and both hero assignments', () => {
  const products = [{ id: 7, name: 'Dress', slug: 'dress', category: 1, variants: [], active: true, priceAOKz: 1, pricePTEur: 1, shippingWeightGrams: 1, images: [{ image: 10 }] }] as ApiProduct[];
  const categories = [{ id: 2, namePT: 'Vestidos', image: 10 }] as ApiCategory[];
  const colours = [{ id: 3, namePT: 'Padrão', swatch: 10 }] as ApiColor[];
  const hero = { heroImage: 10, heroImageMobile: 10 } as HomeHero;

  const usages = buildMediaUsageIndex(products, categories, colours, hero, 'en').get('10') ?? [];
  assert.deepEqual(usages.map((usage) => usage.kind), ['product', 'category', 'colour', 'hero', 'hero']);
  assert.equal(new Set(usages.map((usage) => usage.key)).size, 5);
  assert.ok(usages.every((usage) => usage.href.startsWith('/admin/')));
});

test('colour swatches use staged square cropping and an explicit save', () => {
  const source = readFileSync(new URL('../src/admin/pages/ProductSettings.tsx', import.meta.url), 'utf8');
  assert.match(source, /aspect=\{1\}/);
  assert.match(source, /outputWidth=\{800\}/);
  assert.match(source, /outputSuffix="swatch"/);
  assert.match(source, /saveSwatch/);
  assert.match(source, /pendingForColour\.file/);
});

test('deferred Media Library phases remain documented in code', () => {
  const source = readFileSync(new URL('../src/admin/mediaUsage.ts', import.meta.url), 'utf8');
  assert.match(source, /existing-media picker/i);
  assert.match(source, /checksum/i);
  assert.match(source, /purpose-specific crop/i);
  assert.match(source, /perceptual-hash/i);
});
