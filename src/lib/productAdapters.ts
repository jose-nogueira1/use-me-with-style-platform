import type { ApiProduct } from './api';
import type { Product } from '../types/product';
import { TONE_CYCLE } from '../components/ProductPhoto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Mock data already matches the Product shape almost exactly; this just adds a slug. */
export function adaptMockProduct(mock: Omit<Product, 'slug'>): Product {
  return { ...mock, slug: slugify(mock.name) };
}

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
