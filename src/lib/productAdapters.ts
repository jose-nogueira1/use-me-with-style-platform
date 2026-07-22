import type { ApiProduct } from './api';
import type { Product } from '../types/product';
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

  return {
    id: String(api.id),
    name: localizedName,
    slug: api.slug,
    cat: api.category,
    priceKz: api.priceAOKz,
    priceEur: api.pricePTEur,
    sizes: api.sizes.map((s) => s.size),
    stock: Object.fromEntries(
      api.sizes.map((s) => [s.size, market === 'AO' ? s.stockAO : s.stockPT]),
    ),
    colors: api.colors.map((c) => c.color),
    tag: api.tag,
    description: localizedDescription,
    images,
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}
