export type CartItem = {
  id: string;
  size: string;
  // Colour's stable row id (2026-07-25 bilingual colours follow-up) --
  // NOT a display name, so the dedupe key below stays correct even if the
  // shopper switches storefront language mid-session. Screens resolve the
  // localized label from the product's own colour list when rendering.
  color: string;
  qty: number;
};

export type CartAction =
  // `max` (2026-07-31, stock cap fix): the caller already has the variant's
  // available stock in scope wherever ADD/INC are dispatched (Cart.tsx's
  // stepper, ProductDetail.tsx's Add-to-Cart), so the cap is enforced here,
  // once, rather than only via a disabled button at each call site --
  // previously a shopper could click the stepper's + past actual stock
  // (only a warning appeared, nothing blocked the increment itself).
  | { type: 'ADD'; id: string; size: string; color: string; max: number }
  | { type: 'INC'; idx: number; max: number }
  | { type: 'DEC'; idx: number }
  | { type: 'REMOVE'; idx: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      if (action.max <= 0) return state; // out of stock -- nothing to add
      const existing = state.find(
        (i) => i.id === action.id && i.size === action.size && i.color === action.color,
      );
      if (existing) {
        if (existing.qty >= action.max) return state;
        return state.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...state, { id: action.id, size: action.size, color: action.color, qty: 1 }];
    }
    case 'INC':
      return state.map((i, idx) => (idx === action.idx && i.qty < action.max ? { ...i, qty: i.qty + 1 } : i));
    case 'DEC':
      return state
        .map((i, idx) => (idx === action.idx ? { ...i, qty: Math.max(1, i.qty - 1) } : i))
        .filter((i) => i.qty > 0);
    case 'REMOVE':
      return state.filter((_, idx) => idx !== action.idx);
    case 'CLEAR':
      return [];
    case 'HYDRATE':
      return action.items;
    default:
      return state;
  }
}
