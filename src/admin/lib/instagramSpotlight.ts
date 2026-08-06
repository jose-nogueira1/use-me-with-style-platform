import type { ApiProduct, InstagramSpotlight } from '../../lib/api';

export type ShopAssociation = NonNullable<InstagramSpotlight['productTags']>[number];
export type ProductRelationshipId = string | number;

/** Payload's PostgreSQL collections use numeric IDs. Keep that primitive
 * type when serialising relationship values instead of turning every ID into
 * a string, which Payload rejects for nested relationship arrays. */
export function productRelationshipId(
  ref: string | number | ApiProduct | null | undefined,
): ProductRelationshipId | null {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === 'object') {
    return typeof ref.id === 'string' || typeof ref.id === 'number' ? ref.id : null;
  }
  return ref;
}

export function productRelationshipKey(
  ref: string | number | ApiProduct | null | undefined,
): string {
  const id = productRelationshipId(ref);
  return id === null ? '' : String(id);
}

export function normalizeShopAssociations(
  value: InstagramSpotlight['productTags'],
): ShopAssociation[] {
  return (value ?? []).flatMap((entry) => {
    const productIds = (entry.products ?? [])
      .map(productRelationshipId)
      .filter((id): id is ProductRelationshipId => id !== null)
      .slice(0, 4);
    if (!entry.permalink || productIds.length === 0) return [];

    const productKeys = new Set(productIds.map(String));
    const selections = Object.fromEntries(
      Object.entries(entry.variantSelections ?? {}).filter(([productId]) => productKeys.has(productId)),
    );

    return [{
      mediaId: entry.mediaId ?? null,
      permalink: entry.permalink,
      products: productIds,
      variantSelections: selections,
    }];
  });
}
