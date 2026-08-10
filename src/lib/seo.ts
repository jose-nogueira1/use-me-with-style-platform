import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Lang } from '../theme';
import wordmarkBlack from '../assets/brand/wordmark-black.png';
import { marketAlternateUrls, type MarketAlternateUrls } from './market';
import { canonicalUrl, routeSeoMetadata } from './seoMetadata';

export { SITE_TITLE } from './seoMetadata';

// Per-route <title>/meta description/Open Graph/Twitter Card tags
// (2026-08-07, SEO audit items 1 + 3: "Static <title>, no meta description
// on any page" and "No Open Graph / Twitter Card tags -- link shares show
// no preview" -- every page previously shared index.html's one hardcoded
// <title>Use Me With Style</title> with no meta[name=description] and no
// social-preview tags at all, so a WhatsApp/Instagram/Facebook share of any
// page showed no preview card). No new dependency (react-helmet-async)
// deliberately -- this codebase's own package.json only carries four
// runtime deps (react, react-dom, react-router-dom, lucide-react), and
// StorefrontLayout.tsx already manages its canonical/og:url/og:site_name
// tags with the same plain "find-or-create the DOM node" technique used
// below, so this follows the existing convention rather than introducing a
// second way of doing the same job. og:url/og:site_name themselves stay in
// StorefrontLayout, unchanged -- they're already correct and per-route.
//
// index.html also carries a complete site-wide fallback set for non-JS link
// preview bots. Route-specific bot metadata still depends on prerendering
// (audit item 9); this module replaces the fallbacks after hydration.

// Site-wide og:image fallback for routes/products with no real photo of
// their own -- the same wordmark asset already wired into the header/
// footer everywhere via BrandLogo.tsx (not the unused emblem-black.png),
// per the audit's "a static brand asset (already wired into the header/
// footer)" instruction. Vite resolves this import to a root-relative,
// hashed build path (e.g. /assets/wordmark-black-abc123.png) -- crawlers
// need an absolute URL, so origin is prepended where it's actually used.
function absoluteAssetUrl(assetPath: string): string {
  return `${window.location.origin}${assetPath}`;
}

function ensureMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function ensureCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

const HREFLANG_CODES = ['pt-AO', 'pt-PT', 'x-default'] as const;

function syncHreflangLinks(alternates: MarketAlternateUrls | null) {
  for (const hreflang of HREFLANG_CODES) {
    const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
    const existing = document.head.querySelector<HTMLLinkElement>(selector);
    if (!alternates) {
      existing?.remove();
      continue;
    }

    const element = existing ?? document.createElement('link');
    element.rel = 'alternate';
    element.hreflang = hreflang;
    element.href = alternates[hreflang];
    if (!existing) document.head.appendChild(element);
  }
}

/**
 * Resets <title>, meta description, og:title/og:description/og:image and
 * twitter:card to the site-wide default on every route change, BEFORE any
 * page-specific <Seo> below gets a chance to set something more specific.
 * Rendered once, in StorefrontLayout (which wraps every storefront route
 * via <Outlet/>), using localized route metadata for every storefront page.
 * Home, Browse and ProductDetail can still override these route defaults
 * with live CMS/product content through <Seo> below.
 *
 * useLayoutEffect, not useEffect, is what makes the override ordering
 * reliable: React guarantees every layout effect in a commit fires before
 * any passive effect fires, regardless of where each component sits in the
 * tree. Since this default-setter is a layout effect and <Seo> below is a
 * plain (passive) effect, this always wins the "who sets these tags first"
 * race against Home/Browse/ProductDetail's own <Seo> -- on the very first
 * page load and on every subsequent client-side navigation alike. Relying
 * on parent-before-child or mount-order instead would be fragile (that
 * ordering isn't guaranteed the same way). It's also what makes <Seo>'s
 * `image` prop safe to leave unset on routes with no natural photo (Browse):
 * this always resets og:image to the site default first, so an unset
 * `image` prop just means "don't override", not "reuse whatever the
 * previous page happened to set".
 *
 * twitter:card is a fixed site-wide constant ("summary_large_image", since
 * every route now has *some* image, real or the wordmark fallback). The
 * explicit Twitter title/description/image tags mirror their Open Graph
 * equivalents so the crawler-visible index.html fallbacks never remain
 * stale after hydrated client-side navigation.
 */
export function useSeoDefaults(lang: Lang, pathname: string, search: string) {
  const metadata = routeSeoMetadata(pathname, lang);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const canonical = canonicalUrl(origin, pathname);
  const alternates = typeof window === 'undefined' ? null : marketAlternateUrls(window.location);
  const aoAlternate = alternates?.['pt-AO'];
  const ptAlternate = alternates?.['pt-PT'];
  const defaultAlternate = alternates?.['x-default'];
  useLayoutEffect(() => {
    document.title = metadata.title;
    ensureCanonical(canonical);
    syncHreflangLinks(aoAlternate && ptAlternate && defaultAlternate ? {
      'pt-AO': aoAlternate,
      'pt-PT': ptAlternate,
      'x-default': defaultAlternate,
    } : null);
    ensureMeta('name', 'description', metadata.description);
    // Reset robots on every valid route so client-side navigation away from
    // a 404 cannot leave the destination accidentally marked noindex.
    ensureMeta('name', 'robots', 'index,follow');
    ensureMeta('property', 'og:title', metadata.title);
    ensureMeta('property', 'og:description', metadata.description);
    ensureMeta('property', 'og:image', absoluteAssetUrl(wordmarkBlack));
    ensureMeta('property', 'og:url', canonical);
    ensureMeta('property', 'og:site_name', 'Use Me With Style');
    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:title', metadata.title);
    ensureMeta('name', 'twitter:description', metadata.description);
    ensureMeta('name', 'twitter:image', absoluteAssetUrl(wordmarkBlack));
  }, [aoAlternate, canonical, defaultAlternate, metadata.description, metadata.title, ptAlternate, search]);
}

/**
 * Per-page title + meta description + Open Graph tags. Overrides
 * useSeoDefaults above for exactly the routes that have real content to
 * describe as of this pass (Home, Browse, ProductDetail -- see the SEO
 * audit, items 1 and 3). Every other route keeps the site-wide default
 * until it gets its own pass.
 *
 * A plain useEffect (not useLayoutEffect) is required, not just idiomatic:
 * it needs to run *after* useSeoDefaults, and every layout effect in a
 * commit fires before any passive effect does (see above) -- so pairing
 * "default = layout effect" with "override = passive effect" is what
 * guarantees the override always wins, deterministically.
 *
 * Callers are responsible for the full title string, including the
 * "| Use Me With Style" brand suffix where one makes sense -- this keeps
 * the component itself dumb and lets each page shape its own title (see
 * Browse's "{Category} | Use Me With Style" vs. Home's tagline-first
 * homepage title). og:title/og:description default to the page's own
 * title/description, per the audit's own spec for item 3 -- callers don't
 * pass separate og-specific copy. `image` is optional: pages with a real
 * photo of their own (Home's CMS hero image, ProductDetail's first product
 * photo) pass one; Browse currently doesn't, and simply leaves the
 * useSeoDefaults-set wordmark fallback in place.
 */
export function Seo({ title, description, image, robots }: { title: string; description: string; image?: string; robots?: 'index,follow' | 'noindex,follow' }) {
  const location = useLocation();
  useEffect(() => {
    document.title = title;
    ensureMeta('name', 'description', description);
    ensureMeta('property', 'og:title', title);
    ensureMeta('property', 'og:description', description);
    ensureMeta('name', 'twitter:title', title);
    ensureMeta('name', 'twitter:description', description);
    if (robots) ensureMeta('name', 'robots', robots);
    if (image) {
      ensureMeta('property', 'og:image', image);
      ensureMeta('name', 'twitter:image', image);
    }
  }, [title, description, image, robots, location.pathname, location.search]);
  return null;
}

/**
 * Meta descriptions read best under ~155 characters before search engines
 * truncate them -- CMS-authored copy (product descriptions, CMS hero
 * subtitles) has no length limit of its own, so this trims on a word
 * boundary rather than cutting mid-word.
 */
export function truncateForMeta(text: string, maxLen = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
