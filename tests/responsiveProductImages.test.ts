import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('product uploads use a staged 3:4 crop workflow and save through the product action', () => {
  const editor = read('../src/admin/pages/ProductEditor.tsx');
  assert.match(editor, /aspect=\{3 \/ 4\}/);
  assert.match(editor, /outputWidth=\{1600\}/);
  assert.match(editor, /multiple hidden/);
  assert.match(editor, /pendingImages\.length > 0/);
  assert.match(editor, /Click Save changes to publish/);
});

test('product photography exposes generated responsive sources to the browser', () => {
  const photo = read('../src/components/ProductPhoto.tsx');
  const adapter = read('../src/lib/productAdapters.ts');
  assert.match(photo, /srcSet=\{srcSet \|\| undefined\}/);
  assert.match(photo, /image\?\.mediumUrl, 960/);
  assert.match(photo, /image\?\.largeUrl, 1600/);
  assert.match(adapter, /mediumUrl: absoluteMediaUrl/);
  assert.match(adapter, /largeUrl: absoluteMediaUrl/);
});
