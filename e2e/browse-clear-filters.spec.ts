import { test, expect, type Page } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

// Exercise the current filter drawer and visible result badges. The sidebar
// is retained in the markup but is no longer the shopper's control surface.
async function openFilters(page: Page) {
  await page.getByRole('button', { name: /^Filters/ }).click();
  return page.getByRole('dialog');
}
const badges = (page: Page) => page.getByRole('button', { name: /^Remove filter:/ });

test.describe('Browse — clear all filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', route => route.fulfill({ json: { docs: [] } }));
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en' });
  });

  test('drawer reset is hidden until a filter is active', async ({ page }) => {
    await page.goto('/catalogo');
    const drawer = await openFilters(page);
    await expect(drawer.getByRole('button', { name: 'Clear all filters' })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'M', exact: true }).click();
    await expect(drawer.getByRole('button', { name: 'Clear all filters' })).toBeVisible();
  });

  test('resets URL and local filters while preserving unrelated parameters', async ({ page }) => {
    await page.goto('/catalogo?cat=vestidos&tag=ss26&q=Vestido&size=M&colour=1&sort=price-asc&sale=1&utm_source=test');
    const drawer = await openFilters(page);
    await drawer.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page).toHaveURL(/\/catalogo\?utm_source=test$/);
    await expect(drawer.getByRole('button', { name: 'Default', exact: true })).toHaveAttribute('aria-current', 'true');
    await expect(drawer.getByRole('button', { name: 'M', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(drawer.getByRole('button', { name: 'Black', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(drawer.getByRole('button', { name: 'Clear all filters' })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Close filters' }).click();
    await expect(page.getByPlaceholder('Search products...')).toHaveValue('');
    await expect(badges(page)).toHaveCount(0);
    await expect(page.locator('a[href="/produto/test-dress"]')).toBeVisible();
  });

  test('category accepts multiple values and deselects them independently', async ({ page }) => {
    await page.goto('/catalogo');
    const drawer = await openFilters(page);
    const dresses = drawer.getByRole('button', { name: 'Dresses', exact: true });
    const sets = drawer.getByRole('button', { name: 'Sets', exact: true });
    await dresses.click();
    await sets.click();
    await expect(dresses).toHaveAttribute('aria-pressed', 'true');
    await expect(sets).toHaveAttribute('aria-pressed', 'true');
    expect(new URL(page.url()).searchParams.get('cat')?.split(',').sort()).toEqual(['conjuntos', 'vestidos']);
    await dresses.click();
    await expect(dresses).toHaveAttribute('aria-pressed', 'false');
    await expect(sets).toHaveAttribute('aria-pressed', 'true');
    expect(new URL(page.url()).searchParams.get('cat')).toBe('conjuntos');
    await sets.click();
    expect(new URL(page.url()).searchParams.get('cat')).toBeNull();
  });

  test('a single-value category link still works', async ({ page }) => {
    await page.goto('/catalogo?cat=vestidos');
    await expect(page.getByRole('button', { name: /^Remove filter: Category:/ })).toHaveCount(1);
    const drawer = await openFilters(page);
    await expect(drawer.getByRole('button', { name: 'Dresses', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('sizes remain selected independently and the colour survives a size change', async ({ page }) => {
    await page.goto('/catalogo');
    const drawer = await openFilters(page);
    const small = drawer.getByRole('button', { name: 'S', exact: true });
    const medium = drawer.getByRole('button', { name: 'M', exact: true });
    const black = drawer.getByRole('button', { name: 'Black', exact: true });
    await small.click();
    await medium.click();
    await black.click();
    await expect(small).toHaveAttribute('aria-pressed', 'true');
    await expect(medium).toHaveAttribute('aria-pressed', 'true');
    await small.click();
    await expect(small).toHaveAttribute('aria-pressed', 'false');
    await expect(medium).toHaveAttribute('aria-pressed', 'true');
    await expect(black).toHaveAttribute('aria-pressed', 'true');
    await drawer.getByRole('button', { name: 'Close filters' }).click();
    await expect(page.getByRole('button', { name: 'Remove filter: Size: M', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove filter: Size: S', exact: true })).toHaveCount(0);
  });

  test('each result badge clears only its own filter', async ({ page }) => {
    await page.goto('/catalogo?tag=ss26&size=M&q=Vestido');
    await expect(badges(page)).toHaveCount(3);
    await page.getByRole('button', { name: /^Remove filter: Size:/ }).click();
    await expect(badges(page)).toHaveCount(2);
    await expect(page.getByPlaceholder('Search products...')).toHaveValue('Vestido');
    await page.getByRole('button', { name: /^Remove filter: Collection:/ }).click();
    expect(new URL(page.url()).searchParams.get('tag')).toBeNull();
    await expect(badges(page)).toHaveCount(1);
    await page.getByRole('button', { name: /^Remove filter: Search:/ }).click();
    await expect(badges(page)).toHaveCount(0);
  });

  test('removing the sort badge restores the default order', async ({ page }) => {
    await page.goto('/catalogo');
    let drawer = await openFilters(page);
    await drawer.getByRole('button', { name: 'Price ↑', exact: true }).click();
    await drawer.getByRole('button', { name: 'Close filters' }).click();
    const sortBadge = page.getByRole('button', { name: /^Remove filter: Sort:/ });
    await expect(sortBadge).toBeVisible();
    await sortBadge.click();
    await expect(sortBadge).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('sort')).toBeNull();
    drawer = await openFilters(page);
    await expect(drawer.getByRole('button', { name: 'Default', exact: true })).toHaveAttribute('aria-current', 'true');
  });

  test('offers a reset for a zero-result combination', async ({ page }) => {
    await page.goto('/catalogo');
    await page.getByPlaceholder('Search products...').fill('zzzzz-no-such-product');
    await expect(page.getByText('No products match the selected filters.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.getByPlaceholder('Search products...')).toHaveValue('');
    await expect(page.locator('a[href="/produto/test-dress"]')).toBeVisible();
  });
});
