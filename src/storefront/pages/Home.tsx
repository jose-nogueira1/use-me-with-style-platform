import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductPhoto } from '../../components/ProductPhoto';
import { InstagramFeed } from '../components/InstagramFeed';
import { fetchHomeContent, resolveRef, type HomeContent } from '../../lib/api';
import { absoluteMediaUrl } from '../../lib/productAdapters';

const CATEGORIES = [
  { key: 'vestidos', labelKey: 'dresses', tone: 'rose' as const },
  { key: 'tops', labelKey: 'tops', tone: 'dark' as const },
  { key: 'leggings', labelKey: 'leggings', tone: 'blue' as const },
  { key: 'conjuntos', labelKey: 'sets', tone: 'gold' as const },
];

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
  const heroCtaHref = hero?.heroCtaHref?.trim() || '/catalogo';
  const heroImageUrl = absoluteMediaUrl(resolveRef(hero?.heroImage)?.url);

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
              <ProductPhoto tone="gold" radius={10} />
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
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={`/catalogo?cat=${c.key}`}
              className="ump-hover-lift"
              style={{
                flexShrink: 0,
                minWidth: 96,
                background: C.paper,
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: `1px solid ${C.ruleLight}`,
                textDecoration: 'none',
              }}
            >
              <div style={{ width: 60, height: 64, borderRadius: 6, overflow: 'hidden' }}>
                <ProductPhoto tone={c.tone} radius={6} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: C.ink, textAlign: 'center' }}>{t(c.labelKey, lang)}</div>
            </Link>
          ))}
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
