import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeShopAssociations,
  productRelationshipId,
  productRelationshipKey,
} from '../src/admin/lib/instagramSpotlight.ts';

test('Instagram spotlight preserves numeric Payload relationship IDs', () => {
  const normalized = normalizeShopAssociations([{
    mediaId: '18107691940999148',
    permalink: 'https://www.instagram.com/p/DadvDfHjayc/',
    products: [{ id: 1 } as never],
    variantSelections: { '1': '7', stale: '8' },
  }]);

  assert.deepEqual(normalized, [{
    mediaId: '18107691940999148',
    permalink: 'https://www.instagram.com/p/DadvDfHjayc/',
    products: [1],
    variantSelections: { '1': '7' },
  }]);
});

test('relationship helpers compare IDs consistently without changing their API type', () => {
  assert.equal(productRelationshipId({ id: 12 } as never), 12);
  assert.equal(productRelationshipId('12'), '12');
  assert.equal(productRelationshipKey({ id: 12 } as never), '12');
});
