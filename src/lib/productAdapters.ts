import { refId, resolveRef, type ApiProduct } from './api';
import type { MarketStockStatus, Product, ProductBundleComponent, ProductColor, ProductVariant, SizeGuideRow } from '../types/product';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];
import { TONE_CYCLE } from '../components/ProductPhoto';
import { publicEnv } from '../config/env';
import { buildProductImageAlt } from './productImageAlt';

// Recognised "new arrival" merch-tag labels (2026-07-25 navbar fix), checked
// case-insensitively against BOTH labelPT and labelEN regardless of the
// current storefront language, so the "Novidades"/"New arrivals" nav link
// filters correctly no matter which language a shopper (or the admin who
// named the tag) is using.
const NEW_ARRIVAL_TAG_LABELS = new Set(['novidade', 'novidades', 'new', 'new arrival', 'new arrivals']);

export function marketStockStatus(
  product: Pick<ApiProduct, 'availableAO' | 'availablePT' | 'productType' | 'variants'>,
  market: 'AO' | 'PT',
): { visible: boolean; status: MarketStockStatus; stock: number } {
  const visible = market === 'AO' ? product.availableAO !== false : product.availablePT !== false;
  const stock = (product.variants ?? []).reduce((total, variant) => total + Math.max(0, Number(market === 'AO' ? variant.stockAO : variant.stockPT) || 0), 0);
  return {
    visible,
    status: !visible ? 'hidden' : stock === 0 ? 'sold_out' : stock <= 3 ? 'low_stock' : 'in_stock',
    stock,
  };
}

// Discounts phase 1 (2026-07-25) -- mirrors use-me-with-style-cms's
// lib/salePricing.ts by hand (separate repos/deploys, no shared package).
// The CMS's authoritativeOrder.ts is what actually enforces this at
// checkout; this copy only drives storefront DISPLAY (strikethrough price,
// cart/checkout preview totals) so it's a nice-to-have that it stays in
// sync, not a security boundary.
function isProductOnSale(p: Pick<ApiProduct, 'saleAOKz' | 'salePTEur' | 'saleStartDate' | 'saleEndDate'>, now = new Date()): boolean {
  const hasSalePrice = (p.saleAOKz ?? null) !== null || (p.salePTEur ?? null) !== null;
  if (!hasSalePrice) return false;
  if (p.saleStartDate && now < new Date(p.saleStartDate)) return false;
  if (p.saleEndDate && now > new Date(p.saleEndDate)) return false;
  return true;
}

/** Resolves a CMS-relative media URL to an absolute one. Exported for reuse
 * anywhere else a raw media URL needs the same treatment (e.g. Home.tsx's
 * hero image, 2026-07-25).
 *
 * 2026-08-07 bug fix ("uploaded a product photo, card and detail page still
 * show the placeholder"): in production `publicEnv.apiBaseUrl` is the
 * literal string "/" (the same-origin /api proxy configured in vercel.json
 * -- see api.ts's own API_BASE, which already special-cases this). But
 * `new URL(relativeOrEvenAbsoluteUrl, "/")` unconditionally THROWS --
 * `URL`'s base argument has to be a real absolute URL (with a scheme) on
 * its own, and a bare "/" isn't one. That exception was being silently
 * swallowed by the catch below, so every single media URL sitewide
 * (product photos, colour swatches, the homepage hero image) was quietly
 * resolving to `undefined` and falling back to the placeholder -- this
 * never showed up before because nothing had ever actually gone through
 * this path with real uploaded photos until now. Fixed by resolving
 * against the page's own origin instead of the raw env value whenever
 * that value isn't itself a usable absolute base, and by short-circuiting
 * already-absolute URLs (e.g. a real S3/R2 URL) without needing a base at
 * all -- mirroring the CMS's own copy of this helper in lib/mediaUrl.ts. */
export function absoluteMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = publicEnv.apiBaseUrl && publicEnv.apiBaseUrl !== '/'
    ? publicEnv.apiBaseUrl
    : (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (!base) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return undefined;
  }
}

export function adaptApiProduct(api: ApiProduct, market: 'AO' | 'PT', lang: 'pt' | 'en', index = 0): Product {
  const localizedName = (lang === 'en' ? api.nameEN : api.namePT)?.trim() || api.name;
  const localizedDescription = (lang === 'en' ? api.descriptionEN : api.descriptionPT)?.trim() || api.description;

  // Taxonomies became relationships on 2026-07-25; every product call uses
  // depth=2, so these refs are populated docs. The unpopulated (id-only)
  // shape is still tolerated -- it just falls back to blank/empty rather
  // than crashing.
  const category = resolveRef(api.category);
  const categoryLabel = (lang === 'en' ? category?.nameEN : category?.namePT)?.trim() || category?.namePT || '';
  const images = (api.images ?? []).flatMap(({ image, color }) => {
    if (!image || typeof image !== 'object') return [];
    const url = absoluteMediaUrl(image.url);
    if (!url) return [];
    const colorDoc = resolveRef(color);
    const imageColor = (lang === 'en' ? colorDoc?.nameEN : colorDoc?.namePT)?.trim() || colorDoc?.namePT || '';
    return [{
      url,
      cardUrl: absoluteMediaUrl(image.sizes?.card?.url),
      thumbnailUrl: absoluteMediaUrl(image.sizes?.thumbnail?.url),
      smallUrl: absoluteMediaUrl(image.sizes?.small?.url),
      mediumUrl: absoluteMediaUrl(image.sizes?.medium?.url),
      largeUrl: absoluteMediaUrl(image.sizes?.large?.url),
      alt: image.alt?.trim() || buildProductImageAlt({ productName: localizedName, colorName: imageColor, productType: categoryLabel }),
      colorId: refId(color) || undefined,
    }];
  });
  // tag is hasMany since 2026-07-31 -- Payload returns an array; resolveRef
  // unwraps each entry the same way it always has for a single ref.
  const scopedTagDocs = (api.marketTags ?? [])
    .filter((assignment) => assignment.market === market)
    .map((assignment) => resolveRef(assignment.tag))
    .filter((doc): doc is NonNullable<typeof doc> => doc !== null);
  const tagDocs = [...(api.tag ?? []).map((ref) => resolveRef(ref)), ...scopedTagDocs]
    .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
    .filter((doc, i, docs) => docs.findIndex((candidate) => String(candidate.id) === String(doc.id)) === i);
  const tags = tagDocs.filter((doc) => Boolean(doc.slug)).map((doc) => ({
    label: (lang === 'en' ? doc.labelEN : doc.labelPT)?.trim() || doc.labelPT,
    slug: String(doc.slug),
  }));
  const isNewArrival = tagDocs.some((doc) =>
    [doc.labelPT, doc.labelEN].some((label) => label && NEW_ARRIVAL_TAG_LABELS.has(label.trim().toLowerCase())),
  );

  // Flexible variant inventory: row id is the sellable identity; colour
  // and the localized secondary option are both optional.
  const variants: ProductVariant[] = [];
  const colors: ProductColor[] = [];
  const sizes: string[] = [];
  const stock: Record<string, number> = {};
  for (const row of api.variants ?? []) {
    const colorDoc = resolveRef(row.color);
    // Identity = the colour's stable row id (never varies with language);
    // display label = localized name, resolved here exactly like category
    // and tag above (2026-07-25 bilingual colours follow-up).
    const colorId = colorDoc ? String(colorDoc.id) : '';
    const colorLabel = (lang === 'en' ? colorDoc?.nameEN : colorDoc?.namePT)?.trim() || colorDoc?.namePT || '';
    const marketStock = market === 'AO' ? row.stockAO : row.stockPT;
    const optionValue = (lang === 'en' ? row.optionValueEN : row.size)?.trim() || row.size?.trim() || '';
    variants.push({
      id: String(row.id ?? `${colorId}:${row.size ?? ''}`),
      sku: row.sku?.trim() || undefined,
      color: colorId || undefined,
      optionValue: optionValue || undefined,
      legacySize: row.size?.trim() || undefined,
      stock: marketStock,
    });
    if (colorDoc && !colors.some((c) => c.id === colorId)) {
      const swatch = resolveRef(colorDoc.swatch);
      colors.push({
        id: colorId,
        name: colorLabel,
        hex: colorDoc.hex ?? undefined,
        hex2: colorDoc.hex2 ?? undefined,
        // Pattern swatches render at only 12–20px. Use Payload's smallest
        // aspect-preserving derivative instead of downloading the original;
        // the original remains a compatibility fallback for older media.
        swatchUrl: absoluteMediaUrl(swatch?.sizes?.small?.url ?? swatch?.url),
      });
    }
    if (optionValue && !sizes.includes(optionValue)) sizes.push(optionValue);
    if (optionValue) stock[optionValue] = (stock[optionValue] ?? 0) + marketStock;
  }
  sizes.sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    return ai === -1 || bi === -1 ? a.localeCompare(b, lang) : ai - bi;
  });

  const bundleComponents: ProductBundleComponent[] = (api.bundleComponents ?? []).flatMap((component) => {
    const componentProduct = resolveRef(component.product);
    if (!componentProduct) return [];
    const componentVariant = componentProduct.variants?.find((row) => String(row.id) === String(component.variantId));
    const componentColor = resolveRef(componentVariant?.color);
    const optionValue = (lang === 'en' ? componentVariant?.optionValueEN : componentVariant?.size)?.trim() || componentVariant?.size?.trim();
    const colour = (lang === 'en' ? componentColor?.nameEN : componentColor?.namePT)?.trim() || componentColor?.namePT?.trim();
    return [{
      productId: String(componentProduct.id),
      productName: (lang === 'en' ? componentProduct.nameEN : componentProduct.namePT)?.trim() || componentProduct.name,
      variantId: String(component.variantId),
      qty: Math.max(1, Number(component.qty ?? 1)),
      optionSummary: [colour, optionValue].filter(Boolean).join(' · ') || undefined,
    }];
  });

  if (api.productType === 'bundle') {
    const componentStocks = (api.bundleComponents ?? []).map((component) => {
      const componentProduct = resolveRef(component.product);
      const variant = componentProduct?.variants?.find((row) => String(row.id) === String(component.variantId));
      const available = market === 'AO' ? Number(variant?.stockAO ?? 0) : Number(variant?.stockPT ?? 0);
      return Math.floor(available / Math.max(1, Number(component.qty ?? 1)));
    });
    variants.splice(0, variants.length, { id: 'bundle', stock: componentStocks.length > 0 ? Math.min(...componentStocks) : 0 });
  }

  const onSale = isProductOnSale(api);
  const effectivePriceKz = onSale ? (api.saleAOKz ?? api.priceAOKz) : api.priceAOKz;
  const effectivePriceEur = onSale ? (api.salePTEur ?? api.pricePTEur) : api.pricePTEur;
  const marketStock = variants.reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0);
  const visible = market === 'AO' ? api.availableAO !== false : api.availablePT !== false;
  const marketStatus = !visible ? 'hidden' : marketStock === 0 ? 'sold_out' : marketStock <= 3 ? 'low_stock' : 'in_stock';

  const guide = resolveRef(api.sizeGuide);
  const sizeGuide: SizeGuideRow[] | undefined = guide
    ? guide.rows.map((row) => ({
        size: row.size,
        bust: row.bust ?? undefined,
        waist: row.waist ?? undefined,
        hip: row.hip ?? undefined,
        length: row.length ?? undefined,
      }))
    : undefined;

  return {
    id: String(api.id),
    name: localizedName,
    slug: api.slug,
    cat: category?.slug ?? '',
    catLabel: categoryLabel,
    productType: api.productType === 'bundle' ? 'bundle' : 'standard',
    priceKz: api.priceAOKz,
    priceEur: api.pricePTEur,
    onSale,
    saleEndDate: api.saleEndDate,
    effectivePriceKz,
    effectivePriceEur,
    shippingWeightGrams: Math.max(1, Number(api.shippingWeightGrams ?? 500)),
    optionLabel: (lang === 'en' ? api.optionLabelEN : api.optionLabelPT)?.trim() || api.optionLabelPT?.trim() || undefined,
    sizes,
    stock,
    variants,
    colors,
    tags,
    marketStatus,
    marketStock,
    isNewArrival,
    description: localizedDescription,
    sizeGuide,
    fitNote: (lang === 'en' ? api.fitNoteEN : api.fitNotePT)?.trim() || api.fitNotePT?.trim() || undefined,
    specifications: (api.specifications ?? []).map((entry) => ({
      label: (lang === 'en' ? entry.labelEN : entry.labelPT)?.trim() || entry.labelPT,
      value: (lang === 'en' ? entry.valueEN : entry.valuePT)?.trim() || entry.valuePT,
    })),
    returnEligible: api.returnEligible !== false,
    returnNote: (lang === 'en' ? api.returnNoteEN : api.returnNotePT)?.trim() || api.returnNotePT?.trim() || undefined,
    bundleComponents,
    images,
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}

/** True when any size in this colour still has stock for the current
 * market. Shared by ProductDetail's colour pills and ProductCard's colour
 * swatches (2026-08-07) so "sold out" is decided the same way everywhere
 * instead of two copies of the same `variants.some(...)` drifting apart. */
export function colorHasStock(product: Pick<Product, 'variants'>, colorId: string): boolean {
  return product.variants.some((v) => v.color === colorId && v.stock > 0);
}
