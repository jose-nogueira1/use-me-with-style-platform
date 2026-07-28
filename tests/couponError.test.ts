import assert from 'node:assert/strict';
import test from 'node:test';

import { localizeCouponError } from '../src/storefront/couponError.ts';

test('localizes stable coupon validation reasons', () => {
  assert.equal(localizeCouponError('This code was not found.', 'pt'), 'Este código não foi encontrado.');
  assert.equal(localizeCouponError('This code has expired.', 'en'), 'This code has expired.');
});

test('localizes the dynamic minimum-order reason while preserving its amount', () => {
  assert.equal(
    localizeCouponError('This code requires a minimum order of 50 EUR.', 'pt'),
    'Este código requer uma encomenda mínima de 50 EUR.',
  );
});

test('preserves unknown server reasons for diagnosability', () => {
  assert.equal(localizeCouponError('A new validation rule failed.', 'pt'), 'A new validation rule failed.');
});
