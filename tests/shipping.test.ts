import assert from 'node:assert/strict';
import test from 'node:test';

import { checkoutShippingCost, vatIncludedAmount } from '../src/storefront/shipping.ts';

test('Portugal checkout offers untracked and tracked prices below the free-shipping threshold', () => {
  assert.equal(checkoutShippingCost('PT', 'ctt', 74.99), 4.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 74.99), 6.9);
});

test('Portugal shipping is free from EUR 75 after discounts', () => {
  assert.equal(checkoutShippingCost('PT', 'ctt', 75), 0);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 100), 0);
});

test('Portugal shipping uses admin configuration', () => {
  const config = {
    portugalStandardShippingPrice: 5.5,
    portugalTrackedShippingPrice: 8,
    portugalFreeShippingThreshold: 90,
  };
  assert.equal(checkoutShippingCost('PT', 'ctt', 89, config), 5.5);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 89, config), 8);
  assert.equal(checkoutShippingCost('PT', 'ctt', 90, config), 0);
});

test('Portugal parcels over 2 kg use tracked mainland/island rates while free delivery still wins', () => {
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, undefined, undefined, 2500, '1000-001'), 9.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, undefined, undefined, 2500, '9000-001'), 14.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, undefined, undefined, 2500, '9500-001'), 14.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 75, undefined, undefined, 2500, '9500-001'), 0);
});

test('Angola local-courier pricing is municipality-specific and free from Kz 80,000', () => {
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, undefined, 'Ingombota'), 2500);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, undefined, 'Mussulo'), 8000);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 80_000, undefined, 'Mussulo'), 0);
});

test('VAT included-in-price: Angola is flat, Portugal picks the rate for the postal code region', () => {
  const taxRates = { AO: 14, PT: { mainland: 23, madeira: 22, azores: 16 } };

  const ao = vatIncludedAmount('AO', 16_500, taxRates);
  assert.equal(ao.rate, 14);
  assert.equal(Math.round(ao.amount * 100) / 100, 2026.32);

  const mainland = vatIncludedAmount('PT', 76.9, taxRates, '1000-001');
  assert.equal(mainland.rate, 23);
  assert.equal(Math.round(mainland.amount * 100) / 100, 14.38);

  const madeira = vatIncludedAmount('PT', 76.9, taxRates, '9000-001');
  assert.equal(madeira.rate, 22);

  const azores = vatIncludedAmount('PT', 76.9, taxRates, '9500-001');
  assert.equal(azores.rate, 16);

  // No (or not-yet-valid) postal code falls back to mainland's rate --
  // matches the CMS's own fallback so checkout and the invoice never
  // disagree over a transiently-empty field.
  assert.equal(vatIncludedAmount('PT', 76.9, taxRates, '').rate, 23);
  assert.equal(vatIncludedAmount('PT', 76.9, taxRates).rate, 23);

  // A 0% rate means the full price is already net -- no VAT to back out.
  const zeroRate = vatIncludedAmount('AO', 1000, { AO: 0, PT: taxRates.PT });
  assert.equal(zeroRate.amount, 0);
});
