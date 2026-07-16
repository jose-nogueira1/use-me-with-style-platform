import type { ProductTone } from '../components/ProductPhoto';

// Storefront view-model adapted from the CMS API response. Screens should
// import this type rather than depending on Payload's raw API shape.
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
