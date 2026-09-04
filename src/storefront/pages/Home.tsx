import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';
import { InstagramFeed } from '../components/InstagramFeed';
import {
  fetchCategories,
  fetchHomeHero,
  fetchHomeCategories,
  fetchHomeCollections,
  fetchStorefrontContent,
  resolveRef,
  type ApiCategory,
  type HomeHero,
  type HomeCategories,
  type HomeCollections,
  type StorefrontContent,
} from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { Seo } from '../../lib/seo';
import { homeSeoMetadata } from '../../lib/storefrontContent';
import pictorialWhite from '../../assets/brand/pictorial-white.png';
import type { Product } from '../../types/product';

// Category tiles were a hardcoded list with no admin-editable image
// (2026-07-25 admin request: "I want the admin to be able to change the
// images on the categories"). Now fetched from the CMS like Browse.tsx's
// filter pills -- this fallback covers only the brief moment before the
// fetch resolves (and an unreachable CMS).
const FALLBACK_CATEGORIES: ApiCategory[] = [
  { id: 'vestidos', namePT: 'Vestidos', nameEN: 'Dresses', slug: 'vestidos' },
  { id: 'tops', namePT: 'Tops', nameEN: 'Tops', slug: 'tops' },
  { id: 'leggings', namePT: 'Leggings', nameEN: 'Leggings', slug: 'leggings' },
  { id: 'conjuntos', namePT: 'Conjuntos', nameEN: 'Sets', slug: 'conjuntos' },
];
const CATEGORY_TONE_CYCLE: ProductTone[] = ['rose', 'dark', 'blue', 'gold'];

function HomeProductShelf({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number; pointerId: number } | null>(null);
  const paginationDragRef = useRef<{ startX: number; pointerId: number } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressPaginationClickRef = useRef(false);
  const [activeDot, setActiveDot] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaginationDragging, setIsPaginationDragging] = useState(false);

  const updateActiveDot = useCallback(() => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    const overflowing = track.scrollWidth > track.clientWidth;
    setHasOverflow(overflowing);
    setCanScrollPrev(track.scrollLeft > 1);
    setCanScrollNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 1);
    if (!overflowing) {
      setActiveDot(0);
      return;
    }
    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    if (track.scrollLeft >= maxScrollLeft - 1) {
      setActiveDot(products.length - 1);
      return;
    }
    const step = firstCard.offsetWidth + 10;
    setActiveDot(Math.max(0, Math.min(products.length - 1, Math.round(track.scrollLeft / step))));
  }, [products.length]);

  useEffect(() => {
    updateActiveDot();
    window.addEventListener('resize', updateActiveDot);
    return () => window.removeEventListener('resize', updateActiveDot);
  }, [products.length, updateActiveDot]);

  const handleShelfPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragRef.current = {
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      pointerId: event.pointerId,
    };
    suppressClickRef.current = false;
  };

  const handleShelfPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) < 4) return;
    suppressClickRef.current = true;
    setIsDragging(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
  };

  const finishShelfDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleShelfClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const scrollToProduct = (index: number) => {
    setActiveDot(index);
    trackRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  const scrollShelf = (direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    track.scrollBy({ left: direction * (firstCard.offsetWidth + 10), behavior: 'smooth' });
  };

  const handlePaginationPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    paginationDragRef.current = { startX: event.clientX, pointerId: event.pointerId };
    suppressPaginationClickRef.current = false;
  };

  const handlePaginationPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = paginationDragRef.current;
    const track = trackRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !track) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) < 4) return;
    suppressPaginationClickRef.current = true;
    setIsPaginationDragging(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    track.scrollLeft = progress * (track.scrollWidth - track.clientWidth);
  };

  const finishPaginationDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (paginationDragRef.current?.pointerId !== event.pointerId) return;
    paginationDragRef.current = null;
    setIsPaginationDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePaginationClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressPaginationClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressPaginationClickRef.current = false;
  };

  return (
    <>
      <div className="ump-home-shelf-wrap">
        <div
          ref={trackRef}
          className={`ump-home-shelf-track${isDragging ? ' ump-home-shelf-track-dragging' : ''}`}
          onScroll={updateActiveDot}
          onPointerDown={handleShelfPointerDown}
          onPointerMove={handleShelfPointerMove}
          onPointerUp={finishShelfDrag}
          onPointerCancel={finishShelfDrag}
          onClickCapture={handleShelfClickCapture}
          onDragStart={(event) => event.preventDefault()}
          style={{ display: 'flex', gap: 10, overflowX: 'auto' }}
        >
          {products.map((product) => <ProductCard key={product.id} product={product} size="small" homepage />)}
        </div>
        {hasOverflow && (
          <>
            {canScrollPrev && (
              <button
                type="button"
                className="ump-home-shelf-arrow ump-home-shelf-arrow-prev"
                aria-label="Previous products"
                onClick={() => scrollShelf(-1)}
              >
                <ChevronLeft size={47} strokeWidth={2.25} aria-hidden="true" />
              </button>
            )}
            {canScrollNext && (
              <button
                type="button"
                className="ump-home-shelf-arrow ump-home-shelf-arrow-next"
                aria-label="Next products"
                onClick={() => scrollShelf(1)}
              >
                <ChevronRight size={47} strokeWidth={2.25} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>
      {hasOverflow && products.length > 1 && (
        <div
          className="ump-home-shelf-dots"
          data-dragging={isPaginationDragging || isDragging ? 'true' : undefined}
          aria-label="Shelf pagination"
          onPointerDown={handlePaginationPointerDown}
          onPointerMove={handlePaginationPointerMove}
          onPointerUp={finishPaginationDrag}
          onPointerCancel={finishPaginationDrag}
          onClickCapture={handlePaginationClickCapture}
        >
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={`ump-home-shelf-dot${index === activeDot ? ' ump-home-shelf-dot-active' : ''}`}
              aria-label={`Show product ${index + 1}`}
              aria-current={index === activeDot ? 'true' : undefined}
              onClick={() => scrollToProduct(index)}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function Home() {
  const { market, lang } = useApp();
  const { products, loading } = useProducts(market, lang);
  // 2026-07-25 navbar fix: was `p.tag === 'New'`, which only ever matched
  // the English display label and broke for PT (or any renamed tag) --
  // isNewArrival is resolved once in productAdapters.ts from the merch
  // tag's raw labelPT/labelEN, independent of the current UI language.
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const fallbackFeatured = products.slice(0, 8);

  // Home page content (2026-07-25 admin request): previously hardcoded via
  // i18n.ts translation keys with no admin-editable source. Fetched from
  // the CMS -- split 2026-08-04 into three independent globals (hero,
  // category row, tag-driven collections), each with its own save/version
  // history in Settings, so fetched as three separate calls here. The i18n
  // keys stay as the fallback (both the initial loading moment and an
  // unreachable CMS), and also supply the defaults baked into each global
  // itself, so nothing visibly changes until the admin actually edits it.
  const [hero, setHero] = useState<HomeHero | null>(null);
  const [homeCategories, setHomeCategories] = useState<HomeCategories | null>(null);
  const [homeCollections, setHomeCollections] = useState<HomeCollections | null>(null);
  const [storefrontContent, setStorefrontContent] = useState<StorefrontContent | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchHomeHero()
      .then((content) => {
        if (!cancelled) setHero(content);
      })
      .catch(() => {
        /* keep the i18n fallback below */
      });
    fetchHomeCategories()
      .then((content) => {
        if (!cancelled) setHomeCategories(content);
      })
      .catch(() => {
        /* keep the "show every category" fallback below */
      });
    fetchHomeCollections()
      .then((content) => {
        if (!cancelled) setHomeCollections(content);
      })
      .catch(() => {
        /* keep the New Arrivals/Featured fallback below */
      });
    fetchStorefrontContent()
      .then((content) => {
        if (!cancelled) setStorefrontContent(content);
      })
      .catch(() => {
        /* keep the market-aware metadata fallback below */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroEyebrow = (lang === 'en' ? hero?.heroEyebrowEN : hero?.heroEyebrowPT)?.trim() || t('ss26Collection', lang);
  const heroHeadline = (lang === 'en' ? hero?.heroHeadlineEN : hero?.heroHeadlinePT)?.trim() || t('heroHeadline', lang);
  const heroSubtitle = (lang === 'en' ? hero?.heroSubtitleEN : hero?.heroSubtitlePT)?.trim() || t('heroSubtitle', lang);
  const heroCtaLabel = (lang === 'en' ? hero?.heroCtaLabelEN : hero?.heroCtaLabelPT)?.trim() || t('shopAll', lang);
  // 2026-07-31 fix: heroCtaHref (a hand-typed URL, prone to slug typos/drift)
  // is replaced by heroCtaType + a slug picked from a real dropdown --
  // derive the actual href here instead of trusting a raw string.
  const heroCtaHref =
    hero?.heroCtaType === 'tag' && hero.heroCtaTagSlug
      ? `/catalogo?tag=${encodeURIComponent(hero.heroCtaTagSlug)}`
      : hero?.heroCtaType === 'category' && hero.heroCtaCategorySlug
        ? `/catalogo?cat=${encodeURIComponent(hero.heroCtaCategorySlug)}`
        : '/catalogo';
  const heroImage = resolveRef(hero?.heroImage);
  const heroImageUrl = absoluteMediaUrl(heroImage?.sizes?.large?.url ?? heroImage?.sizes?.hero?.url ?? heroImage?.url);
  const heroImageSrcSet = [
    [heroImage?.sizes?.small?.url, 480],
    [heroImage?.sizes?.medium?.url, 960],
    [heroImage?.sizes?.large?.url, 1600],
    [heroImage?.sizes?.hero?.url, 2560],
  ]
    .flatMap(([url, width]) => {
      const absolute = absoluteMediaUrl(typeof url === 'string' ? url : undefined);
      return absolute ? [`${absolute} ${width}w`] : [];
    })
    .join(', ');
  const heroImageMobile = resolveRef(hero?.heroImageMobile) ?? heroImage;
  const heroImageMobileUrl = absoluteMediaUrl(heroImageMobile?.sizes?.large?.url ?? heroImageMobile?.sizes?.medium?.url ?? heroImageMobile?.url);
  const heroImageMobileSrcSet = [
    [heroImageMobile?.sizes?.small?.url, 480],
    [heroImageMobile?.sizes?.medium?.url, 960],
    [heroImageMobile?.sizes?.large?.url, 1600],
  ]
    .flatMap(([url, width]) => {
      const absolute = absoluteMediaUrl(typeof url === 'string' ? url : undefined);
      return absolute ? [`${absolute} ${width}w`] : [];
    })
    .join(', ');

  // Homepage curation (2026-08-04, "admin should have total control here"
  // over which categories and merch-tag shelves appear on the homepage --
  // plus a follow-up asking for e.g. an "SS26" shelf alongside New
  // Arrivals/Featured). hero.collections generalises both the New Arrivals
  // and Featured sections below into any number of admin-defined,
  // tag-driven shelves. Empty -> falls back to exactly the newArrivals/
  // featured sections defined above, unchanged, so nothing visibly changes
  // until an admin actually configures a collection in Settings.
  const customCollections = (homeCollections?.collections ?? [])
    .filter((c) => c.tagSlug)
    .map((c) => {
      const limit = Math.max(1, Math.min(24, c.itemLimit ?? 8));
      return {
        key: c.id ?? c.tagSlug,
        tagSlug: c.tagSlug,
        title: (lang === 'en' ? c.titleEN : c.titlePT)?.trim() || c.titleEN?.trim() || c.titlePT?.trim() || c.tagSlug,
        items: products.filter((p) => p.tags.some((tag) => tag.slug === c.tagSlug)).slice(0, limit),
      };
    })
    .filter((shelf) => shelf.items.length > 0);
  /* FUTURE_FEATURED_CURATED: preserve the former market-specific curated
     featured selection here if the storefront needs it again. For now,
     Featured is just another merchandising-tag shelf in customCollections. */

  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATEGORIES);
  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((docs) => {
        if (!cancelled && docs.length > 0) setCategories(docs);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Which categories show in the row, and in what order (2026-08-04) --
  // hero.homepageCategorySlugs, when set, picks a subset/order out of the
  // full `categories` list already fetched above; unmatched slugs (a
  // category renamed/deleted since) are silently skipped rather than
  // showing a broken tile. Empty -> every category shows, unchanged.
  const displayCategories = homeCategories?.homepageCategorySlugs?.length
    ? (homeCategories.homepageCategorySlugs
        .map((entry) => categories.find((c) => c.slug === entry.slug))
        .filter((c): c is ApiCategory => c !== undefined))
    : categories;

  // Desktop click-and-drag scrolling for the category carousel (2026-08-08,
  // alongside the .ump-cat-row/.ump-cat-tile carousel fix in App.tsx) --
  // mouse only, same "defer pointer capture until a real drag is detected"
  // technique already fixed/proven in InstagramFeed.tsx's onPointerMove
  // (capturing on every pointerdown, including plain clicks, suppressed the
  // browser's synthesized click on the nested Link). Touch/pen fall through
  // to native scrolling, same reasoning as that file's onPointerDown. No
  // auto-scroll loop here -- unlike an endless content feed, this is a
  // short, fixed set of navigation tiles a shopper is actively choosing
  // from, so nothing should be advancing on its own while they're deciding.
  const catTrackRef = useRef<HTMLDivElement>(null);
  const catDraggingRef = useRef(false);
  const catDraggedPastThresholdRef = useRef(false);
  const catDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const onCatPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const track = catTrackRef.current;
    if (!track) return;
    catDraggingRef.current = true;
    catDraggedPastThresholdRef.current = false;
    catDragStartRef.current = { x: e.clientX, scrollLeft: track.scrollLeft };
  };
  const onCatPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!catDraggingRef.current) return;
    const track = catTrackRef.current;
    if (!track) return;
    const dx = e.clientX - catDragStartRef.current.x;
    if (!catDraggedPastThresholdRef.current && Math.abs(dx) > 4) {
      catDraggedPastThresholdRef.current = true;
      track.setPointerCapture(e.pointerId);
    }
    if (catDraggedPastThresholdRef.current) {
      track.scrollLeft = catDragStartRef.current.scrollLeft - dx;
    }
  };
  const endCatDrag = () => {
    catDraggingRef.current = false;
  };

  // SEO audit item 15: use dedicated, admin-editable market metadata instead
  // of recycling the visual hero copy. AO explicitly surfaces Luanda delivery
  // and the currently active Multicaixa methods; PT keeps separate, accurate
  // Portugal positioning. The admin guidance prevents claiming AppyPay before
  // its operational switch is enabled.
  const { title: seoTitle, description: seoDescription } = homeSeoMetadata(market, lang, storefrontContent);

  return (
    <div>
      {/* og:image (2026-08-07, audit item 3): heroImageUrl is already an
          absolute URL (or undefined, when no CMS hero image is set and the
          gradient placeholder below is showing instead) -- undefined just
          means "don't override", leaving useSeoDefaults' wordmark fallback
          in place rather than pointing a link preview at a placeholder. */}
      <Seo title={seoTitle} description={seoDescription} image={heroImageUrl} />
      {/* Hero, per Figma "01. Home" / "07. Desktop Home and Collection" --
          background/text use the hero* tokens so this panel (and the
          matching header background in StorefrontLayout) flips between the
          light and dark palettes along with the rest of the app. */}
      <div className="ump-home-hero" style={{ background: C.heroBg, color: C.heroText, padding: '36px 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div
          className="ump-hero-grid ump-content-width"
          style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}
        >
          <div className="ump-hero-copy">
            <div className="ump-hero-eyebrow" style={{ fontSize: 10, letterSpacing: 3, color: C.heroAccent, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>
              {heroEyebrow}
            </div>
            <h1 className="ump-hero-headline" style={{ fontFamily: F.display, fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.01em', margin: '0 0 16px' }}>
              {heroHeadline}
            </h1>
            <div className="ump-hero-subtitle" style={{ fontSize: 13, color: C.heroSubtitle, lineHeight: 1.6, marginBottom: 22, maxWidth: 420 }}>
              {heroSubtitle}
            </div>
            <Link
              to={heroCtaHref}
              className="ump-hero-cta"
              style={{
                display: 'inline-block',
                padding: '13px 22px',
                background: C.champagne,
                border: `1px solid ${C.heroCtaBorder}`,
                color: C.black,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              {heroCtaLabel}
            </Link>
          </div>
          <div className="ump-hero-photo" style={{ aspectRatio: '3 / 2', borderRadius: 10, overflow: 'hidden' }}>
            {heroImageUrl ? (
              <>
                <picture>
                  {heroImageMobileUrl && <source media="(max-width: 859px)" srcSet={heroImageMobileSrcSet || heroImageMobileUrl} sizes="100vw" />}
                  <img
                    src={heroImageUrl}
                    srcSet={heroImageSrcSet || undefined}
                    sizes="(max-width: 859px) 100vw, 58vw"
                    alt={heroImage?.alt?.trim() || (lang === 'pt' ? 'Coleção Use Me With Style' : 'Use Me With Style collection')}
                    width={1600}
                    height={1067}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </picture>
                <div className="ump-hero-shade" aria-hidden="true" />
              </>
            ) : (
              // Hero placeholder (2026-07-25, option "B" picked from three
              // mocked-up alternatives after user feedback that the previous
              // abstract "garment stripes" ProductPhoto read as an obvious
              // dev placeholder): a soft duotone gradient with the brand's
              // pictorial mark (a dress-on-hanger line icon, already used in
              // the header/footer) watermarked faintly in the middle. Same
              // gold family as ProductPhoto's 'gold' tone, so it still reads
              // as "on-brand, temporary" rather than a different accent
              // color -- swapped out the moment an admin uploads a real photo.
              <>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #EEE4D4 0%, #D0B165 55%, #CAA039 100%)',
                  }}
                >
                  <img src={pictorialWhite} alt="" width={400} height={268} loading="eager" fetchPriority="high" decoding="async" style={{ width: '38%', height: 'auto', opacity: 0.55 }} />
                </div>
                <div className="ump-hero-shade" aria-hidden="true" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="ump-content-width" style={{ padding: '24px 20px 8px' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('categories', lang)}
        </div>
        <div
          ref={catTrackRef}
          className="ump-cat-row"
          onPointerDown={onCatPointerDown}
          onPointerMove={onCatPointerMove}
          onPointerUp={endCatDrag}
          onPointerCancel={endCatDrag}
          onMouseLeave={endCatDrag}
        >
          {displayCategories.map((c, index) => {
            const slug = c.slug ?? String(c.id);
            const label = (lang === 'en' ? c.nameEN : c.namePT)?.trim() || c.namePT;
            const categoryImage = resolveRef(c.image);
            const imageUrl = absoluteMediaUrl(categoryImage?.sizes?.medium?.url ?? categoryImage?.sizes?.small?.url ?? categoryImage?.url);
            const imageSrcSet = [
              [categoryImage?.sizes?.small?.url, 480],
              [categoryImage?.sizes?.medium?.url, 960],
            ]
              .flatMap(([url, width]) => {
                const absolute = absoluteMediaUrl(typeof url === 'string' ? url : undefined);
                return absolute ? [`${absolute} ${width}w`] : [];
              })
              .join(', ');
            return (
              <Link
                key={String(c.id)}
                to={`/catalogo?cat=${slug}`}
                className="ump-hover-lift ump-cat-tile"
                draggable={false}
                onClick={(e) => {
                  if (catDraggedPastThresholdRef.current) e.preventDefault();
                }}
                style={{
                  position: 'relative',
                  display: 'block',
                  aspectRatio: '3 / 4',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${C.ruleLight}`,
                  textDecoration: 'none',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    srcSet={imageSrcSet || undefined}
                    sizes="(max-width: 640px) 70vw, 280px"
                    alt=""
                    width={1200}
                    height={1600}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <ProductPhoto tone={CATEGORY_TONE_CYCLE[index % CATEGORY_TONE_CYCLE.length]} radius={0} />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: C.tileScrim,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    bottom: 12,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    // Sits on the tileScrim gradient, which darkens whatever
                    // artwork is beneath it -- so this stays constant across
                    // themes by design (11.7:1 over the scrim).
                    color: C.onDark,
                  }}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: C.inkSoft }}>{t('loadingProducts', lang)}</div>}

      {customCollections.length > 0 ? (
        // Admin-curated shelves (2026-08-04) -- any number of tag-driven
        // collections configured in Settings, in the order the admin set.
        // Same horizontal-scroll-with-"View all" layout New Arrivals
        // already used, reused here so a shopper sees a consistent pattern
        // regardless of how many shelves the admin has configured.
        customCollections.map((shelf) => (
          <div key={shelf.key} className="ump-content-width" style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
                {shelf.title}
              </div>
              <Link to={`/catalogo?tag=${encodeURIComponent(shelf.tagSlug)}`} style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, textDecoration: 'none' }}>
                {t('viewAll', lang)} →
              </Link>
            </div>
            <HomeProductShelf products={shelf.items} />
          </div>
        ))
      ) : (
        <>
          {/* New arrivals */}
          {newArrivals.length > 0 && (
            <div className="ump-content-width" style={{ padding: '20px 20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
                  {t('newArrivals', lang)}
                </div>
                <Link to="/catalogo?cat=new" style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, textDecoration: 'none' }}>
                  {t('viewAll', lang)} →
                </Link>
              </div>
              <HomeProductShelf products={newArrivals} />
            </div>
          )}

          {/* Featured grid */}
          {fallbackFeatured.length > 0 && (
            <div className="ump-content-width" style={{ padding: '20px 20px 24px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
                {t('featured', lang)}
              </div>
              <HomeProductShelf products={fallbackFeatured} />
            </div>
          )}
        </>
      )}

      {/* Editorial remains out of launch scope until client content is approved. */}
      <InstagramFeed />
    </div>
  );
}
