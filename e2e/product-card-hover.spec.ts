import { test, expect, type Page } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

// Two photos with different colours so a screenshot shows which one is on top.
const svg = (fill: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${fill}"/></svg>`;

async function setup(page: Page, images: Array<{ file: string; color?: number }>) {
  await page.route('**/api/**', route => route.fulfill({ json: { docs: [] } }));
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'AO', lang: 'en' });
  await page.route('**/api/products**', route => route.fulfill({ json: { docs: [{
    id: '201', name: 'Hover Dress', slug: 'hover-dress', priceAOKz: 10000, pricePTEur: 100,
    active: true, availableAO: true, availablePT: true,
    variants: [
      { color: { id: 1, nameEN: 'Black', namePT: 'Preto' }, size: 'M', stockAO: 5, stockPT: 5 },
      { color: { id: 2, nameEN: 'Red', namePT: 'Vermelho' }, size: 'M', stockAO: 5, stockPT: 5 },
    ],
    images: images.map(({ file, color }) => ({ image: { url: `https://hover.test/${file}.svg`, alt: file }, color })),
  }] } }));
  await page.route('https://hover.test/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: svg(route.request().url().includes('first') ? 'tan' : 'navy'),
  }));
}

const card = (page: Page) => page.locator('a.ump-product-card').first();
const hoverLayer = (page: Page) => card(page).locator('div[aria-hidden="true"]').filter({ has: page.locator('img') });

test.describe('with a mouse', () => {
  test('the card fades to the second photo on hover and back when the pointer leaves', async ({ page }, testInfo) => {
    await setup(page, [{ file: 'first' }, { file: 'second' }]);
    await page.goto('/catalogo');
    await expect(card(page)).toBeVisible();
    // Nothing is downloaded for the second photo until someone hovers.
    await expect(hoverLayer(page)).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('card-rest.png'), clip: (await card(page).boundingBox())! });

    await card(page).hover();
    await expect(hoverLayer(page)).toHaveCount(1);
    await expect(hoverLayer(page)).toHaveCSS('opacity', '1');
    await page.waitForTimeout(500);
    await page.screenshot({ path: testInfo.outputPath('card-hover.png'), clip: (await card(page).boundingBox())! });

    await page.mouse.move(0, 0);
    await expect(hoverLayer(page)).toHaveCSS('opacity', '0');
  });

  test('a product with one photo has no hover layer', async ({ page }) => {
    await setup(page, [{ file: 'first' }]);
    await page.goto('/catalogo');
    await card(page).hover();
    await expect(hoverLayer(page)).toHaveCount(0);
  });

  test('a photo of another colour is not used as the hover photo', async ({ page }) => {
    await setup(page, [{ file: 'first', color: 1 }, { file: 'second', color: 2 }]);
    await page.goto('/catalogo');
    await card(page).hover();
    await expect(hoverLayer(page)).toHaveCount(0);
  });

  test('keyboard focus shows the second photo too', async ({ page }) => {
    await setup(page, [{ file: 'first' }, { file: 'second' }]);
    await page.goto('/catalogo');
    await card(page).focus();
    await expect(hoverLayer(page)).toHaveCSS('opacity', '1');
  });
});

test.describe('on a touch screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tapping does not trigger the hover photo', async ({ page }) => {
    await setup(page, [{ file: 'first' }, { file: 'second' }]);
    await page.goto('/catalogo');
    await expect(card(page)).toBeVisible();
    await card(page).dispatchEvent('pointerenter', { pointerType: 'touch' });
    await expect(hoverLayer(page)).toHaveCount(0);
  });
});
