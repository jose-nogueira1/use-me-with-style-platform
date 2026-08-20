import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useReducer, type ReactNode } from 'react';
import { formatKz, type Lang } from '../theme';
import { publicEnv } from '../config/env';
import { cartReducer, type CartItem, type CartAction } from './cartReducer';
import { applyCartActionToStorage, parseStoredCart } from './cartSync';
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
const CART_STORAGE_PREFIX = 'ump-cart-v1';
const FAVORITES_STORAGE_PREFIX = 'ump-favorites-v1';

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

// Automatic day/night theme (2026-08-07 request: "light 8AM-8PM, dark 8PM-
// 8AM, should change automatically"). Local device time, since there's no
// server-side timezone concept for a storefront visitor. 20 is exclusive on
// the light side (8:00:00pm itself is already dark) to match "from 8PM till
// 8AM" reading as dark starting exactly at 8PM.
function timeBasedThemeMode(now: Date = new Date()): ThemeMode {
  const hour = now.getHours();
  return hour >= 8 && hour < 20 ? 'light' : 'dark';
}

function readInitialThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (SSR/private mode) -- fall through to time-of-day.
  }
  return timeBasedThemeMode();
}

function cartStorageKey(market: Market) {
  return `${CART_STORAGE_PREFIX}:${market}`;
}

function readStoredCart(market: Market): CartItem[] {
  try {
    return parseStoredCart(localStorage.getItem(cartStorageKey(market)));
  } catch {
    return [];
  }
}

function favoritesStorageKey(market: Market) {
  return `${FAVORITES_STORAGE_PREFIX}:${market}`;
}

function readStoredFavorites(market: Market): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(favoritesStorageKey(market)) || '[]') as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, 200) : []);
  } catch {
    return new Set();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang() ?? 'pt');
  const [market, setMarketState] = useState<Market>(() => hostnameMarket() ?? readStoredMarket() ?? defaultMarket);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readInitialThemeMode);
  const [cart, dispatchCartState] = useReducer(cartReducer, market, readStoredCart);
  const [favorites, setFavorites] = useState<Set<string>>(() => readStoredFavorites(market));
  const cartChannel = useRef<BroadcastChannel | null>(null);

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

  // Keeps the theme flipping automatically at the 8AM/8PM boundary for
  // anyone who leaves a tab open across one, WITHOUT overriding an explicit
  // manual choice -- once setThemeMode has been called (the header's
  // light/dark toggle), THEME_STORAGE_KEY is set and this effect stops
  // touching themeMode entirely, same as how a manual choice isn't fought
  // by an OS-level dark-mode change either. Polled every minute rather than
  // a single precisely-timed setTimeout -- simpler, and landing up to a
  // minute late on something driven by wall-clock time is imperceptible.
  useEffect(() => {
    const applyIfAutomatic = () => {
      let hasExplicitOverride: boolean;
      try {
        hasExplicitOverride = localStorage.getItem(THEME_STORAGE_KEY) != null;
      } catch {
        hasExplicitOverride = false;
      }
      if (hasExplicitOverride) return;
      setThemeModeState(timeBasedThemeMode());
    };
    const id = setInterval(applyIfAutomatic, 60_000);
    return () => clearInterval(id);
  }, []);

  // Keeps <html lang> in sync with the live language state (2026-08-07, SEO
  // audit item 2). index.html's static default is now "pt" (this
  // storefront's actual default, matching readStoredLang() ?? 'pt' above),
  // but that's only correct until hydration -- without this, toggling to EN
  // via the header's language switch left the DOM attribute permanently
  // wrong at "pt" for the rest of the session (and vice versa for anyone
  // whose stored preference is "en"). A plain synchronous assignment, not
  // useLayoutEffect: document.documentElement.lang has no paint-timing
  // sensitivity the way a visible title/meta tag might.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Synchronize external cart writes. The storage event covers every modern
  // browser; BroadcastChannel makes updates immediate and also provides a
  // clean path for browsers that coalesce rapid storage notifications.
  useEffect(() => {
    const key = cartStorageKey(market);
    const applyExternal = (items: CartItem[]) => dispatchCartState({ type: 'HYDRATE', items });
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === key) applyExternal(parseStoredCart(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(key);
      channel.onmessage = (event: MessageEvent<unknown>) => applyExternal(parseStoredCart(JSON.stringify(event.data)));
      cartChannel.current = channel;
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      cartChannel.current?.close();
      cartChannel.current = null;
    };
  }, [market]);

  const dispatchCart = useCallback((action: CartAction) => {
    // HYDRATE is an internal state synchronization operation; persisting it
    // would let a stale tab echo an old snapshot back over the authoritative
    // cart. All user mutations instead start from the latest stored value.
    if (action.type === 'HYDRATE') {
      dispatchCartState(action);
      return;
    }
    try {
      const next = applyCartActionToStorage(localStorage, cartStorageKey(market), action);
      dispatchCartState({ type: 'HYDRATE', items: next });
      cartChannel.current?.postMessage(next);
    } catch {
      // Private browsing/storage restrictions: preserve fully functional
      // single-tab behavior even when durable synchronization is unavailable.
      dispatchCartState(action);
    }
  }, [market]);

  useEffect(() => {
    try {
      localStorage.setItem(favoritesStorageKey(market), JSON.stringify([...favorites]));
    } catch {
      // Storage can be unavailable; favorites still work for the current session.
    }
  }, [favorites, market]);

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
    dispatchCartState({ type: 'HYDRATE', items: readStoredCart(m) });
    setFavorites(readStoredFavorites(m));
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
    [lang, market, themeMode, cart, dispatchCart, favorites],
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

/** Angola/Portugal-only formatter -- matches the confirmed Phase 1 markets
 * (INTL deferred). Formats the price actually charged (the sale price when
 * one is active, 2026-07-25 discounts phase 1) -- use useFormatOriginalPrice
 * below alongside this one for a "was" strikethrough price. */
// eslint-disable-next-line react-refresh/only-export-components
export function useFormatPrice() {
  const { market, lang } = useApp();
  return (product: { effectivePriceKz: number; effectivePriceEur: number }) =>
    market === 'AO' ? `Kz ${formatKz(product.effectivePriceKz, lang)}` : `€${product.effectivePriceEur}`;
}

/** The regular (pre-sale) price, for a strikethrough next to useFormatPrice's
 * result -- only meaningful when `product.onSale` is true. */
// eslint-disable-next-line react-refresh/only-export-components
export function useFormatOriginalPrice() {
  const { market, lang } = useApp();
  return (product: { priceKz: number; priceEur: number }) =>
    market === 'AO' ? `Kz ${formatKz(product.priceKz, lang)}` : `€${product.priceEur}`;
}
