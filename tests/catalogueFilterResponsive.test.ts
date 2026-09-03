import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const browseSource = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('catalogue filters use a dense two-column desktop layout and horizontal mobile chip tracks', () => {
  assert.match(browseSource, /className="ump-browse-filter-grid"/);
  assert.match(browseSource, /className="ump-browse-active-filters"/);
  assert.match(browseSource, /ump-filter-options/);
  assert.match(browseSource, /className="ump-filter-full"/);
  assert.match(browseSource, /className="ump-filter-half"/);
  assert.match(browseSource, /className="ump-sort-options"/);
  assert.match(browseSource, /collapsibleDesktop/);
  assert.match(browseSource, /label=\{t\('category', lang\)\}[\s\S]*collapsibleDesktop/);
  assert.match(browseSource, /const canCollapse = collapsibleDesktop \? options\.length > 3/);
  assert.doesNotMatch(browseSource, /label=\{t\('size', lang\)\}[^\n]*collapsibleDesktop/);
  assert.doesNotMatch(browseSource, /label=\{t\('productType', lang\)\}[^\n]*collapsibleDesktop/);
  assert.match(browseSource, /ump-filter-options-collapsed/);
  assert.doesNotMatch(browseSource, /maxHeight: canCollapse && !expanded \? 174 : undefined/);
  assert.match(appSource, /\.ump-filter-options-collapsed[\s\S]*max-height:\s*102px/);
  assert.doesNotMatch(browseSource, /label=\{t\('colour', lang\)\}[^\n]*collapsible(?!Desktop)/);
  assert.match(appSource, /\.ump-browse-filter-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.match(appSource, /\.ump-filter-options\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(appSource, /\.ump-browse-active-filters\s*\{[\s\S]*overflow-x:\s*auto/);
});

test('sidebar category filters omit the redundant all option while top navigation keeps it', () => {
  assert.match(browseSource, /ump-browse-catpills[\s\S]*cats\.map/);
  assert.match(browseSource, /label=\{t\('category', lang\)\}[\s\S]*options=\{cats\.filter\(\(c\) => c\.key !== 'all'\)\.map/);
});
