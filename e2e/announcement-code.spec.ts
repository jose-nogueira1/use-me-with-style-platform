import { test, expect } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

/** The promoted discount code stands out in gold inside the announcement bar. */
test('the code in the announcement bar is gold and the rest of the message is not', async ({ page }) => {
  await mockCheckoutBackend(page);
  await page.route('**/storefront-banner*', (route) =>
    route.fulfill({
      json: { items: [{ id: 'coupon', code: 'TESTE90', pt: 'Use o código TESTE90 e ganhe 90% de desconto', en: 'Use code TESTE90 for 90% off' }] },
    }),
  );
  await seedCheckout(page, { market: 'AO', lang: 'en' });
  await page.goto('/checkout');
  const bar = page.locator('.ump-announce');
  const code = bar.locator('strong', { hasText: 'TESTE90' }).first();
  await expect(code).toBeVisible();
  await expect(code).toHaveCSS('color', 'rgb(229, 194, 79)');
  await expect(bar.locator('.ump-announce-item').first()).toContainText('Use code TESTE90 for 90% off');
  await bar.screenshot({ path: 'test-results/announcement-code.png' });
});
