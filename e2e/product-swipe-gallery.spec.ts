import { test, expect, type Page } from '@playwright/test';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

async function setup(page: Page, photoCount = 3) {
  await page.route('**/api/**', route => route.fulfill({ json: { docs: [] } }));
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'AO', lang: 'en' });
  await page.route('**/api/products**', route => route.fulfill({ json: { docs: [{
    id: '101', name: 'Gallery Dress', slug: 'gallery-dress', priceAOKz: 10000, pricePTEur: 100,
    active: true, availableAO: true, availablePT: true,
    variants: [
      { color: { id: 1, nameEN: 'Black', namePT: 'Preto' }, size: 'M', stockAO: 5, stockPT: 5 },
      { color: { id: 2, nameEN: 'Red', namePT: 'Vermelho' }, size: 'M', stockAO: 0, stockPT: 0 },
    ],
    images: Array.from({ length: photoCount }, (_, i) => ({ image: { url: `https://gallery.test/${i}.svg`, alt: `Dress view ${i + 1}` }, color: i === 2 ? 2 : 1 })),
  }] } }));
  await page.route('https://gallery.test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="tan"/></svg>' }));
}

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('mobile swipe selects the photo and stays synchronized across resize and colour changes', async ({ page }, testInfo) => {
  await setup(page);
  await page.goto('/produto/gallery-dress');
  const gallery = page.getByRole('region', { name: 'Product photos' });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator('img[fetchpriority="high"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('gallery-mobile.png') });
  const box = (await gallery.boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * .85, y }] });
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * (.85 - step * .08), y }] });
    await page.waitForTimeout(25);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('button', { name: 'View photo 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('gallery-desktop.png') });
  await page.getByRole('button', { name: 'View photo 1', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => gallery.evaluate(el => el.scrollLeft)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gallery.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Red/ }).click();
  await expect(gallery.locator('img')).toHaveCount(1);
  await expect(gallery.locator('img')).toHaveAttribute('src', 'https://gallery.test/2.svg');
  await expect.poll(() => gallery.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(page.getByRole('button', { name: 'Next photo', exact: true })).toHaveCount(0);
});

for (const photoCount of [0, 1]) {
  test(`${photoCount} photos keep the gallery usable without navigation controls`, async ({ page }) => {
    await setup(page, photoCount);
    await page.goto('/produto/gallery-dress');
    await expect(page.getByRole('region', { name: 'Product photos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next photo', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Gallery Dress', exact: true })).toBeVisible();
  });
}
