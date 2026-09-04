import { ArrowRight, Clock, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductPhoto } from '../../components/ProductPhoto';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { trackMetaCustomEvent } from '../../lib/metaAnalytics';
import { useApp } from '../../state/AppContext';
import { C, F, formatKz } from '../../theme';
import { saleDiscountLabel, saleDiscountPercent, saleUrgencyLabel } from '../../lib/salePresentation';
import type { ApiInstagramLookProduct } from '../../lib/api';

export function InstagramProductCard({ product, lookId, compact = false }: { product: ApiInstagramLookProduct; lookId: string; compact?: boolean }) {
  const { lang, market } = useApp();
  const name = (lang === 'en' ? product.nameEN : product.namePT)?.trim() || product.name;
  const colour = (lang === 'en' ? product.selectedColorNameEN : product.selectedColorNamePT)?.trim();
  const price = product.currency === 'AOA' ? `${formatKz(product.price, lang)} Kz` : `€${product.price.toFixed(2)}`;
  const regularPrice = product.currency === 'AOA' ? `${formatKz(product.regularPrice, lang)} Kz` : `€${product.regularPrice.toFixed(2)}`;
  const saleDiscount = product.onSale ? saleDiscountPercent(product.regularPrice, product.price) : null;
  const saleLabel = product.onSale ? saleDiscountLabel(product.regularPrice, product.price, lang) : null;
  const saleUrgency = product.onSale ? saleUrgencyLabel(product.saleEndDate, lang) : null;
  const lowStock = product.inStock && product.marketStock <= 3;
  const stockLabel = lang === 'pt' ? `Só ${product.marketStock} restantes` : `Only ${product.marketStock} left`;
  const colourQuery = product.selectedColorId ? `?cor=${encodeURIComponent(product.selectedColorId)}` : '';
  const href = `/produto/${encodeURIComponent(product.slug)}${colourQuery}`;

  return (
    <Link
      to={href}
      onClick={() => trackMetaCustomEvent('ShopTheLookProductClick', {
        instagram_look_id: lookId,
        product_id: product.id,
        product_name: name,
        market,
      })}
      style={{
        display: compact ? 'grid' : 'block',
        gridTemplateColumns: compact ? '88px minmax(0, 1fr)' : undefined,
        minWidth: 0,
        overflow: 'hidden',
        border: `1px solid ${C.ruleLight}`,
        borderRadius: 10,
        background: C.paper,
        color: C.ink,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <div style={{ aspectRatio: compact ? undefined : '4 / 5', height: compact ? 'auto' : undefined, minHeight: compact ? 108 : 0, alignSelf: 'stretch', overflow: 'hidden', position: 'relative', background: C.subtleBg }}>
        <div style={{ width: '100%', height: '100%', opacity: product.inStock ? 1 : 0.55 }}>
          <ProductPhoto
            tone="gold"
            radius={0}
            image={product.imageUrl ? { url: absoluteMediaUrl(product.imageUrl) || product.imageUrl, alt: product.imageAlt?.trim() || name } : undefined}
          />
        </div>
        {!compact && (!product.inStock || (lowStock && !product.onSale)) && <div aria-label={!product.inStock ? (lang === 'pt' ? 'Esgotado' : 'Sold out') : stockLabel} style={{ position: 'absolute', top: 0, right: 0, zIndex: 3, padding: '7px 10px', borderRadius: '0 0 0 7px', background: !product.inStock ? C.danger : C.tagBg, color: !product.inStock ? C.paper : C.dangerStrong, fontSize: 9, fontWeight: 850, boxShadow: '0 1px 3px rgba(0,0,0,0.14)' }}>{!product.inStock ? (lang === 'pt' ? 'Esgotado' : 'Sold out') : stockLabel}</div>}
        {!compact && product.onSale && product.inStock && <div aria-label={lang === 'pt' ? `Promoção: ${saleLabel}` : `Sale: ${saleLabel}`} style={{ position: 'absolute', top: 20, right: -42, width: 160, zIndex: 3, padding: '7px 8px', background: 'linear-gradient(135deg, #B95545, #A6483A)', color: C.paper, fontSize: 10, fontWeight: 900, letterSpacing: 0.3, textAlign: 'center', whiteSpace: 'nowrap', transform: 'rotate(45deg)', boxShadow: '0 1px 3px rgba(0,0,0,0.16)' }}>{saleLabel}</div>}
        {!compact && !product.inStock && <span aria-hidden style={{ position: 'absolute', left: '-33.35%', top: '50%', width: '166.7%', height: 3, zIndex: 2, background: C.dangerStrong, transform: 'rotate(53.13deg)', pointerEvents: 'none' }} />}
      </div>
      <div style={{ padding: compact ? '12px' : 11, minWidth: 0 }}>
        {compact && (product.onSale || !product.inStock || lowStock) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {!product.inStock && <div className="ump-instagram-compact-badge" style={{ background: C.danger, color: C.paper, fontSize: 9, fontWeight: 850, padding: '5px 7px', borderRadius: 5 }}>{lang === 'pt' ? 'Esgotado' : 'Sold out'}</div>}
            {product.onSale && product.inStock && <div className="ump-instagram-compact-badge" aria-label={lang === 'pt' ? `Promoção: ${saleLabel}` : `Sale: ${saleLabel}`} style={{ background: C.dangerStrong, color: C.paper, fontSize: 9, fontWeight: 900, padding: '5px 7px', borderRadius: 5 }}>{saleLabel}</div>}
            {lowStock && product.inStock && <div className="ump-instagram-compact-badge" style={{ background: C.tagBg, color: C.dangerStrong, fontSize: 9, fontWeight: 850, padding: '5px 7px', borderRadius: 5, border: `1px solid ${C.rule}` }}>{stockLabel}</div>}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.goldDeep, fontSize: 9, fontWeight: 850, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <ShoppingBag size={11} /> {lang === 'pt' ? 'Comprar o look' : 'Shop the look'}
        </div>
        <div style={{ marginTop: 5, fontFamily: F.display, fontSize: compact ? 15.5 : 16, fontWeight: 800, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {colour && <div style={{ marginTop: 4, fontSize: 10.5, color: C.inkSoft }}>{lang === 'pt' ? 'Cor' : 'Colour'}: {colour}</div>}
        {(product.onSale || (lowStock && product.onSale)) && <div style={{ marginTop: 6, padding: compact ? '7px 8px' : '8px 9px', borderRadius: 6, background: product.onSale ? C.dangerBg : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, fontSize: 12.5, fontWeight: 800, flexWrap: 'wrap' }}>
          {product.onSale && <span style={{ color: C.inkSoft, textDecoration: 'line-through', fontWeight: 600 }}>{regularPrice}</span>}
          <span style={{ color: product.onSale ? C.dangerStrong : C.ink }}>{price}</span>
          {saleDiscount !== null && <span style={{ color: C.dangerStrong, fontWeight: 900 }}>−{saleDiscount}%</span>}
        </div>
        {lowStock && product.onSale && <div style={{ marginTop: 4, color: C.dangerStrong, fontSize: 10.5, fontWeight: 800 }}>{stockLabel}</div>}
        {saleUrgency && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: C.dangerStrong, fontSize: 10.5, fontWeight: 800 }}><Clock size={11} aria-hidden /> {saleUrgency}</div>}
        </div>}
        <div style={{ marginTop: 6, fontSize: 10.5, color: product.inStock ? C.successText : C.danger, fontWeight: 700 }}>
          {product.inStock
            ? product.availableSizes.length > 0
              ? `${lang === 'pt' ? 'Disponível' : 'Available'}: ${product.availableSizes.join(', ')}`
              : (lang === 'pt' ? 'Disponível' : 'Available')
            : (lang === 'pt' ? 'Esgotado — ver semelhantes' : 'Sold out — view similar')}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, color: C.goldDeep, fontSize: 10.5, fontWeight: 850 }}>
          {lang === 'pt' ? 'Ver produto' : 'View product'} <ArrowRight size={11} />
        </div>
      </div>
    </Link>
  );
}
