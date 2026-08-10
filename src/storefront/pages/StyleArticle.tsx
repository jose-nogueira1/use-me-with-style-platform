import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchPostBySlug, type ApiPost } from '../../lib/api';
import { Seo } from '../../lib/seo';
import { canonicalUrl } from '../../lib/seoMetadata';
import { serializeJsonLd } from '../../lib/jsonLd';
import { buildBlogPostingStructuredData, formatPostDate, localizePost, type LocalizedPostBlock } from '../../lib/styleGuide';
import { NotFound } from './NotFound';

export function StyleArticle() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { lang, market } = useApp();
  const requestKey = `${market}:${slug}`;
  const [result, setResult] = useState<{ key: string; post: ApiPost | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPostBySlug(slug, market)
      .then((post) => { if (!cancelled) setResult({ key: requestKey, post }); })
      .catch(() => { if (!cancelled) setResult({ key: requestKey, post: null }); });
    return () => { cancelled = true; };
  }, [market, requestKey, slug]);

  const post = result?.key === requestKey ? result.post : undefined;

  if (post === undefined) {
    return <div role="status" className="ump-form-width" style={{ padding: '48px 20px', color: C.inkSoft }}>{lang === 'pt' ? 'A carregar artigo…' : 'Loading article…'}</div>;
  }
  if (post === null) return <NotFound />;

  const localized = localizePost(post, lang);
  const url = canonicalUrl(typeof window === 'undefined' ? '' : window.location.origin, `/estilo/${post.slug}`);
  const structuredData = buildBlogPostingStructuredData(post, lang, url);
  const date = post.publishedAt || post.createdAt;

  return (
    <article className="ump-form-width" style={{ padding: '38px 20px 64px' }}>
      <Seo title={localized.seoTitle} description={localized.seoDescription} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <Link to="/estilo" style={{ color: C.goldDeep, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
        {lang === 'pt' ? '← Guia de estilo' : '← Style guide'}
      </Link>
      <header style={{ margin: '24px 0 34px' }}>
        <time dateTime={date} style={{ color: C.inkSoft, fontSize: 11 }}>{formatPostDate(date, lang)}</time>
        <h1 style={{ fontFamily: F.display, color: C.ink, fontSize: 34, lineHeight: 1.18, margin: '10px 0 14px' }}>{localized.title}</h1>
        <p style={{ color: C.inkSoft, fontSize: 15, lineHeight: 1.75, margin: 0 }}>{localized.excerpt}</p>
      </header>
      <div style={{ borderTop: `1px solid ${C.ruleLight}`, paddingTop: 30 }}>
        {localized.body.map((block, index) => <ArticleBlock key={block.id ?? `${block.kind}-${index}`} block={block} />)}
      </div>
      <aside style={{ marginTop: 42, padding: 22, borderRadius: 10, background: C.subtleBg, border: `1px solid ${C.ruleLight}` }}>
        <div style={{ color: C.ink, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{lang === 'pt' ? 'Pronta para encontrar o seu próximo look?' : 'Ready to find your next look?'}</div>
        <Link to="/catalogo" style={{ color: C.goldDeep, fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>{lang === 'pt' ? 'Explorar o catálogo →' : 'Explore the catalogue →'}</Link>
      </aside>
    </article>
  );
}

function ArticleBlock({ block }: { block: LocalizedPostBlock }) {
  const heading = block.heading ? <h2 style={{ fontFamily: F.display, color: C.ink, fontSize: 22, lineHeight: 1.3, margin: '30px 0 10px' }}>{block.heading}</h2> : null;
  if (block.kind === 'bullets') {
    const items = block.text.split('\n').map((item) => item.trim()).filter(Boolean);
    return (
      <section>
        {heading}
        <ul style={{ color: C.ink, fontSize: 14, lineHeight: 1.75, paddingLeft: 22, margin: '0 0 18px' }}>
          {items.map((item) => <li key={item} style={{ marginBottom: 6 }}>{item}</li>)}
        </ul>
      </section>
    );
  }
  return (
    <section>
      {heading}
      <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.8, margin: '0 0 18px' }}>{block.text}</p>
    </section>
  );
}
