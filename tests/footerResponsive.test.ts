import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const footerSource = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('mobile footer uses a two-column link grid while desktop keeps three link columns', () => {
  assert.match(footerSource, /className="ump-footer-links-grid"/);
  assert.match(footerSource, /Shipping, returns & prices/);
  assert.match(layoutSource, /\.ump-footer-links-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(layoutSource, /@media \(min-width: 720px\)[\s\S]*\.ump-footer-links-grid \{ grid-template-columns: repeat\(3, 1fr\)/);
});
