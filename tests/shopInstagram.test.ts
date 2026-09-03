import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const apiSource = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');
const feedSource = readFileSync(new URL('../src/storefront/components/InstagramFeed.tsx', import.meta.url), 'utf8');
const shopPageSource = readFileSync(new URL('../src/storefront/pages/ShopInstagram.tsx', import.meta.url), 'utf8');
const productCardSource = readFileSync(new URL('../src/storefront/components/InstagramProductCard.tsx', import.meta.url), 'utf8');
const productPhotoSource = readFileSync(new URL('../src/components/ProductPhoto.tsx', import.meta.url), 'utf8');
const productDetailSource = readFileSync(new URL('../src/storefront/pages/ProductDetail.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const footerSource = readFileSync(new URL('../src/storefront/components/Footer.tsx', import.meta.url), 'utf8');

test('Instagram feed requests are market-aware and expose resolved catalogue facts', () => {
  assert.match(apiSource, /instagram-feed\?limit=\$\{limit\}&market=\$\{market\}/);
  assert.match(apiSource, /availableSizes: string\[\]/);
  assert.match(apiSource, /variantSelections\?: Record<string, string \| string\[\]>/);
  assert.match(apiSource, /selectedColorId: string \| null/);
  assert.match(apiSource, /regularPrice: number/);
});

test('Instagram feed settings manage up to six products and exact colours per post', () => {
  assert.match(settingsSource, /Products in this look|Produtos neste look/);
  assert.match(settingsSource, /up to six products|máximo seis produtos/);
  assert.match(settingsSource, /variantSelections/);
  assert.match(settingsSource, /toggleColour/);
  assert.match(settingsSource, /selectedColourCount/);
  assert.match(settingsSource, /adminListProducts/);
});

test('homepage and dedicated page render shoppable product cards', () => {
  assert.match(feedSource, /InstagramProductCard/);
  assert.match(feedSource, /ShopTheLookOpen/);
  assert.match(shopPageSource, /Shop Instagram/);
  assert.match(shopPageSource, /shop-instagram\/\$\{encodeURIComponent\(post.lookSlug\)\}/);
  assert.match(productCardSource, /ShopTheLookProductClick/);
  assert.match(productCardSource, /Sold out — view similar/);
  assert.match(productCardSource, /product\.imageAlt\?\.trim\(\) \|\| name/);
  assert.match(shopPageSource, /key=\{`\$\{product\.id\}-\$\{product\.selectedColorId/);
  assert.match(feedSource, /key=\{`\$\{product\.id\}-\$\{product\.selectedColorId/);
});

// 2026-08-08 redesign: the homepage feed no longer links to /shop-instagram
// itself (its "Comprar no Instagram" button was removed as redundant with
// per-post shopping in the lightbox -- see InstagramFeed.tsx's header
// comment) -- the footer is now that page's only entry point, so it must
// not have been silently orphaned.
test('/shop-instagram is still reachable from the footer now that the feed no longer links to it', () => {
  assert.doesNotMatch(feedSource, /to="\/shop-instagram"/);
  assert.match(footerSource, /to: '\/shop-instagram'/);
});

// 2026-08-08 redesign: Instagram-native overlay lightbox (close/view/shop
// pills and caption all on top of the photo, no separate content panel) plus
// real video playback and a heading that doubles as the follow link.
test('lightbox redesign: overlaid chrome, direct-to-product shopping, and video playback', () => {
  assert.match(feedSource, /ump-instagram-lightbox-topbar/);
  assert.match(feedSource, /ump-instagram-lightbox-caption/);
  assert.doesNotMatch(feedSource, /className="ump-instagram-lightbox-body"/);
  // Single-tagged-product posts jump straight to the product page instead of
  // showing a redundant card first.
  assert.match(feedSource, /selectedProducts\.length === 1/);
  assert.match(feedSource, /to=\{`\/produto\/\$\{encodeURIComponent\(selectedProducts\[0\]\.slug\)\}/);
  // Multi-product posts (rare, can't be disambiguated by one tap) get a
  // popover instead.
  assert.match(feedSource, /selectedProducts\.length > 1/);
  assert.match(feedSource, /ump-instagram-lightbox-picker/);
  // Video posts: badge on the tile, real <video> with muted autoplay + a
  // tap-to-unmute control in the lightbox.
  assert.match(feedSource, /ump-instagram-video-badge/);
  assert.match(feedSource, /<video/);
  assert.match(feedSource, /muted=\{videoMuted\}/);
  assert.match(feedSource, /ump-instagram-lightbox-mute/);
  // The heading is the follow link now; there's no separate Follow button.
  assert.match(feedSource, /href=\{INSTAGRAM_URL\}/);
  assert.doesNotMatch(feedSource, /instagramCta/);
});

test('Instagram API types and CMS mapping carry video media type and URL through', () => {
  assert.match(apiSource, /mediaType: 'IMAGE' \| 'VIDEO'/);
  assert.match(apiSource, /videoUrl\?: string/);
});

test('shop look routes are public and exact colours preselect on product pages', () => {
  assert.match(appSource, /path="shop-instagram"/);
  assert.match(appSource, /path="shop-instagram\/:lookSlug"/);
  assert.match(productDetailSource, /searchParams\.get\('cor'\)/);
  assert.match(productDetailSource, /candidate\.id === requestedColor/);
});

test('products without catalogue images use a valid, crash-safe placeholder tone', () => {
  assert.match(productCardSource, /tone="gold"/);
  assert.doesNotMatch(productCardSource, /tone="light"/);
  assert.match(productPhotoSource, /TONE_STYLES\[tone\] \?\? TONE_STYLES\.gold/);
});

test('ProductPhoto never renders an empty alt attribute for a real image', () => {
  assert.match(productPhotoSource, /image\?\.alt\?\.trim\(\) \|\| 'Produto — Use Me With Style'/);
  assert.match(productPhotoSource, /alt=\{imageAlt\}/);
  assert.doesNotMatch(productPhotoSource, /alt=\{image\?\.alt \|\| ''\}/);
});
