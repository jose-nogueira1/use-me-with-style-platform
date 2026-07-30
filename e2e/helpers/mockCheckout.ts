import type { Page } from '@playwright/test';

export type MockMarket = 'AO' | 'PT';

/** Single product used across every spec in this suite -- priced so the
 * math is easy to hand-verify: 10,000 Kz / €100. Angola's Stripe/PayPal
 * settlement reuses the EUR price (see Checkout.tsx's usesEurSettlement
 * branch), so €100 is what a 10% coupon has to correctly compute against
 * once the payment method flips the settlement currency. */
export const PRODUCT_ID = '101';

const PRODUCT = {
  id: PRODUCT_ID,
  name: 'Test Dress',
  namePT: 'Vestido Teste',
  nameEN: 'Test Dress',
  slug: 'test-dress',
  category: 1,
  description: '',
  descriptionPT: '',
  descriptionEN: '',
  priceAOKz: 10000,
  pricePTEur: 100,
  shippingWeightGrams: 500,
  saleAOKz: null,
  salePTEur: null,
  saleStartDate: null,
  saleEndDate: null,
  variants: [
    {
      color: { id: 1, namePT: 'Preto', nameEN: 'Black', hex: '#000000' },
      size: 'M',
      stockAO: 10,
      stockPT: 10,
    },
  ],
  active: true,
  availableAO: true,
  availablePT: true,
};

const MARKET_SETTINGS = {
  angolaPaymentLive: true,
  angolaBankTransferInstructionsPT: '',
  angolaBankTransferInstructionsEN: '',
  angolaPaymentMethods: ['multicaixa_express', 'stripe', 'paypal'],
  angolaDeliveryMethods: ['courier_ao'],
  angolaMunicipalityPrices: {
    Luanda: 3000, Cacuaco: 5000, Cazenga: 3500, Viana: 6000, Belas: 6500, Talatona: 4000,
    Mussulo: 8000, Sambizanga: 3000, Rangel: 3000, Maianga: 2500, Samba: 3500, Camama: 4500,
    Mulenvos: 5500, Kilamba: 5000, 'Hoji Ya Henda': 3500, Ingombota: 2500,
  },
  angolaFreeShippingThreshold: 80000,
  portugalPaymentsEnabled: true,
  portugalPaymentMethods: ['paypal', 'stripe'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  portugalStandardShippingPrice: 4.9,
  portugalTrackedShippingPrice: 6.9,
  portugalFreeShippingThreshold: 75,
  portugalStandardWeightLimitGrams: 2000,
  portugalHeavyMainlandShippingPrice: 9.9,
  portugalHeavyIslandsShippingPrice: 14.9,
  angolaReturnsPolicyTextPT: '',
  angolaReturnsPolicyTextEN: '',
  portugalReturnsPolicyTextPT: '',
  portugalReturnsPolicyTextEN: '',
  businessHoursTextPT: '',
  businessHoursTextEN: '',
  angolaShippingTextPT: '',
  angolaShippingTextEN: '',
  portugalShippingTextPT: '',
  portugalShippingTextEN: '',
  internationalShippingTextPT: '',
  internationalShippingTextEN: '',
};

/** Mocks POST /api/coupons/validate. Two behaviours, mirroring the CMS's
 * real resolveCoupon():
 *  - "EURONLY" simulates a fixed-Kz-only coupon (e.g. fixedOffAOKz set,
 *    fixedOffPTEur not) -- valid while settling in Kz, rejected once the
 *    payment method flips settlement to EUR. Used to test that a coupon
 *    becoming genuinely invalid across a method switch is surfaced with
 *    the visible "removed, reapply" message, never silently.
 *  - Anything else is treated as a 10%-off coupon, discounting whatever
 *    settlement subtotal the checkout page actually sends -- the same
 *    currency-awareness the real percent-off coupon path has, so
 *    switching AO between Kz and EUR settlement recalculates correctly
 *    instead of mixing units.
 */
async function mockCouponValidate(page: Page) {
  await page.route('**/api/coupons/validate', async (route) => {
    const body = route.request().postDataJSON() as {
      code: string;
      usesEurSettlement?: boolean;
      subtotal: number;
    };
    const code = body.code.trim().toUpperCase();

    if (code === 'EURONLY') {
      if (body.usesEurSettlement) {
        await route.fulfill({
          json: { valid: false, reason: 'This code is not valid for the selected payment method.' },
        });
        return;
      }
      await route.fulfill({
        json: { valid: true, code, discountAmount: 1000, label: `${code} (-1.000 Kz)` },
      });
      return;
    }

    const discountAmount = Math.round(body.subtotal * 0.1 * 100) / 100;
    await route.fulfill({
      json: { valid: true, code, discountAmount, label: `${code} (-10%)` },
    });
  });
}

/** Mocks every backend call Checkout.tsx makes (products, market settings,
 * coupon validation) so these specs run against just the Vite dev server --
 * no CMS process or database required. */
export async function mockCheckoutBackend(page: Page) {
  await page.route('**/api/products**', async (route) => {
    await route.fulfill({ json: { docs: [PRODUCT] } });
  });
  await page.route('**/api/globals/market-settings', async (route) => {
    await route.fulfill({ json: MARKET_SETTINGS });
  });
  await mockCouponValidate(page);
}

/** Pre-populates localStorage (market/language/cart) via an init script, so
 * AppContext hydrates directly into the desired state on first render
 * instead of the test having to drive Browse -> PDP -> Cart just to get one
 * item into the checkout. Storage keys/shapes mirror
 * src/state/AppContext.tsx exactly (cartStorageKey, isCartItem). */
export async function seedCheckout(
  page: Page,
  opts: { market: MockMarket; lang?: 'pt' | 'en'; qty?: number },
) {
  const lang = opts.lang ?? 'en';
  const cart = [{ id: PRODUCT_ID, size: 'M', color: '1', qty: opts.qty ?? 1 }];
  await page.addInitScript(
    ([market, lang, cartJson]) => {
      window.localStorage.setItem('ump-market-pref', market);
      window.localStorage.setItem('ump-lang-pref', lang);
      window.localStorage.setItem(`ump-cart-v1:${market}`, cartJson);
    },
    [opts.market, lang, JSON.stringify(cart)] as [string, string, string],
  );
}
