import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchPosts, type ApiPost } from '../../lib/api';
import { Seo } from '../../lib/seo';
import { formatPostDate, localizePost } from '../../lib/styleGuide';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';

export function StyleGuide() {
  const { lang, market } = useApp();
  const [result, setResult] = useState<{ market: typeof market; posts: ApiPost[]; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPosts(market)
      .then((posts) => { if (!cancelled) setResult({ market, posts, failed: false }); })
      .catch(() => { if (!cancelled) setResult({ market, posts: [], failed: true }); });
    return () => { cancelled = true; };
  }, [market]);

  const current = result?.market === market ? result : null;

  const title = lang === 'pt' ? 'Guia de estilo' : 'Style guide';
  const intro = lang === 'pt'
    ? 'Conselhos práticos para escolher, combinar e cuidar da sua roupa desportiva.'
    : 'Practical advice for choosing, styling and caring for your activewear.';

  return (
    <div className="ump-content-width" style={{ padding: '48px 20px 64px' }}>
      <Seo
        title={lang === 'pt' ? 'Guia de estilo e moda desportiva | Use Me With Style' : 'Activewear style guide | Use Me With Style'}
        description={lang === 'pt' ? 'Guias sobre leggings, roupa para o ginásio, tecidos e estilo ativo para mulheres em Angola e Portugal.' : 'Guides to leggings, gym outfits, activewear fabrics and active style for women in Angola and Portugal.'}
      />
      <BreadcrumbJsonLd items={[
        { name: lang === 'pt' ? 'Início' : 'Home', path: '/' },
        { name: title, path: '/estilo' },
      ]} />
      <header style={{ maxWidth: 720, marginBottom: 36 }}>
        <div style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Use Me With Style</div>
        <h1 style={{ fontFamily: F.display, color: C.ink, fontSize: 36, lineHeight: 1.15, margin: '0 0 14px' }}>{title}</h1>
        <p style={{ color: C.inkSoft, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{intro}</p>
      </header>

      {current === null ? (
        <div role="status" style={{ color: C.inkSoft, fontSize: 13 }}>{lang === 'pt' ? 'A carregar artigos…' : 'Loading articles…'}</div>
      ) : current.failed ? (
        <div role="alert" style={{ color: C.danger, fontSize: 13 }}>{lang === 'pt' ? 'Não foi possível carregar os artigos.' : 'Articles could not be loaded.'}</div>
      ) : current.posts.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13 }}>{lang === 'pt' ? 'Ainda não existem artigos publicados.' : 'There are no published articles yet.'}</div>
      ) : (
        <div className="ump-style-guide-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
          {current.posts.map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, lang }: { post: ApiPost; lang: 'pt' | 'en' }) {
  const localized = localizePost(post, lang);
  const date = post.publishedAt || post.createdAt;
  return (
    <article className="ump-hover-lift" style={{ background: C.paper, border: `1px solid ${C.ruleLight}`, borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', minHeight: 260 }}>
      <time dateTime={date} style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
        {formatPostDate(date, lang)}
      </time>
      <h2 style={{ fontFamily: F.display, color: C.ink, fontSize: 21, lineHeight: 1.25, margin: '14px 0 10px' }}>
        <Link to={`/estilo/${encodeURIComponent(post.slug)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{localized.title}</Link>
      </h2>
      <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.7, margin: '0 0 20px' }}>{localized.excerpt}</p>
      <Link to={`/estilo/${encodeURIComponent(post.slug)}`} aria-label={`${lang === 'pt' ? 'Ler' : 'Read'}: ${localized.title}`} style={{ color: C.goldDeep, fontSize: 12, fontWeight: 800, textDecoration: 'none', marginTop: 'auto' }}>
        {lang === 'pt' ? 'Ler artigo →' : 'Read article →'}
      </Link>
    </article>
  );
}
