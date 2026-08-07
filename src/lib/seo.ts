import { useEffect, useLayoutEffect } from 'react';
import type { Lang } from '../theme';
import wordmarkBlack from '../assets/brand/wordmark-black.png';

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
// This only fixes what a real browser tab (or a crawler that executes JS)
// sees -- it does NOT fix what a non-JS crawler or link-preview bot sees,
// since the site is still pure client-side rendered (audit item 9). Once
// deployed, verify with Facebook's Sharing Debugger and Twitter's Card
// Validator -- both need a live URL, so that check only happens post-deploy.

export const SITE_TITLE = 'Use Me With Style';

const SITE_DESCRIPTION: Record<Lang, string> = {
  pt: 'Moda desportiva feminina para Angola e Portugal — leggings, conjuntos fitness e vestidos, com entrega em Luanda e em toda a Europa.',
  en: 'Activewear for women in Angola and Portugal — leggings, fitness sets and dresses, delivered in Luanda and across Europe.',
};

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

/**
 * Resets <title>, meta description, og:title/og:description/og:image and
 * twitter:card to the site-wide default on every route change, BEFORE any
 * page-specific <Seo> below gets a chance to set something more specific.
 * Rendered once, in StorefrontLayout (which wraps every storefront route
 * via <Outlet/>), so routes with no dedicated SEO copy yet (Cart, Checkout,
 * About, Help, the legal pages, etc.) still get a real title/description/
 * preview image instead of the previous static, identical-everywhere tag
 * (and, for OG, nothing at all).
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
 * every route now has *some* image, real or the wordmark fallback) rather
 * than a per-page override -- Twitter's crawler falls back to the og:*
 * equivalents for title/description/image automatically once twitter:card
 * is present, so there's no need for separate twitter:title/description/
 * image tags too.
 */
export function useSeoDefaults(lang: Lang, routeKey: string) {
  useLayoutEffect(() => {
    document.title = SITE_TITLE;
    ensureMeta('name', 'description', SITE_DESCRIPTION[lang]);
    ensureMeta('property', 'og:title', SITE_TITLE);
    ensureMeta('property', 'og:description', SITE_DESCRIPTION[lang]);
    ensureMeta('property', 'og:image', absoluteAssetUrl(wordmarkBlack));
    ensureMeta('name', 'twitter:card', 'summary_large_image');
    // routeKey (typically location.pathname + search) forces this to re-run
    // on every navigation, not just when `lang` changes -- otherwise a nav
    // from a page that set its own <Seo> (e.g. a product) to one that
    // doesn't (e.g. Cart) would leave the previous page's tags behind.
  }, [lang, routeKey]);
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
export function Seo({ title, description, image }: { title: string; description: string; image?: string }) {
  useEffect(() => {
    document.title = title;
    ensureMeta('name', 'description', description);
    ensureMeta('property', 'og:title', title);
    ensureMeta('property', 'og:description', description);
    if (image) ensureMeta('property', 'og:image', image);
  }, [title, description, image]);
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
