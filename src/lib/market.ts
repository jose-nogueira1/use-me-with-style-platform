import type { Market } from '../state/AppContext';

const MARKET_SUBDOMAINS: Record<Market, string> = { AO: 'ao', PT: 'pt' };

/**
 * Reads the market off the subdomain (ao.usemewithstyle.shop /
 * pt.usemewithstyle.shop). Returns null when the hostname carries no market
 * label -- localhost, an apex domain, or a Vercel preview URL -- so callers
 * can fall back to geo-detection/env defaults instead of asserting a market
 * that isn't actually locked in by the URL.
 */
export function marketFromHostname(hostname: string): Market | null {
  const label = hostname.split('.')[0]?.toLowerCase();
  if (label === 'ao') return 'AO';
  if (label === 'pt') return 'PT';
  return null;
}

/**
 * True once the current hostname pins a specific market. Angola and
 * Portugal are fully separate storefronts once this is true -- "switching
 * markets" means leaving this site for the sibling one, not flipping local
 * state (that would silently mix one market's catalogue/pricing/checkout
 * into the other's origin).
 */
export function isMarketLockedByHostname(hostname: string): boolean {
  return marketFromHostname(hostname) !== null;
}

type LocationLike = {
  hostname: string;
  protocol: string;
  port: string;
  pathname: string;
  search: string;
  hash?: string;
};

/**
 * Builds the URL for the sibling market's subdomain, preserving the current
 * path/search -- e.g. ao.usemewithstyle.shop/catalogo?cat=vestidos ->
 * pt.usemewithstyle.shop/catalogo?cat=vestidos -- instead of dropping the
 * visitor back at the home page of the other site. Returns null if the
 * current hostname isn't already market-locked (nothing to swap).
 */
export function siblingMarketUrl(targetMarket: Market, location: LocationLike): string | null {
  const currentMarket = marketFromHostname(location.hostname);
  if (!currentMarket) return null;

  const rest = location.hostname.split('.').slice(1).join('.');
  const nextHost = `${MARKET_SUBDOMAINS[targetMarket]}.${rest}`;
  const port = location.port ? `:${location.port}` : '';
  return `${location.protocol}//${nextHost}${port}${location.pathname}${location.search}${location.hash ?? ''}`;
}

/**
 * Builds the market subdomain URL from an apex/root hostname -- e.g.
 * usemewithstyle.shop -> ao.usemewithstyle.shop -- stripping a leading "www."
 * first so we don't produce "ao.www.usemewithstyle.shop".
 */
export function apexToMarketUrl(targetMarket: Market, location: LocationLike): string {
  const bareHost = location.hostname.replace(/^www\./i, '');
  const port = location.port ? `:${location.port}` : '';
  return `${location.protocol}//${MARKET_SUBDOMAINS[targetMarket]}.${bareHost}${port}${location.pathname}${location.search}${location.hash ?? ''}`;
}

/**
 * Runs once at boot, before the app mounts, on hostnames that aren't already
 * market-locked (the apex/marketing domain -- not ao./pt.): asks Vercel's
 * IP-geolocation for the visitor's country via /api/geo and redirects
 * straight to the right market subdomain. Angola -> ao., everywhere else
 * (including a failed/unreachable geo lookup) -> pt., per the 2026-07-10
 * product decision ("Angola loads Angolan market, everywhere else loads
 * Portuguese market").
 *
 * `apexHostname` should be the configured production hostname (derived from
 * VITE_SITE_URL) so this only fires on the real apex domain -- never on
 * localhost or a Vercel preview URL, where there's no matching ao./pt.
 * subdomain to redirect to.
 *
 * Returns true if a redirect was kicked off, so the caller can skip
 * mounting the React app on this page load (it's navigating away anyway).
 */
export async function redirectToDetectedMarketIfNeeded(apexHostname: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;

  if (marketFromHostname(hostname)) return false; // already on ao./pt.
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false; // no subdomains to redirect to locally

  const bareApex = apexHostname.replace(/^www\./i, '');
  const bareHost = hostname.replace(/^www\./i, '');
  if (bareHost !== bareApex) return false; // not the configured apex (e.g. an unrelated preview URL) -- leave it alone

  let country: string | null = null;
  try {
    const res = await fetch('/api/geo');
    if (res.ok) {
      const data: { country?: string | null } = await res.json();
      country = data.country ?? null;
    }
  } catch {
    // Geo endpoint unreachable -- fall through to the Portugal default below.
  }

  const target: Market = country === 'AO' ? 'AO' : 'PT';
  window.location.replace(apexToMarketUrl(target, window.location));
  return true;
}
