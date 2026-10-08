import assert from 'node:assert/strict';
import test from 'node:test';

import { shipmentExtra, shouldConfirmNoTracking } from '../src/admin/lib/shipment.ts';

test('a number typed but not yet saved travels with the "shipped" request', () => {
  assert.deepEqual(shipmentExtra('', 'ZG-1'), { cttTrackingCode: 'ZG-1' });
  assert.deepEqual(shipmentExtra(undefined, ' ZG-1 '), { cttTrackingCode: 'ZG-1' });
  assert.deepEqual(shipmentExtra('ZG-1', 'ZG-2'), { cttTrackingCode: 'ZG-2' }); // corrected number
});

test('nothing extra is sent when there is no number or it is already saved', () => {
  assert.equal(shipmentExtra('', ''), undefined);
  assert.equal(shipmentExtra(null, '  '), undefined);
  assert.equal(shipmentExtra('ZG-1', 'ZG-1'), undefined);
});

test('only Angola orders without any number ask before shipping', () => {
  assert.equal(shouldConfirmNoTracking('AO', '', ''), true);
  assert.equal(shouldConfirmNoTracking('AO', null, undefined), true);
  assert.equal(shouldConfirmNoTracking('AO', '', 'ZG-1'), false); // typed
  assert.equal(shouldConfirmNoTracking('AO', 'ZG-1', ''), false); // saved
  assert.equal(shouldConfirmNoTracking('PT', '', ''), false); // CTT Standard has no number
});
