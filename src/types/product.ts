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
 * with neither, screens fall back to a plain text chip.
 *
 * Bilingual (2026-07-25 follow-up): `name` is already resolved to the
 * shopper's current storefront language (falls back to Portuguese) -- use
 * it for display. `id` is the colour's stable row id and never changes
 * with language; use it for identity (matching against ProductVariant.color,
 * cart dedup keys, etc). */
export type ProductColor = {
  id: string;
  name: string;
  hex?: string;
  swatchUrl?: string;
};

/** One sellable colour+size combination, with stock for the CURRENT
 * market (variant-level inventory, 2026-07-25). `color` is the colour's
 * stable ROW ID (2026-07-25 bilingual follow-up -- was the colour name
 * until colours could have more than one language's name), matching
 * ProductColor.id and the value the cart/order flow carries end to end. */
export type ProductVariant = {
  color: string;
  size: string;
  stock: number;
};

/** One row of the shared measurement chart (cm, language-neutral --
 * labels are translated by the storefront). */
export type SizeGuideRow = {
  size: string;
  bust?: number;
  waist?: number;
  hip?: number;
  length?: number;
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
  /** Stock for the CURRENT market, keyed by size, SUMMED across colours --
   * coarse availability for cards/lists. Use `variants` for the exact
   * colour+size number. */
  stock: Record<string, number>;
  /** Exact per colour+size stock for the current market. */
  variants: ProductVariant[];
  colors: ProductColor[];
  tag?: string;
  description?: string;
  /** Shared measurement chart (if the product references one). */
  sizeGuide?: SizeGuideRow[];
  /** Localized per-product fit note shown under the size chart. */
  fitNote?: string;
  images: ProductImage[];
  /** Placeholder product-photo tone (see components/ProductPhoto.tsx). */
  tone: ProductTone;
};
