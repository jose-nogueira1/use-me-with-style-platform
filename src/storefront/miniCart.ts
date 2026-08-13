export const OPEN_MINI_CART_EVENT = 'ump:open-mini-cart';

/** Opens the shared cart preview from anywhere inside the storefront. */
export function openMiniCart() {
  window.dispatchEvent(new Event(OPEN_MINI_CART_EVENT));
}
