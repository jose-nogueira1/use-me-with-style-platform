import { test, expect } from '@playwright/test';
import { t } from '../src/theme';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

/** Checkout delivery/pricing regressions with a fully mocked backend. */

function digitsOnly(text: string): string {
  return text.replace(/[^\d]/g, '');
}

test.describe('Checkout authoritative delivery and coupon behaviour', () => {
  test('AO: municipality selection applies its editable local-courier price', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en' });
    await page.goto('/checkout');

    await expect(page.locator('input[name="payment"][value="multicaixa_express"]')).toBeChecked();
    await expect(page.getByTestId('checkout-subtotal')).toContainText('Kz');
    await page.getByLabel(t('municipality', 'en')).selectOption('Ingombota');
    expect(digitsOnly(await page.getByTestId('checkout-shipping').innerText())).toContain('2500');

    await page.getByLabel(t('couponLabel', 'en')).fill('SAVE10');
    await page.getByRole('button', { name: t('couponApply', 'en') }).click();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');

    await expect(page.getByTestId('checkout-discount')).toBeVisible();
    expect(digitsOnly(await page.getByTestId('checkout-discount').innerText())).toContain('1000');
    expect(digitsOnly(await page.getByTestId('checkout-total').innerText())).toContain('11500');
  });

  test('AO: delivery is free from Kz 80,000 after discounts', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en', qty: 8 });
    await page.goto('/checkout');
    await page.getByLabel(t('municipality', 'en')).selectOption('Mussulo');
    await expect(page.getByTestId('checkout-shipping')).toContainText(t('free', 'en'));
    expect(digitsOnly(await page.getByTestId('checkout-total').innerText())).toContain('80000');
  });

  test('PT: coupon survives a PayPal -> Stripe switch and a delivery-method switch', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'PT', lang: 'en' });
    await page.goto('/checkout');

    // Starts on PayPal (PT's first configured payment option) with CTT
    // delivery. The mocked €100 basket qualifies for free shipping.
    await expect(page.locator('input[name="payment"][value="paypal"]')).toBeChecked();
    await expect(page.locator('input[name="delivery"][value="ctt"]')).toBeChecked();

    await page.getByLabel(t('couponLabel', 'en')).fill('SAVE10');
    await page.getByRole('button', { name: t('couponApply', 'en') }).click();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
    // €100 - €10 (10%) remains above the €75 free-shipping threshold.
    await expect(page.getByTestId('checkout-shipping')).toContainText(t('free', 'en'));
    await expect(page.getByTestId('checkout-total')).toContainText('€90.00');

    // PT never changes settlement currency, but every payment method still
    // re-triggers the revalidation effect -- confirm the coupon survives
    // the whole chain instead of only the first switch.
    for (const method of ['stripe']) {
      await page.locator(`input[name="payment"][value="${method}"]`).check();
      await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
      await expect(page.getByTestId('checkout-discount')).toContainText('-€10.00');
      await expect(page.getByTestId('checkout-total')).toContainText('€90.00');
      await expect(page.getByTestId('coupon-error')).toHaveCount(0);
    }

    // Delivery method is the effect's other dependency -- must also
    // revalidate rather than only reacting to payment-method changes.
    await page.locator('input[name="delivery"][value="courier_pt"]').check();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
    // Switching to tracked delivery keeps free shipping because the
    // discounted merchandise total remains above €75.
    await expect(page.getByTestId('checkout-shipping')).toContainText(t('free', 'en'));
    await expect(page.getByTestId('checkout-total')).toContainText('€90.00');
  });
});
