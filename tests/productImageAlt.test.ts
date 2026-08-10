import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProductImageAlt } from '../src/lib/productImageAlt.ts';

test('product image fallback includes product, colour, type and brand', () => {
  assert.equal(
    buildProductImageAlt({ productName: 'Vestido Teste', colorName: 'Preto', productType: 'Vestidos' }),
    'Vestido Teste Preto Vestidos — Use Me With Style',
  );
});

test('product image fallback ignores missing details but is never empty', () => {
  assert.equal(
    buildProductImageAlt({ productName: 'Mochila Desportiva', colorName: '  ', productType: null }),
    'Mochila Desportiva — Use Me With Style',
  );
  assert.equal(buildProductImageAlt({}), 'Produto — Use Me With Style');
});
