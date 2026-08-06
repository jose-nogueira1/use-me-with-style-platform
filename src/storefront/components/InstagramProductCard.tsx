import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductPhoto } from '../../components/ProductPhoto';
import { absoluteMediaUrl } from '../../lib/productAdapters';
import { trackMetaCustomEvent } from '../../lib/metaAnalytics';
import { useApp } from '../../state/AppContext';
import { C, F, formatKz } from '../../theme';
import type { ApiInstagramLookProduct } from '../../lib/api';

export function InstagramProductCard({ product, lookId, compact = false }: { product: ApiInstagramLookProduct; lookId: string; compact?: boolean }) {
  const { lang, market } = useApp();
  const name = (lang === 'en' ? product.nameEN : product.namePT)?.trim() || product.name;
  const colour = (lang === 'en' ? product.selectedColorNameEN : product.selectedColorNamePT)?.trim();
  const price = product.currency === 'AOA' ? `${formatKz(product.price, lang)} Kz` : `€${product.price.toFixed(2)}`;
  const regularPrice = product.currency === 'AOA' ? `${formatKz(product.regularPrice, lang)} Kz` : `€${product.regularPrice.toFixed(2)}`;
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
        gridTemplateColumns: compact ? '76px minmax(0, 1fr)' : undefined,
        minWidth: 0,
        overflow: 'hidden',
        border: `1px solid ${C.ruleLight}`,
        borderRadius: 10,
        background: C.paper,
        color: C.ink,
        textDecoration: 'none',
      }}
    >
      <div style={{ aspectRatio: compact ? undefined : '4 / 5', height: compact ? 94 : undefined, minHeight: 0, overflow: 'hidden', background: C.subtleBg }}>
        <ProductPhoto
          tone="gold"
          radius={0}
          image={product.imageUrl ? { url: absoluteMediaUrl(product.imageUrl) || product.imageUrl, alt: name } : undefined}
        />
      </div>
      <div style={{ padding: compact ? '10px 11px' : 11, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.goldDeep, fontSize: 8.5, fontWeight: 850, letterSpacing: 0.7, textTransform: 'uppercase' }}>
          <ShoppingBag size={10} /> {lang === 'pt' ? 'Comprar o look' : 'Shop the look'}
        </div>
        <div style={{ marginTop: 4, fontFamily: F.display, fontSize: compact ? 14 : 16, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {colour && <div style={{ marginTop: 3, fontSize: 9.5, color: C.inkSoft }}>{lang === 'pt' ? 'Cor' : 'Colour'}: {colour}</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 5, fontSize: 11, fontWeight: 800 }}>
          {product.onSale && <span style={{ color: C.inkSoft, textDecoration: 'line-through', fontWeight: 600 }}>{regularPrice}</span>}
          <span style={{ color: product.onSale ? C.dangerStrong : C.ink }}>{price}</span>
        </div>
        <div style={{ marginTop: 5, fontSize: 9.5, color: product.inStock ? C.successText : C.danger, fontWeight: 700 }}>
          {product.inStock
            ? product.availableSizes.length > 0
              ? `${lang === 'pt' ? 'Disponível' : 'Available'}: ${product.availableSizes.join(', ')}`
              : (lang === 'pt' ? 'Disponível' : 'Available')
            : (lang === 'pt' ? 'Esgotado — ver semelhantes' : 'Sold out — view similar')}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7, color: C.goldDeep, fontSize: 9.5, fontWeight: 850 }}>
          {lang === 'pt' ? 'Ver produto' : 'View product'} <ArrowRight size={10} />
        </div>
      </div>
    </Link>
  );
}
