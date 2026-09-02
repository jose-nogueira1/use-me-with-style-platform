import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp, useFormatOriginalPrice, useFormatPrice } from '../../state/AppContext';
import { ProductPhoto } from '../../components/ProductPhoto';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import { colorHasStock } from '../../lib/productAdapters';
import type { Product } from '../../types/product';

// How many colour dots to show before collapsing into a "+N" overflow chip
// (2026-08-07: colour availability at a glance on the catalogue/search grid,
// not just on the product page) -- keeps a product with a large colour range
// from blowing out the card's fixed-height footer.
const MAX_VISIBLE_SWATCHES = 6;

const TAG_STYLE: Record<string, { bg: string; text: string }> = {
  'In stock': { bg: C.successBg, text: C.successText },
};
const DEFAULT_TAG_STYLE = { bg: C.tagBg, text: C.goldDeep };
const TAG_KEY: Record<string, string> = { New: 'tagNew', 'Few left': 'tagFewLeft', Bestseller: 'tagBestseller', 'In stock': 'tagInStock' };

export function ProductCard({ product, size = 'grid', priority = false, homepage = false }: { product: Product; size?: 'small' | 'grid'; priority?: boolean; homepage?: boolean }) {
  const { lang } = useApp();
  const fmtPrice = useFormatPrice();
  const fmtOriginalPrice = useFormatOriginalPrice();
  const isSmall = size === 'small';

  return (
    <Link
      to={`/produto/${product.slug}`}
      className={`ump-hover-lift${homepage ? ' ump-home-product-card' : ''}`}
      style={{
        flexShrink: isSmall ? 0 : undefined,
        width: isSmall ? (homepage ? 258.75 : 215.625) : undefined,
        display: 'block',
        background: C.paper,
        borderRadius: 8,
        overflow: 'hidden',
        textAlign: 'left',
        border: `1px solid ${C.ruleLight}`,
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
      }}
    >
      <div style={{ aspectRatio: '3 / 4', width: '100%', position: 'relative', background: C.subtleBg }}>
        <div style={{ width: '100%', height: '100%', opacity: product.marketStatus === 'sold_out' ? 0.55 : 1 }}>
          <ProductPhoto tone={product.tone} radius={0} image={product.images[0]} variant="card" priority={priority} />
        </div>
        {(product.marketStatus === 'sold_out' || product.marketStatus === 'low_stock') && (
          <div
            aria-label={product.marketStatus === 'sold_out' ? t('outOfStock', lang) : t('fewLeftStock', lang, { n: product.marketStock })}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 3,
              background: product.marketStatus === 'sold_out' ? C.danger : C.tagBg,
              color: product.marketStatus === 'sold_out' ? C.paper : C.dangerStrong,
              fontSize: 9,
              fontWeight: 800,
              padding: '6px 9px',
              borderRadius: 6,
              border: `1px solid ${product.marketStatus === 'sold_out' ? C.danger : C.rule}`,
              borderRadius: '0 0 0 6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            {product.marketStatus === 'sold_out' ? t('outOfStock', lang) : t('fewLeftStock', lang, { n: product.marketStock })}
          </div>
        )}
        {product.marketStatus === 'sold_out' && (
          <span aria-hidden style={{ position: 'absolute', left: '-33.35%', top: '50%', width: '166.7%', height: 3, zIndex: 2, background: C.dangerStrong, transform: 'rotate(53.13deg)', pointerEvents: 'none' }} />
        )}
      </div>
      <div style={{ padding: '10px 8px 12px', opacity: product.marketStatus === 'sold_out' ? 0.55 : 1 }}>
        {/* Multi-select since 2026-07-31 -- a product can carry more than
            one badge (e.g. both "Novidade" and "Bestseller") at once. */}
        {product.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {product.tags.map((tag) => {
              const tagStyle = TAG_STYLE[tag.label] ?? DEFAULT_TAG_STYLE;
              return (
                <div
                  key={tag.slug}
                  style={{
                    display: 'inline-block',
                    background: tagStyle.bg,
                    color: tagStyle.text,
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${C.rule}`,
                  }}
                >
                  {t(TAG_KEY[tag.label] || '', lang) || tag.label}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 800, color: C.ink }}>{product.name}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          {product.onSale && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft, textDecoration: 'line-through' }}>
              {fmtOriginalPrice(product)}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 800, color: product.onSale ? C.dangerStrong : C.ink }}>{fmtPrice(product)}</span>
        </div>
        {/* Colour availability at a glance (2026-08-07): a diagonal strike
            reuses the exact same "sold out in this colour" rule as the
            product page's colour pills (colorHasStock) -- and since a
            circular dot has no text baseline for CSS's own line-through to
            hang off, the strike here is a small rotated bar drawn on top. */}
        {product.colors.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {product.colors.slice(0, MAX_VISIBLE_SWATCHES).map((co) => {
              const inStock = colorHasStock(product, co.id);
              return (
                <span key={co.id} title={co.name} style={{ position: 'relative', width: 12, height: 12, flexShrink: 0, display: 'inline-block' }}>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: `1px solid ${C.rule}`,
                      background: hasSwatch(co) ? swatchBackground(co) : C.subtleBg,
                      opacity: inStock ? 1 : 0.4,
                    }}
                  />
                  {!inStock && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: -1,
                        right: -1,
                        top: 5,
                        height: 1.5,
                        background: C.dangerStrong,
                        transform: 'rotate(-45deg)',
                      }}
                    />
                  )}
                </span>
              );
            })}
            {product.colors.length > MAX_VISIBLE_SWATCHES && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.inkSoft }}>
                +{product.colors.length - MAX_VISIBLE_SWATCHES}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
