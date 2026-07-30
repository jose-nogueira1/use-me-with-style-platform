import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, Search, X } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp, useFormatOriginalPrice, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { ProductCard } from '../components/ProductCard';
import { trackMetaEvent } from '../../lib/metaAnalytics';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';

// Category display names now come from the CMS categories collection (via
// product.catLabel) instead of a hardcoded slug->i18n-key map (2026-07-25).

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { market, lang, dispatchCart, favorites, toggleFavorite } = useApp();
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

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.inkSoft }}>…</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '60px 30px', textAlign: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 20, color: C.ink, marginBottom: 12 }}>{t('productNotFound', lang)}</div>
        <button onClick={() => navigate('/catalogo')} style={{ color: C.goldDeep, fontSize: 12, textDecoration: 'underline' }}>
          {t('continueShopping', lang)}
        </button>
      </div>
    );
  }

  const activeSize = size ?? product.sizes[Math.floor(product.sizes.length / 2)];
  // Colours are taxonomy entries now; `activeColor` holds the colour's
  // stable ROW ID (2026-07-25 bilingual follow-up -- an id, not a display
  // name, since the name now varies by storefront language and the cart
  // must keep referring to the same colour if the shopper switches
  // language mid-session). `activeColorLabel` below is what's shown.
  const activeColor = color ?? product.colors[0]?.id;
  const activeColorLabel = product.colors.find((c) => c.id === activeColor)?.name ?? activeColor;
  // Variant-level stock (2026-07-25): availability is per colour+size, so
  // switching colour changes which sizes are in stock.
  const stockFor = (colorId: string | undefined, sizeName: string) =>
    product.variants.find((v) => v.color === colorId && v.size === sizeName)?.stock ?? 0;
  const colorHasStock = (colorId: string) => product.variants.some((v) => v.color === colorId && v.stock > 0);
  const stockForSize = activeColor ? stockFor(activeColor, activeSize) : product.stock[activeSize] ?? 0;
  const isLowStock = stockForSize > 0 && stockForSize <= 3;
  const isOutOfStock = stockForSize === 0;
  const isFav = favorites.has(product.id);
  const recommendations = products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
    if (isOutOfStock) return;
    dispatchCart({ type: 'ADD', id: product.id, size: activeSize, color: activeColor });
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
      <div className="ump-product-layout">
        <div style={{ height: 440, borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
          <ProductPhoto tone={product.tone} radius={0} image={product.images[0]} />
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
          {product.tag && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: C.black, color: C.onDarkGold, fontSize: 9, letterSpacing: 1.5, padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>
              {tagLabel(product.tag, lang)}
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

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase' }}>{t('size', lang)}</div>
              <button onClick={() => setShowSizeGuide(true)} style={{ fontSize: 10, color: C.inkSoft, textDecoration: 'underline' }}>
                {t('sizeGuide', lang)}
              </button>
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
          </div>

          <div style={{ marginTop: 20 }}>
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
                    border: `1.5px solid ${activeColor === co.id ? C.gold : C.fieldBorder}`,
                    background: activeColor === co.id ? C.tagBg : C.paper,
                    color: activeColor === co.id ? C.goldDeep : C.ink,
                    fontWeight: activeColor === co.id ? 700 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: colorHasStock(co.id) ? 1 : 0.45,
                    textDecoration: colorHasStock(co.id) ? 'none' : 'line-through',
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
          </div>

          <div style={{ marginTop: 24, padding: '16px 0', borderTop: `1px solid ${C.ruleLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('description', lang)}
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }}>{product.description || t('defaultDescription', lang)}</div>
          </div>

          <div style={{ background: C.subtleBg, borderRadius: 8, padding: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0' }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>{t('shipping', lang)}</span>
              <span style={{ color: C.inkSoft }}>{market === 'AO' ? t('localCourierDelivery', lang) : t('businessDays', lang)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0' }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>{t('returns', lang)}</span>
              <span style={{ color: C.inkSoft }}>{t(market === 'AO' ? 'fortyEightHours' : 'fourteenDays', lang)}</span>
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
                    ? 'Guia de tamanhos em breve. Fale connosco pelo WhatsApp para conselhos de tamanho.'
                    : 'Size chart coming soon. Message us on WhatsApp for sizing advice.')}
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
          disabled={isOutOfStock}
          style={{
            flex: 1,
            padding: 14,
            background: added ? C.successText : isOutOfStock ? C.disabledBg : C.ctaBg,
            border: `1px solid ${added ? C.successText : isOutOfStock ? C.disabledBg : C.ctaBorder}`,
            color: added ? C.onDark : isOutOfStock ? C.disabledFg : C.onDarkGold,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
          }}
        >
          {added ? (
            <>
              <Check size={14} /> {t('added', lang)}
            </>
          ) : isOutOfStock ? (
            t('outOfStock', lang)
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
