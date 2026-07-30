import type { Page } from '@playwright/test';

// WCAG 2.1 contrast scanner, run inside the page against real computed
// styles (2026-07-30, dark-mode QA follow-up).
//
// This exists because the dark-mode defects found on 30 July were all
// invisible to unit tests and to code review: `C.black` text is perfectly
// correct on a cream page and catastrophic on a near-black one, and nothing
// in the type system or the linter can tell the difference. Only rendering
// both themes and measuring the result catches it.
//
// Two rules are enforced, both from WCAG 2.1 AA:
//   1.4.3  Contrast (Minimum)   -- text needs 4.5:1, or 3:1 when "large"
//                                  (>=24px, or >=18.66px at weight >=700).
//   1.4.11 Non-text Contrast    -- the boundary of an interactive control
//                                  needs 3:1 against what's behind it.
//
// Deliberate exemptions, so the guard stays trustworthy rather than noisy:
//   - Disabled controls (explicitly exempt from 1.4.11).
//   - Screen-reader-only content (clipped, or .ump-sr-only).
//   - Controls with neither a fill nor a border -- a plain inline text link
//     has no boundary to measure, and its text is already covered by 1.4.3.
//   - Zero-size / hidden / fully transparent elements.
//   - Anything sitting on imagery. This one is a measurement limit, not a
//     judgement call: getComputedStyle only exposes backgroundColor, so an
//     element on top of a photo or a gradient reports the page colour behind
//     it and gets scored against the wrong thing. On the first real run that
//     produced a wave of false alarms -- the category-tile captions were
//     flagged at 1.19:1 when they actually render near 11:1 over the scrim
//     gradient. Rather than guess at pixel values, elements whose backdrop
//     is artwork are skipped and covered by visual review instead. Three
//     shapes of this: a background-image in the ancestor chain, an element
//     whose own bounds come from image content, and frosted overlays that
//     declare backdrop-filter.

export type TextFailure = {
  kind: 'text';
  text: string;
  selector: string;
  foreground: string;
  background: string;
  fontSize: number;
  fontWeight: number;
  ratio: number;
  required: number;
};

export type UiFailure = {
  kind: 'ui';
  label: string;
  selector: string;
  surface: string;
  behind: string;
  surfaceRatio: number;
  borderRatio: number;
  required: 3;
};

export type ContrastReport = { text: TextFailure[]; ui: UiFailure[] };

export async function auditContrast(page: Page): Promise<ContrastReport> {
  return page.evaluate(() => {
    type Rgb = { r: number; g: number; b: number; a: number };

    const parse = (c: string): Rgb | null => {
      const m = (c || '').match(/[\d.]+/g);
      if (!m) return null;
      const [r, g, b, a = 1] = m.map(Number);
      return { r, g, b, a: Number(a) };
    };
    const over = (fg: Rgb, bg: Rgb): Rgb => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const luminance = (c: Rgb) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (a: Rgb, b: Rgb) => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const hex = (c: Rgb) =>
      '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const round = (n: number) => Math.round(n * 100) / 100;

    // Walks ancestors compositing every semi-transparent layer until an
    // opaque one is hit, so `rgba()` fills resolve to what's actually seen.
    const effectiveBg = (el: Element | null): Rgb => {
      let node: Element | null = el;
      const layers: Rgb[] = [];
      while (node && node !== document.documentElement) {
        const bg = parse(getComputedStyle(node).backgroundColor);
        if (bg && bg.a > 0) {
          layers.push(bg);
          if (bg.a === 1) break;
        }
        node = node.parentElement;
      }
      let base: Rgb = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return base;
    };

    // Every rectangle on the page that paints artwork: a real <img>, or any
    // element with a background-image (the tile scrim gradient, the hero
    // placeholder). Collected once and tested geometrically rather than by
    // walking ancestors, because the thing behind a caption is usually its
    // absolutely-positioned SIBLING, not an ancestor -- an ancestor walk
    // both misses those and over-skips whole sections that merely happen to
    // contain images further down.
    // [data-artwork] is an explicit hook on ProductPhoto -- its placeholder
    // is built from plain background colours, so no heuristic can spot it.
    const artworkRects: DOMRect[] = [];
    document.querySelectorAll('*').forEach((node) => {
      const isImg =
        node.tagName === 'IMG' ||
        node.tagName === 'PICTURE' ||
        node.hasAttribute('data-artwork');
      const bi = getComputedStyle(node).backgroundImage;
      if (!isImg && (!bi || bi === 'none')) return;
      const r = node.getBoundingClientRect();
      if (r.width > 8 && r.height > 8) artworkRects.push(r);
    });

    // True when the element's centre sits on top of one of those rectangles,
    // i.e. its real backdrop is artwork whose pixel colour we cannot read.
    const onArtwork = (el: Element | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return artworkRects.some(
        (a) => cx >= a.left && cx <= a.right && cy >= a.top && cy <= a.bottom,
      );
    };

    // A control whose visible bounds come from its own image content (a
    // product card, a category tile) doesn't rely on fill or border to be
    // perceivable, so 1.4.11 has nothing meaningful to measure.
    const hasImageContent = (el: Element) =>
      Boolean(el.querySelector('img, picture, [data-artwork]')) ||
      Array.from(el.querySelectorAll('*')).some((child) => {
        const bi = getComputedStyle(child).backgroundImage;
        return bi && bi !== 'none';
      });

    const isHidden = (el: Element) => {
      let node: Element | null = el;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (node.classList?.contains('ump-sr-only')) return true;
        if (cs.clip === 'rect(0px, 0px, 0px, 0px)') return true;
        const r = node.getBoundingClientRect();
        if (r.width <= 1 && r.height <= 1) return true;
        node = node.parentElement;
      }
      return false;
    };

    const selectorFor = (el: Element) => {
      let s = el.tagName.toLowerCase();
      if (el.id) s += `#${el.id}`;
      const cls = typeof el.className === 'string' ? el.className.trim() : '';
      if (cls) s += '.' + cls.split(/\s+/).slice(0, 2).join('.');
      return s;
    };

    const text: unknown[] = [];
    const ui: unknown[] = [];

    document.querySelectorAll('*').forEach((el) => {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent ?? '').trim())
        .join(' ')
        .trim();
      if (!own) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      if (isHidden(el)) return;
      if (onArtwork(el)) return;
      const fg0 = parse(cs.color);
      if (!fg0) return;
      const bg = effectiveBg(el);
      const fg = over(fg0, bg);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const fontWeight = cs.fontWeight === 'bold' ? 700 : parseInt(cs.fontWeight, 10) || 400;
      const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const required = large ? 3 : 4.5;
      const r = ratio(fg, bg);
      if (r < required) {
        text.push({
          kind: 'text',
          text: own.slice(0, 60),
          selector: selectorFor(el),
          foreground: hex(fg),
          background: hex(bg),
          fontSize,
          fontWeight,
          ratio: round(r),
          required,
        });
      }
    });

    document
      .querySelectorAll('button, a[href], input, select, textarea, [role="button"]')
      .forEach((el) => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return;
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        if (isHidden(el)) return;
        // Disabled controls are exempt from 1.4.11.
        if ((el as HTMLButtonElement).disabled) return;
        if (el.getAttribute('aria-disabled') === 'true') return;
        // Backdrop is artwork, or the control is defined by its own imagery,
        // or it's a frosted overlay -- see the note at the top of the file.
        if (onArtwork(el)) return;
        if (hasImageContent(el)) return;
        if (cs.backdropFilter && cs.backdropFilter !== 'none') return;

        const fill = parse(cs.backgroundColor);
        const borderWidth = parseFloat(cs.borderTopWidth) || 0;
        const borderColor = parse(cs.borderTopColor);
        const hasFill = Boolean(fill && fill.a > 0);
        const hasBorder = borderWidth > 0 && Boolean(borderColor && borderColor.a > 0);
        // No fill and no border -> nothing to measure (plain text link).
        if (!hasFill && !hasBorder) return;

        const behind = effectiveBg(el.parentElement);
        const surface = hasFill ? over(fill as Rgb, behind) : behind;
        const surfaceRatio = hasFill ? ratio(surface, behind) : 0;
        const borderRatio = hasBorder ? ratio(over(borderColor as Rgb, behind), behind) : 0;
        // Either a distinguishable fill OR a distinguishable border satisfies
        // the rule -- the control just has to be perceivable somehow.
        if (Math.max(surfaceRatio, borderRatio) < 3) {
          ui.push({
            kind: 'ui',
            label: ((el as HTMLElement).innerText || el.getAttribute('aria-label') || el.tagName)
              .trim()
              .slice(0, 40),
            selector: selectorFor(el),
            surface: hex(surface),
            behind: hex(behind),
            surfaceRatio: round(surfaceRatio),
            borderRatio: round(borderRatio),
            required: 3,
          });
        }
      });

    return { text, ui } as { text: TextFailure[]; ui: UiFailure[] };
  }) as Promise<ContrastReport>;
}

/** Renders a failure list as a readable assertion message. */
export function formatFailures(route: string, theme: string, report: ContrastReport): string {
  const lines = [`${report.text.length + report.ui.length} contrast failure(s) on ${route} [${theme}]`];
  for (const f of report.text) {
    lines.push(
      `  TEXT  ${f.ratio}:1 (needs ${f.required}:1)  "${f.text}"  ${f.foreground} on ${f.background}  [${f.selector}, ${f.fontSize}px/${f.fontWeight}]`,
    );
  }
  for (const f of report.ui) {
    lines.push(
      `  UI    fill ${f.surfaceRatio}:1 / border ${f.borderRatio}:1 (needs 3:1)  "${f.label}"  ${f.surface} on ${f.behind}  [${f.selector}]`,
    );
  }
  return lines.join('\n');
}

/** Forces a theme before first paint, matching AppContext's storage key. */
export async function seedTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    window.localStorage.setItem('ump-theme-pref', t);
  }, theme);
}
