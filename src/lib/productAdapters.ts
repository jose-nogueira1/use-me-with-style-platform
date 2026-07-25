import { resolveRef, type ApiProduct } from './api';
import type { Product, ProductColor, ProductVariant, SizeGuideRow } from '../types/product';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];
import { TONE_CYCLE } from '../components/ProductPhoto';
import { publicEnv } from '../config/env';

// Recognised "new arrival" merch-tag labels (2026-07-25 navbar fix), checked
// case-insensitively against BOTH labelPT and labelEN regardless of the
// current storefront language, so the "Novidades"/"New arrivals" nav link
// filters correctly no matter which language a shopper (or the admin who
// named the tag) is using.
const NEW_ARRIVAL_TAG_LABELS = new Set(['novidade', 'novidades', 'new', 'new arrival', 'new arrivals']);

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
 * hero image, 2026-07-25). */
export function absoluteMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, publicEnv.apiBaseUrl).toString();
  } catch {
    return undefined;
  }
}

export function adaptApiProduct(api: ApiProduct, market: 'AO' | 'PT', lang: 'pt' | 'en', index = 0): Product {
  const localizedName = (lang === 'en' ? api.nameEN : api.namePT)?.trim() || api.name;
  const localizedDescription = (lang === 'en' ? api.descriptionEN : api.descriptionPT)?.trim() || api.description;
  const images = (api.images ?? []).flatMap(({ image }) => {
    if (!image || typeof image !== 'object') return [];
    const url = absoluteMediaUrl(image.url);
    if (!url) return [];
    return [{
      url,
      cardUrl: absoluteMediaUrl(image.sizes?.card?.url),
      thumbnailUrl: absoluteMediaUrl(image.sizes?.thumbnail?.url),
      alt: image.alt?.trim() || localizedName,
    }];
  });

  // Taxonomies became relationships on 2026-07-25; every product call uses
  // depth=2, so these refs are populated docs. The unpopulated (id-only)
  // shape is still tolerated -- it just falls back to blank/empty rather
  // than crashing.
  const category = resolveRef(api.category);
  const tag = resolveRef(api.tag);
  const isNewArrival = Boolean(
    tag && [tag.labelPT, tag.labelEN].some((label) => label && NEW_ARRIVAL_TAG_LABELS.has(label.trim().toLowerCase())),
  );

  // Variant-level inventory: colours, sizes, and stock all derive from the
  // colour+size variant rows (row order = colour display order).
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
    variants.push({ color: colorId, size: row.size, stock: marketStock });
    if (colorDoc && !colors.some((c) => c.id === colorId)) {
      const swatch = resolveRef(colorDoc.swatch);
      colors.push({ id: colorId, name: colorLabel, hex: colorDoc.hex ?? undefined, hex2: colorDoc.hex2 ?? undefined, swatchUrl: absoluteMediaUrl(swatch?.url) });
    }
    if (!sizes.includes(row.size)) sizes.push(row.size);
    stock[row.size] = (stock[row.size] ?? 0) + marketStock;
  }
  sizes.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const onSale = isProductOnSale(api);
  const effectivePriceKz = onSale ? (api.saleAOKz ?? api.priceAOKz) : api.priceAOKz;
  const effectivePriceEur = onSale ? (api.salePTEur ?? api.pricePTEur) : api.pricePTEur;

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
    catLabel: (lang === 'en' ? category?.nameEN : category?.namePT)?.trim() || category?.namePT || '',
    priceKz: api.priceAOKz,
    priceEur: api.pricePTEur,
    onSale,
    effectivePriceKz,
    effectivePriceEur,
    sizes,
    stock,
    variants,
    colors,
    tag: tag ? ((lang === 'en' ? tag.labelEN : tag.labelPT)?.trim() || tag.labelPT) : undefined,
    tagSlug: tag?.slug ?? undefined,
    isNewArrival,
    description: localizedDescription,
    sizeGuide,
    fitNote: (lang === 'en' ? api.fitNoteEN : api.fitNotePT)?.trim() || api.fitNotePT?.trim() || undefined,
    images,
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}
