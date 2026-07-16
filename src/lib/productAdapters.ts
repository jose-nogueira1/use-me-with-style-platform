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

export function adaptApiProduct(api: ApiProduct, market: 'AO' | 'PT', index = 0): Product {
  const images = (api.images ?? []).flatMap(({ image }) => {
    if (!image || typeof image === 'string') return [];
    const url = absoluteMediaUrl(image.url);
    if (!url) return [];
    return [{
      url,
      cardUrl: absoluteMediaUrl(image.sizes?.card?.url),
      thumbnailUrl: absoluteMediaUrl(image.sizes?.thumbnail?.url),
      alt: image.alt?.trim() || api.name,
    }];
  });

  return {
    id: api.id,
    name: api.name,
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
    description: api.description,
    images,
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}
