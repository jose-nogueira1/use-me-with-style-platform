import { test, expect } from '@playwright/test';
import { t } from '../src/theme';
import { mockCheckoutBackend, seedCheckout } from './helpers/mockCheckout';

/**
 * Regression coverage for the 2026-07-26 QA finding: switching payment or
 * delivery method at checkout used to silently clear an already-applied
 * coupon -- or worse, keep it applied but subtract a EUR-denominated
 * discount from a Kz subtotal with no conversion. A real order (PT-265633)
 * went through at full price (€48.00 instead of €43.60) because nobody
 * noticed the silent reset. See Checkout.tsx's coupon-revalidation effect
 * and memory/useme-checkout-e2e-audit-2026-07-26.md for the full incident.
 *
 * This is deliberately a small, targeted suite (not general checkout
 * coverage) -- coupon-vs-method-switch is the one place a silent bug here
 * directly costs revenue or customer trust, per the QA report.
 *
 * Every backend call the checkout page makes is mocked (see
 * helpers/mockCheckout.ts), so this suite runs standalone against just the
 * Vite dev server -- no CMS process or database required.
 */

function digitsOnly(text: string): string {
  return text.replace(/[^\d]/g, '');
}

test.describe('Checkout coupon behaviour across payment-method switches', () => {
  test('AO: coupon survives a Multicaixa -> Stripe switch and recalculates into EUR', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en' });
    await page.goto('/checkout');

    // Starts on Multicaixa (AO's first configured payment option), priced
    // in Kz.
    await expect(page.locator('input[name="payment"][value="multicaixa_express"]')).toBeChecked();
    await expect(page.getByTestId('checkout-subtotal')).toContainText('Kz');

    await page.getByLabel(t('couponLabel', 'en')).fill('SAVE10');
    await page.getByRole('button', { name: t('couponApply', 'en') }).click();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');

    // 10% of the 10,000 Kz subtotal -- digit-only comparison sidesteps
    // locale-dependent thousands-separator formatting (formatKz uses
    // toLocaleString).
    await expect(page.getByTestId('checkout-discount')).toBeVisible();
    expect(digitsOnly(await page.getByTestId('checkout-discount').innerText())).toContain('1000');

    // Switching to Stripe used to either silently drop the coupon, or (an
    // earlier, incomplete fix) keep it but subtract a EUR discount from the
    // still-Kz subtotal. Both must now be correct: the EUR-settlement
    // notice appears, the coupon is still applied, and every figure in the
    // summary -- subtotal, discount, total -- is in EUR.
    await page.locator('input[name="payment"][value="stripe"]').check();

    await expect(page.getByTestId('eur-settlement-notice')).toBeVisible();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
    await expect(page.getByTestId('coupon-error')).toHaveCount(0);
    await expect(page.getByTestId('checkout-subtotal')).toContainText('€100.00');
    await expect(page.getByTestId('checkout-discount')).toContainText('-€10.00');
    await expect(page.getByTestId('checkout-total')).toContainText('€90.00');
  });

  test('AO: a coupon that becomes invalid under EUR settlement is cleared with a visible message, not silently', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'AO', lang: 'en' });
    await page.goto('/checkout');

    await page.getByLabel(t('couponLabel', 'en')).fill('EURONLY');
    await page.getByRole('button', { name: t('couponApply', 'en') }).click();
    await expect(page.getByTestId('applied-coupon')).toContainText('EURONLY');

    // Stripe settles in EUR -- EURONLY is mocked to reject in that context,
    // simulating a Kz-only fixed coupon with no EUR equivalent.
    await page.locator('input[name="payment"][value="stripe"]').check();

    await expect(page.getByTestId('coupon-error')).toContainText(t('couponRemovedOnMethodChange', 'en'));
    // The applied-coupon banner is gone (reverted to the plain input)...
    await expect(page.getByTestId('applied-coupon')).toHaveCount(0);
    // ...but the code is repopulated in the input, one click away from
    // reapplying, instead of the shopper having to remember/retype it.
    await expect(page.getByLabel(t('couponLabel', 'en'))).toHaveValue('EURONLY');
    // No discount row left over, and the total is back to the full EUR
    // price -- nothing silently lost *or* silently kept mixed-currency.
    await expect(page.getByTestId('checkout-discount')).toHaveCount(0);
    await expect(page.getByTestId('checkout-total')).toContainText('€100.00');
  });

  test('PT: coupon survives a PayPal -> Stripe -> MB WAY chain and a delivery-method switch', async ({ page }) => {
    await mockCheckoutBackend(page);
    await seedCheckout(page, { market: 'PT', lang: 'en' });
    await page.goto('/checkout');

    // Starts on PayPal (PT's first configured payment option) with CTT
    // delivery (€4 shipping).
    await expect(page.locator('input[name="payment"][value="paypal"]')).toBeChecked();
    await expect(page.locator('input[name="delivery"][value="ctt"]')).toBeChecked();

    await page.getByLabel(t('couponLabel', 'en')).fill('SAVE10');
    await page.getByRole('button', { name: t('couponApply', 'en') }).click();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
    // €100 - €10 (10%) + €4 CTT shipping.
    await expect(page.getByTestId('checkout-total')).toContainText('€94.00');

    // PT never changes settlement currency, but every payment method still
    // re-triggers the revalidation effect -- confirm the coupon survives
    // the whole chain instead of only the first switch.
    for (const method of ['stripe', 'mbway']) {
      await page.locator(`input[name="payment"][value="${method}"]`).check();
      await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
      await expect(page.getByTestId('checkout-discount')).toContainText('-€10.00');
      await expect(page.getByTestId('checkout-total')).toContainText('€94.00');
      await expect(page.getByTestId('coupon-error')).toHaveCount(0);
    }

    // Delivery method is the effect's other dependency -- must also
    // revalidate rather than only reacting to payment-method changes.
    await page.locator('input[name="delivery"][value="courier_pt"]').check();
    await expect(page.getByTestId('applied-coupon')).toContainText('SAVE10');
    // Shipping goes from CTT's €4 to courier's €6 -- total shifts by €2,
    // but the coupon itself must still be intact, not dropped.
    await expect(page.getByTestId('checkout-total')).toContainText('€96.00');
  });
});
