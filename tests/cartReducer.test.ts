import assert from 'node:assert/strict';
import test from 'node:test';
import { cartReducer } from '../src/state/cartReducer.ts';

test('combines identical variants but keeps distinct variants separate', () => {
  let state = cartReducer([], { type: 'ADD', id: 'dress', size: 'M', color: 'Gold', max: 10 });
  state = cartReducer(state, { type: 'ADD', id: 'dress', size: 'M', color: 'Gold', max: 10 });
  state = cartReducer(state, { type: 'ADD', id: 'dress', size: 'L', color: 'Gold', max: 10 });
  assert.deepEqual(state.map(({ size, qty }) => ({ size, qty })), [{ size: 'M', qty: 2 }, { size: 'L', qty: 1 }]);
});

test('quantity never falls below one and hydration restores saved state', () => {
  const saved = [{ id: 'top', size: 'S', color: 'Black', qty: 2 }];
  let state = cartReducer([], { type: 'HYDRATE', items: saved });
  state = cartReducer(state, { type: 'DEC', idx: 0 });
  state = cartReducer(state, { type: 'DEC', idx: 0 });
  assert.equal(state[0]?.qty, 1);
  assert.deepEqual(cartReducer(state, { type: 'CLEAR' }), []);
});

// 2026-07-31: a shopper could previously click the cart's + stepper (or
// Add to Cart repeatedly) past the variant's actual stock -- a warning
// appeared, but nothing stopped the quantity climbing. INC/ADD now take
// the caller's already-known stock figure as `max` and refuse to exceed it.
test('quantity never exceeds the variant stock cap via INC or repeated ADD', () => {
  // Only 6 units available -- INC six times should stop climbing at 6.
  let state = [{ id: 'dress', size: 'S', color: 'Black', qty: 1 }];
  for (let i = 0; i < 8; i++) state = cartReducer(state, { type: 'INC', idx: 0, max: 6 });
  assert.equal(state[0].qty, 6);

  // Repeated ADD of the same variant hits the same ceiling.
  let added = cartReducer([], { type: 'ADD', id: 'top', size: 'M', color: 'Gold', max: 6 });
  for (let i = 0; i < 7; i++) added = cartReducer(added, { type: 'ADD', id: 'top', size: 'M', color: 'Gold', max: 6 });
  assert.equal(added[0].qty, 6);

  // Zero stock: ADD is a no-op rather than creating a qty:0 or qty:1 line.
  assert.deepEqual(cartReducer([], { type: 'ADD', id: 'top', size: 'M', color: 'Gold', max: 0 }), []);
});
