import assert from 'node:assert/strict';
import test from 'node:test';

import { IMAGE_UPLOAD_POLICIES, imageUploadGuidance, validateImageUploadDimensions } from '../src/lib/imageUpload.ts';

const image = (size: number) => ({ size, type: 'image/jpeg' });

test('catalogue images are limited to 2 MB and 2000px', () => {
  assert.throws(
    () => validateImageUploadDimensions(image(IMAGE_UPLOAD_POLICIES.catalogue.maxBytes + 1), 1000, 'catalogue', 'en'),
    /limit is 2 MB/,
  );
  assert.throws(() => validateImageUploadDimensions(image(1000), 2001, 'catalogue', 'en'), /maximum is 2000px/);
});

test('hero images allow 3 MB and 2560px', () => {
  assert.doesNotThrow(() => validateImageUploadDimensions(image(3 * 1024 * 1024), 2560, 'hero', 'en'));
});

test('brand assets are limited to 500 KB', () => {
  assert.throws(() => validateImageUploadDimensions(image(500 * 1024 + 1), 500, 'brand', 'pt'), /500 KB/);
});

test('upload guidance is localized and states both limits', () => {
  assert.match(imageUploadGuidance('hero', 'pt'), /3 MB/);
  assert.match(imageUploadGuidance('hero', 'pt'), /2560px/);
});
