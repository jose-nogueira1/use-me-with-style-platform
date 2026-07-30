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

  // Solid-black CTA chrome (2026-07-30 dark-mode QA). The fill stays black
  // in both themes -- that's the brand look -- but in dark mode a black fill
  // on the near-black page (#050505 on #0F0D0B = 1.05:1) left the button
  // with no perceivable edge, failing WCAG 1.4.11's 3:1 non-text contrast
  // rule. ctaBorder is therefore theme-reactive: invisible in light mode
  // (same value as the fill, so light rendering is byte-identical) and a
  // deep gold in dark mode (3.93:1 against the page). Use it on every
  // surface painted with `background: C.black`.
  ctaBg: 'var(--c-cta-bg)',
  ctaBorder: 'var(--c-cta-border)',

  // Error / low-stock / sale accents. These were hardcoded hexes chosen
  // against the cream light-mode page; on the dark page the same values
  // dropped to ~3.3:1. Now theme-reactive so both modes clear 4.5:1.
  //   danger       -- out-of-stock and low-stock warning text
  //   dangerStrong -- sale prices (deliberately hotter than `danger`)
  //   dangerBg     -- the tinted notice box behind `danger` text
  danger: 'var(--c-danger)',
  dangerStrong: 'var(--c-danger-strong)',
  dangerBg: 'var(--c-danger-bg)',

  // Disabled controls (e.g. the "Out of stock" CTA). Previously painted
  // with inkSoft, which flips to a LIGHT grey in dark mode while its label
  // stayed near-white -- 2.66:1. Split into its own pair so the label keeps
  // contrast in both themes.
  disabledBg: 'var(--c-disabled-bg)',
  disabledFg: 'var(--c-disabled-fg)',

  // Interactive form-control borders. `rule` is the decorative divider tone
  // and is deliberately faint (~1.2:1); using it on inputs meant every field
  // on checkout had a boundary well under WCAG 1.4.11's 3:1 minimum -- in
  // BOTH themes, so this was never a dark-mode-only problem. fieldBorder is
  // the accessible counterpart: use it on anything the shopper types into,
  // picks from, or toggles; keep `rule`/`ruleLight` for dividers and
  // decorative container edges.
  fieldBorder: 'var(--c-field-border)',

  // The round control that floats on top of product photography (the
  // favourites heart). The chip is a light frosted disc in light mode; in
  // dark mode it inverts to a dark disc, both so it stops reading as a
  // glaring white blob and because its icon is drawn with photoChipFg --
  // previously the icon inherited C.ink, which flips to near-white and
  // vanished against the light chip (1.06:1).
  photoChipBg: 'var(--c-photo-chip-bg)',
  photoChipFg: 'var(--c-photo-chip-fg)',

  // Scrims over imagery/modals. Constant across themes on purpose: they
  // darken whatever is beneath them, so they don't need to flip.
  scrim: 'rgba(5,5,5,0.4)',
  scrimSoft: 'rgba(5,5,5,0.35)',
  // Bottom-up gradient behind the category-tile captions.
  tileScrim: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.0) 45%)',

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
  // Nudged 2026-07-30 from #ECE5D8 (1.23:1 against paper -- effectively
  // invisible) to 1.58:1. Still a whisper of an edge, but a perceivable one.
  '--c-rule-light': '#D5CBB6',
  '--c-subtle-bg': '#F8F4EC',
  '--c-success-bg': '#EFF2EA',
  '--c-success-text': '#4B5944',
  '--c-hero-bg': '#F1E9D6',
  '--c-hero-text': '#171514',
  '--c-hero-accent': '#937027',
  '--c-hero-subtitle': '#6C655D',
  '--c-hero-field-bg': '#FFFFFF',
  '--c-hero-field-border': '#D8CDB7',
  // Same value as the fill -> the border is invisible and light mode renders
  // exactly as it did before these tokens were introduced.
  '--c-cta-bg': '#050505',
  '--c-cta-border': '#050505',
  '--c-danger': '#A6483A',
  '--c-danger-strong': '#B95545',
  '--c-danger-bg': '#FBEAE4',
  '--c-disabled-bg': '#6C655D',
  '--c-disabled-fg': '#FFFDF8',
  // 3.82:1 against paper (the decorative --c-rule scored 1.55:1).
  '--c-field-border': '#8A8071',
  '--c-photo-chip-bg': 'rgba(255,255,255,0.85)',
  '--c-photo-chip-fg': '#171514',
};

export const DARK_VARS: Record<string, string> = {
  '--c-paper': '#0F0D0B',
  '--c-ink': '#F5F1EA',
  '--c-ink-soft': '#A79C8C',
  '--c-gold-deep': '#E0B75E',
  '--c-white': '#221E19',
  '--c-tag-bg': '#2E2612',
  '--c-rule': '#3A342A',
  // Nudged 2026-07-30 from #2A251E (1.28:1) to 1.58:1, mirroring the light
  // mode change so container edges read the same way in both themes.
  '--c-rule-light': '#3B342A',
  '--c-subtle-bg': '#17130F',
  '--c-success-bg': '#16231A',
  '--c-success-text': '#8FBF88',
  '--c-hero-bg': '#1B1712',
  '--c-hero-text': '#FFFDF8',
  '--c-hero-accent': '#E5C24F',
  '--c-hero-subtitle': '#D9D1C2',
  '--c-hero-field-bg': '#171310',
  '--c-hero-field-border': '#6B531E',
  // Fill stays black (brand), but the deep-gold edge gives the button a
  // perceivable boundary: 3.93:1 against --c-paper, clearing WCAG 1.4.11.
  '--c-cta-bg': '#050505',
  '--c-cta-border': '#8A6C24',
  // 7.60:1 / 8.54:1 against --c-paper (the light-mode values scored 3.33:1).
  '--c-danger': '#E8887A',
  '--c-danger-strong': '#F0938A',
  // Deep oxblood tint so the notice reads as a dark-theme surface rather
  // than a cream light-mode island; --c-danger on it is 6.59:1.
  '--c-danger-bg': '#2E1714',
  '--c-disabled-bg': '#3A342A',
  '--c-disabled-fg': '#C9BFAF',
  // 3.34:1 against paper.
  '--c-field-border': '#6E6455',
  // Dark disc instead of the light one, so the control stops reading as a
  // light-mode island on top of the photo.
  '--c-photo-chip-bg': 'rgba(20,17,14,0.82)',
  '--c-photo-chip-fg': '#F5F1EA',
};
