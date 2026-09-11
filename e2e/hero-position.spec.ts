import { test, expect } from '@playwright/test';
import type { HomeHero } from '../src/lib/api';

test('admin positions save independently and the storefront uses the saved framing', async ({ page }) => {
  let hero: HomeHero = {
    heroEyebrowPT: 'Coleção SS26', heroHeadlinePT: 'Moda que se move consigo.',
    heroSubtitlePT: 'Peças pensadas para si, com preços sempre claros e diretos.', heroCtaLabelPT: 'Ver tudo',
    heroImage: { id: 84, url: '/api/media/file/hero.svg' },
    heroImageMobile: { id: 85, url: '/api/media/file/hero.svg' },
    heroDesktopPositionX: 65, heroDesktopPositionY: 20, heroMobilePositionX: 50, heroMobilePositionY: 50,
  };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/media/file/hero.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067"><rect width="1600" height="1067" fill="tan"/></svg>' });
    if (path === '/api/users/me') return route.fulfill({ json: { user: { id: 'local', email: 'preview@example.test' } } });
    if (path === '/api/globals/home-hero') {
      if (route.request().method() !== 'GET') {
        const submitted = route.request().postDataJSON();
        // Payload's numeric-ID upload validator rejects string relationship IDs.
        if (submitted.heroImage !== 84 || submitted.heroImageMobile !== 85) {
          return route.fulfill({ status: 400, json: { errors: [{ message: 'Invalid media relationship IDs' }] } });
        }
        hero = { ...hero, ...submitted, heroImage: hero.heroImage, heroImageMobile: hero.heroImageMobile };
        return route.fulfill({ json: { message: 'Saved', result: hero } });
      }
      return route.fulfill({ json: hero });
    }
    return route.fulfill({ json: { docs: [] } });
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/admin/definicoes?tab=home');
  const desktop = page.getByRole('group', { name: /Posição desktop|Desktop position/ });
  const mobile = page.getByRole('group', { name: /Posição mobile|Mobile position/ });
  await desktop.getByRole('slider').first().focus();
  await page.keyboard.press('End');
  await mobile.getByRole('slider').nth(1).focus();
  await page.keyboard.press('Home');
  await expect(desktop.getByRole('slider').first()).toHaveValue('100');
  await expect(mobile.getByRole('slider').nth(1)).toHaveValue('0');
  await page.getByRole('button', { name: /Guardar destaque|Save hero/, exact: true }).click();
  await expect(page.getByRole('button', { name: /Guardar destaque|Save hero/, exact: true })).toBeDisabled();
  await page.reload();
  await expect(desktop.getByRole('slider').first()).toHaveValue('100');
  await expect(mobile.getByRole('slider').nth(1)).toHaveValue('0');
  await page.goto('/');
  const image = page.locator('.ump-hero-photo picture img');
  await expect(image).toHaveCSS('object-position', '100% 20%');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(image).toHaveCSS('object-position', '50% 0%');
});
