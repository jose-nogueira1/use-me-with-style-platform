import type { AnnouncementItem, HomeHero } from './api';

export const PRERENDER_DATA_SCRIPT_ID = 'ump-prerender-data';
export const HOME_RUNTIME_READY_EVENT = 'ump-home-runtime-ready';

type PrerenderData = {
  homeHero?: HomeHero;
  // Announcement bar content for the market this snapshot was built for.
  announcement?: { market: string; items: AnnouncementItem[] };
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

/** The announcement bar's items as they were when this page was pre-rendered, for
 * the given market. Starting the bar from them (instead of empty) keeps it from
 * vanishing and reappearing, with the header jumping, while the client re-renders
 * the snapshot and refetches. Empty when there is no snapshot or it is for
 * another market. */
export function readPrerenderAnnouncement(market: string): AnnouncementItem[] {
  if (typeof document === 'undefined') return [];
  const raw = document.getElementById(PRERENDER_DATA_SCRIPT_ID)?.textContent;
  return parsePrerenderAnnouncement(raw, market);
}

export function parsePrerenderAnnouncement(raw: string | null | undefined, market: string): AnnouncementItem[] {
  if (!raw) return [];
  try {
    const announcement = (JSON.parse(raw) as PrerenderData).announcement;
    return announcement?.market === market && Array.isArray(announcement.items) ? announcement.items : [];
  } catch {
    return [];
  }
}

export function rememberAnnouncementForPrerender(market: string, items: AnnouncementItem[]) {
  if (typeof window === 'undefined') return;
  window.__UMP_PRERENDER_DATA__ = { ...window.__UMP_PRERENDER_DATA__, announcement: { market, items } };
}
