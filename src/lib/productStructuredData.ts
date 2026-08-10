import type { Market } from '../state/AppContext';
import type { Product } from '../types/product';

type StructuredProduct = Pick<
  Product,
  'id' | 'name' | 'description' | 'catLabel' | 'effectivePriceKz' | 'effectivePriceEur' | 'images' | 'variants'
>;

type ProductStructuredDataInput = {
  product: StructuredProduct;
  market: Market;
  url: string;
  fallbackDescription: string;
};

export function buildProductStructuredData({
  product,
  market,
  url,
  fallbackDescription,
}: ProductStructuredDataInput) {
  const imageUrls = [...new Set(product.images.map((image) => image.url).filter(Boolean))];
  const sku = product.variants.find((variant) => variant.sku?.trim())?.sku?.trim() || product.id;
  const available = product.variants.some((variant) => variant.stock > 0);
  const price = market === 'AO'
    ? product.effectivePriceKz.toFixed(0)
    : product.effectivePriceEur.toFixed(2);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: product.description?.trim() || fallbackDescription.trim(),
    sku,
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
    ...(product.catLabel ? { category: product.catLabel } : {}),
    brand: {
      '@type': 'Brand',
      name: 'Use Me With Style',
    },
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: market === 'AO' ? 'AOA' : 'EUR',
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

/** Prevents CMS-authored text containing "</script>" from terminating the
 * JSON-LD element and becoming executable markup. JSON remains valid because
 * \u003c is the escaped form of the less-than character inside JSON strings. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
