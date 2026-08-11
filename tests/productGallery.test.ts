import assert from 'node:assert/strict';
import test from 'node:test';
import { imagesForColor } from '../src/lib/productGallery.ts';
import type { ProductImage } from '../src/types/product.ts';

const images: ProductImage[] = [
  { url: 'general.webp', alt: 'General photo' },
  { url: 'black.webp', alt: 'Black photo', colorId: 'black' },
  { url: 'red.webp', alt: 'Red photo', colorId: 'red' },
];

test('general product photos appear alongside every selected colour', () => {
  assert.deepEqual(imagesForColor(images, 'black').map((image) => image.url), ['general.webp', 'black.webp']);
  assert.deepEqual(imagesForColor(images, 'red').map((image) => image.url), ['general.webp', 'red.webp']);
});

test('gallery filtering preserves admin order and has a stale-data fallback', () => {
  assert.deepEqual(imagesForColor(images, 'blue').map((image) => image.url), ['general.webp']);
  const taggedOnly = images.filter((image) => image.colorId);
  assert.equal(imagesForColor(taggedOnly, 'blue'), taggedOnly);
});
