import type { Product } from '../types/product';

export type CatalogueFilterState = {
  availableOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  sizes: string[];
  colors: string[];
  collectionTags: string[];
  productTypes: string[];
};

function hasStockForSize(product: Product, size: string) {
  return product.variants.some((variant) =>
    (variant.optionValue ?? variant.legacySize) === size && variant.stock > 0,
  );
}

function hasStockForColor(product: Product, color: string) {
  return product.variants.some((variant) => variant.color === color && variant.stock > 0);
}

export function filterCatalogueProducts(products: Product[], filters: CatalogueFilterState, market: 'AO' | 'PT') {
  return products.filter((product) => {
    if (filters.availableOnly && (product.marketStock <= 0 || product.marketStatus === 'hidden')) return false;
    if (filters.onSale && !product.onSale) return false;

    const price = market === 'AO' ? product.effectivePriceKz : product.effectivePriceEur;
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && price > filters.maxPrice) return false;
    if (filters.sizes.length && !filters.sizes.some((size) => hasStockForSize(product, size))) return false;
    if (filters.colors.length && !filters.colors.some((color) => hasStockForColor(product, color))) return false;
    if (filters.productTypes.length && !filters.productTypes.includes(product.productType)) return false;
    if (filters.collectionTags.length && !filters.collectionTags.some((tag) =>
      tag === 'new' ? product.isNewArrival : product.tags.some((item) => item.slug === tag),
    )) return false;

    return true;
  });
}
