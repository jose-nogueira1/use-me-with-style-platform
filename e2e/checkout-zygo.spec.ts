import { test, expect } from '@playwright/test';
import { t } from '../src/theme';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

/** Angola delivery by Zygo: four priced zones, an optional point of reference, a link to Zygo. */

function digitsOnly(text: string): string {
  return text.replace(/[^\d]/g, '');
}

test.describe('Angola checkout: Zygo delivery', () => {
  test.beforeEach(async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en' });
    await page.goto('/checkout');
  });

  test('the delivery method names Zygo and links to its website', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Zygo' }).first();
    await expect(link).toHaveAttribute('href', 'https://www.zygo.ao/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    // clicking the link must not be what selects the delivery method row
    await expect(page.locator('input[name="delivery"][value="courier_ao"]')).toBeChecked();
    await expect(page.getByText(/Estafeta|Local courier/i)).toHaveCount(0);
  });

  test('neighbourhoods are grouped by zone with the zone price, and the price follows the choice', async ({ page }) => {
    const select = page.getByLabel(t('municipality', 'en'));
    await expect(select).toBeVisible();
    const groups = await select.locator('optgroup').evaluateAll((nodes) => nodes.map((node) => ({
      label: (node as HTMLOptGroupElement).label,
      options: Array.from(node.querySelectorAll('option')).map((option) => option.value),
    })));
    expect(groups.map((group) => group.options.length)).toEqual([6, 5, 5, 5]);
    expect(groups.map((group) => digitsOnly(group.label))).toEqual(['3500', '3500', '3500', '5500']);
    expect(groups[3].options).toEqual(['Viana', 'Kilamba', 'Zango', 'Cacuaco', 'Funda']);

    await select.selectOption('Talatona');
    expect(digitsOnly(await page.getByTestId('checkout-shipping').innerText())).toContain('3500');
    await select.selectOption('Cacuaco');
    expect(digitsOnly(await page.getByTestId('checkout-shipping').innerText())).toContain('5500');
  });

  test('the point of reference is optional and travels with the order', async ({ page }) => {
    const reference = page.getByLabel(t('deliveryReference', 'en'));
    await expect(reference).toBeVisible();
    await expect(reference).not.toHaveAttribute('required', '');
    await reference.fill('Next to the Kero supermarket');
    await expect(reference).toHaveValue('Next to the Kero supermarket');
  });
});

test('Portugal checkout has no point-of-reference field and no Zygo', async ({ page }) => {
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'PT', lang: 'en' });
  await page.goto('/checkout');
  await expect(page.getByLabel(t('deliveryReference', 'en'))).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Zygo' })).toHaveCount(0);
});

test('the Angola footer names AppyPay as the payment processor and offers Multicaixa Express only', async ({ page }) => {
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'AO', lang: 'en' });
  await page.goto('/checkout');
  const footer = page.locator('footer');
  await expect(footer).toContainText('Payments processed by AppyPay · Multicaixa Express');
  await expect(footer.getByRole('link', { name: 'AppyPay' })).toHaveAttribute('href', 'https://www.appypay.co.ao/');
  await expect(footer).not.toContainText('Reference');
});

test('the Portugal footer has no AppyPay line', async ({ page }) => {
  await mockCheckoutBackend(page);
  await seedCheckout(page, { market: 'PT', lang: 'en' });
  await page.goto('/checkout');
  await expect(page.locator('footer')).not.toContainText('AppyPay');
});

test('the footer credits Velship Labs with a link, in both markets', async ({ page }) => {
  for (const market of ['AO', 'PT'] as const) {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market, lang: 'en' });
    await page.goto('/checkout');
    const credit = page.locator('footer').getByRole('link', { name: 'Velship Labs' });
    await expect(credit).toHaveAttribute('href', 'https://velship-labs-landing-page.vercel.app/pt');
    await expect(credit).toHaveAttribute('target', '_blank');
    await expect(credit).toHaveAttribute('rel', /noopener/);
  }
});
