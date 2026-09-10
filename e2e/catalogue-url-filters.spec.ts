import { test, expect } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ json: { docs: [] } }));
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'AO', lang: 'en' });
});

for (const width of [390, 1440]) {
  test.describe(`${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
    });

    test('size, colour and sort survive reload and clear without removing unrelated parameters', async ({ page }) => {
      await page.goto('/catalogo?utm_source=test');
      await page.getByRole('button', { name: /^Filters/ }).click();
      const drawer = page.getByRole('dialog');
      await drawer.getByRole('button', { name: 'M', exact: true }).click();
      await expect(page).toHaveURL(/size=M/);
      await drawer.getByRole('button', { name: 'Black', exact: true }).click();
      await drawer.getByRole('button', { name: 'Price ↓', exact: true }).click();
      await page.reload();
      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(drawer.getByRole('button', { name: 'M', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'Black', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'Price ↓', exact: true })).toHaveAttribute('aria-current', 'true');
      await drawer.getByRole('button', { name: 'Clear all filters', exact: true }).click();
      await expect(page).toHaveURL(/\/catalogo\?utm_source=test$/);
      await page.reload();
      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(drawer.getByRole('button', { name: 'M', exact: true })).toHaveAttribute('aria-pressed', 'false');
    });

    test('shared links filter results and browser navigation restores selections', async ({ page }) => {
      await page.goto('/catalogo?size=S&colour=1&sort=price-asc');
      await page.getByRole('button', { name: /^Filters/ }).click();
      const drawer = page.getByRole('dialog');
      await expect(drawer.getByRole('button', { name: 'S', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('a[href="/produto/test-dress"]')).toHaveCount(0);
      await drawer.getByRole('button', { name: 'M', exact: true }).click();
      await expect(page.locator('a[href="/produto/test-dress"]')).toBeVisible();
      await page.getByRole('button', { name: 'Close filters', exact: true }).click();
      await page.locator('a[href="/produto/test-dress"]').click();
      await page.goBack();
      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(drawer.getByRole('button', { name: 'S', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'M', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'Black', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'Price ↑', exact: true })).toHaveAttribute('aria-current', 'true');
    });
  });
}
