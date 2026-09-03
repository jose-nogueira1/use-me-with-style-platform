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

test('catalogue filter drawer is opened from the search row and replaces the lower trigger', () => {
  assert.match(browseSource, /className="ump-browse-filter-trigger"/);
  assert.match(browseSource, /className="ump-filter-drawer-backdrop"/);
  assert.match(browseSource, /className="ump-filter-drawer(?:\s|"|')/);
  assert.doesNotMatch(browseSource, /className="ump-browse-filter-toggle"[\s\S]*t\('filters', lang\)/);
  assert.match(appSource, /\.ump-filter-drawer\s*\{[\s\S]*position:\s*fixed/);
  assert.match(appSource, /\.ump-filter-drawer-backdrop\s*\{[\s\S]*position:\s*fixed/);
});

test('catalogue filter drawer applies filters and only expands groups that exceed three rows', () => {
  assert.match(browseSource, /Apply Filters/);
  assert.match(browseSource, /scrollHeight\s*>\s*102/);
  assert.match(browseSource, /hasMore/);
});

test('catalogue filters use a bottom sheet on mobile and a side drawer on desktop', () => {
  assert.match(browseSource, /className="ump-filter-drawer-handle"/);
  assert.match(appSource, /@media \(max-width: 719px\)[\s\S]*\.ump-filter-drawer\s*\{[\s\S]*align-self:\s*flex-end/);
  assert.match(appSource, /@media \(max-width: 719px\)[\s\S]*border-radius:\s*18px\s+18px\s+0\s+0/);
  assert.match(appSource, /@media \(max-width: 719px\)[\s\S]*height:\s*min\(75vh/);
});

test('active catalogue filters put clear filters before the active pills', () => {
  const activeStart = browseSource.indexOf('className="ump-browse-active-filters"');
  const clearIndex = browseSource.indexOf('activeFilterBadges.length > 1 && <ClearFiltersButton', activeStart);
  const pillsIndex = browseSource.indexOf('activeFilterBadges.map', activeStart);
  assert.ok(activeStart >= 0 && clearIndex > activeStart && clearIndex < pillsIndex);
});

test('mobile filter sheet handle supports a downward dismiss gesture', () => {
  assert.match(browseSource, /onPointerDown=\{startSheetDrag\}/);
  assert.match(browseSource, /onPointerMove=\{moveSheetDrag\}/);
  assert.match(browseSource, /onPointerUp=\{endSheetDrag\}/);
  assert.match(browseSource, /setShowFilters\(false\)/);
});
