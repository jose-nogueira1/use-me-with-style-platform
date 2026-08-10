import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Heart, Search, X } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp, useFormatOriginalPrice, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { ProductCard } from '../components/ProductCard';
import { trackMetaEvent } from '../../lib/metaAnalytics';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import { colorHasStock } from '../../lib/productAdapters';
import { Seo, SITE_TITLE, truncateForMeta } from '../../lib/seo';
import { canonicalUrl } from '../../lib/seoMetadata';
import { buildProductStructuredData } from '../../lib/productStructuredData';
import { serializeJsonLd } from '../../lib/jsonLd';

// Category display names now come from the CMS categories collection (via
// product.catLabel) instead of a hardcoded slug->i18n-key map (2026-07-25).

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { market, lang, cart, dispatchCart, favorites, toggleFavorite } = useApp();
  const { products, loading } = useProducts(market, lang);
  const fmtPrice = useFormatPrice();
  const fmtOriginalPrice = useFormatOriginalPrice();

  const product = products.find((p) => p.slug === slug);

  useEffect(() => {
    if (!product) return;
    trackMetaEvent('ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: market === 'AO' ? product.effectivePriceKz : product.effectivePriceEur,
      currency: market === 'AO' ? 'AOA' : 'EUR',
    });
  }, [market, product]);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  // Gallery (2026-08-07, per-colour photo galleries): tracks the shopper's
  // manual thumbnail pick by URL rather than by index. That sidesteps
  // needing an effect to reset the selection when the colour-filtered
  // gallery below changes shape -- if the previously picked URL isn't in
  // the new list, `mainImage` below just falls back to its first photo,
  // with no extra render/effect required.
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.inkSoft }}>…</div>;
  }

  if (!product) {
    const notFoundTitle = lang === 'pt' ? `Produto não encontrado | ${SITE_TITLE}` : `Product not found | ${SITE_TITLE}`;
    const notFoundDescription = lang === 'pt'
      ? 'Este produto não existe ou já não está disponível na Use Me With Style.'
      : 'This product does not exist or is no longer available from Use Me With Style.';
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center' }}>
        <Seo title={notFoundTitle} description={notFoundDescription} robots="noindex,follow" />
        <h1 style={{ fontFamily: F.display, fontSize: 20, color: C.ink, margin: '0 0 12px' }}>{t('productNotFound', lang)}</h1>
        <button onClick={() => navigate('/catalogo')} style={{ color: C.goldDeep, fontSize: 12, textDecoration: 'underline' }}>
          {t('continueShopping', lang)}
        </button>
      </div>
    );
  }

  // Colours are taxonomy entries now; `activeColor` holds the colour's
  // stable ROW ID (2026-07-25 bilingual follow-up -- an id, not a display
  // name, since the name now varies by storefront language and the cart
  // must keep referring to the same colour if the shopper switches
  // language mid-session). `activeColorLabel` below is what's shown.
  const requestedColor = searchParams.get('cor');
  const activeColor = color ?? (product.colors.some((candidate) => candidate.id === requestedColor) ? requestedColor : product.colors[0]?.id);
  // Variant-level stock (2026-07-25): availability is per colour+size, so
  // switching colour changes which sizes are in stock.
  const stockFor = (colorId: string | null | undefined, optionValue: string | null | undefined) =>
    product.variants.find((v) => v.color === colorId && v.optionValue === optionValue)?.stock ?? 0;
  const defaultSize = product.sizes.find((candidate) => stockFor(activeColor, candidate) > 0) ?? product.sizes[Math.floor(product.sizes.length / 2)];
  const activeSize = size ?? defaultSize;
  const activeColorLabel = product.colors.find((c) => c.id === activeColor)?.name ?? activeColor;
  // Colour-filtered gallery (2026-08-07): photos tagged to the selected
  // colour win; if that colour has none of its own yet, fall back to the
  // untagged "general" pool (approved product-wide default), and if a
  // product somehow has neither (e.g. every photo tagged to a DIFFERENT
  // colour), fall back to every photo rather than showing nothing.
  const generalImages = product.images.filter((img) => !img.colorId);
  const colorImages = activeColor ? product.images.filter((img) => img.colorId === activeColor) : [];
  const galleryImages = colorImages.length > 0 ? colorImages : generalImages.length > 0 ? generalImages : product.images;
  const mainImage = galleryImages.find((img) => img.url === selectedImageUrl) ?? galleryImages[0];
  // Prev/next nav arrows (2026-08-07), alongside the thumbnail strip below.
  // Wraps at both ends so the arrows are always active with 2+ photos,
  // rather than disabling at the first/last image.
  const mainImageIndex = galleryImages.findIndex((img) => img.url === mainImage?.url);
  const goToImage = (direction: -1 | 1) => {
    if (galleryImages.length < 2) return;
    const from = mainImageIndex === -1 ? 0 : mainImageIndex;
    const next = (from + direction + galleryImages.length) % galleryImages.length;
    setSelectedImageUrl(galleryImages[next].url);
  };
  const activeVariant = product.productType === 'bundle'
    ? product.variants[0]
    : product.variants.find((variant) =>
        (variant.color ?? '') === (activeColor ?? '') && (variant.optionValue ?? '') === (activeSize ?? ''),
      ) ?? product.variants[0];
  const stockForSize = activeVariant?.stock ?? 0;
  const isLowStock = stockForSize > 0 && stockForSize <= 3;
  const isOutOfStock = stockForSize === 0;
  const isFav = favorites.has(product.id);
  const recommendations = products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  // Already-in-cart quantity for this exact colour+size, so a repeated
  // click at the stock cap can be told apart from one that actually added
  // something (2026-07-31 stock cap fix).
  const qtyInCart = cart.find((i) => i.id === product.id && (i.variantId ? i.variantId === activeVariant?.id : i.size === activeSize && i.color === activeColor))?.qty ?? 0;
  const atCartMax = !isOutOfStock && qtyInCart >= stockForSize;

  // SEO (2026-08-07, audit item 1): "product.name plus a truncated product
  // description" per the audit's own spec for this page. Falls back to the
  // same defaultDescription copy the page body itself already shows when a
  // product has no CMS description yet, so this is never blank.
  const seoTitle = `${product.name} | ${SITE_TITLE}`;
  const seoDescription = truncateForMeta(product.description || t('defaultDescription', lang));
  // og:image (2026-08-07, audit item 3): "the product's first real photo"
  // per the audit's own spec -- product.images[0].url is already an
  // absolute URL (built via absoluteMediaUrl in productAdapters.ts).
  // Undefined when a product has no photos yet, which just means "don't
  // override", leaving useSeoDefaults' wordmark fallback in place.
  const seoImage = product.images[0]?.url;
  const productUrl = canonicalUrl(typeof window === 'undefined' ? '' : window.location.origin, `/produto/${product.slug}`);
  const productJsonLd = buildProductStructuredData({
    product,
    market,
    url: productUrl,
    fallbackDescription: t('defaultDescription', lang),
  });

  const handleAdd = () => {
    if (isOutOfStock || qtyInCart >= stockForSize) return;
    // max: repeatedly clicking Add-to-Cart used to keep incrementing past
    // the same unbounded path as the cart stepper -- see cartReducer.ts.
    if (!activeVariant) return;
    dispatchCart({
      type: 'ADD',
      id: product.id,
      variantId: activeVariant.id,
      size: activeVariant.legacySize ?? activeVariant.optionValue ?? '',
      color: activeVariant.color ?? '',
      max: stockForSize,
    });
    trackMetaEvent('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: market === 'AO' ? product.effectivePriceKz : product.effectivePriceEur,
      currency: market === 'AO' ? 'AOA' : 'EUR',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{ background: C.paper, position: 'relative' }}>
      <Seo title={seoTitle} description={seoDescription} image={seoImage} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <div className="ump-product-layout">
        <div>
        <div style={{ height: 440, borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
          <ProductPhoto tone={product.tone} radius={0} image={mainImage} variant="card" priority />
          <button
            onClick={() => toggleFavorite(product.id)}
            aria-label={isFav ? (lang === 'pt' ? `Remover ${product.name} dos favoritos` : `Remove ${product.name} from favorites`) : (lang === 'pt' ? `Adicionar ${product.name} aos favoritos` : `Add ${product.name} to favorites`)}
            aria-pressed={isFav}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 38,
              height: 38,
              background: C.photoChipBg,
              borderRadius: 19,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* photoChipFg, not C.ink (2026-07-30): C.ink flips to near-white
                in dark mode and the icon disappeared against the chip at
                1.06:1. goldDeep for the active state keeps the filled heart
                above 3:1 on the chip in both themes (C.gold managed 2.2:1). */}
            <Heart size={18} fill={isFav ? C.goldDeep : 'none'} color={isFav ? C.goldDeep : C.photoChipFg} />
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goToImage(-1)}
                aria-label={lang === 'pt' ? 'Fotografia anterior' : 'Previous photo'}
                style={{
                  position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
                  width: 34, height: 34, borderRadius: 17, background: C.photoChipBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronLeft size={18} color={C.photoChipFg} />
              </button>
              <button
                type="button"
                onClick={() => goToImage(1)}
                aria-label={lang === 'pt' ? 'Próxima fotografia' : 'Next photo'}
                style={{
                  position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                  width: 34, height: 34, borderRadius: 17, background: C.photoChipBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronRight size={18} color={C.photoChipFg} />
              </button>
            </>
          )}
          {product.tags.length > 0 && (
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 'calc(100% - 70px)' }}>
              {product.tags.map((tag) => (
                <div
                  key={tag.slug}
                  style={{ background: C.black, color: C.onDarkGold, fontSize: 9, letterSpacing: 1.5, padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}
                >
                  {tagLabel(tag.label, lang)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip (2026-08-07): the page previously only ever
            showed images[0], with no way to browse the rest -- clicking a
            thumbnail here just moves selectedImageUrl, no navigation. Only
            rendered when there's more than one photo to choose from. */}
        {galleryImages.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', padding: 2 }}>
            {galleryImages.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setSelectedImageUrl(img.url)}
                aria-label={lang === 'pt' ? `Ver fotografia ${i + 1}` : `View photo ${i + 1}`}
                aria-pressed={img.url === mainImage?.url}
                style={{
                  flex: '0 0 60px', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', padding: 0,
                  border: `2px solid ${img.url === mainImage?.url ? C.goldDeep : 'transparent'}`,
                  cursor: 'pointer', background: C.subtleBg,
                }}
              >
                <img src={img.thumbnailUrl || img.cardUrl || img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
            {product.catLabel || product.cat}
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.ink, margin: '4px 0 0', fontWeight: 800 }}>{product.name}</h1>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            {product.onSale && (
              <span style={{ fontSize: 15, fontWeight: 700, color: C.inkSoft, textDecoration: 'line-through' }}>
                {fmtOriginalPrice(product)}
              </span>
            )}
            <span style={{ fontSize: 20, fontWeight: 800, color: product.onSale ? C.dangerStrong : C.ink }}>{fmtPrice(product)}</span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOutOfStock ? (
              <span style={{ fontSize: 11, color: C.danger, fontWeight: 700 }}>● {t('outOfStock', lang)}</span>
            ) : isLowStock ? (
              <span style={{ fontSize: 11, color: C.danger, fontWeight: 700 }}>● {t('fewLeftStock', lang, { n: stockForSize })}</span>
            ) : (
              <span style={{ fontSize: 11, color: C.successText, fontWeight: 700 }}>● {t('inStockCount', lang, { n: stockForSize })}</span>
            )}
          </div>

          {product.sizes.length > 0 && <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              {/* optionLabel is admin-set copy (e.g. "Tamanho"/"Capacidade") --
                  fall back to the generic "size" translation rather than
                  hiding the whole selector (and its size-guide link) when a
                  product has real size variants but no label was set. */}
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>{product.optionLabel || t('size', lang)}</div>
              {product.sizeGuide && product.sizeGuide.length > 0 && <button onClick={() => setShowSizeGuide(true)} style={{ fontSize: 10, color: C.inkSoft, textDecoration: 'underline' }}>
                {t('sizeGuide', lang)}
              </button>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {product.sizes.map((s) => {
                const outForThisSize = (activeColor ? stockFor(activeColor, s) : product.stock[s] ?? 0) === 0;
                return (
                  <button
                    key={s}
                    onClick={() => !outForThisSize && setSize(s)}
                    disabled={outForThisSize}
                    aria-pressed={activeSize === s}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: `1px solid ${activeSize === s ? C.ctaBorder : C.fieldBorder}`,
                      background: activeSize === s ? C.ctaBg : C.paper,
                      color: outForThisSize ? C.inkSoft : activeSize === s ? C.onDarkGold : C.ink,
                      opacity: outForThisSize ? 0.4 : 1,
                      textDecoration: outForThisSize ? 'line-through' : 'none',
                      cursor: outForThisSize ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>}

          {product.colors.length > 0 && <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>
              {t('colourLabel', lang)}: <span style={{ color: C.ink, fontWeight: 500, marginLeft: 4 }}>{activeColorLabel}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {product.colors.map((co) => (
                <button
                  key={co.id}
                  onClick={() => setColor(co.id)}
                  aria-pressed={activeColor === co.id}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 20,
                    border: `1.5px solid ${activeColor === co.id ? C.goldDeep : C.fieldBorder}`,
                    background: activeColor === co.id ? C.tagBg : C.paper,
                    color: activeColor === co.id ? C.goldDeep : C.ink,
                    fontWeight: activeColor === co.id ? 700 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: colorHasStock(product, co.id) ? 1 : 0.45,
                    textDecoration: colorHasStock(product, co.id) ? 'none' : 'line-through',
                  }}
                >
                  {hasSwatch(co) && (
                    <span
                      aria-hidden
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: `1px solid ${C.rule}`,
                        background: swatchBackground(co),
                      }}
                    />
                  )}
                  {co.name}
                </button>
              ))}
            </div>
          </div>}

          <div style={{ marginTop: 24, padding: '16px 0', borderTop: `1px solid ${C.ruleLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('description', lang)}
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>{product.description || t('defaultDescription', lang)}</div>
          </div>

          {product.productType === 'bundle' && product.bundleComponents.length > 0 && (
            <div style={{ marginTop: 4, padding: '16px 0', borderTop: `1px solid ${C.ruleLight}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 10 }}>
                {lang === 'pt' ? 'O que está incluído' : "What's included"}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {product.bundleComponents.map((component) => (
                  <div key={`${component.productId}:${component.variantId}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: C.ink }}>
                    <span>{component.productName}{component.optionSummary ? ` · ${component.optionSummary}` : ''}</span>
                    <strong>× {component.qty}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.specifications.length > 0 && (
            <div style={{ marginTop: 4, padding: '16px 0', borderTop: `1px solid ${C.ruleLight}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 10 }}>
                {lang === 'pt' ? 'Detalhes do produto' : 'Product details'}
              </div>
              <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
                {product.specifications.map((entry, index) => (
                  <div key={`${entry.label}:${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 0.8fr) 1.2fr', gap: 12, fontSize: 12 }}>
                    <dt style={{ color: C.inkSoft }}>{entry.label}</dt><dd style={{ margin: 0, color: C.ink }}>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div style={{ background: C.subtleBg, borderRadius: 8, padding: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '6px 0' }}>
              <span style={{ color: C.ink, fontWeight: 700, flexShrink: 0 }}>{t('shipping', lang)}</span>
              <span style={{ color: C.inkSoft, textAlign: 'right' }}>{market === 'AO' ? t('localCourierDelivery', lang) : t('businessDays', lang)}</span>
            </div>
            <div style={{ padding: '10px 0 6px', marginTop: 4, borderTop: `1px solid ${C.ruleLight}` }}>
              <div style={{ color: C.ink, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{t('returns', lang)}</div>
              <div style={{ color: C.inkSoft, fontSize: 12, lineHeight: 1.5 }}>{product.returnNote || (product.returnEligible ? t(market === 'AO' ? 'fortyEightHours' : 'fourteenDays', lang) : (lang === 'pt' ? 'Este artigo não é elegível para devolução.' : 'This item is not eligible for return.'))}</div>
            </div>
          </div>
        </div>
      </div>

      {showSizeGuide && (
        <div style={{ position: 'fixed', inset: 0, background: C.scrim, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="size-guide-title" style={{ background: C.paper, borderRadius: 10, padding: 20, width: '100%', maxWidth: 360, boxShadow: '0 20px 50px rgba(0,0,0,0.24)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div id="size-guide-title" style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800 }}>{t('sizeGuide', lang)}</div>
              <button aria-label={lang === 'pt' ? 'Fechar guia de tamanhos' : 'Close size guide'} onClick={() => setShowSizeGuide(false)}>
                <X size={18} />
              </button>
            </div>
            {product.sizeGuide && product.sizeGuide.length > 0 ? (
              (() => {
                // Only render columns that have at least one value -- e.g.
                // leggings charts may skip "bust".
                const columns = (['bust', 'waist', 'hip', 'length'] as const).filter((key) =>
                  product.sizeGuide!.some((row) => row[key] != null),
                );
                const columnLabel = { bust: 'sgBust', waist: 'sgWaist', hip: 'sgHip', length: 'sgLength' } as const;
                return (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '7px 0', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>{t('size', lang)}</th>
                          {columns.map((key) => (
                            <th key={key} style={{ textAlign: 'right', padding: '7px 0', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>
                              {t(columnLabel[key], lang)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeGuide.map((row) => (
                          <tr key={row.size} style={{ borderTop: `1px solid ${C.ruleLight}` }}>
                            <td style={{ padding: '9px 0', fontWeight: 700, color: C.ink }}>{row.size}</td>
                            {columns.map((key) => (
                              <td key={key} style={{ padding: '9px 0', textAlign: 'right', color: C.inkSoft }}>
                                {row[key] != null ? `${row[key]} cm` : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {product.fitNote && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.ruleLight}`, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>
                        {product.fitNote}
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>
                {product.fitNote ||
                  (lang === 'pt'
                    ? 'Guia de tamanhos em breve. Envie um email para support@usemewithstyle.shop para aconselhamento.'
                    : 'Size chart coming soon. Email support@usemewithstyle.shop for sizing advice.')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ump-sticky-cta ump-pd-width" style={{ background: C.paper, padding: '14px 20px', borderTop: `1px solid ${C.ruleLight}`, boxShadow: '0 -4px 12px rgba(0,0,0,0.04)', display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate('/catalogo')}
          aria-label={lang === 'pt' ? 'Explorar catálogo' : 'Browse catalogue'}
          style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.fieldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink }}
        >
          <Search size={16} />
        </button>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock || atCartMax}
          style={{
            flex: 1,
            padding: 14,
            background: added ? C.successText : isOutOfStock || atCartMax ? C.disabledBg : C.ctaBg,
            border: `1px solid ${added ? C.successText : isOutOfStock || atCartMax ? C.disabledBg : C.ctaBorder}`,
            color: added ? C.onDark : isOutOfStock || atCartMax ? C.disabledFg : C.onDarkGold,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: isOutOfStock || atCartMax ? 'not-allowed' : 'pointer',
          }}
        >
          {added ? (
            <>
              <Check size={14} /> {t('added', lang)}
            </>
          ) : isOutOfStock ? (
            t('outOfStock', lang)
          ) : atCartMax ? (
            t('allInCart', lang)
          ) : (
            <>
              {t('addToCart', lang)} · {fmtPrice(product)}
            </>
          )}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="ump-pd-width" style={{ padding: '18px 20px 24px', background: C.paper }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('completeTheLook', lang)}
          </div>
          <div className="ump-grid-auto">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TAG_KEY: Record<string, string> = { New: 'tagNew', 'Few left': 'tagFewLeft', Bestseller: 'tagBestseller', 'In stock': 'tagInStock' };
function tagLabel(tag: string, lang: Parameters<typeof t>[1]) {
  const key = TAG_KEY[tag];
  return key ? t(key, lang) : tag;
}
