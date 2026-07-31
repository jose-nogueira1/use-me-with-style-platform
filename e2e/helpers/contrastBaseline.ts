import type { ContrastReport, TextFailure, UiFailure } from './contrast';

// Known, accepted contrast failures.
//
// CURRENTLY EMPTY — and that is the desired state.
//
// History, worth keeping because it explains why the mechanism exists:
// enabling light-mode enforcement on 30 July 2026 surfaced 19 real failures
// that had been shipping unmeasured. Nearly all traced to a single token,
// `--c-gold-deep` (#937027), which scored exactly 4.50:1 on plain paper —
// tuned to just clear AA there — and therefore fell short on every tinted
// surface the design also used it on: hero band 3.79:1, footer 4.17:1,
// tag/chip backgrounds 4.13:1. The rest were the hero CTA and the header
// controls over the hero band, which had no perceivable boundary.
//
// Those were baselined here rather than fixed unilaterally, because the fix
// darkens the brand gold across every eyebrow label, footer heading and icon
// on the storefront. The client approved the change the same day, so all 19
// entries were fixed and removed:
//   --c-gold-deep       #937027 -> #7E5D1F   (5.00–5.95:1 on all surfaces)
//   --c-hero-field-border  light 1.30 -> 3.53,  dark 2.45 -> 3.61
//   --c-hero-cta-border    new; light 4.09, invisible in dark (already 10.32)
//   active chip borders    C.gold 2.40 -> C.goldDeep 5.95 light / 10.26 dark
//
// Keep this file. When something genuinely can't be fixed straight away, add
// it here with its measured ratio and reason rather than loosening the
// scanner or deleting a test.
//
// This is deliberately NOT a mute button:
//   - Anything not listed here fails the build. New regressions are caught.
//   - If a listed item stops failing, the suite ALSO fails, telling you to
//     delete the entry. A baseline that silently rots is worse than none.

export type BaselineEntry = {
  /** Route the failure appears on, or '*' for every route (e.g. footer). */
  route: string | '*';
  theme: 'light' | 'dark';
  kind: 'text' | 'ui';
  /** Substring match against the failing element's text or label. */
  match: string;
  /** Measured on 2026-07-30 — recorded so drift is visible in review. */
  ratio: number;
  reason: string;
};

export const CONTRAST_BASELINE: BaselineEntry[] = [];

const matches = (entry: BaselineEntry, route: string, theme: string, label: string, kind: string) =>
  (entry.route === '*' || entry.route === route) &&
  entry.theme === theme &&
  entry.kind === kind &&
  label.toLowerCase().includes(entry.match.toLowerCase());

export type Triaged = {
  /** Failures with no baseline entry — these must fail the build. */
  unexpected: (TextFailure | UiFailure)[];
  /** Baseline entries that no longer fail — delete them. */
  stale: BaselineEntry[];
};

export function triage(route: string, theme: 'light' | 'dark', report: ContrastReport): Triaged {
  const all = [
    ...report.text.map((f) => ({ f, label: f.text, kind: 'text' as const })),
    ...report.ui.map((f) => ({ f, label: f.label, kind: 'ui' as const })),
  ];

  const relevant = CONTRAST_BASELINE.filter(
    (e) => (e.route === '*' || e.route === route) && e.theme === theme,
  );
  const hit = new Set<BaselineEntry>();
  const unexpected: (TextFailure | UiFailure)[] = [];

  for (const { f, label, kind } of all) {
    const entry = relevant.find((e) => matches(e, route, theme, label, kind));
    if (entry) hit.add(entry);
    else unexpected.push(f);
  }

  return { unexpected, stale: relevant.filter((e) => !hit.has(e)) };
}
