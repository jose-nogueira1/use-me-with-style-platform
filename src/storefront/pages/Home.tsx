import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';
import { InstagramFeed } from '../components/InstagramFeed';
import { fetchCategories, fetchHomeContent, resolveRef, type ApiCategory, type HomeContent } from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import pictorialWhite from '../../assets/brand/pictorial-white.png';

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

export function Home() {
  const { market, lang } = useApp();
  const { products, loading } = useProducts(market, lang);
  // 2026-07-25 navbar fix: was `p.tag === 'New'`, which only ever matched
  // the English display label and broke for PT (or any renamed tag) --
  // isNewArrival is resolved once in productAdapters.ts from the merch
  // tag's raw labelPT/labelEN, independent of the current UI language.
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const featured = products.slice(0, 8);

  // Home hero content (2026-07-25 admin request): previously hardcoded via
  // i18n.ts translation keys with no admin-editable source. Fetched from
  // the CMS's home-content global; the i18n keys stay as the fallback
  // (both the initial loading moment and an unreachable CMS), and also
  // supply the defaults baked into the global itself, so nothing visibly
  // changes until the admin actually edits it in Settings.
  const [hero, setHero] = useState<HomeContent | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchHomeContent()
      .then((content) => {
        if (!cancelled) setHero(content);
      })
      .catch(() => {
        /* keep the i18n fallback below */
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
  const heroImageUrl = absoluteMediaUrl(resolveRef(hero?.heroImage)?.url);

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

  return (
    <div>
      {/* Hero, per Figma "01. Home" / "07. Desktop Home and Collection" --
          background/text use the hero* tokens so this panel (and the
          matching header background in StorefrontLayout) flips between the
          light and dark palettes along with the rest of the app. */}
      <div style={{ background: C.heroBg, color: C.heroText, padding: '36px 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div
          className="ump-hero-grid ump-content-width"
          style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.heroAccent, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>
              {heroEyebrow}
            </div>
            <h1 style={{ fontFamily: F.display, fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.01em', margin: '0 0 16px' }}>
              {heroHeadline}
            </h1>
            <div style={{ fontSize: 13, color: C.heroSubtitle, lineHeight: 1.6, marginBottom: 22, maxWidth: 420 }}>
              {heroSubtitle}
            </div>
            <Link
              to={heroCtaHref}
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
          <div className="ump-hero-photo" style={{ height: 260, borderRadius: 10, overflow: 'hidden' }}>
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <img src={pictorialWhite} alt="" style={{ width: '38%', opacity: 0.55 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="ump-content-width" style={{ padding: '24px 20px 8px' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('categories', lang)}
        </div>
        <div className="ump-cat-row">
          {categories.map((c, index) => {
            const slug = c.slug ?? String(c.id);
            const label = (lang === 'en' ? c.nameEN : c.namePT)?.trim() || c.namePT;
            const imageUrl = absoluteMediaUrl(resolveRef(c.image)?.url);
            return (
              <Link
                key={String(c.id)}
                to={`/catalogo?cat=${slug}`}
                className="ump-hover-lift ump-cat-tile"
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
                  <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <div className="ump-content-width" style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
              {t('newArrivals', lang)}
            </div>
            <Link to="/catalogo" style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, textDecoration: 'none' }}>
              {t('viewAll', lang)} →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} size="small" />
            ))}
          </div>
        </div>
      )}

      {/* Featured grid */}
      {featured.length > 0 && (
        <div className="ump-content-width" style={{ padding: '20px 20px 24px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            {t('featured', lang)}
          </div>
          <div className="ump-grid-auto">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Editorial remains out of launch scope until client content is approved. */}
      <InstagramFeed />
    </div>
  );
}
