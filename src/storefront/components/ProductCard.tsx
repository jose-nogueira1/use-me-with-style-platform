import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto } from '../../components/ProductPhoto';
import type { Product } from '../../types/product';

const TAG_STYLE: Record<string, { bg: string; text: string }> = {
  'In stock': { bg: C.successBg, text: C.successText },
};
const DEFAULT_TAG_STYLE = { bg: C.tagBg, text: C.goldDeep };
const TAG_KEY: Record<string, string> = { New: 'tagNew', 'Few left': 'tagFewLeft', Bestseller: 'tagBestseller', 'In stock': 'tagInStock' };

// Figma always shows both currencies on a product card (Kz primary/bold,
// EUR secondary/muted) regardless of the selected market -- the market
// toggle affects delivery/payment info elsewhere, not this label.
function fmtKz(n: number) {
  return `${n.toLocaleString('en-US')} Kz`;
}

export function ProductCard({ product, size = 'grid' }: { product: Product; size?: 'small' | 'grid' }) {
  const { lang } = useApp();
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
        <ProductPhoto tone={product.tone} radius={0} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.black }}>{fmtKz(product.priceKz)}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft }}>EUR {product.priceEur}</span>
        </div>
      </div>
    </Link>
  );
}
