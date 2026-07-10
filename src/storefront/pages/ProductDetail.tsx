import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, Search, X } from 'lucide-react';
import { C, F, t } from '../../theme';
import { useApp, useFormatPrice } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductPhoto } from '../../components/ProductPhoto';
import { ProductCard } from '../components/ProductCard';

const CAT_LABEL_KEY: Record<string, string> = { vestidos: 'dresses', tops: 'tops', leggings: 'leggings', conjuntos: 'sets' };

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { market, lang, dispatchCart, favorites, toggleFavorite } = useApp();
  const { products, loading } = useProducts(market);
  const fmtPrice = useFormatPrice();

  const product = products.find((p) => p.slug === slug);

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
  const activeColor = color ?? product.colors[0];
  const stockForSize = product.stock[activeSize] ?? 10;
  const isLowStock = stockForSize > 0 && stockForSize <= 3;
  const isOutOfStock = stockForSize === 0;
  const isFav = favorites.has(product.id);
  const recommendations = products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
    if (isOutOfStock) return;
    dispatchCart({ type: 'ADD', id: product.id, size: activeSize, color: activeColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{ background: C.paper, position: 'relative' }}>
      <div className="ump-product-layout">
        <div style={{ height: 440, borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
          <ProductPhoto tone={product.tone} radius={0} />
          <button
            onClick={() => toggleFavorite(product.id)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 38,
              height: 38,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 19,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Heart size={18} fill={isFav ? C.gold : 'none'} color={isFav ? C.gold : C.ink} />
          </button>
          {product.tag && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: C.black, color: C.onDarkGold, fontSize: 9, letterSpacing: 1.5, padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>
              {tagLabel(product.tag, lang)}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
            {t(CAT_LABEL_KEY[product.cat] ?? 'sets', lang)}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 26, color: C.ink, marginTop: 4, fontWeight: 800 }}>{product.name}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.black }}>{fmtPrice(product)}</span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOutOfStock ? (
              <span style={{ fontSize: 11, color: '#A6483A', fontWeight: 700 }}>● {t('outOfStock', lang)}</span>
            ) : isLowStock ? (
              <span style={{ fontSize: 11, color: '#A6483A', fontWeight: 700 }}>● {t('fewLeftStock', lang, { n: stockForSize })}</span>
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
                const outForThisSize = (product.stock[s] ?? 10) === 0;
                return (
                  <button
                    key={s}
                    onClick={() => !outForThisSize && setSize(s)}
                    disabled={outForThisSize}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: `1px solid ${activeSize === s ? C.black : C.rule}`,
                      background: activeSize === s ? C.black : C.paper,
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
              {t('colourLabel', lang)}: <span style={{ color: C.ink, fontWeight: 500, marginLeft: 4 }}>{activeColor}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {product.colors.map((co) => (
                <button
                  key={co}
                  onClick={() => setColor(co)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 20,
                    border: `1.5px solid ${activeColor === co ? C.gold : C.rule}`,
                    background: activeColor === co ? C.tagBg : C.paper,
                    color: activeColor === co ? C.goldDeep : C.ink,
                    fontWeight: activeColor === co ? 700 : 500,
                  }}
                >
                  {co}
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
              <span style={{ color: C.inkSoft }}>{t('fourteenDays', lang)}</span>
            </div>
          </div>
        </div>
      </div>

      {showSizeGuide && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.4)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.paper, borderRadius: 10, padding: 20, width: '100%', maxWidth: 360, boxShadow: '0 20px 50px rgba(0,0,0,0.24)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800 }}>{t('sizeGuide', lang)}</div>
              <button onClick={() => setShowSizeGuide(false)}>
                <X size={18} />
              </button>
            </div>
            {['XS · 78-84 cm', 'S · 84-90 cm', 'M · 90-96 cm', 'L · 96-104 cm', 'XL · 104-112 cm'].map((row) => (
              <div key={row} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: `1px solid ${C.ruleLight}`, fontSize: 13 }}>
                <span>{row.split('·')[0]}</span>
                <span style={{ color: C.inkSoft }}>{row.split('·')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ump-sticky-cta ump-pd-width" style={{ background: C.paper, padding: '14px 20px', borderTop: `1px solid ${C.ruleLight}`, boxShadow: '0 -4px 12px rgba(0,0,0,0.04)', display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate('/catalogo')}
          aria-label="Search"
          style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink }}
        >
          <Search size={16} />
        </button>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          style={{
            flex: 1,
            padding: 14,
            background: added ? C.successText : isOutOfStock ? C.inkSoft : C.black,
            color: added ? C.onDark : isOutOfStock ? C.onDark : C.onDarkGold,
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
