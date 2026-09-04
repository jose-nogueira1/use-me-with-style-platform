import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { formatMoneyInput } from '../src/admin/components/moneyFormatting.ts';
import { calculateSalePrice } from '../src/admin/lib/salePricing.ts';

const productSource = readFileSync(new URL('../src/admin/pages/ProductEditor.tsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/admin/pages/Settings.tsx', import.meta.url), 'utf8');
const couponsSource = readFileSync(new URL('../src/admin/pages/Coupons.tsx', import.meta.url), 'utf8');
const returnsSource = readFileSync(new URL('../src/admin/pages/ReturnDetail.tsx', import.meta.url), 'utf8');
const moneySource = readFileSync(new URL('../src/admin/components/MoneyField.tsx', import.meta.url), 'utf8');
const checkoutSource = readFileSync(new URL('../src/storefront/pages/Checkout.tsx', import.meta.url), 'utf8');

test('all editable admin monetary surfaces use the shared money field', () => {
  assert.match(productSource, /<MoneyField[\s\S]*priceAOKz/);
  assert.match(settingsSource, /<MoneyField[\s\S]*portugalStandardShippingPrice/);
  assert.match(settingsSource, /<MoneyField[\s\S]*monthlyBudgetUsd/);
  assert.match(couponsSource, /<MoneyField[\s\S]*fixedOffAOKz/);
  assert.match(returnsSource, /<MoneyField[\s\S]*approvedAmount/);
});

test('money field guidance follows the active admin language', () => {
  assert.match(moneySource, /lang: 'en' \| 'pt'/);
  assert.match(moneySource, /Apenas números inteiros/);
  assert.match(moneySource, /Whole numbers only/);
  assert.match(productSource, /<MoneyField[\s\S]*lang=\{lang\}/);
  assert.match(settingsSource, /<MoneyField[\s\S]*lang=\{lang\}/);
  assert.match(couponsSource, /<MoneyField[\s\S]*lang=\{lang\}/);
  assert.match(returnsSource, /<MoneyField[\s\S]*lang=\{lang\}/);
});

test('money field formats whole and decimal values for display', () => {
  assert.equal(formatMoneyInput('280000', 'AO'), '280,000');
  assert.equal(formatMoneyInput('2999.99', 'EUR'), '2,999.99');
  assert.equal(formatMoneyInput('0.', 'EUR'), '0.');
});

test('percentage sale pricing calculates market-safe sale prices', () => {
  assert.equal(calculateSalePrice('280000', '20', 'AO'), 224000);
  assert.equal(calculateSalePrice('2999.99', '20', 'EUR'), 2399.99);
  assert.equal(calculateSalePrice('2999.99', '0', 'EUR'), null);
  assert.equal(calculateSalePrice('2999.99', '100', 'EUR'), null);
});

test('percentage sale mode keeps existing sale and coupon checkout contracts', () => {
  assert.match(productSource, /salePricingMode/);
  assert.match(productSource, /Remove sale/);
  assert.match(productSource, /saleAOKz/);
  assert.match(productSource, /salePTEur/);
  assert.match(checkoutSource, /eligibleSubtotal: settlementEligibleSubtotal/);
  assert.match(checkoutSource, /couponCode: appliedCoupon\?\.code/);
});
