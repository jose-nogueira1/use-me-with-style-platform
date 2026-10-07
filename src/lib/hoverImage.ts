import type { ProductImage } from '../types/product';

/** The photo a product card fades to on hover: the next photo after the first
 * that does not contradict it. Photos can be tagged with a colour, and a card
 * that showed a red dress must not flash a blue one, so a colour-tagged first
 * photo is only followed by the same colour or an untagged ("general") photo.
 * Undefined when there is nothing suitable, so a single-photo product simply
 * has no hover effect. */
export function hoverImage(images: ProductImage[]): ProductImage | undefined {
  const [first, ...rest] = images;
  if (!first) return undefined;
  return rest.find((image) => image.url !== first.url && (!image.colorId || !first.colorId || image.colorId === first.colorId));
}
