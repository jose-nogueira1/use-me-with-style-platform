import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ApiPost } from '../src/lib/api.ts';
import { buildBlogPostingStructuredData, localizePost } from '../src/lib/styleGuide.ts';

const projectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const post: ApiPost = {
  id: 1,
  titlePT: 'Como escolher leggings',
  titleEN: 'How to choose leggings',
  slug: 'como-escolher-leggings',
  excerptPT: 'Resumo português suficientemente útil.',
  excerptEN: 'A sufficiently useful English excerpt.',
  body: [
    { kind: 'section', headingPT: 'Tecido', headingEN: 'Fabric', textPT: 'Observe a elasticidade.', textEN: 'Check the stretch.' },
    { kind: 'bullets', headingPT: 'Lista', headingEN: 'Checklist', textPT: 'Cintura\nCobertura', textEN: 'Waistband\nCoverage' },
  ],
  seoTitlePT: 'Como escolher leggings | Use Me With Style',
  seoTitleEN: 'How to choose leggings | Use Me With Style',
  seoDescriptionPT: 'Guia português para escolher leggings.',
  seoDescriptionEN: 'An English guide to choosing leggings.',
  status: 'published',
  publishedAt: '2026-08-10T09:00:00.000Z',
  availableAO: true,
  availablePT: true,
  updatedAt: '2026-08-10T12:00:00.000Z',
  createdAt: '2026-08-10T08:00:00.000Z',
};

test('style-guide content localizes every article field and block', () => {
  const english = localizePost(post, 'en');
  assert.equal(english.title, 'How to choose leggings');
  assert.equal(english.body[0].heading, 'Fabric');
  assert.equal(english.body[1].text, 'Waistband\nCoverage');
});

test('BlogPosting structured data carries canonical dates, language and publisher', () => {
  const value = buildBlogPostingStructuredData(post, 'pt', 'https://ao.usemewithstyle.shop/estilo/como-escolher-leggings');
  assert.equal(value['@type'], 'BlogPosting');
  assert.equal(value.headline, 'Como escolher leggings');
  assert.equal(value.inLanguage, 'pt');
  assert.equal(value.datePublished, post.publishedAt);
  assert.equal(value.publisher['@id'], 'https://usemewithstyle.shop/#organization');
  assert.match(value.articleBody, /elasticidade/);
});

test('listing, article, admin and API surfaces are connected', () => {
  const app = projectFile('src/App.tsx');
  const footer = projectFile('src/storefront/components/Footer.tsx');
  const listing = projectFile('src/storefront/pages/StyleGuide.tsx');
  const article = projectFile('src/storefront/pages/StyleArticle.tsx');
  const adminRoutes = projectFile('src/admin/AdminRoutes.tsx');
  const admin = projectFile('src/admin/pages/Articles.tsx');
  const api = projectFile('src/lib/api.ts');
  assert.match(app, /path="estilo" element={<StyleGuide \/>}/);
  assert.match(app, /path="estilo\/:slug" element={<StyleArticle \/>}/);
  assert.match(footer, /to="\/estilo"/);
  assert.match(listing, /fetchPosts\(market\)/);
  assert.match(article, /fetchPostBySlug\(slug, market\)/);
  assert.match(article, /application\/ld\+json/);
  assert.match(adminRoutes, /path="artigos" element={<Articles \/>}/);
  assert.match(admin, /adminCreatePost/);
  assert.match(admin, /adminUpdatePost/);
  assert.match(api, /where\[status\]\[equals\]=published/);
});
