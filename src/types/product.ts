import type { ProductTone } from '../components/ProductPhoto';

// Unified view-model the storefront UI works with, regardless of whether the
// data came from the CMS API or the dev-mode mock dataset. Screens should
// only ever import this type, never ApiProduct or the raw mock shape.
export type Product = {
  id: string;
  name: string;
  slug: string;
  cat: 'vestidos' | 'tops' | 'leggings' | 'conjuntos';
  priceKz: number;
  priceEur: number;
  sizes: string[];
  /** Stock for the CURRENT market, keyed by size. */
  stock: Record<string, number>;
  colors: string[];
  tag?: string;
  description?: string;
  /** Placeholder product-photo tone (see components/ProductPhoto.tsx). */
  tone: ProductTone;
};
