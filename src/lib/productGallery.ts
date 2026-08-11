import type { ProductImage } from '../types/product';

/** General photos belong to every colour gallery. Colour-tagged photos are
 * additive, and filtering the original array preserves the merchandising
 * order set by the administrator. If stale data contains no usable photo
 * for the selected colour, showing the complete gallery is safer than an
 * empty product page. */
export function imagesForColor(images: ProductImage[], colorId?: string): ProductImage[] {
  const relevant = images.filter((image) => !image.colorId || image.colorId === colorId);
  return relevant.length > 0 ? relevant : images;
}
