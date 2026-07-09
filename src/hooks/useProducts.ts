import { useEffect, useState } from 'react';
import { publicEnv } from '../config/env';
import { fetchProducts } from '../lib/api';
import { adaptApiProduct, adaptMockProduct } from '../lib/productAdapters';
import { PRODUCTS as MOCK_PRODUCTS } from '../data/mockData';
import type { Product } from '../types/product';
import type { Market } from '../state/AppContext';

type UseProductsResult = {
  products: Product[];
  loading: boolean;
  /** Set when the API call failed and we silently fell back to mock data. */
  usingFallback: boolean;
};

/**
 * Single source of truth for storefront product data. Tries the CMS API
 * first; if it's unreachable (backend not running yet, still common while
 * this is being built out) or VITE_ENABLE_MOCK_DATA is explicitly on, falls
 * back to the prototype's mock catalogue so the UI is never just blank.
 */
export function useProducts(market: Market): UseProductsResult {
  const [products, setProducts] = useState<Product[]>(() =>
    publicEnv.mockDataEnabled ? MOCK_PRODUCTS.map(adaptMockProduct) : [],
  );
  const [loading, setLoading] = useState(!publicEnv.mockDataEnabled);
  const [usingFallback, setUsingFallback] = useState(publicEnv.mockDataEnabled);

  useEffect(() => {
    let cancelled = false;

    if (publicEnv.mockDataEnabled) {
      // Dev mode: mock data is the deliberate choice, don't hit the network.
      setProducts(MOCK_PRODUCTS.map(adaptMockProduct));
      setUsingFallback(true);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchProducts()
      .then((apiProducts) => {
        if (cancelled) return;
        setProducts(apiProducts.map((p, i) => adaptApiProduct(p, market, i)));
        setUsingFallback(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('Failed to load products from the CMS API, falling back to mock data.', err);
        setProducts(MOCK_PRODUCTS.map(adaptMockProduct));
        setUsingFallback(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [market]);

  return { products, loading, usingFallback };
}
