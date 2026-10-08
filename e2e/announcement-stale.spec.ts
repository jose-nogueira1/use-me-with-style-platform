import { test, expect } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

/** The pre-rendered snapshot can be older than the admin's current bar: it must never be shown. */
test('an out-of-date pre-rendered bar is never shown; the current one appears once fetched', async ({ page }) => {
  await mockCheckoutBackend(page);
  const STALE = { id: 'message', pt: 'Mensagem antiga', en: 'Old message' };
  await page.route('**/checkout', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    const snapshot = JSON.stringify({ announcement: { market: 'AO', items: [STALE] } });
    const html = (await response.text()).replace('</body>', `<script id="ump-prerender-data" type="application/json">${snapshot}</script></body>`);
    await route.fulfill({ response, body: html });
  });
  await page.route('**/storefront-banner*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({ json: { items: [{ id: 'coupon', code: 'TEST90', pt: 'Use o código TEST90', en: 'Use code TEST90' }] } });
  });
  await seedCheckout(page, { market: 'AO', lang: 'en' });
  await page.goto('/checkout');

  const bar = page.locator('.ump-announce');
  await expect(bar).toHaveCount(1); // its place is held from the first paint
  await page.waitForTimeout(400);
  await expect(bar).toBeHidden(); // holds its place but is not shown while the fetch is pending
  await expect(bar).toContainText('Old message'); // (the stale text is only in the hidden placeholder)
  await expect(bar.locator('.ump-announce-item').first()).toContainText('Use code TEST90'); // appears once fresh
  await expect(bar).toBeVisible();
  await expect(bar).not.toContainText('Old message');
});
