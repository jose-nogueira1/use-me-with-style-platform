import { useEffect, useState } from 'react';
import { fetchProducts } from '../lib/api';
import { adaptApiProduct } from '../lib/productAdapters';
import type { Product } from '../types/product';
import type { Market } from '../state/AppContext';

type UseProductsResult = {
  products: Product[];
  loading: boolean;
};

// Module-scoped, not component state: survives Cart/Browse/Home mounting
// and unmounting as the shopper navigates, so it actually helps repeat
// market switches (2026-07-27 follow-up to the market-switch UX pass).
// Each market+language combination is cached separately since the adapted
// `Product[]` bakes in market-specific pricing/stock and language-specific
// names. Intentionally never expires within a page load -- catalogue edits
// mid-session are rare, and a switch always kicks off a background
// revalidation (below) that quietly refreshes the cache/UI once it
// resolves, so staleness self-heals within one round trip rather than
// piling up forever.
const productsCache = new Map<string, Product[]>();

function cacheKeyFor(market: Market, lang: 'pt' | 'en') {
  return `${market}:${lang}`;
}

/**
 * Single source of truth for storefront product data. The CMS is authoritative:
 * an unavailable API produces an empty catalogue and a visible console error,
 * never a silent local-data fallback.
 */
export function useProducts(market: Market, lang: 'pt' | 'en'): UseProductsResult {
  const key = cacheKeyFor(market, lang);
  const [state, setState] = useState<{ key: string; products: Product[]; loading: boolean }>(() => {
    const cached = productsCache.get(key);
    return { key, products: cached ?? [], loading: !cached };
  });

  // Synchronously reset for the new market/lang during render (React's
  // documented "adjust state when a prop changes" pattern) rather than in
  // the effect below -- a cache HIT should show its data on the very same
  // frame the switch happens, with no one-frame flash of the previous
  // market's products first. A cache MISS still resets to empty+loading,
  // identical to the old always-fetch-fresh behaviour.
  if (state.key !== key) {
    const cached = productsCache.get(key);
    setState({ key, products: cached ?? [], loading: !cached });
  }

  useEffect(() => {
    let cancelled = false;

    // Always revalidate in the background, even on a cache hit -- this is
    // stale-while-revalidate, not stale-forever. The difference from the
    // pre-cache version is only that a cache hit doesn't re-arm `loading`
    // (nothing needs a skeleton when we already have good-enough data to
    // show instantly), matching the instant-feeling repeat-switch this was
    // built for.
    fetchProducts(market)
      .then((apiProducts) => {
        if (cancelled) return;
        const adapted = apiProducts.map((p, i) => adaptApiProduct(p, market, lang, i));
        productsCache.set(key, adapted);
        setState({ key, products: adapted, loading: false });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load products from the CMS API.', err);
        // A cache hit already on screen is more useful than clearing it
        // out from under the shopper over a transient refetch failure --
        // only genuinely empty (no prior cache) collapses to [].
        setState((prev) => (prev.key === key ? { key, products: productsCache.get(key) ?? [], loading: false } : prev));
      });

    return () => {
      cancelled = true;
    };
  }, [market, lang, key]);

  return { products: state.products, loading: state.loading };
}
