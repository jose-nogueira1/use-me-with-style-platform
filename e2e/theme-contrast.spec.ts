import { test, expect } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';
import { auditContrast, formatFailures, seedTheme } from './helpers/contrast';
import { triage } from './helpers/contrastBaseline';

// Dark/light contrast regression guard (2026-07-30).
//
// Added after a dark-mode audit found the product price rendering at 1.05:1
// -- black on a near-black page -- across the card, the PDP and the cart,
// plus primary CTAs with no perceivable boundary. Every one of those shipped
// through type-checking, linting and unit tests, because none of them can
// see a rendered colour.
//
// Both themes are checked, not just dark: the fix introduced theme-reactive
// tokens, and the whole point is that neither theme regresses when someone
// touches them.
//
// Adding light-mode enforcement surfaced a set of real, pre-existing
// failures that nothing had ever measured before -- mostly --c-gold-deep
// being too light for small text on tinted backgrounds. Those are recorded
// in helpers/contrastBaseline.ts with their measured ratios and the reason
// they're deferred, rather than being fixed unilaterally: the fix darkens
// the brand gold and needs the client's sign-off. Everything outside that
// list fails the build, and a baseline entry that stops failing also fails
// the build so the list can't rot.
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/catalogo', name: 'browse' },
  { path: '/produto/test-dress', name: 'product detail' },
  { path: '/carrinho', name: 'cart' },
  { path: '/checkout', name: 'checkout' },
  { path: '/ajuda', name: 'help' },
  { path: '/sobre', name: 'about' },
  { path: '/conta', name: 'order lookup' },
  { path: '/rota-inexistente', name: '404' },
] as const;

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test.describe(`${theme} theme contrast`, () => {
    for (const route of ROUTES) {
      test(`${route.name} meets WCAG AA`, async ({ page }) => {
        await mockCheckoutBackend(page);
        // Cart/checkout need a seeded basket to render their real content
        // rather than the empty state.
        await seedCheckout(page, { market: 'AO', lang: 'pt' });
        await seedTheme(page, theme);

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        // Let the theme attribute and any first-paint transitions settle.
        await page.waitForTimeout(300);

        const report = await auditContrast(page);
        const { unexpected, stale } = triage(route.path, theme, report);

        // New failures fail the build.
        expect(
          unexpected.length,
          formatFailures(route.path, theme, {
            text: unexpected.filter((f) => f.kind === 'text') as typeof report.text,
            ui: unexpected.filter((f) => f.kind === 'ui') as typeof report.ui,
          }),
        ).toBe(0);

        // A baselined item that now passes means the baseline is stale --
        // fail too, so the exception list can't quietly outlive its reason.
        expect(
          stale.length,
          `${stale.length} baseline entr(y/ies) on ${route.path} [${theme}] no longer fail ` +
            `and should be deleted from e2e/helpers/contrastBaseline.ts:\n` +
            stale.map((e) => `  - "${e.match}" (${e.reason})`).join('\n'),
        ).toBe(0);
      });
    }
  });
}

test.describe('theme token integrity', () => {
  test('every themed token resolves in both modes', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedTheme(page, 'dark');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // A var() that doesn't resolve silently renders as transparent/black
    // rather than throwing, which is exactly how an unnoticed dark-mode
    // regression starts. Assert each one actually has a value.
    const unresolved = await page.evaluate(() => {
      const shell = document.querySelector('.ump-shell');
      if (!shell) return ['.ump-shell not found'];
      const cs = getComputedStyle(shell);
      const names = [
        '--c-paper', '--c-ink', '--c-ink-soft', '--c-gold-deep', '--c-white',
        '--c-tag-bg', '--c-rule', '--c-rule-light', '--c-subtle-bg',
        '--c-success-bg', '--c-success-text', '--c-hero-bg', '--c-hero-text',
        '--c-hero-accent', '--c-hero-subtitle', '--c-hero-field-bg',
        '--c-hero-field-border', '--c-cta-bg', '--c-cta-border', '--c-danger',
        '--c-danger-strong', '--c-danger-bg', '--c-disabled-bg',
        '--c-disabled-fg', '--c-field-border', '--c-photo-chip-bg',
        '--c-photo-chip-fg',
      ];
      return names.filter((n) => !cs.getPropertyValue(n).trim());
    });

    expect(unresolved, `unresolved CSS variables: ${unresolved.join(', ')}`).toEqual([]);
  });
});
