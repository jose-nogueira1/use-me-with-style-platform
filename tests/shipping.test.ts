import assert from 'node:assert/strict';
import test from 'node:test';

import { ANGOLA_DELIVERY_ZONES, ANGOLA_ZONES, angolaZoneOf, checkoutShippingCost, vatIncludedAmount } from '../src/storefront/shipping.ts';

test('Portugal checkout offers untracked and tracked prices below the free-shipping threshold', () => {
  assert.equal(checkoutShippingCost('PT', 'ctt', 74.99), 4.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 74.99), 6.9);
});

const FREE_ON = { portugalFreeShippingEnabled: true, angolaFreeShippingEnabled: true };

test('Portugal shipping is free from EUR 75 after discounts once free delivery is switched on', () => {
  assert.equal(checkoutShippingCost('PT', 'ctt', 75, FREE_ON), 0);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 100, FREE_ON), 0);
});

test('free delivery is off unless an admin switches it on', () => {
  assert.equal(checkoutShippingCost('PT', 'ctt', 1000), 4.9);
  assert.equal(checkoutShippingCost('PT', 'ctt', 1000, { portugalFreeShippingEnabled: false }), 4.9);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 1_000_000, undefined, 'Zango'), 5500);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 1_000_000, { angolaFreeShippingEnabled: false }, 'Zango'), 5500);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 1_000_000, { angolaFreeShippingEnabled: true }, 'Zango'), 0);
});

test('Portugal shipping uses admin configuration', () => {
  const config = {
    portugalFreeShippingEnabled: true,
    portugalStandardShippingPrice: 5.5,
    portugalTrackedShippingPrice: 8,
    portugalFreeShippingThreshold: 90,
  };
  assert.equal(checkoutShippingCost('PT', 'ctt', 89, config), 5.5);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 89, config), 8);
  assert.equal(checkoutShippingCost('PT', 'ctt', 90, config), 0);
});

test('Portugal parcels over 2 kg use tracked mainland/island rates while free delivery still wins', () => {
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, FREE_ON, undefined, 2500, '1000-001'), 9.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, FREE_ON, undefined, 2500, '9000-001'), 14.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 50, FREE_ON, undefined, 2500, '9500-001'), 14.9);
  assert.equal(checkoutShippingCost('PT', 'courier_pt', 75, FREE_ON, undefined, 2500, '9500-001'), 0);
});

test('Angola Zygo pricing is by zone, editable per zone, and free from Kz 80,000', () => {
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, FREE_ON, 'Mutamba'), 3500); // Centro
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, FREE_ON, 'Talatona'), 3500); // Sul
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, FREE_ON, 'Hoji ya Henda'), 3500); // Norte
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 79_999, FREE_ON, 'Zango'), 5500); // Periferia
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 80_000, FREE_ON, 'Zango'), 0);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 50_000, { angolaZonePricePeriferia: 6000 }, 'Viana'), 6000);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 50_000, { angolaZonePricePeriferia: 6000 }, 'Sambizanga'), 3500);
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 50_000, undefined, 'Mussulo'), 0); // a former municipality has no price
  assert.equal(checkoutShippingCost('AO', 'courier_ao', 50_000, undefined, undefined), 0); // nothing selected yet
});

test('the 21 neighbourhoods are split 6/5/5/5 across the four zones', () => {
  assert.deepEqual(ANGOLA_ZONES.map((zone) => ANGOLA_DELIVERY_ZONES[zone].length), [6, 5, 5, 5]);
  assert.equal(angolaZoneOf('Cacuaco'), 'periferia');
  assert.equal(angolaZoneOf('Luanda'), null);
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
