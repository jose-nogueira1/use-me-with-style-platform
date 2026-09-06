import type { Market } from '../state/AppContext';
import { parseStoredCart } from '../state/cartSync.ts';

type ReadableStorage = Pick<Storage, 'getItem'>;

export function otherMarketCartSummary(
  storage: ReadableStorage,
  market: Market,
): { market: Market; itemCount: number } {
  const otherMarket: Market = market === 'AO' ? 'PT' : 'AO';
  const items = parseStoredCart(storage.getItem(`ump-cart-v1:${otherMarket}`));
  return {
    market: otherMarket,
    itemCount: items.reduce((total, item) => total + item.qty, 0),
  };
}
