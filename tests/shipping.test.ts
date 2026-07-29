import assert from 'node:assert/strict';
import test from 'node:test';

import { checkoutShippingCost } from '../src/storefront/shipping.ts';

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

test('Angola local-courier pricing remains unchanged', () => {
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 10), 0);
});
