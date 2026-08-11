import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Inter is self-hosted and no Google Fonts stylesheet blocks rendering', () => {
  assert.match(projectFile('src/main.tsx'), /@fontsource-variable\/inter\/wght\.css/);
  assert.doesNotMatch(projectFile('src/App.tsx'), /fonts\.googleapis\.com/);
  assert.match(projectFile('src/theme/tokens.ts'), /Inter Variable/);
});

test('the shared raster wordmark reserves its intrinsic layout dimensions', () => {
  const source = projectFile('src/components/BrandLogo.tsx');
  assert.match(source, /height=\{height\}/);
  assert.match(source, /width=\{Math\.round\(height \* WORDMARK_ASPECT\)\}/);
});

test('product loading and global controls avoid measured CLS and accessibility regressions', () => {
  assert.match(projectFile('src/storefront/pages/ProductDetail.tsx'), /minHeight: '100vh'/);
  assert.match(projectFile('src/storefront/pages/StyleArticle.tsx'), /minHeight: '100vh'/);
  assert.match(projectFile('src/storefront/StorefrontLayout.tsx'), /language', lang\)}: \$\{lang\.toUpperCase\(\)\}/);
  assert.match(projectFile('src/storefront/components/Footer.tsx'), /minHeight: 24/);
  assert.match(projectFile('src/storefront/components/InstagramFeed.tsx'), /ump-instagram-shop-badge" aria-hidden="true"/);
});

test('storefront image priority is limited to likely LCP candidates', () => {
  assert.match(projectFile('src/storefront/pages/Browse.tsx'), /priority=\{index === 0\}/);
  assert.match(projectFile('src/storefront/pages/ShopInstagram.tsx'), /priority=\{index === 0\}/);
  assert.match(projectFile('src/storefront/pages/ProductDetail.tsx'), /variant="full" priority/);
  assert.match(projectFile('src/storefront/pages/ProductDetail.tsx'), /variant="thumbnail"/);
});

test('remaining direct storefront images have dimensions and intentional alt behavior', () => {
  const home = projectFile('src/storefront/pages/Home.tsx');
  assert.match(home, /alt=\{heroImage\?\.alt\?\.trim\(\)/);
  assert.match(home, /pictorialWhite.*alt="".*width=\{400\}.*height=\{268\}/);
  assert.match(home, /alt=""\s+width=\{1200\}\s+height=\{1600\}\s+loading="lazy"/);
});
