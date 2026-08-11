import type { ApiCategory, ApiColor, ApiMedia, ApiProduct, HomeHero } from '../lib/api.ts';

export type MediaUsage = {
  key: string;
  label: string;
  href: string;
  kind: 'product' | 'category' | 'colour' | 'hero';
};

export type MediaUsageIndex = Map<string, MediaUsage[]>;

function relationshipId(ref: string | number | { id?: string | number } | null | undefined): string {
  if (ref === null || ref === undefined) return '';
  if (typeof ref === 'object') return ref.id === undefined ? '' : String(ref.id);
  return String(ref);
}

function add(index: MediaUsageIndex, media: ApiMedia['id'] | string, usage: MediaUsage): void {
  const id = String(media);
  if (!id) return;
  const existing = index.get(id) ?? [];
  if (!existing.some((item) => item.key === usage.key)) index.set(id, [...existing, usage]);
}

export function buildMediaUsageIndex(
  products: ApiProduct[],
  categories: ApiCategory[],
  colours: ApiColor[],
  hero: HomeHero,
  lang: 'pt' | 'en',
): MediaUsageIndex {
  const index: MediaUsageIndex = new Map();

  for (const product of products) {
    for (const [position, image] of (product.images ?? []).entries()) {
      const mediaId = relationshipId(image.image);
      if (mediaId) add(index, mediaId, {
        key: `product:${product.id}:${position}`,
        kind: 'product',
        label: `${lang === 'pt' ? 'Produto' : 'Product'}: ${product.namePT || product.name || product.slug}`,
        href: `/admin/produtos/${product.id}`,
      });
    }
  }

  for (const category of categories) {
    const mediaId = relationshipId(category.image);
    if (mediaId) add(index, mediaId, {
      key: `category:${category.id}`,
      kind: 'category',
      label: `${lang === 'pt' ? 'Categoria' : 'Category'}: ${category.namePT}`,
      href: '/admin/definicoes?tab=products',
    });
  }

  for (const colour of colours) {
    const mediaId = relationshipId(colour.swatch);
    if (mediaId) add(index, mediaId, {
      key: `colour:${colour.id}`,
      kind: 'colour',
      label: `${lang === 'pt' ? 'Cor' : 'Colour'}: ${colour.namePT}`,
      href: '/admin/definicoes?tab=products',
    });
  }

  const desktopId = relationshipId(hero.heroImage);
  if (desktopId) add(index, desktopId, {
    key: 'hero:desktop',
    kind: 'hero',
    label: lang === 'pt' ? 'Página inicial: hero desktop' : 'Home page: desktop hero',
    href: '/admin/definicoes?tab=home',
  });
  const mobileId = relationshipId(hero.heroImageMobile);
  if (mobileId) add(index, mobileId, {
    key: 'hero:mobile',
    kind: 'hero',
    label: lang === 'pt' ? 'Página inicial: hero mobile' : 'Home page: mobile hero',
    href: '/admin/definicoes?tab=home',
  });

  return index;
}

// Later Media Library phases, intentionally deferred:
// 3. Add a reusable existing-media picker to hero/product/category/swatch editors.
// 4. Store an original-file checksum and offer reuse for exact duplicate uploads.
// 5. Model one master asset with separate purpose-specific crop derivatives.
// 6. Add optional perceptual-hash warnings for visually similar files.
