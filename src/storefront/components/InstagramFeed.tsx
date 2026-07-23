import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto, TONE_CYCLE } from '../../components/ProductPhoto';
import { fetchInstagramFeed, type ApiInstagramPost } from '../../lib/api';

// Homepage "Instagram feed" section. Pulls real posts from the client's
// Instagram Business account (@use_me_withstyle, confirmed 2026-07-16) via
// the CMS's Graph API proxy (GET /api/instagram-feed -- see
// src/lib/instagramFeed.ts in use-me-with-style-cms). Real photos are a
// progressive enhancement over the tone-block placeholder grid: whenever
// Instagram credentials aren't configured yet (JOS-58), the feed request
// fails, or a specific photo URL 404s, that tile falls back to the same
// abstract placeholder ProductPhoto already uses for products without
// client media -- so the section never looks broken, only quieter.
// lucide-react doesn't ship a literal Instagram glyph, so the Camera icon
// stands in as a generic "photo feed" mark rather than reproducing the
// brand logo.
const INSTAGRAM_URL = 'https://www.instagram.com/use_me_withstyle/';
const TILE_COUNT = 6;

export function InstagramFeed() {
  const { lang } = useApp();
  const [posts, setPosts] = useState<ApiInstagramPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchInstagramFeed(TILE_COUNT).then((result) => {
      if (!cancelled) setPosts(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ump-content-width" style={{ padding: '28px 20px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: F.display, fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
          {t('instagramHeading', lang)} <span style={{ color: C.inkSoft, fontWeight: 700 }}>{t('instagramHandle', lang)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.inkSoft }}>{t('instagramSubheading', lang)}</div>
      </div>

      <div className="ump-instagram-grid">
        {Array.from({ length: TILE_COUNT }).map((_, i) => {
          const post = posts[i];
          const label = post
            ? (lang === 'pt'
              ? `Abrir publicação no Instagram${post.caption ? `: ${post.caption}` : ''}`
              : `Open Instagram post${post.caption ? `: ${post.caption}` : ''}`)
            : (lang === 'pt' ? `Abrir publicação ${i + 1} no Instagram` : `Open Instagram post ${i + 1}`);
          return (
          <a
            key={post?.id ?? i}
            href={post?.permalink ?? INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="ump-instagram-tile"
            style={{ position: 'relative', display: 'block', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 1' }}
          >
            <ProductPhoto
              tone={TONE_CYCLE[i % TONE_CYCLE.length]}
              radius={8}
              image={post ? { url: post.imageUrl, alt: post.caption || (lang === 'pt' ? 'Publicação do Instagram' : 'Instagram post') } : undefined}
            />
            <div
              className="ump-instagram-tile-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5,5,5,0.35)',
                opacity: 0,
              }}
            >
              <Camera size={20} color="#FFFDF8" />
            </div>
          </a>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 8,
            background: C.paper,
            border: `1px solid ${C.rule}`,
            color: C.ink,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
            textDecoration: 'none',
          }}
        >
          <Camera size={14} color={C.goldDeep} />
          {t('instagramCta', lang)}
        </a>
      </div>
    </div>
  );
}
