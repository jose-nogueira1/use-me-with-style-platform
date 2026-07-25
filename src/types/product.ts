import type { ProductTone } from '../components/ProductPhoto';

export type ProductImage = {
  url: string;
  cardUrl?: string;
  thumbnailUrl?: string;
  alt: string;
};

/** Colour taxonomy entry (2026-07-25): colours moved from free text to a
 * CMS collection so the storefront can render real swatches. `hex` renders
 * a coloured dot; `swatchUrl` (pattern/multicolour image) wins over hex;
 * with neither, screens fall back to a plain text chip. */
export type ProductColor = {
  name: string;
  hex?: string;
  swatchUrl?: string;
};

// Storefront view-model adapted from the CMS API response. Screens should
// import this type rather than depending on Payload's raw API shape.
export type Product = {
  id: string;
  name: string;
  slug: string;
  /** Category slug (e.g. 'vestidos') -- matches the ?cat= URL param. */
  cat: string;
  /** Localized category display name, from the categories collection. */
  catLabel: string;
  priceKz: number;
  priceEur: number;
  sizes: string[];
  /** Stock for the CURRENT market, keyed by size. */
  stock: Record<string, number>;
  colors: ProductColor[];
  tag?: string;
  description?: string;
  images: ProductImage[];
  /** Placeholder product-photo tone (see components/ProductPhoto.tsx). */
  tone: ProductTone;
};
