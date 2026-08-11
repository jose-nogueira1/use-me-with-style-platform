import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('category images use a staged 3:4 crop and explicit image save', () => {
  const settings = read('../src/admin/pages/ProductSettings.tsx');
  assert.match(settings, /aspect=\{3 \/ 4\}/);
  assert.match(settings, /outputWidth=\{1200\}/);
  assert.match(settings, /outputSuffix="category"/);
  assert.match(settings, /Save image/);
  assert.match(settings, /pendingForEntry\.file/);
  assert.match(settings, /categoryImagesCalloutTitle/);
  assert.match(settings, /categoryImagesCalloutBody/);
});

test('media upload guidance is separated from the page header', () => {
  const media = read('../src/admin/pages/Media.tsx');
  assert.match(media, /margin: '14px 28px 0'/);
  assert.doesNotMatch(media, /margin: '-8px 28px 0'/);
});

test('category tiles retain responsive 480 and 960 pixel sources', () => {
  const home = read('../src/storefront/pages/Home.tsx');
  assert.match(home, /categoryImage\?\.sizes\?\.small\?\.url, 480/);
  assert.match(home, /categoryImage\?\.sizes\?\.medium\?\.url, 960/);
  assert.match(home, /sizes="\(max-width: 640px\) 70vw, 280px"/);
});
