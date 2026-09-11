import type { HomeHero } from './api';

export const PRERENDER_DATA_SCRIPT_ID = 'ump-prerender-data';
export const HOME_RUNTIME_READY_EVENT = 'ump-home-runtime-ready';

type PrerenderData = {
  homeHero?: HomeHero;
};

declare global {
  interface Window {
    __UMP_PRERENDER_DATA__?: PrerenderData;
  }
}

export function readPrerenderHomeHero(): HomeHero | null {
  if (typeof document === 'undefined') return null;
  const raw = document.getElementById(PRERENDER_DATA_SCRIPT_ID)?.textContent;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PrerenderData;
    return parsed.homeHero ?? null;
  } catch {
    return null;
  }
}

export function rememberHomeHeroForPrerender(homeHero: HomeHero) {
  if (typeof window === 'undefined') return;
  window.__UMP_PRERENDER_DATA__ = { ...window.__UMP_PRERENDER_DATA__, homeHero };
}
