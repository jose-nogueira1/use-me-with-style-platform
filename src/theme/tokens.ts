// Design tokens extracted from the real Figma high-fidelity design
// ("Use Me With Style — Phase 1 Launch Design", node 119:3 "Design System"
// cover + cross-referenced against every screen). Do not invent new colors
// outside this palette -- everything in the UI should trace back to one of
// these swatches or their derived neutral/text pairings.
//
// Values that need to flip between light/dark mode are CSS custom
// properties (see LIGHT_VARS / DARK_VARS below, injected as :root /
// [data-theme='dark'] rules in App.tsx). Because these are plain CSS
// variable references, every existing `style={{ color: C.ink }}` call site
// repaints automatically when the theme toggles -- no per-component changes
// needed.
//
// Earlier this file also treated the Home hero / header-on-Home / order
// confirmation hero as permanently dark "regardless of mode" -- in practice
// that meant toggling the theme had almost no visible effect on the Home
// page (the most-viewed screen), since its header+hero band ignored the
// toggle entirely and only secondary areas (category tiles, footer) flipped.
// Those surfaces now use the hero* tokens below, which ARE theme-reactive.
// Only small, deliberately-branded elements (solid black CTA buttons,
// product photo art) stay constant across modes -- those are isolated UI
// chrome, not large surfaces, so keeping them constant doesn't create the
// "half the app didn't change" impression.
export const C = {
  // Brand swatches (from the Figma cover) -- constant across themes
  black: '#050505',
  champagne: '#E5C24F',
  gold: '#CAA039',
  rose: '#A66F63',
  sage: '#78816F',
  blue: '#426A70',

  // Page chrome -- flips between light/dark mode
  paper: 'var(--c-paper)',
  ink: 'var(--c-ink)',
  inkSoft: 'var(--c-ink-soft)',
  goldDeep: 'var(--c-gold-deep)',
  white: 'var(--c-white)',
  tagBg: 'var(--c-tag-bg)',
  rule: 'var(--c-rule)',
  ruleLight: 'var(--c-rule-light)',
  subtleBg: 'var(--c-subtle-bg)',
  successBg: 'var(--c-success-bg)',
  successText: 'var(--c-success-text)',

  // Home hero / header-on-Home / order-confirmation hero -- flips between
  // light/dark mode (a warm cream surface with dark ink in light mode, the
  // original moody dark panel in dark mode).
  heroBg: 'var(--c-hero-bg)',
  heroText: 'var(--c-hero-text)',
  heroAccent: 'var(--c-hero-accent)',
  heroSubtitle: 'var(--c-hero-subtitle)',
  heroFieldBg: 'var(--c-hero-field-bg)',
  heroFieldBorder: 'var(--c-hero-field-border)',

  // Text/surfaces meant for permanently-dark UI chrome (solid black CTA
  // buttons like "Checkout" / "Add to cart") -- constant across themes,
  // since these are small isolated brand elements, not page surfaces.
  onDark: '#FFFDF8',
  onDarkGold: '#E5C24F',

  // Legacy dark-hero constants -- kept only for any stray reference; new
  // code should use the hero* tokens above instead, which react to theme.
  heroDark: '#1B1712',
  darkFieldBg: '#171310',
  darkFieldBorder: '#6B531E',
  darkDivider: '#352817',
  heroWash: '#6D5128',
  garmentStripeDark: '#2A2724',
  photoDarkBg: '#4C4030',
} as const;

export const F = {
  // The design uses Inter exclusively (Regular/Medium/Bold/Extra Bold) --
  // no serif anywhere, including the "Use Me" wordmark.
  sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  // Aliases kept so existing call sites (F.display / F.body) don't all need
  // renaming at once -- both point at the same real typeface now.
  display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

// Injected as :root (light, default) and [data-theme='dark'] (override) in
// App.tsx's global <style> block.
export const LIGHT_VARS: Record<string, string> = {
  '--c-paper': '#FFFDF8',
  '--c-ink': '#171514',
  '--c-ink-soft': '#6C655D',
  '--c-gold-deep': '#937027',
  '--c-white': '#FFFFFF',
  '--c-tag-bg': '#FCF3D8',
  '--c-rule': '#D8CDB7',
  '--c-rule-light': '#ECE5D8',
  '--c-subtle-bg': '#F8F4EC',
  '--c-success-bg': '#EFF2EA',
  '--c-success-text': '#4B5944',
  '--c-hero-bg': '#F1E9D6',
  '--c-hero-text': '#171514',
  '--c-hero-accent': '#937027',
  '--c-hero-subtitle': '#6C655D',
  '--c-hero-field-bg': '#FFFFFF',
  '--c-hero-field-border': '#D8CDB7',
};

export const DARK_VARS: Record<string, string> = {
  '--c-paper': '#0F0D0B',
  '--c-ink': '#F5F1EA',
  '--c-ink-soft': '#A79C8C',
  '--c-gold-deep': '#E0B75E',
  '--c-white': '#221E19',
  '--c-tag-bg': '#2E2612',
  '--c-rule': '#3A342A',
  '--c-rule-light': '#2A251E',
  '--c-subtle-bg': '#17130F',
  '--c-success-bg': '#16231A',
  '--c-success-text': '#8FBF88',
  '--c-hero-bg': '#1B1712',
  '--c-hero-text': '#FFFDF8',
  '--c-hero-accent': '#E5C24F',
  '--c-hero-subtitle': '#D9D1C2',
  '--c-hero-field-bg': '#171310',
  '--c-hero-field-border': '#6B531E',
};
