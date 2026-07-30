import assert from 'node:assert/strict';
import test from 'node:test';

type Listener = (event: { detail?: unknown }) => void;

function installBrowserState(cookie = '') {
  const values = new Map<string, string>();
  const listeners = new Map<string, Listener[]>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const windowStub = {
    localStorage,
    dispatchEvent: (event: { type: string; detail?: unknown }) => {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
      return true;
    },
    addEventListener: (type: string, listener: Listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    fbq: undefined as ((...args: unknown[]) => void) | undefined,
    location: { href: 'https://pt.usemewithstyle.shop/checkout' },
  };
  Object.assign(globalThis, {
    window: windowStub,
    document: { cookie },
    CustomEvent: class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  });
  return { values, windowStub };
}

test('rejected analytics consent is persisted and excluded from order context', async () => {
  const { setAnalyticsConsent, getAnalyticsConsent, getMetaOrderContext } = await import('../src/lib/analyticsConsent.ts');
  const { windowStub } = installBrowserState('_fbp=fb.1.123; _fbc=fb.1.456');
  const calls: unknown[][] = [];
  windowStub.fbq = (...args: unknown[]) => calls.push(args);

  setAnalyticsConsent('rejected');

  assert.equal(getAnalyticsConsent(), 'rejected');
  assert.deepEqual(getMetaOrderContext(), {
    analyticsConsent: false,
    metaFbp: 'fb.1.123',
    metaFbc: 'fb.1.456',
    metaEventSourceUrl: 'https://pt.usemewithstyle.shop/checkout',
  });
  assert.deepEqual(calls, [['consent', 'revoke']]);
});

test('accepted analytics consent is included with Meta browser identifiers', async () => {
  const { setAnalyticsConsent, getMetaOrderContext, clearAnalyticsConsent, getAnalyticsConsent } = await import('../src/lib/analyticsConsent.ts');
  installBrowserState('_fbp=fb.1.789; _fbc=fb.1.987');

  setAnalyticsConsent('accepted');
  assert.deepEqual(getMetaOrderContext(), {
    analyticsConsent: true,
    metaFbp: 'fb.1.789',
    metaFbc: 'fb.1.987',
    metaEventSourceUrl: 'https://pt.usemewithstyle.shop/checkout',
  });

  clearAnalyticsConsent();
  assert.equal(getAnalyticsConsent(), null);
  assert.equal(getMetaOrderContext().analyticsConsent, false);
});
