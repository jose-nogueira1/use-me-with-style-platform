import type { CartItem } from '../state/cartReducer';
import type { Product, ProductImage } from '../types/product';

export function cartItemImage(
  product: Pick<Product, 'images' | 'variants'>,
  item: CartItem,
): ProductImage | undefined {
  const variant = product.variants.find((candidate) =>
    item.variantId
      ? candidate.id === item.variantId
      : candidate.color === item.color && candidate.legacySize === item.size,
  );
  const colorId = variant?.color ?? item.color;
  return product.images.find((image) => image.colorId === colorId)
    ?? product.images.find((image) => !image.colorId)
    ?? product.images[0];
}
