import type { ProductTone } from '../components/ProductPhoto';

export type ProductImage = {
  url: string;
  cardUrl?: string;
  thumbnailUrl?: string;
  smallUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  alt: string;
  /** Per-colour photo galleries (2026-08-07). Matches ProductColor.id.
   * Undefined means "general" -- shown regardless of which colour is
   * selected, and used as the fallback pool for any colour that has no
   * photos tagged to it yet. See ProductDetail.tsx's gallery filter. */
  colorId?: string;
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
 * cart dedup keys, etc).
 *
 * Combination colours (2026-07-25 follow-up): `hex2`, when set, renders a
 * split-circle swatch (e.g. red & white) instead of a solid dot -- see
 * lib/colorSwatch.ts. Still a single colour id, unrelated to `swatchUrl`
 * which is for patterns a flat split can't represent. */
export type ProductColor = {
  id: string;
  name: string;
  hex?: string;
  hex2?: string;
  swatchUrl?: string;
};

/** One sellable colour+size combination, with stock for the CURRENT
 * market (variant-level inventory, 2026-07-25). `color` is the colour's
 * stable ROW ID (2026-07-25 bilingual follow-up -- was the colour name
 * until colours could have more than one language's name), matching
 * ProductColor.id and the value the cart/order flow carries end to end. */
export type ProductVariant = {
  id: string;
  sku?: string;
  color?: string;
  optionValue?: string;
  legacySize?: string;
  stock: number;
};

export type ProductSpecification = { label: string; value: string };
export type ProductBundleComponent = {
  productId: string;
  productName: string;
  variantId: string;
  qty: number;
  optionSummary?: string;
};

/** One merchandising badge on a product (e.g. "Novidade", "Bestseller").
 * hasMany since 2026-07-31 -- a product can carry more than one at once, so
 * this replaces the old single `tag`/`tagSlug` string pair. `slug` is the
 * stable identifier used by the ?tag= collection-link filter in Browse.tsx
 * (an unrelated feature -- a curated collection URL matches against any one
 * of a product's tags, not the product's single tag). */
export type ProductTag = {
  label: string;
  slug: string;
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
  productType: 'standard' | 'bundle';
  /** Regular (non-sale) price -- kept even while on sale so the storefront
   * can show a strikethrough "was" price. Use effectivePriceKz/Eur below
   * for anything money actually changes hands over (cart, checkout,
   * ad-tracking value). */
  priceKz: number;
  priceEur: number;
  /** True when a sale price is currently active (2026-07-25, discounts
   * phase 1) -- see productAdapters.ts's isProductOnSale. */
  onSale: boolean;
  /** The price actually charged: the sale price while onSale, otherwise
   * identical to priceKz/priceEur. Everything that computes money
   * (cart/checkout totals, Meta conversion value) should read these, not
   * priceKz/priceEur directly. */
  effectivePriceKz: number;
  effectivePriceEur: number;
  shippingWeightGrams: number;
  optionLabel?: string;
  sizes: string[];
  /** Stock for the CURRENT market, keyed by size, SUMMED across colours --
   * coarse availability for cards/lists. Use `variants` for the exact
   * colour+size number. */
  stock: Record<string, number>;
  /** Exact per colour+size stock for the current market. */
  variants: ProductVariant[];
  colors: ProductColor[];
  /** Merchandising badges (2026-07-31: multi-select, was a single tag).
   * Empty array means no tags. */
  tags: ProductTag[];
  /** True when ANY of the product's merch tags is a recognised "new
   * arrival" marker
   * (2026-07-25 navbar fix) -- checked against BOTH labelPT and labelEN on
   * the tag doc, not the current display language, so it's stable across
   * a language switch. Drives the "Novidades"/"New arrivals" nav link,
   * which used to filter by category slug 'new' -- a slug that has never
   * existed since categories became real CMS data, so it always showed
   * zero results. */
  isNewArrival: boolean;
  description?: string;
  /** Shared measurement chart (if the product references one). */
  sizeGuide?: SizeGuideRow[];
  /** Localized per-product fit note shown under the size chart. */
  fitNote?: string;
  specifications: ProductSpecification[];
  returnEligible: boolean;
  returnNote?: string;
  bundleComponents: ProductBundleComponent[];
  images: ProductImage[];
  /** Placeholder product-photo tone (see components/ProductPhoto.tsx). */
  tone: ProductTone;
};
