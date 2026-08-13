import { cartReducer, type CartAction, type CartItem } from './cartReducer.ts';

type CartStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === 'string'
    && typeof item.size === 'string'
    && typeof item.color === 'string'
    && Number.isInteger(item.qty)
    && Number(item.qty) > 0
    && Number(item.qty) <= 20;
}

export function parseStoredCart(raw: string | null): CartItem[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCartItem).slice(0, 50) : [];
  } catch {
    return [];
  }
}

/** Apply an action to the newest persisted value, not to a tab's possibly
 * stale React snapshot. This prevents a later-open product tab from erasing
 * products previously added in another tab. */
export function applyCartActionToStorage(storage: CartStorage, key: string, action: CartAction): CartItem[] {
  const current = parseStoredCart(storage.getItem(key));
  const next = cartReducer(current, action);
  storage.setItem(key, JSON.stringify(next));
  return next;
}
