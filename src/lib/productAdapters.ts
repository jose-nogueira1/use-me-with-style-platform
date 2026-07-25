import { resolveRef, type ApiProduct } from './api';
import type { Product, ProductColor } from '../types/product';
import { TONE_CYCLE } from '../components/ProductPhoto';
import { publicEnv } from '../config/env';

function absoluteMediaUrl(url?: string): string | undefined {
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
  // depth=1, so these refs are populated docs. The unpopulated (id-only)
  // shape is still tolerated -- it just falls back to blank/empty rather
  // than crashing.
  const category = resolveRef(api.category);
  const tag = resolveRef(api.tag);
  const colors: ProductColor[] = (api.colors ?? []).flatMap((ref) => {
    const doc = resolveRef(ref);
    if (!doc) return [];
    const swatch = resolveRef(doc.swatch);
    return [{
      name: doc.name,
      hex: doc.hex ?? undefined,
      swatchUrl: absoluteMediaUrl(swatch?.url),
    }];
  });

  return {
    id: String(api.id),
    name: localizedName,
    slug: api.slug,
    cat: category?.slug ?? '',
    catLabel: (lang === 'en' ? category?.nameEN : category?.namePT)?.trim() || category?.namePT || '',
    priceKz: api.priceAOKz,
    priceEur: api.pricePTEur,
    sizes: api.sizes.map((s) => s.size),
    stock: Object.fromEntries(
      api.sizes.map((s) => [s.size, market === 'AO' ? s.stockAO : s.stockPT]),
    ),
    colors,
    tag: tag ? ((lang === 'en' ? tag.labelEN : tag.labelPT)?.trim() || tag.labelPT) : undefined,
    description: localizedDescription,
    images,
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}
