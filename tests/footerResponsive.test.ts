import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const footerSource = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('footer uses a mobile two-column grid, tablet brand-plus-two-by-two layout, and wide desktop columns', () => {
  assert.match(footerSource, /className="ump-footer-links-grid"/);
  assert.match(footerSource, /Shipping, returns & prices/);
  assert.match(layoutSource, /\.ump-footer-links-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(layoutSource, /@media \(min-width: 720px\)[\s\S]*\.ump-footer-grid \{ display: grid; grid-template-columns: 1fr 2fr/);
  assert.match(layoutSource, /@media \(min-width: 720px\)[\s\S]*\.ump-footer-links-grid \{ grid-template-columns: repeat\(2, 1fr\)/);
  assert.match(layoutSource, /@media \(min-width: 1400px\)[\s\S]*\.ump-footer-grid \{[\s\S]*grid-template-columns: 1\.3fr 4fr/);
  assert.match(layoutSource, /@media \(min-width: 1400px\)[\s\S]*\.ump-footer-links-grid \{ grid-template-columns: repeat\(4, 1fr\)/);
  assert.match(layoutSource, /@media \(min-width: 1400px\)[\s\S]*\.ump-footer-grid \{ max-width: none; margin: 0; padding-left: 32px; padding-right: 32px/);
});
