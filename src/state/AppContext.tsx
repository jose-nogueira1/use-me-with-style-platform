import { createContext, useContext, useEffect, useMemo, useState, useReducer, type ReactNode } from 'react';
import type { Lang } from '../theme';
import { publicEnv } from '../config/env';
import { cartReducer, type CartItem, type CartAction } from './cartReducer';
import { marketFromHostname, siblingMarketUrl } from '../lib/market';

export type Market = 'AO' | 'PT';
export type ThemeMode = 'light' | 'dark';

type AppContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  market: Market;
  setMarket: (market: Market) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  cart: CartItem[];
  dispatchCart: (action: CartAction) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const MARKET_STORAGE_KEY = 'ump-market-pref';
const LANG_STORAGE_KEY = 'ump-lang-pref';
const THEME_STORAGE_KEY = 'ump-theme-pref';

const defaultMarket: Market = publicEnv.defaultMarket === 'PT' ? 'PT' : 'AO';

/**
 * The market subdomain (ao./pt.) is the source of truth once present --
 * Angola and Portugal are separate storefronts (JOS separation decision,
 * 2026-07-10), not a free user toggle. `null` here means the current
 * hostname doesn't carry a market label (localhost, an apex domain, a
 * Vercel preview URL) and callers should fall back to geo-detection/env
 * default instead, same as before this change.
 */
function hostnameMarket(): Market | null {
  if (typeof window === 'undefined') return null;
  return marketFromHostname(window.location.hostname);
}

function readStoredMarket(): Market | null {
  try {
    const v = localStorage.getItem(MARKET_STORAGE_KEY);
    return v === 'AO' || v === 'PT' ? v : null;
  } catch {
    return null;
  }
}

function readStoredLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return v === 'pt' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

function readInitialThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (SSR/private mode) -- fall through to system preference.
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang() ?? 'pt');
  const [market, setMarketState] = useState<Market>(() => hostnameMarket() ?? readStoredMarket() ?? defaultMarket);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readInitialThemeMode);
  const [cart, dispatchCart] = useReducer(cartReducer, []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Phase 1 markets: Angola (Kz) and Portugal (EUR). Geo-detection only
  // matters when the hostname itself doesn't already lock the market (i.e.
  // we're not on ao./pt.) -- on a real market subdomain the URL is the
  // source of truth and must never be second-guessed by a geo lookup.
  useEffect(() => {
    if (hostnameMarket()) return;
    if (readStoredMarket()) return;
    let cancelled = false;
    fetch('/api/geo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { country?: string | null } | null) => {
        if (cancelled || !data) return;
        setMarketState(data.country === 'AO' ? 'AO' : 'PT');
      })
      .catch(() => {
        // Geo endpoint not reachable (local dev, or Vercel headers absent) --
        // keep the env-based default already set on first render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMarket = (m: Market) => {
    // On a market subdomain, "switching" means actually leaving this site
    // for the sibling one -- AO and PT are separate storefronts now, so
    // there's no in-place state flip that could show PT catalogue/pricing
    // on ao.* or vice versa.
    const locked = hostnameMarket();
    if (locked) {
      if (m === locked) return;
      const url = siblingMarketUrl(m, window.location);
      if (url) {
        window.location.href = url;
        return;
      }
    }
    setMarketState(m);
    try {
      localStorage.setItem(MARKET_STORAGE_KEY, m);
    } catch {
      // ignore -- persistence is a nicety, not a requirement
    }
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const value = useMemo(
    () => ({ lang, setLang, market, setMarket, themeMode, setThemeMode, cart, dispatchCart, favorites, toggleFavorite }),
    [lang, market, themeMode, cart, favorites],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Provider and its colocated hooks intentionally share the same module.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp() must be used within <AppProvider>');
  return ctx;
}

/** Angola/Portugal-only formatter -- matches the confirmed Phase 1 markets (INTL deferred). */
// eslint-disable-next-line react-refresh/only-export-components
export function useFormatPrice() {
  const { market } = useApp();
  return (product: { priceKz: number; priceEur: number }) =>
    market === 'AO' ? `Kz ${product.priceKz.toLocaleString('pt-PT')}` : `€${product.priceEur}`;
}
