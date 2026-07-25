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
  | { type: 'ADD'; id: string; size: string; color: string }
  | { type: 'INC'; idx: number }
  | { type: 'DEC'; idx: number }
  | { type: 'REMOVE'; idx: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(
        (i) => i.id === action.id && i.size === action.size && i.color === action.color,
      );
      if (existing) {
        return state.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...state, { id: action.id, size: action.size, color: action.color, qty: 1 }];
    }
    case 'INC':
      return state.map((i, idx) => (idx === action.idx ? { ...i, qty: i.qty + 1 } : i));
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
