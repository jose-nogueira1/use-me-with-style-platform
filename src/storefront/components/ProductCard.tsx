import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp, useFormatOriginalPrice, useFormatPrice } from '../../state/AppContext';
import { ProductPhoto } from '../../components/ProductPhoto';
import type { Product } from '../../types/product';

const TAG_STYLE: Record<string, { bg: string; text: string }> = {
  'In stock': { bg: C.successBg, text: C.successText },
};
const DEFAULT_TAG_STYLE = { bg: C.tagBg, text: C.goldDeep };
const TAG_KEY: Record<string, string> = { New: 'tagNew', 'Few left': 'tagFewLeft', Bestseller: 'tagBestseller', 'In stock': 'tagInStock' };

export function ProductCard({ product, size = 'grid' }: { product: Product; size?: 'small' | 'grid' }) {
  const { lang } = useApp();
  const fmtPrice = useFormatPrice();
  const fmtOriginalPrice = useFormatOriginalPrice();
  const isSmall = size === 'small';
  const tagStyle = product.tag ? TAG_STYLE[product.tag] ?? DEFAULT_TAG_STYLE : null;

  return (
    <Link
      to={`/produto/${product.slug}`}
      className="ump-hover-lift"
      style={{
        flexShrink: isSmall ? 0 : undefined,
        width: isSmall ? 150 : undefined,
        display: 'block',
        background: C.paper,
        borderRadius: 8,
        overflow: 'hidden',
        textAlign: 'left',
        border: `1px solid ${C.ruleLight}`,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ aspectRatio: '174 / 142', width: '100%' }}>
        <ProductPhoto tone={product.tone} radius={0} image={product.images[0]} variant="card" />
      </div>
      <div style={{ padding: '10px 8px 12px' }}>
        {tagStyle && (
          <div
            style={{
              display: 'inline-block',
              background: tagStyle.bg,
              color: tagStyle.text,
              fontSize: 9,
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${C.rule}`,
              marginBottom: 6,
            }}
          >
            {t((product.tag && TAG_KEY[product.tag]) || '', lang) || product.tag}
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
      </div>
    </Link>
  );
}
