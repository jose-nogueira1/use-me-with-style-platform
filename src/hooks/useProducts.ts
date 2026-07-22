import { useEffect, useState } from 'react';
import { fetchProducts } from '../lib/api';
import { adaptApiProduct } from '../lib/productAdapters';
import type { Product } from '../types/product';
import type { Market } from '../state/AppContext';

type UseProductsResult = {
  products: Product[];
  loading: boolean;
};

/**
 * Single source of truth for storefront product data. The CMS is authoritative:
 * an unavailable API produces an empty catalogue and a visible console error,
 * never a silent local-data fallback.
 */
export function useProducts(market: Market, lang: 'pt' | 'en'): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchProducts(market)
      .then((apiProducts) => {
        if (cancelled) return;
        setProducts(apiProducts.map((p, i) => adaptApiProduct(p, market, lang, i)));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load products from the CMS API.', err);
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [market, lang]);

  return { products, loading };
}
