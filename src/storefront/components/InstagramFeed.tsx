import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
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
// Instagram credentials aren't configured yet, the feed request fails, or a
// specific photo URL 404s, that tile falls back to the same abstract
// placeholder ProductPhoto already uses for products without client media --
// so the section never looks broken, only quieter.
// lucide-react doesn't ship a literal Instagram glyph, so the Camera icon
// stands in as a generic "photo feed" mark rather than reproducing the
// brand logo.
//
// 2026-08-02 redesign (Jay-P feedback: tiles read too small, wanted a
// carousel): was a fixed 3/6-column grid capped inside the page's
// max-width container, so tiles topped out around 200px on wide screens.
// Now a full-bleed, larger portrait strip that auto-scrolls left at a slow,
// editorial pace, pauses on hover, and is fully drag/swipe-able -- see the
// auto-scroll effect below for how those interact. Pulls up to 10 posts
// (the CMS endpoint supports up to 12) instead of 6, so the loop feels like
// a real feed rather than a handful of tiles repeating.
const INSTAGRAM_URL = 'https://www.instagram.com/use_me_withstyle/';
const TILE_COUNT = 10;
const AUTO_SCROLL_PX_PER_SEC = 26;
// How long after any manual interaction (drag, wheel, touch) the carousel
// waits before resuming auto-scroll -- long enough that it doesn't feel like
// it's fighting the person who just scrolled it themselves.
const RESUME_AFTER_MS = 1500;
const DRAG_THRESHOLD_PX = 4;

export function InstagramFeed() {
  const { lang } = useApp();
  const [posts, setPosts] = useState<ApiInstagramPost[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const draggedPastThresholdRef = useRef(false);
  const lastManualAtRef = useRef(0);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  useEffect(() => {
    let cancelled = false;
    fetchInstagramFeed(TILE_COUNT).then((result) => {
      if (!cancelled) setPosts(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const paused = hoveringRef.current || draggingRef.current || now - lastManualAtRef.current < RESUME_AFTER_MS;
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += (AUTO_SCROLL_PX_PER_SEC * dt) / 1000;
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) track.scrollLeft -= half;
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
    track.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartRef.current.x;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) draggedPastThresholdRef.current = true;
    track.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    markManual();
  };

  // Real posts once loaded; otherwise TILE_COUNT placeholder slots so the
  // strip keeps its shape while the feed request is in flight.
  const tiles: (ApiInstagramPost | undefined)[] = posts.length > 0 ? posts : Array.from({ length: TILE_COUNT });
  const loopedTiles = [...tiles, ...tiles];

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
        className="ump-instagram-track"
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
          const isDuplicate = i >= tiles.length;
          const label = post
            ? lang === 'pt'
              ? `Abrir publicação no Instagram${post.caption ? `: ${post.caption}` : ''}`
              : `Open Instagram post${post.caption ? `: ${post.caption}` : ''}`
            : lang === 'pt'
              ? 'Abrir Instagram'
              : 'Open Instagram';
          return (
            <a
              key={post ? `${post.id}-${i}` : i}
              href={post?.permalink ?? INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              tabIndex={isDuplicate ? -1 : undefined}
              aria-hidden={isDuplicate ? true : undefined}
              className="ump-instagram-tile"
              draggable={false}
              onClick={(e) => {
                if (draggedPastThresholdRef.current) e.preventDefault();
              }}
            >
              <ProductPhoto
                tone={TONE_CYCLE[i % TONE_CYCLE.length]}
                radius={10}
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
                  background: C.scrimSoft,
                  opacity: 0,
                }}
              >
                <Camera size={20} color="#FFFDF8" />
              </div>
            </a>
          );
        })}
      </div>

      <div className="ump-content-width" style={{ textAlign: 'center', marginTop: 20, padding: '0 20px' }}>
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
    </div>
  );
}
