import assert from 'node:assert/strict';
import test from 'node:test';

import { orderItemImage } from '../src/admin/lib/orderItemImage.ts';

Object.defineProperty(globalThis, 'window', { value: { location: { origin: 'https://admin.example' } } });

const product = {
  id: 'product-1', name: 'Backpack', images: [
    { image: { url: 'https://cdn.example/black.webp', alt: 'Black backpack' }, color: { id: 'black' } },
    { image: { url: 'https://cdn.example/general.webp', alt: 'Backpack' }, color: null },
    { image: { url: 'https://cdn.example/red.webp', alt: 'Red backpack' }, color: { id: 'red' } },
  ],
} as never;

test('admin order item uses the photograph assigned to each purchased colour', () => {
  assert.match(orderItemImage({ product: { id: 'product-1' }, colorId: 'black' }, [product]).url ?? '', /black\.webp/);
  assert.match(orderItemImage({ product: 'product-1', colorId: 'red' }, [product]).url ?? '', /red\.webp/);
});

test('admin order item falls back to the general photograph', () => {
  assert.match(orderItemImage({ product: 'product-1', colorId: 'blue' }, [product]).url ?? '', /general\.webp/);
});
