import type { ApiPost, ApiPostBlock } from './api';

export type LocalizedPostBlock = {
  id?: string | null;
  kind: ApiPostBlock['kind'];
  heading: string;
  text: string;
};

export function localizePost(post: ApiPost, lang: 'pt' | 'en') {
  const choose = (pt: string | null | undefined, en: string | null | undefined) => (
    lang === 'en' ? (en?.trim() || pt?.trim() || '') : (pt?.trim() || en?.trim() || '')
  );
  return {
    title: choose(post.titlePT, post.titleEN),
    excerpt: choose(post.excerptPT, post.excerptEN),
    seoTitle: choose(post.seoTitlePT, post.seoTitleEN),
    seoDescription: choose(post.seoDescriptionPT, post.seoDescriptionEN),
    body: post.body.map((block): LocalizedPostBlock => ({
      id: block.id,
      kind: block.kind,
      heading: choose(block.headingPT, block.headingEN),
      text: choose(block.textPT, block.textEN),
    })),
  };
}

export function buildBlogPostingStructuredData(post: ApiPost, lang: 'pt' | 'en', url: string) {
  const localized = localizePost(post, lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: localized.title,
    description: localized.seoDescription || localized.excerpt,
    articleBody: localized.body.map((block) => [block.heading, block.text].filter(Boolean).join('. ')).join('\n\n'),
    inLanguage: lang === 'pt' ? 'pt' : 'en',
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'Use Me With Style' },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://usemewithstyle.shop/#organization',
      name: 'Use Me With Style',
    },
  };
}

export function formatPostDate(value: string, lang: 'pt' | 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
