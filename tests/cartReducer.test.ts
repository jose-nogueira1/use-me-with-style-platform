import assert from 'node:assert/strict';
import test from 'node:test';
import { cartReducer } from '../src/state/cartReducer.ts';

test('combines identical variants but keeps distinct variants separate', () => {
  let state = cartReducer([], { type: 'ADD', id: 'dress', size: 'M', color: 'Gold' });
  state = cartReducer(state, { type: 'ADD', id: 'dress', size: 'M', color: 'Gold' });
  state = cartReducer(state, { type: 'ADD', id: 'dress', size: 'L', color: 'Gold' });
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
