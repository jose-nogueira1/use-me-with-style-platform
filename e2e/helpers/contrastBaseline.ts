import type { ContrastReport, TextFailure, UiFailure } from './contrast';

// Known, accepted contrast failures — 30 July 2026.
//
// Every entry here is a REAL failure that predates the dark-mode work and
// that we have consciously chosen not to fix yet. None of them were
// introduced by the dark-mode fixes; they surfaced because that work added
// light-mode enforcement, which had never existed before.
//
// The common cause is `--c-gold-deep` (#937027). It scores exactly 4.50:1
// on plain paper — tuned to just pass there — and therefore falls short on
// every tinted surface the design also puts it on (hero band 3.79:1, footer
// and chips 4.13–4.17:1). Fixing it means darkening the brand gold to
// roughly #7E5D1F, which changes eyebrow labels, footer headings and icons
// across the whole storefront in light mode. That is Raisa's palette, so it
// needs client/designer sign-off rather than a unilateral QA change.
//
// This file is deliberately NOT a mute button:
//   - Anything not listed here fails the build. New regressions are caught.
//   - If a listed item stops failing, the suite ALSO fails, telling you to
//     delete the entry. A baseline that silently rots is worse than none.
//
// Follow-up: darken --c-gold-deep and give the hero-band controls and hero
// CTA a real boundary. Track alongside the Phase 1 legal/content sign-off,
// since it touches brand colour.

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

export const CONTRAST_BASELINE: BaselineEntry[] = [
  // --- --c-gold-deep on tinted backgrounds (light mode) -------------------
  {
    route: '*', theme: 'light', kind: 'text', match: 'Comprar', ratio: 4.17,
    reason: 'goldDeep on subtleBg — footer column heading',
  },
  {
    route: '*', theme: 'light', kind: 'text', match: 'Apoio', ratio: 4.17,
    reason: 'goldDeep on subtleBg — footer column heading',
  },
  {
    route: '*', theme: 'light', kind: 'text', match: 'Informação', ratio: 4.17,
    reason: 'goldDeep on subtleBg — footer column heading',
  },
  {
    route: '/', theme: 'light', kind: 'text', match: 'Coleção SS26', ratio: 3.79,
    reason: 'goldDeep on heroBg — hero eyebrow',
  },
  {
    route: '/', theme: 'light', kind: 'text', match: 'Categorias', ratio: 3.79,
    reason: 'goldDeep on heroBg — section eyebrow',
  },
  {
    route: '/', theme: 'light', kind: 'text', match: 'Em destaque', ratio: 3.79,
    reason: 'goldDeep on heroBg — section eyebrow',
  },
  {
    route: '/', theme: 'light', kind: 'text', match: 'Segue-nos', ratio: 3.79,
    reason: 'goldDeep on heroBg — section eyebrow',
  },
  {
    route: '/sobre', theme: 'light', kind: 'text', match: 'Use Me With Style', ratio: 3.79,
    reason: 'goldDeep on heroBg — page eyebrow',
  },
  {
    route: '/catalogo', theme: 'light', kind: 'text', match: 'Padrão', ratio: 4.13,
    reason: 'goldDeep on tagBg — active sort chip label',
  },
  {
    route: '/produto/test-dress', theme: 'light', kind: 'text', match: 'Preto', ratio: 4.13,
    reason: 'goldDeep on tagBg — active colour chip label',
  },

  // --- hero-band chrome boundaries ---------------------------------------
  {
    route: '/', theme: 'light', kind: 'ui', match: 'VER TUDO', ratio: 1.43,
    reason: 'champagne CTA on heroBg — no boundary in light mode',
  },
  {
    route: '/', theme: 'light', kind: 'ui', match: 'PT', ratio: 1.3,
    reason: 'heroFieldBorder on heroBg — header control, light mode',
  },
  {
    route: '/', theme: 'light', kind: 'ui', match: 'Carrinho', ratio: 1.3,
    reason: 'heroFieldBorder on heroBg — header control, light mode',
  },
  {
    route: '/', theme: 'light', kind: 'ui', match: 'Usar tema escuro', ratio: 1.3,
    reason: 'heroFieldBorder on heroBg — theme toggle, light mode',
  },
  {
    route: '/', theme: 'dark', kind: 'ui', match: 'PT', ratio: 2.45,
    reason: 'heroFieldBorder on heroBg — header control, dark mode (marginal)',
  },
  {
    route: '/', theme: 'dark', kind: 'ui', match: 'Carrinho', ratio: 2.45,
    reason: 'heroFieldBorder on heroBg — header control, dark mode (marginal)',
  },
  {
    route: '/', theme: 'dark', kind: 'ui', match: 'Usar tema claro', ratio: 2.45,
    reason: 'heroFieldBorder on heroBg — theme toggle, dark mode (marginal)',
  },

  // --- chip borders -------------------------------------------------------
  {
    route: '/catalogo', theme: 'light', kind: 'ui', match: 'Padrão', ratio: 2.4,
    reason: 'C.gold border on paper — active sort chip (marginal)',
  },
  {
    route: '/produto/test-dress', theme: 'light', kind: 'ui', match: 'Preto', ratio: 2.4,
    reason: 'C.gold border on paper — active colour chip (marginal)',
  },
];

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
