import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowUpRight, Camera, Expand, Play, ShoppingBag, Volume2, VolumeX, X } from 'lucide-react';
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
//
// 2026-08-08 redesign (Jay-P, referencing a competitor's Instagram post as
// inspiration): three changes, approved after a "let me know your thoughts"
// discussion rather than built straight from the request --
//
// 1. Lightbox now looks like Instagram's own native post view: close (X)
//    moved to the top-left, "View on Instagram" and "Shop the look" are
//    small pills overlaid on TOP of the photo (top-left, next to close)
//    instead of a separate panel below it, and the caption is an overlaid
//    gradient at the BOTTOM of the photo instead of plain text in that
//    panel. The old `.ump-instagram-lightbox-body` content panel is gone
//    entirely -- the whole modal is now just the photo/video with overlays,
//    at every breakpoint (previously desktop got a special two-column
//    layout with an always-visible product card; Jay-P chose to unify
//    instead of keeping that variant). Tapping the shop pill jumps straight
//    to the product page when a post tags exactly one product (matches "we
//    already have that when we open the picture" -- no reason to show a
//    redundant card first); a post tagging more than one product (up to 4,
//    see resolveShopTheLookProducts) instead opens a small popover of
//    compact product cards, since a single tap can't disambiguate which one.
// 2. Real video support. The Graph API always exposed `media_type` and, for
//    VIDEO items, `media_url` IS the actual playable file -- this component
//    used to receive only a still thumbnail and had no way to play a video
//    at all, so every video post silently became a dead photo. Tiles for
//    video posts now show a small play-icon badge, and the lightbox renders
//    an actual <video> (autoplay, muted, looping, with a tap-to-unmute
//    icon -- same behavior Instagram's own app uses, including the mute
//    icon's bottom-right placement). CAROUSEL_ALBUM posts are intentionally
//    out of scope here (still shown as their static cover image) -- each
//    slide needs a separate Graph API call this endpoint doesn't make yet.
// 3. Removed the "Comprar no Instagram"/"Seguir no Instagram" buttons that
//    used to sit below the whole strip. Reasoning: shopping is already one
//    tap away inside any post's lightbox, so a section-level shop button was
//    redundant, and "Segue-nos @use_me_withstyle" above the strip now IS the
//    follow link (wrapped in an <a> to the profile) so a separate Follow
//    button is redundant too. /shop-instagram (the "every shoppable look at
//    once" page) still exists and is still linked -- just from the footer
//    now instead of from here, so it isn't orphaned.
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
  // Reset together whenever a (possibly different) post is opened -- see the
  // tile onClick below. Not derived from selectedPost.id via an effect
  // because that would also fire on the very first open, which is fine, but
  // keeping the resets colocated with the state change that causes them is
  // simpler to follow.
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
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

  // Lock background scroll while the lightbox is open (2026-08-07 bug fix,
  // "swipe up/down swipes the background, not supposed to happen"; 2026-08-07
  // round 2, "it's leaking again" -- `overflow: hidden` alone was the first
  // attempt and it does stop scrolling on desktop, but iOS Safari has a
  // long-standing bug where `overflow: hidden` on <body> is simply ignored
  // for touch panning -- the page still rubber-bands/scrolls under a finger
  // drag no matter what the body's overflow is set to. The reliable
  // cross-browser fix is to take the body fully out of the scrollable flow:
  // pin it with `position: fixed` at its current scroll offset (via a
  // negative `top`), which removes it from anything a touch drag could pan,
  // then on close undo that and jump back to the stored offset in one
  // frame -- restoring scrollTop the normal way (rather than smoothly)
  // avoids any visible jump/flash. The backdrop being `position: fixed` only
  // ever stopped touches from reaching elements visually BEHIND it; it never
  // controlled whether the body itself could still be the thing panning.
  // The 2026-08-08 overlay redesign (see this file's header comment) removed
  // the scrollable content panel this used to reference -- the multi-product
  // picker's nested `.ump-instagram-lightbox-picker-scroll` is the only
  // thing inside the modal with its own `overflow-y: auto` now, and it's
  // short enough (max 4 products) that this scroll-lock rarely matters to
  // it either way.
  useEffect(() => {
    if (!selectedPost) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
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
    // Mouse only (2026-08-07 bug fix, "Instagram feed not swipeable on
    // mobile, stays stuck"): touch and pen pointers fall through to the
    // browser's own native horizontal scrolling instead -- see the
    // `.ump-instagram-track` touch-action comment in App.tsx for why. This
    // custom drag-to-scroll exists ONLY because desktop mice have no native
    // click-and-drag scroll gesture; touchscreens already get one for free
    // from `overflow-x: auto`, and letting this handler *also* seize
    // control of scrollLeft on top of the browser's native touch panning is
    // exactly the kind of two-systems-fighting-over-the-same-property bug
    // that reads as the strip being "stuck" -- native touch scrolling wins
    // some frames, the manual scrollLeft assignment wins others, and the
    // net result is a track that barely moves or stutters.
    if (e.pointerType !== 'mouse') return;
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

  // Non-null, always-an-array view of the open post's tagged products --
  // avoids `selectedPost.products!` non-null assertions scattered through
  // the lightbox JSX below.
  const selectedProducts = selectedPost?.products ?? [];

  // Real posts once loaded; otherwise TILE_COUNT placeholder slots so the
  // strip keeps its shape while the feed request is in flight.
  const tiles: (ApiInstagramPost | undefined)[] = posts.length > 0 ? posts : Array.from({ length: TILE_COUNT });
  // Below MIN_TILES_TO_LOOP, don't duplicate -- see the header comment.
  const shouldLoop = tiles.length >= MIN_TILES_TO_LOOP;
  const loopedTiles = shouldLoop ? [...tiles, ...tiles] : tiles;

  return (
    <div style={{ padding: '28px 0 40px' }}>
      <div className="ump-content-width" style={{ textAlign: 'center', marginBottom: 16, padding: '0 20px' }}>
        {/* 2026-08-08: the heading itself is now the follow link (opens the
            profile in a new tab), replacing the separate "Follow on
            Instagram" button that used to sit below the strip -- see the
            header comment above. */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: F.display, fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800,
            textTransform: 'uppercase', marginBottom: 6, textDecoration: 'none',
          }}
        >
          {t('instagramHeading', lang)} <span style={{ color: C.inkSoft, fontWeight: 700 }}>{t('instagramHandle', lang)}</span>
          <ArrowUpRight size={13} color={C.goldDeep} />
        </a>
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
          return (
            <button
              key={post ? `${post.id}-${i}` : i}
              type="button"
              tabIndex={originalIndex !== i ? -1 : undefined}
              aria-hidden={originalIndex !== i ? true : undefined}
              className={`ump-instagram-tile${isLarge ? ' ump-instagram-tile--large' : ''}`}
              draggable={false}
              disabled={!post}
              onClick={() => {
                if (draggedPastThresholdRef.current || !post) return;
                setSelectedPost(post);
                setCaptionExpanded(false);
                setShowProductPicker(false);
                setVideoMuted(true);
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
                <div className="ump-instagram-shop-badge" aria-hidden="true">
                  <ShoppingBag size={11} /> {post?.products?.length}
                </div>
              )}
              {post?.mediaType === 'VIDEO' && (
                <div className="ump-instagram-video-badge" aria-hidden="true">
                  <Play size={11} fill="currentColor" />
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

      {selectedPost && (
        <div
          className="ump-instagram-lightbox-backdrop"
          onClick={() => setSelectedPost(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="instagram-lightbox-caption"
            className="ump-instagram-lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ump-instagram-lightbox-media">
              {selectedPost.mediaType === 'VIDEO' && selectedPost.videoUrl ? (
                <video
                  key={selectedPost.id}
                  src={selectedPost.videoUrl}
                  poster={selectedPost.imageUrl}
                  autoPlay
                  loop
                  muted={videoMuted}
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <ProductPhoto
                  tone="dark"
                  radius={0}
                  image={{ url: selectedPost.imageUrl, alt: selectedPost.captionDisplay || '' }}
                />
              )}
            </div>

            {/* Overlaid, Instagram-native chrome (2026-08-08) -- close, "view
                on Instagram", and "shop the look" all sit on top of the
                photo/video instead of in a panel below it. */}
            <div className="ump-instagram-lightbox-topbar">
              <button
                type="button"
                aria-label={lang === 'pt' ? 'Fechar' : 'Close'}
                className="ump-instagram-lightbox-close"
                onClick={() => setSelectedPost(null)}
              >
                <X size={18} />
              </button>
              <a
                href={selectedPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="ump-instagram-lightbox-pill"
              >
                <Camera size={12} />
                {lang === 'pt' ? 'Ver no Instagram' : 'View on Instagram'}
              </a>
              {selectedProducts.length === 1 && (
                <Link
                  to={`/produto/${encodeURIComponent(selectedProducts[0].slug)}${selectedProducts[0].selectedColorId ? `?cor=${encodeURIComponent(selectedProducts[0].selectedColorId)}` : ''}`}
                  onClick={() => trackMetaCustomEvent('ShopTheLookProductClick', {
                    instagram_look_id: selectedPost.id,
                    product_id: selectedProducts[0].id,
                    product_name: (lang === 'en' ? selectedProducts[0].nameEN : selectedProducts[0].namePT) || selectedProducts[0].name,
                    market,
                  })}
                  className="ump-instagram-lightbox-pill ump-instagram-lightbox-pill--gold"
                >
                  <ShoppingBag size={12} />
                  {lang === 'pt' ? 'Comprar o look' : 'Shop the look'}
                </Link>
              )}
              {/* More than one tagged product (rare, up to 4 -- see
                  resolveShopTheLookProducts): a single tap can't say which
                  one, so the pill opens a small popover instead of jumping
                  straight to a product page. */}
              {selectedProducts.length > 1 && (
                <button
                  type="button"
                  className="ump-instagram-lightbox-pill ump-instagram-lightbox-pill--gold"
                  onClick={() => setShowProductPicker((open) => !open)}
                  aria-expanded={showProductPicker}
                >
                  <ShoppingBag size={12} />
                  {lang === 'pt' ? 'Comprar o look' : 'Shop the look'} · {selectedProducts.length}
                </button>
              )}
            </div>

            {showProductPicker && selectedProducts.length > 1 && (
              <div className="ump-instagram-lightbox-picker">
                <div className="ump-instagram-lightbox-picker-scroll">
                  {selectedProducts.map((product) => (
                    <InstagramProductCard key={`${product.id}-${product.selectedColorId ?? 'any'}`} product={product} lookId={selectedPost.id} compact />
                  ))}
                </div>
                {/* Cards are tall enough now that 3+ of them routinely need
                    a scroll -- this fade is a non-interactive hint that
                    there's more below, rather than the last card just
                    looking abruptly cut off. */}
                {selectedProducts.length > 2 && <div className="ump-instagram-lightbox-picker-fade" aria-hidden="true" />}
              </div>
            )}

            {selectedPost.caption && (
              <button
                type="button"
                id="instagram-lightbox-caption"
                className="ump-instagram-lightbox-caption"
                onClick={() => setCaptionExpanded((expanded) => !expanded)}
                aria-expanded={captionExpanded}
              >
                <span style={{ WebkitLineClamp: captionExpanded ? 'unset' : 3 }}>{selectedPost.caption}</span>
              </button>
            )}

            {/* Muted autoplay + tap-to-unmute, same placement/behavior as
                Instagram's own video posts. */}
            {selectedPost.mediaType === 'VIDEO' && selectedPost.videoUrl && (
              <button
                type="button"
                aria-label={videoMuted ? (lang === 'pt' ? 'Ativar som' : 'Unmute') : (lang === 'pt' ? 'Silenciar' : 'Mute')}
                className="ump-instagram-lightbox-mute"
                onClick={() => setVideoMuted((m) => !m)}
              >
                {videoMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
