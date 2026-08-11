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
});

test('storefront uses mobile art direction and retains the desktop composition', () => {
  const home = read('../src/storefront/pages/Home.tsx');
  const app = read('../src/App.tsx');
  assert.match(home, /heroImageMobile/);
  assert.match(home, /source media="\(max-width: 859px\)"/);
  assert.match(home, /ump-hero-shade/);
  assert.match(app, /grid-template-columns: \.9fr 1\.15fr/);
  assert.match(app, /min-height: min\(76svh, 680px\)/);
});
