import { useEffect, useLayoutEffect } from 'react';
import type { Lang } from '../theme';

// Per-route <title>/meta description (2026-08-07, SEO audit item 1: "Static
// <title>, no meta description on any page" -- every page previously shared
// index.html's one hardcoded <title>Use Me With Style</title> with no
// meta[name=description] at all). No new dependency (react-helmet-async)
// deliberately -- this codebase's own package.json only carries four
// runtime deps (react, react-dom, react-router-dom, lucide-react), and
// StorefrontLayout.tsx already manages its canonical/og:url tags with the
// same plain "find-or-create the DOM node" technique used below, so this
// follows the existing convention rather than introducing a second way of
// doing the same job.
//
// This only fixes what a real browser tab sees -- it does NOT fix what a
// non-JS crawler or link-preview bot sees, since the site is still pure
// client-side rendered (audit item 9). That's a separate, much bigger piece
// of work; this is the half-day fix that unblocks everything else in the
// on-page table.

export const SITE_TITLE = 'Use Me With Style';

const SITE_DESCRIPTION: Record<Lang, string> = {
  pt: 'Moda desportiva feminina para Angola e Portugal — leggings, conjuntos fitness e vestidos, com entrega em Luanda e em toda a Europa.',
  en: 'Activewear for women in Angola and Portugal — leggings, fitness sets and dresses, delivered in Luanda and across Europe.',
};

function ensureDescriptionMeta(content: string) {
  let element = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', 'description');
    document.head.appendChild(element);
  }
  element.content = content;
}

/**
 * Resets <title> and meta description to the site-wide default on every
 * route change, BEFORE any page-specific <Seo> below gets a chance to set
 * something more specific. Rendered once, in StorefrontLayout (which wraps
 * every storefront route via <Outlet/>), so routes with no dedicated SEO
 * copy yet (Cart, Checkout, About, Help, the legal pages, etc.) still get a
 * real title/description instead of the previous static, identical-
 * everywhere tag.
 *
 * useLayoutEffect, not useEffect, is what makes the override ordering
 * reliable: React guarantees every layout effect in a commit fires before
 * any passive effect fires, regardless of where each component sits in the
 * tree. Since this default-setter is a layout effect and <Seo> below is a
 * plain (passive) effect, this always wins the "who sets the title first"
 * race against Home/Browse/ProductDetail's own <Seo> -- on the very first
 * page load and on every subsequent client-side navigation alike. Relying
 * on parent-before-child or mount-order instead would be fragile (that
 * ordering isn't guaranteed the same way).
 */
export function useSeoDefaults(lang: Lang, routeKey: string) {
  useLayoutEffect(() => {
    document.title = SITE_TITLE;
    ensureDescriptionMeta(SITE_DESCRIPTION[lang]);
    // routeKey (typically location.pathname + search) forces this to re-run
    // on every navigation, not just when `lang` changes -- otherwise a nav
    // from a page that set its own <Seo> (e.g. a product) to one that
    // doesn't (e.g. Cart) would leave the previous page's title behind.
  }, [lang, routeKey]);
}

/**
 * Per-page title + meta description. Overrides useSeoDefaults above for
 * exactly the routes that have real content to describe as of this pass
 * (Home, Browse, ProductDetail -- see the SEO audit, item 1). Every other
 * route keeps the site-wide default until it gets its own pass.
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
 * homepage title).
 */
export function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    ensureDescriptionMeta(description);
  }, [title, description]);
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
