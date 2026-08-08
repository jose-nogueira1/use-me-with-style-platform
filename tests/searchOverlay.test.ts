import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 2026-08-08 ("I noticed we don't have a search option in the homepage"):
// a header search icon + live-results dropdown (SearchOverlay.tsx), reachable
// from every page including home, replacing the old cart-page-only icon that
// just navigated to the catalogue with no way to actually type a query until
// you got there.
const overlaySource = readFileSync(new URL('../src/storefront/components/SearchOverlay.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/storefront/StorefrontLayout.tsx', import.meta.url), 'utf8');
const browseSource = readFileSync(new URL('../src/storefront/pages/Browse.tsx', import.meta.url), 'utf8');
const i18nSource = readFileSync(new URL('../src/theme/i18n.ts', import.meta.url), 'utf8');

test('header renders a persistent, always-present search trigger and search panel', () => {
  assert.match(layoutSource, /import \{ SearchOverlay \} from '\.\/components\/SearchOverlay'/);
  assert.match(layoutSource, /<SearchOverlay open=\{searchOpen\} onClose=\{\(\) => setSearchOpen\(false\)\}/);
  // The old behaviour swapped the icon itself between Search (on the cart
  // page) and ShoppingBag (everywhere else) -- that conditional is gone,
  // both icons should now render unconditionally, side by side.
  assert.doesNotMatch(layoutSource, /isCart \? <Search/);
  assert.doesNotMatch(layoutSource, /const isCart = /);
});

test('search panel closes on Escape, on an outside click, and on any route change', () => {
  assert.match(overlaySource, /if \(!open\) return null;/);
  assert.match(layoutSource, /e\.key === 'Escape'\) setSearchOpen\(false\)/);
  assert.match(layoutSource, /headerRef\.current && !headerRef\.current\.contains/);
  assert.match(layoutSource, /setSearchOpen\(false\);/);
  assert.match(layoutSource, /\[location\.pathname, location\.search\]/);
});

test('search panel filters the shared product catalogue and hands off to /catalogo?q=', () => {
  assert.match(overlaySource, /useProducts\(market, lang\)/);
  // Same case-insensitive name-substring match Browse.tsx's own search box
  // uses, so the live preview here and the full results page never disagree.
  assert.match(overlaySource, /p\.name\.toLowerCase\(\)\.includes\(q\)/);
  assert.match(overlaySource, /`\/catalogo\?q=\$\{encodeURIComponent\(trimmed\)\}`/);
  assert.match(overlaySource, /searchSeeAllResults/);
  assert.match(overlaySource, /searchNoResults/);
});

test('/catalogo reads an initial search term from ?q= so the overlay\'s "see all" link actually pre-filters', () => {
  assert.match(browseSource, /searchParams\.get\('q'\)/);
  assert.match(browseSource, /useState\(urlQuery\)/);
});

test('search i18n strings exist in both languages', () => {
  for (const key of ['searchNoResults', 'searchSeeAllResults', 'closeSearch']) {
    const pattern = new RegExp(`${key}: \\{ pt: '[^']+', en: '[^']+' \\}`);
    assert.match(i18nSource, pattern, `missing or malformed i18n entry for ${key}`);
  }
});
