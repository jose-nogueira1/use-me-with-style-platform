import { defineConfig, devices } from '@playwright/test';

// Small, focused E2E regression suite (2026-07-27) -- currently just the
// checkout coupon-vs-payment-method-switch behaviour flagged in the
// 2026-07-26 QA report as the one place a silent pricing bug directly costs
// revenue or customer trust. See e2e/checkout-coupon.spec.ts and
// memory/useme-checkout-e2e-audit-2026-07-26.md for the incident this
// guards against.
//
// Deliberately separate from the existing `npm test` (node --experimental-
// strip-types --test tests/*.test.ts) unit suite -- these are real browser
// tests against the running app, not unit tests.
//
// All CMS/backend calls the checkout flow needs are mocked at the network
// layer (see e2e/helpers/mockCheckout.ts), so this suite only needs the
// Vite dev server -- no database, no CMS process, no real coupon/product
// data required.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
