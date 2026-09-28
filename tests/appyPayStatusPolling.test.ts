import assert from 'node:assert/strict';
import test from 'node:test';

test('AppyPay status polling stops as soon as the webhook marks the order paid', async () => {
  const module = await import('../src/lib/appyPayStatusPolling.ts').catch(() => ({}));
  const waitForAppyPayResolution = 'waitForAppyPayResolution' in module
    ? module.waitForAppyPayResolution
    : undefined;

  assert.equal(typeof waitForAppyPayResolution, 'function');
  if (typeof waitForAppyPayResolution !== 'function') return;

  let lookups = 0;
  let waits = 0;
  let now = 0;
  const result = await waitForAppyPayResolution({
    lookup: async () => {
      lookups += 1;
      return { paymentStatus: lookups === 1 ? 'pending' : 'paid' };
    },
    wait: async () => {
      waits += 1;
      now += 2_000;
    },
    now: () => now,
    intervalMs: 2_000,
    timeoutMs: 30_000,
  });

  assert.deepEqual(result, { paymentStatus: 'paid' });
  assert.equal(lookups, 2);
  assert.equal(waits, 1);
});
