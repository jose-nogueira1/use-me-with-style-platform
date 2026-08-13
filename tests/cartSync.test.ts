import assert from 'node:assert/strict';
import test from 'node:test';

import { applyCartActionToStorage, parseStoredCart } from '../src/state/cartSync.ts';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const key = 'ump-cart-v1:AO';

test('sequential actions from stale tabs preserve every product', () => {
  const storage = new MemoryStorage();
  // Each call represents a different tab. The coordinator deliberately does
  // not receive that tab's stale React state; it reads the latest shared cart.
  applyCartActionToStorage(storage, key, { type: 'ADD', id: 'one', variantId: 'v1', max: 5 });
  applyCartActionToStorage(storage, key, { type: 'ADD', id: 'two', variantId: 'v2', max: 5 });
  const result = applyCartActionToStorage(storage, key, { type: 'ADD', id: 'three', variantId: 'v3', max: 5 });
  assert.deepEqual(result.map((item) => item.id), ['one', 'two', 'three']);
});

test('quantity, removal and clear actions operate on the latest shared cart', () => {
  const storage = new MemoryStorage();
  storage.setItem(key, JSON.stringify([
    { id: 'one', variantId: 'v1', size: '', color: '', qty: 1 },
    { id: 'two', variantId: 'v2', size: '', color: '', qty: 1 },
  ]));
  assert.equal(applyCartActionToStorage(storage, key, { type: 'INC', idx: 0, max: 3 })[0]?.qty, 2);
  assert.deepEqual(applyCartActionToStorage(storage, key, { type: 'REMOVE', idx: 1 }).map((item) => item.id), ['one']);
  assert.deepEqual(applyCartActionToStorage(storage, key, { type: 'CLEAR' }), []);
});

test('market-specific keys remain isolated and persisted data hydrates safely', () => {
  const storage = new MemoryStorage();
  applyCartActionToStorage(storage, 'ump-cart-v1:AO', { type: 'ADD', id: 'ao-item', variantId: 'ao-v', max: 2 });
  applyCartActionToStorage(storage, 'ump-cart-v1:PT', { type: 'ADD', id: 'pt-item', variantId: 'pt-v', max: 2 });
  assert.deepEqual(parseStoredCart(storage.getItem('ump-cart-v1:AO')).map((item) => item.id), ['ao-item']);
  assert.deepEqual(parseStoredCart(storage.getItem('ump-cart-v1:PT')).map((item) => item.id), ['pt-item']);
});
