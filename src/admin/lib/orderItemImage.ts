import type { ApiProduct } from '../../lib/api.ts';

type OrderImageItem = { product: unknown; colorId?: string | null };

function relationshipId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function absoluteMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return undefined;
  try { return new URL(url, window.location.origin).toString(); } catch { return undefined; }
}

/** Resolve the catalogue photo that represents the exact purchased colour.
 * General images remain the fallback, followed by the first image for older
 * catalogue records without assignments. */
export function orderItemImage(
  item: OrderImageItem,
  products: ApiProduct[],
): { url?: string; alt?: string } {
  const product = products.find((entry) => String(entry.id) === relationshipId(item.product));
  const images = product?.images ?? [];
  const exact = item.colorId
    ? images.find((entry) => relationshipId(entry.color) === String(item.colorId))
    : undefined;
  const general = images.find((entry) => !relationshipId(entry.color));
  const selected = exact ?? general ?? images[0];
  const media = selected?.image && typeof selected.image === 'object'
    ? selected.image as { url?: string; alt?: string }
    : {};
  return { url: absoluteMediaUrl(media.url), alt: media.alt || product?.name };
}
