import { createContext, useContext, useEffect, useMemo, useState, useReducer, type ReactNode } from 'react';
import type { Lang } from '../theme';
import { publicEnv } from '../config/env';
import { cartReducer, type CartItem, type CartAction } from './cartReducer';

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
  const [market, setMarketState] = useState<Market>(() => readStoredMarket() ?? defaultMarket);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readInitialThemeMode);
  const [cart, dispatchCart] = useReducer(cartReducer, []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Phase 1 markets: Angola (Kz) and Portugal (EUR). If the visitor hasn't
  // explicitly picked a market before (no stored preference), ask our
  // /api/geo endpoint (Vercel's IP-country header) and default to Angola
  // pricing there, Portugal everywhere else. Silently keeps the env-based
  // default if geo-detection fails or isn't available (e.g. local dev).
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMarket = (m: Market) => {
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp() must be used within <AppProvider>');
  return ctx;
}

/** Angola/Portugal-only formatter -- matches the confirmed Phase 1 markets (INTL deferred). */
export function useFormatPrice() {
  const { market } = useApp();
  return (product: { priceKz: number; priceEur: number }) =>
    market === 'AO' ? `Kz ${product.priceKz.toLocaleString('pt-PT')}` : `€${product.priceEur}`;
}
