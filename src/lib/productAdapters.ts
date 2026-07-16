import type { ApiProduct } from './api';
import type { Product } from '../types/product';
import { TONE_CYCLE } from '../components/ProductPhoto';

export function adaptApiProduct(api: ApiProduct, market: 'AO' | 'PT', index = 0): Product {
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
    tone: TONE_CYCLE[index % TONE_CYCLE.length],
  };
}
