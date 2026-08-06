import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Camera, Expand, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto, TONE_CYCLE } from '../../components/ProductPhoto';
import { fetchInstagramFeed, type ApiInstagramPost } from '../../lib/api';
import { trackMetaCustomEvent } from '../../lib/metaAnalytics';
import { InstagramProductCard } from './InstagramProductCard';

// Homepage "Instagram feed" section. Pulls real posts from the client's
// Instagram Business account (@use_me_withstyle, confirmed 2026-07-16) via
// the CMS's Graph API proxy (GET /api/instagram-feed -- see
// src/lib/instagramFeed.ts in use-me-with-style-cms). Real photos are a
// progressive enhancement over the tone-block placeholder grid: whenever
// Instagram credentials aren't configured yet, the feed request fails, or a
// specific photo URL 404s, that tile falls back to the same abstract
// placeholder ProductPhoto already uses for products without client media --
// so the section never looks broken, only quieter.
//
// 2026-08-02, round 1 (Jay-P: tiles too small, wanted a carousel): went from
// a fixed 3/6-column grid capped inside .ump-content-width to a full-bleed
// auto-scrolling/draggable strip -- see App.tsx's .ump-instagram-* rules.
//
// 2026-08-02, round 2 (Jay-P: "not a huge fan, looks like just a collage of
// photos"): three more changes, plus a real bug fix found along the way --
//
// 1. "A reason to exist beyond a photo" -- every tile now shows a caption
//    (curated labelPT/labelEN if the CMS's Instagram Spotlight global has
//    one, else a server-cleaned version of the real Instagram caption) in a
//    PERSISTENT bottom gradient, not hover-only. Hover-only was invisible
//    on mobile/touch, where there's no hover state at all, so most visitors
//    never saw any text at all before.
// 2. "Break the uniform rhythm" -- tiles vary in width instead of being
//    perfectly uniform (see `isLarge` below): curated posts respect the
//    admin's explicit size choice; the uncurated "latest N" fallback uses a
//    fixed every-4th-tile pattern so the rhythm-break exists even before
//    any curation is configured.
// 3. "Don't send people away immediately" -- clicking a tile now opens an
//    in-page lightbox (full photo, full caption, an explicit "View on
//    Instagram" link) instead of instantly navigating off the site.
// 4. Bug fix, found while building #3: clicking a tile had stopped
//    navigating anywhere. Root cause was the round-1 drag-to-scroll code --
//    `track.setPointerCapture(e.pointerId)` was called on EVERY pointerdown
//    (i.e. every plain click too, not just drags), and pointer-capturing to
//    a different element than the actual click target is known to suppress
//    the browser's synthesized click on the nested element in some engines.
//    Capture is now deferred until the drag threshold is actually exceeded
//    (see onPointerMove), so a plain click/tap never captures the pointer
//    at all and always fires normally.
//
// 2026-08-02, round 3 bug fix (Jay-P: "I added one [curated post] in prod
// to test, it doubled the post"): the seamless-infinite-scroll technique
// below always rendered `[...tiles, ...tiles]` regardless of how many
// tiles there were. That's invisible with a full row of ~10 posts -- the
// two copies blend into one continuous strip -- but with only 1-2 curated
// posts (exactly what an admin testing the new curation feature would add
// first) it's just the same photo sitting twice, back to back, nakedly
// visible. Below MIN_TILES_TO_LOOP, tiles are no longer duplicated at all;
// the auto-scroll loop below also stops trying to wrap seamlessly in that
// case (there's no second copy to wrap into) and just clamps at the end.
//
// 2026-08-02, round 4 (Jay-P: "I actually don't like this admin instagram
// feature... just show the most recent 12 posts and allow me to choose the
// highlighted post, the caption should be the post caption and tile size
// for highlighted post is large"): the round-2/3 curation model -- an
// admin-ordered list of entries, each with its own optional caption
// override and size choice -- is gone. Replaced with exactly one admin
// choice (see Settings.tsx's InstagramSpotlightSection): which single post,
// if any, is highlighted. Everything else is automatic again -- always the
// latest ~12 posts, in that order, every caption is the real Instagram
// caption (cleaned server-side), and only the highlighted post is 'large'.
// `curated`/`labelPT`/`labelEN`/FALLBACK_LARGE_EVERY are gone with it --
// `post.size` from the API is now always meaningful, no fallback rhythm
// needed.
const INSTAGRAM_URL = 'https://www.instagram.com/use_me_withstyle/';
const TILE_COUNT = 10;
const MIN_TILES_TO_LOOP = 6;
const AUTO_SCROLL_PX_PER_SEC = 26;
// How long after any manual interaction (drag, wheel, touch) the carousel
// waits before resuming auto-scroll -- long enough that it doesn't feel like
// it's fighting the person who just scrolled it themselves.
const RESUME_AFTER_MS = 1500;
const DRAG_THRESHOLD_PX = 4;

export function InstagramFeed() {
  const { lang, market } = useApp();
  const [posts, setPosts] = useState<ApiInstagramPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ApiInstagramPost | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const draggedPastThresholdRef = useRef(false);
  const lastManualAtRef = useRef(0);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  // Mirrors `selectedPost` into a ref for the auto-scroll rAF loop below to
  // read -- that loop is set up once (its effect deliberately doesn't
  // depend on selectedPost, to avoid restarting the animation every time
  // the lightbox opens/closes) so it can't see state updates through its
  // own closure; only a ref stays current across those renders. Synced via
  // its own effect rather than assigned during render, which React's own
  // hooks lint rule flags as unsafe (ref mutations must happen outside render).
  const selectedPostRef = useRef<ApiInstagramPost | null>(null);
  useEffect(() => {
    selectedPostRef.current = selectedPost;
  }, [selectedPost]);

  useEffect(() => {
    let cancelled = false;
    fetchInstagramFeed(TILE_COUNT, market).then((result) => {
      if (cancelled) return;
      setPosts(result.posts);
    });
    return () => {
      cancelled = true;
    };
  }, [market]);

  // Close the lightbox on Escape; a plain Effect rather than an inline
  // handler since it needs to listen globally (the trigger tile isn't
  // necessarily focused, e.g. after a drag-then-click).
  useEffect(() => {
    if (!selectedPost) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPost]);

  // Auto-scroll loop. Advances scrollLeft at a constant speed, skipping
  // frames while hovered, actively dragged, or shortly after any manual
  // scroll interaction. The rendered track is the tile list doubled back to
  // back (see `loopedTiles` below), so wrapping scrollLeft back by exactly
  // half the scroll width at the halfway point loops seamlessly -- the
  // second copy is pixel-identical to the first, so the reset is invisible.
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || posts.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    // Whether the render below actually duplicated the tile list -- see
    // MIN_TILES_TO_LOOP's comment above. Recomputed from posts.length just
    // like `tiles`/`loopedTiles` in the render below (this effect already
    // re-runs whenever posts.length changes), so it always matches what's
    // actually in the DOM.
    const tileCount = posts.length > 0 ? posts.length : TILE_COUNT;
    const loop = tileCount >= MIN_TILES_TO_LOOP;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const paused = hoveringRef.current || draggingRef.current || now - lastManualAtRef.current < RESUME_AFTER_MS || Boolean(selectedPostRef.current);
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += (AUTO_SCROLL_PX_PER_SEC * dt) / 1000;
        if (loop) {
          // Duplicated content -- wrapping back by exactly half the scroll
          // width at the halfway point loops seamlessly (the second copy is
          // pixel-identical to the first).
          const half = track.scrollWidth / 2;
          if (track.scrollLeft >= half) track.scrollLeft -= half;
        } else {
          // Nothing duplicated to wrap into -- clamp at the end instead of
          // snapping back to the start, which would look like a jump cut.
          const max = track.scrollWidth - track.clientWidth;
          if (track.scrollLeft >= max) track.scrollLeft = max;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [posts.length]);

  const markManual = () => {
    lastManualAtRef.current = performance.now();
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    draggedPastThresholdRef.current = false;
    dragStartRef.current = { x: e.clientX, scrollLeft: track.scrollLeft };
    // Deliberately NOT capturing the pointer here -- see the round-2 bug
    // fix note in the header comment. Capture only kicks in once a real
    // drag is detected, in onPointerMove.
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartRef.current.x;
    if (!draggedPastThresholdRef.current && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      draggedPastThresholdRef.current = true;
      track.setPointerCapture(e.pointerId);
    }
    if (draggedPastThresholdRef.current) {
      track.scrollLeft = dragStartRef.current.scrollLeft - dx;
    }
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (draggedPastThresholdRef.current) markManual();
  };

  // Real posts once loaded; otherwise TILE_COUNT placeholder slots so the
  // strip keeps its shape while the feed request is in flight.
  const tiles: (ApiInstagramPost | undefined)[] = posts.length > 0 ? posts : Array.from({ length: TILE_COUNT });
  // Below MIN_TILES_TO_LOOP, don't duplicate -- see the header comment.
  const shouldLoop = tiles.length >= MIN_TILES_TO_LOOP;
  const loopedTiles = shouldLoop ? [...tiles, ...tiles] : tiles;

  return (
    <div style={{ padding: '28px 0 40px' }}>
      <div className="ump-content-width" style={{ textAlign: 'center', marginBottom: 16, padding: '0 20px' }}>
        <div style={{ fontFamily: F.display, fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
          {t('instagramHeading', lang)} <span style={{ color: C.inkSoft, fontWeight: 700 }}>{t('instagramHandle', lang)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.inkSoft }}>{t('instagramSubheading', lang)}</div>
      </div>

      <div
        ref={trackRef}
        className={`ump-instagram-track${shouldLoop ? '' : ' ump-instagram-track--compact'}`}
        onMouseEnter={() => {
          hoveringRef.current = true;
        }}
        onMouseLeave={() => {
          hoveringRef.current = false;
          endDrag();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={markManual}
        onTouchStart={markManual}
      >
        {loopedTiles.map((post, i) => {
          const originalIndex = i % tiles.length;
          const isLarge = post?.size === 'large';
          const displayLabel = post
            ? post.captionDisplay || (lang === 'pt' ? 'Ver publicação' : 'View post')
            : undefined;
          const ariaLabel = post
            ? lang === 'pt'
              ? `Ver publicação do Instagram${displayLabel ? `: ${displayLabel}` : ''}`
              : `View Instagram post${displayLabel ? `: ${displayLabel}` : ''}`
            : lang === 'pt'
              ? 'A carregar publicação'
              : 'Loading post';
          return (
            <button
              key={post ? `${post.id}-${i}` : i}
              type="button"
              aria-label={ariaLabel}
              tabIndex={originalIndex !== i ? -1 : undefined}
              aria-hidden={originalIndex !== i ? true : undefined}
              className={`ump-instagram-tile${isLarge ? ' ump-instagram-tile--large' : ''}`}
              draggable={false}
              disabled={!post}
              onClick={() => {
                if (draggedPastThresholdRef.current || !post) return;
                setSelectedPost(post);
                if ((post.products?.length ?? 0) > 0) {
                  trackMetaCustomEvent('ShopTheLookOpen', {
                    instagram_look_id: post.id,
                    product_ids: post.products?.map((product) => product.id),
                    market,
                    surface: 'homepage_feed',
                  });
                }
              }}
            >
              <ProductPhoto
                tone={TONE_CYCLE[originalIndex % TONE_CYCLE.length]}
                radius={10}
                image={post ? { url: post.imageUrl, alt: displayLabel || '' } : undefined}
              />
              <div className="ump-instagram-tile-hover">
                <Expand size={18} color="#FFFDF8" />
              </div>
              {(post?.products?.length ?? 0) > 0 && (
                <div className="ump-instagram-shop-badge">
                  <ShoppingBag size={11} /> {post?.products?.length}
                </div>
              )}
              {displayLabel && (
                <div className="ump-instagram-tile-caption">
                  <span>{displayLabel}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="ump-content-width" style={{ textAlign: 'center', marginTop: 20, padding: '0 20px' }}>
        {posts.some((post) => (post.products?.length ?? 0) > 0) && (
          <Link
            to="/shop-instagram"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', marginRight: 8,
              borderRadius: 8, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800,
              letterSpacing: 0.5, textDecoration: 'none',
            }}
          >
            <ShoppingBag size={14} /> {lang === 'pt' ? 'Comprar no Instagram' : 'Shop Instagram'}
          </Link>
        )}
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
            border: `1px solid ${C.fieldBorder}`,
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

      {selectedPost && (
        <div
          className="ump-instagram-lightbox-backdrop"
          onClick={() => setSelectedPost(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="instagram-lightbox-caption"
            className={`ump-instagram-lightbox${(selectedPost.products?.length ?? 0) > 0 ? ' ump-instagram-lightbox--shoppable' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={lang === 'pt' ? 'Fechar' : 'Close'}
              className="ump-instagram-lightbox-close"
              onClick={() => setSelectedPost(null)}
            >
              <X size={18} />
            </button>
            <div className="ump-instagram-lightbox-image">
              <ProductPhoto
                tone="dark"
                radius={0}
                image={{ url: selectedPost.imageUrl, alt: selectedPost.captionDisplay || '' }}
              />
            </div>
            <div className="ump-instagram-lightbox-body">
              {selectedPost.caption && (
                <p id="instagram-lightbox-caption" style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                  {selectedPost.caption}
                </p>
              )}
              {(selectedPost.products?.length ?? 0) > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: C.inkSoft, textTransform: 'uppercase' }}>
                    {lang === 'pt' ? 'Comprar este look' : 'Shop this look'}
                  </div>
                  <div className="ump-instagram-product-grid">
                    {selectedPost.products?.map((product) => (
                      <InstagramProductCard key={product.id} product={product} lookId={selectedPost.id} compact />
                    ))}
                  </div>
                </div>
              )}
              <a
                href={selectedPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: C.goldDeep, textDecoration: 'none' }}
              >
                <Camera size={13} />
                {lang === 'pt' ? 'Ver no Instagram ↗' : 'View on Instagram ↗'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
