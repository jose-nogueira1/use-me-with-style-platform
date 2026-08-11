import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IMAGE_UPLOAD_POLICIES,
  imageOptimizationSummary,
  imageUploadGuidance,
  prepareImageUpload,
  validateImageUploadDimensions,
} from '../src/lib/imageUpload.ts';

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

test('oversized images are compressed before upload and report the improvement', async () => {
  const original = new File([new Uint8Array(3 * 1024 * 1024)], 'camera.jpg', { type: 'image/jpeg' });
  const optimized = new File([new Uint8Array(800 * 1024)], 'camera.webp', { type: 'image/webp' });
  const result = await prepareImageUpload(original, 'catalogue', 'en', {
    enabled: true,
    readWidth: async (file) => file === original ? 4000 : 1600,
    compress: async (_file, options) => {
      assert.equal(options.maxWidthOrHeight, 2000);
      assert.equal(options.fileType, 'image/webp');
      return optimized;
    },
  });
  assert.equal(result.file, optimized);
  assert.equal(result.optimized, true);
  assert.match(imageOptimizationSummary(result, 'en') ?? '', /3.0 MB.*800 KB/);
});

test('compliant files bypass compression entirely', async () => {
  const original = new File([new Uint8Array(200 * 1024)], 'ready.webp', { type: 'image/webp' });
  let compressed = false;
  const result = await prepareImageUpload(original, 'catalogue', 'en', {
    enabled: true,
    readWidth: async () => 1200,
    compress: async () => {
      compressed = true;
      return original;
    },
  });
  assert.equal(result.file, original);
  assert.equal(result.optimized, false);
  assert.equal(compressed, false);
});

test('the rollback flag restores strict rejection of oversized images', async () => {
  const original = new File([new Uint8Array(3 * 1024 * 1024)], 'camera.jpg', { type: 'image/jpeg' });
  await assert.rejects(
    prepareImageUpload(original, 'catalogue', 'en', { enabled: false, readWidth: async () => 4000 }),
    /limit is 2 MB/,
  );
});
