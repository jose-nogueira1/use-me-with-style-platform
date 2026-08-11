import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('hero admin stages independent desktop and mobile crops behind Save', () => {
  const settings = read('../src/admin/pages/Settings.tsx');
  assert.match(settings, /cropStage.*'desktop'.*'mobile'/s);
  assert.match(settings, /pendingMobileImage/);
  assert.match(settings, /heroImageMobile: heroImageMobileId/);
  assert.match(settings, /1 de 2 — Ajustar desktop/);
  assert.match(settings, /2 de 2 — Ajustar mobile/);
  assert.match(settings, /key=\{cropStage\}/);
});

test('storefront uses mobile art direction and retains the desktop composition', () => {
  const home = read('../src/storefront/pages/Home.tsx');
  const app = read('../src/App.tsx');
  assert.match(home, /heroImageMobile/);
  assert.match(home, /source media="\(max-width: 859px\)"/);
  assert.match(home, /loading="eager"/);
  assert.match(home, /fetchPriority="high"/);
  assert.match(home, /width=\{1600\}/);
  assert.match(home, /height=\{1067\}/);
  assert.match(home, /ump-hero-shade/);
  assert.match(app, /grid-template-columns: \.9fr 1\.15fr/);
  assert.match(app, /aspect-ratio: 3 \/ 2/);
  assert.match(app, /min-height: min\(76svh, 680px\)/);
});

test('crop editor remains usable for a tall mobile crop on a desktop viewport', () => {
  const modal = read('../src/admin/components/ImageCropModal.tsx');
  assert.match(modal, /maxHeight: 'calc\(100dvh - 32px\)'/);
  assert.match(modal, /aspect < 1 \? 'min\(58dvh, 520px\)'/);
  assert.doesNotMatch(modal, /aspectRatio: String\(aspect\)/);
});
