import { publicEnv } from '../config/env';

// Thin REST client for the use-me-with-style-cms Payload backend. Payload's
// default REST shape: collections return { docs, totalDocs, ... } on list,
// and a single document object on find-by-id/create/update. Globals return
// the global's fields directly (no `docs` wrapper).
// Production uses the same-origin `/api` proxy configured in vercel.json.
// Besides avoiding a hard dependency on an API subdomain, this keeps browser
// requests same-origin and therefore independent of CMS CORS configuration.
const API_BASE = publicEnv.apiBaseUrl === '/'
  ? '/api'
  : `${publicEnv.apiBaseUrl.replace(/\/$/, '')}/api`;

// Exported so admin pages that need a plain URL (file downloads via <a href>,
// not a fetch() call the request() helper can wrap) can still point at the
// right origin -- e.g. the internal-invoice PDF download link.
export const apiBase = API_BASE;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { auth = false }: { auth?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: auth ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`${options.method || 'GET'} ${path} failed (${res.status}): ${body}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types (kept intentionally loose/hand-written here -- swap for
// `payload-types.ts` generated types once the CMS and frontend share a
// workspace, or copy that file over manually).
// ---------------------------------------------------------------------------
/** Payload relationship shape: a plain id (string/number) at depth 0, or the
 * populated media object at depth>=1. Admin product calls always use
 * depth=1, but the type still has to allow for the unpopulated shape. */
export type ApiProductImageRef =
  | string
  | number
  | {
      id?: string | number;
      url?: string;
      alt?: string;
      sizes?: {
        thumbnail?: { url?: string };
        card?: { url?: string };
      };
    };

// ---------------------------------------------------------------------------
// Catalogue taxonomies (2026-07-25): categories, merchandising tags, and
// colours are admin-managed collections instead of hardcoded enums/free text.
// Like media above, each relationship is a plain id at depth 0 and a
// populated doc at depth >= 1; storefront/admin product calls use depth=1.
// ---------------------------------------------------------------------------
export type ApiCategory = {
  id: string | number;
  namePT: string;
  nameEN?: string | null;
  slug?: string | null;
  /** Category tile image (2026-07-25 admin request) -- optional, falls back
   * to a decorative placeholder on the storefront when unset. */
  image?: string | number | ApiMedia | null;
};

export type ApiMerchTag = {
  id: string | number;
  labelPT: string;
  labelEN?: string | null;
  /** Stable auto-generated slug (2026-07-25 follow-up), same policy as
   * Categories.slug -- lets the home hero's "Button link" point at a
   * themed collection via /catalogo?tag=<slug> instead of just a category. */
  slug?: string | null;
};

export type ApiColor = {
  id: string | number;
  namePT: string;
  nameEN?: string | null;
  hex?: string | null;
  /** Second hex value for two-tone combination colours (e.g. red & white),
   * 2026-07-25 follow-up -- renders a split-circle swatch. See
   * lib/colorSwatch.ts. */
  hex2?: string | null;
  swatch?: string | number | { url?: string } | null;
};

export type ApiSizeGuideRow = {
  size: string;
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  length?: number | null;
  id?: string | null;
};

export type ApiSizeGuide = {
  id: string | number;
  name: string;
  rows: ApiSizeGuideRow[];
};

export type ApiCategoryRef = string | number | ApiCategory;
export type ApiMerchTagRef = string | number | ApiMerchTag;
export type ApiColorRef = string | number | ApiColor;
export type ApiSizeGuideRef = string | number | ApiSizeGuide;

/** Variant-level inventory (2026-07-25): stock per colour+size row. */
export type ApiVariant = {
  color: ApiColorRef;
  size: string;
  stockAO: number;
  stockPT: number;
  id?: string | null;
};

/** Safely reads the populated doc off a relationship ref (id-only at depth
 * 0), mirroring resolveProductImage below. */
export function resolveRef<T extends object>(ref: T | string | number | null | undefined): T | null {
  return ref && typeof ref === 'object' ? ref : null;
}

/** Admin-facing "Portuguese / English" label, matching how category and
 * merch-tag dropdowns already display their two names side by side. */
export function colorLabel(c: { namePT: string; nameEN?: string | null }): string {
  return c.nameEN && c.nameEN !== c.namePT ? `${c.namePT} / ${c.nameEN}` : c.namePT;
}

/** Normalizes a relationship ref to a string id, whatever its depth. */
export function refId(ref: string | number | { id?: string | number } | null | undefined): string {
  if (ref === null || ref === undefined) return '';
  if (typeof ref === 'object') return ref.id !== undefined ? String(ref.id) : '';
  return String(ref);
}

export type ApiProduct = {
  // Payload returns numeric IDs with the local SQLite adapter and string IDs
  // with PostgreSQL. Treat both as valid so admin routes work in every env.
  id: string | number;
  name: string;
  namePT?: string;
  nameEN?: string;
  slug: string;
  category: ApiCategoryRef;
  description?: string;
  descriptionPT?: string;
  descriptionEN?: string;
  sizeGuide?: ApiSizeGuideRef | null;
  fitNotePT?: string;
  fitNoteEN?: string;
  tag?: ApiMerchTagRef | null;
  images?: { image: ApiProductImageRef }[];
  priceAOKz: number;
  pricePTEur: number;
  shippingWeightGrams: number;
  /** Sale pricing (2026-07-25, discounts phase 1) -- optional per-market
   * override, replacing the regular price at checkout while set and within
   * the optional start/end window. See productAdapters.ts's
   * isProductOnSale/effectivePrice helpers, mirrored from the CMS's
   * lib/salePricing.ts (kept in sync by hand -- separate repos/deploys). */
  saleAOKz?: number | null;
  salePTEur?: number | null;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  variants: ApiVariant[];
  active: boolean;
  /** Per-market storefront visibility (JOS market-separation decision,
   * 2026-07-10) -- a product can be sold in one market only. Both default to
   * true in the CMS, so existing products stay visible everywhere unless an
   * admin deliberately narrows them. */
  availableAO: boolean;
  availablePT: boolean;
};

/** Safely reads url/alt off an ApiProductImageRef, instead of every call
 * site repeating the same `typeof === 'object'` guard against the
 * unpopulated (depth-0) id-only shape. */
export function resolveProductImage(image: ApiProductImageRef | undefined): { url?: string; alt?: string } {
  if (image && typeof image === 'object') return { url: image.url, alt: image.alt };
  return {};
}

/** Shared with the admin notifications bell (PageHeader.tsx) and the
 * Products list page's "Low stock" filter, so the two can't silently drift
 * out of sync on what "low" means. Per-variant since 2026-07-25 (a colour
 * running out in one size counts as low even if other colours are fine). */
export function productIsLowStock(p: ApiProduct): boolean {
  return p.variants.some((v) => v.stockAO + v.stockPT <= 2);
}

/** Stricter than productIsLowStock -- a variant genuinely sold out, not
 * just running low. Used by the admin notifications bell (2026-07-25) to
 * flag "urgent" only for products that can't be sold at all right now,
 * rather than every merely-low-stock one. */
export function productIsOutOfStock(p: ApiProduct): boolean {
  return p.variants.some((v) => v.stockAO + v.stockPT === 0);
}

// ---------------------------------------------------------------------------
// Coupon codes (2026-07-25, discounts phase 2). Mirrors the CMS's Coupons
// collection -- see couponPricing.ts there. The storefront only ever
// submits a CODE, never a discount amount; resolveCoupon() server-side is
// the only thing that turns it into money (see authoritativeOrder.ts).
// ---------------------------------------------------------------------------
export type ApiCoupon = {
  id: string | number;
  code: string;
  active?: boolean;
  description?: string | null;
  type: 'percent' | 'fixed';
  percentOff?: number | null;
  fixedOffAOKz?: number | null;
  fixedOffPTEur?: number | null;
  minOrderValueAOKz?: number | null;
  minOrderValuePTEur?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usageCount?: number;
  maxRedemptionsPerEmail?: number | null;
  /** Market scoping (2026-07-27, market-switch follow-up) -- same
   * availableAO/availablePT pattern as ApiProduct. Both default true, so an
   * older coupon predating this field is still valid everywhere until an
   * admin deliberately restricts it. */
  availableAO?: boolean | null;
  availablePT?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CouponValidationResult =
  | { valid: true; code: string; discountAmount: number; label: string }
  | { valid: false; reason: string };

/** Advisory-only check, powering the checkout "Apply" button so the shopper
 * sees the discount before paying -- the CMS re-resolves the SAME code for
 * real at order-creation time (authoritativeOrder.ts) and rejects the order
 * if it's no longer valid, so this call being stale/bypassed is harmless. */
export async function validateCoupon(input: {
  code: string;
  market: 'AO' | 'PT';
  usesEurSettlement?: boolean;
  subtotal: number;
  customerEmail?: string;
}): Promise<CouponValidationResult> {
  return request<CouponValidationResult>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type OrderItemInput = {
  product: string | number;
  productName: string;
  size: string;
  // Colour's stable ROW ID (2026-07-25, colours bilingual follow-up) --
  // NOT the display name, which now varies by storefront language. The CMS
  // resolves this to a localized, human-readable name for the stored order
  // item/invoices (see authoritativeOrder.ts); a plain name string is still
  // accepted as a legacy fallback.
  color?: string;
  qty: number;
  unitPrice: number;
};

export type CreateOrderInput = {
  market: 'AO' | 'PT';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  /** Optional floor/door line (andar/porta) -- common on PT addresses, kept
   * separate from the free-text `address` line so it renders cleanly on
   * shipping labels/invoices. Not used for AO (courier coordination is via
   * WhatsApp, not a structured address). */
  addressLine2?: string;
  /** Required for PT (validated client-side against the 0000-000 CTT
   * format); not collected for AO, which has no equivalent postal-code
   * convention in this checkout. */
  postalCode?: string;
  city: string;
  country: string;
  /** Portuguese NIF (tax number), optional -- collected so it can appear on
   * the Moloni-issued invoice for PT orders (2026-07-10 addition). Never
   * collected for AO (SWEG invoicing, out of scope here). */
  taxId?: string;
  notes?: string;
  items: OrderItemInput[];
  currency: 'Kz' | 'EUR';
  subtotal: number;
  shippingCost: number;
  /** Coupon code the shopper applied at checkout (2026-07-25, discounts
   * phase 2) -- just the string; the CMS resolves it into an actual
   * discount amount server-side and rejects the order if it's no longer
   * valid. Optional so a cached bundle without this field still posts. */
  couponCode?: string;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  // Storefront UI language at checkout ('pt' | 'en') -- drives the language
  // of the order-confirmation email sent by the CMS. Optional so an older
  // cached bundle without this field still posts a valid order (CMS default
  // falls back to 'pt').
  lang?: 'pt' | 'en';
  analyticsConsent?: boolean;
  metaFbp?: string;
  metaFbc?: string;
  metaEventSourceUrl?: string;
};

export type ApiOrder = CreateOrderInput & {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  /** Server-computed, from the applied coupon (if any) -- see couponCode
   * above. discountAmount is 0/absent when no coupon was applied. */
  discountAmount?: number;
  discountLabel?: string | null;
  deliveryRegion?: 'mainland' | 'madeira' | 'azores' | null;
  cttTrackingCode?: string | null;
  // Provider/diagnostic fields -- all admin-set or admin-read-only in
  // Payload (see Orders.ts), surfaced here so the storefront admin's order
  // detail can display the same troubleshooting info Payload admin shows.
  paymentReference?: string;
  appyPayMerchantTransactionId?: string;
  appyPayTransactionId?: string;
  appyPayStatus?: string;
  appyPayPaymentMethod?: string;
  appyPayResponseCode?: number;
  appyPayResponseMessage?: string;
  appyPayReferenceEntity?: string;
  appyPayReferenceNumber?: string;
  appyPayReferenceDueDate?: string;
  appyPayVerifiedAt?: string;
  inventoryReservationStatus?: string;
  inventoryReservationExpiresAt?: string;
  inventoryReservationReleasedAt?: string;
};

export type PublicOrderStatus = Pick<
  ApiOrder,
  'orderNumber' | 'status' | 'paymentStatus' | 'total' | 'currency' | 'deliveryRegion' | 'cttTrackingCode' | 'updatedAt'
>;

export type MarketSettings = {
  angolaPaymentLive: boolean;
  /** Split PT/EN (2026-07-26 bilingual audit): was a single field, which
   * meant Checkout.tsx's English-only fallback copy showed to Angola's
   * Portuguese-default shoppers whenever this was blank. Pick via
   * pickBilingual(), same as every other bilingual CMS field. */
  angolaBankTransferInstructionsPT?: string;
  angolaBankTransferInstructionsEN?: string;
  /** Per-market payment/delivery method lists (2026-07-10 decision). Angola:
   * Multicaixa Express (AppyPay) + Stripe + PayPal (Stripe/PayPal settle in
   * EUR). Portugal: PayPal + Stripe + MB WAY, unchanged. */
  angolaPaymentMethods: string[];
  angolaDeliveryMethods: string[];
  angolaMunicipalityPrices: Record<string, number>;
  angolaFreeShippingThreshold: number;
  portugalPaymentMethods: string[];
  portugalDeliveryMethods: string[];
  portugalStandardShippingPrice: number;
  portugalTrackedShippingPrice: number;
  portugalFreeShippingThreshold: number;
  portugalStandardWeightLimitGrams: number;
  portugalHeavyMainlandShippingPrice: number;
  portugalHeavyIslandsShippingPrice: number;
  /** Client-provided legal copy (JOS-64, added 2026-07-23). Angola and
   * Portugal/EU have materially different terms (48h exchange-only vs.
   * 14-day statutory withdrawal with refund), so these are separate fields
   * rather than a translation of one shared policy. Bilingual (JOS-64,
   * added 2026-07-24): PT is client-provided, EN is our translation of it. */
  angolaReturnsPolicyTextPT?: string;
  angolaReturnsPolicyTextEN?: string;
  portugalReturnsPolicyTextPT?: string;
  portugalReturnsPolicyTextEN?: string;
  /** Business hours + shipping info (JOS-64 follow-up, added 2026-07-24).
   * Same bilingual PT/EN pattern as the returns policy. Business hours are
   * shared across both markets (one WhatsApp support line); shipping is
   * per-market, plus a shared international-shipping note. */
  businessHoursTextPT?: string;
  businessHoursTextEN?: string;
  angolaShippingTextPT?: string;
  angolaShippingTextEN?: string;
  portugalShippingTextPT?: string;
  portugalShippingTextEN?: string;
  internationalShippingTextPT?: string;
  internationalShippingTextEN?: string;
};

/** Privacy Policy + Terms & Conditions (added 2026-07-24). Store-wide, not
 * per-market -- its own global rather than more MarketSettings fields. */
export type LegalContent = {
  privacyPolicyTextPT?: string;
  privacyPolicyTextEN?: string;
  termsTextPT?: string;
  termsTextEN?: string;
};

/** Storefront home hero content (2026-07-25 admin request) -- was hardcoded
 * via i18n.ts translation keys with no admin-editable source. Same
 * bilingual PT/EN pattern as LegalContent above. `heroImage`, when set,
 * replaces the decorative placeholder graphic. */
export type HomeContent = {
  heroEyebrowPT?: string;
  heroEyebrowEN?: string;
  heroHeadlinePT?: string;
  heroHeadlineEN?: string;
  heroSubtitlePT?: string;
  heroSubtitleEN?: string;
  heroCtaLabelPT?: string;
  heroCtaLabelEN?: string;
  heroCtaHref?: string;
  heroImage?: string | number | ApiMedia | null;
};

/** One auto-saved snapshot of home-content (2026-07-25 follow-up: "save old
 * homepage creations, in case I want to re-activate them later"). Payload's
 * built-in global versioning (versions.max on the global, no drafts/publish
 * workflow) snapshots the PREVIOUS doc on every save -- `version` is the
 * full HomeContent shape as it existed at that point in time. */
export type HomeContentVersion = {
  id: string | number;
  version: HomeContent;
  createdAt: string;
  updatedAt: string;
};

export type ApiCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  market: 'AO' | 'PT';
  orderCount: number;
  createdAt: string;
};

/** Internal (non-fiscal) invoicing configuration, per market -- admin-only
 * global (added 2026-07-25 for storefront-admin/Payload-admin parity). */
export type InvoiceSettings = {
  /** Split PT/EN (2026-07-26 bilingual audit): the invoice PDF renderer now
   * picks by the order's `lang` instead of always rendering Portuguese. */
  phaseOneDisclaimerPT: string;
  phaseOneDisclaimerEN: string;
  invoicingEnabledAO: boolean;
  issuerNameAO?: string;
  issuerTaxIdAO?: string;
  issuerAddressAO?: string;
  bankNameAO?: string;
  accountHolderAO?: string;
  bankAccountAO?: string;
  swiftBicAO?: string;
  paymentInstructionsAO?: string;
  vatRateAO: number;
  taxNoteAO?: string;
  invoicePrefixAO?: string;
  invoiceFooterAO?: string;
  invoicingEnabledPT: boolean;
  issuerNamePT?: string;
  issuerTaxIdPT?: string;
  issuerAddressPT?: string;
  bankNamePT?: string;
  accountHolderPT?: string;
  bankAccountPT?: string;
  swiftBicPT?: string;
  paymentInstructionsPT?: string;
  vatRatePT: number;
  taxNotePT?: string;
  invoicePrefixPT?: string;
  invoiceFooterPT?: string;
};

/** Issued internal invoice snapshot (read-only in the admin -- these are
 * immutable once generated, see Invoices.ts's `update: () => false`). Added
 * 2026-07-25 for storefront-admin/Payload-admin parity. */
export type ApiInvoice = {
  id: string;
  relatedOrder: string | { id: string; orderNumber?: string };
  invoiceNumber: string;
  sequence: number;
  year: number;
  status: 'issued' | 'failed';
  market: 'AO' | 'PT';
  issuedAt: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  currency: 'Kz' | 'EUR';
  total: number;
  errorMessage?: string;
};

/** Media library entry (product photos, etc.) -- added 2026-07-25 for
 * storefront-admin/Payload-admin parity. */
export type ApiMedia = {
  id: string | number;
  alt: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  filesize?: number;
  createdAt?: string;
  sizes?: {
    thumbnail?: { url?: string };
    card?: { url?: string };
  };
};

export type MessageChannel = 'whatsapp' | 'instagram';
export type MessageStatus = 'open' | 'auto_handled' | 'escalated' | 'resolved';

export type ApiMessage = {
  id: string;
  channel: MessageChannel;
  direction: 'inbound' | 'outbound';
  contactHandle: string;
  customerName?: string;
  body: string;
  status: MessageStatus;
  automationNote?: string;
  relatedOrder?: string;
  relatedCustomer?: string;
  sentByAutomation: boolean;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Public (storefront) endpoints
// ---------------------------------------------------------------------------
// Markets are fully separated storefronts (JOS decision, 2026-07-10): each
// site only ever fetches products flagged available in its own market, so
// an AO-only or PT-only product simply doesn't exist as far as the other
// site's API responses are concerned (not just hidden client-side).
function availabilityField(market: 'AO' | 'PT'): 'availableAO' | 'availablePT' {
  return market === 'AO' ? 'availableAO' : 'availablePT';
}

// depth=2 (was 1 before the 2026-07-25 taxonomy change): colour SWATCH
// images live one relationship deeper than the colour doc itself
// (product -> color -> media), so depth 1 would leave swatchUrl empty.
export async function fetchProducts(market: 'AO' | 'PT'): Promise<ApiProduct[]> {
  const data = await request<{ docs: ApiProduct[] }>(
    `/products?where[active][equals]=true&where[${availabilityField(market)}][equals]=true&limit=100&depth=2`,
  );
  return data.docs;
}

export async function fetchProductBySlug(slug: string, market: 'AO' | 'PT'): Promise<ApiProduct | null> {
  const data = await request<{ docs: ApiProduct[] }>(
    `/products?where[slug][equals]=${encodeURIComponent(slug)}&where[${availabilityField(market)}][equals]=true&limit=1&depth=2`,
  );
  return data.docs[0] ?? null;
}

/** Public: categories for the Browse filter pills/sidebar. Sorted by
 * creation so the original four keep their familiar order. */
export async function fetchCategories(): Promise<ApiCategory[]> {
  const data = await request<{ docs: ApiCategory[] }>('/categories?limit=100&sort=createdAt&depth=1');
  return data.docs;
}

/** Public read of merchandising tags (2026-07-25 follow-up) -- the CMS
 * collection is publicly readable (access.read: () => true), same as
 * categories. Used by Browse.tsx to resolve a ?tag=<slug> URL param (the
 * home hero button's "collection" link) into a filter and a display label. */
export async function fetchMerchTags(): Promise<ApiMerchTag[]> {
  const data = await request<{ docs: ApiMerchTag[] }>('/merch-tags?limit=100&sort=createdAt');
  return data.docs;
}

export async function fetchMarketSettings(): Promise<MarketSettings> {
  return request<MarketSettings>('/globals/market-settings');
}

export async function fetchLegalContent(): Promise<LegalContent> {
  return request<LegalContent>('/globals/legal-content');
}

// depth=1 so heroImage resolves to a populated media doc (url/sizes)
// instead of just an id, same reason fetchProducts uses depth for swatches.
export async function fetchHomeContent(): Promise<HomeContent> {
  return request<HomeContent>('/globals/home-content?depth=1');
}

export type ApiInstagramPost = {
  id: string;
  imageUrl: string;
  permalink: string;
  caption: string;
};

/**
 * Real posts from the client's Instagram Business account, via the CMS's
 * Graph API proxy (GET /api/instagram-feed). Returns an empty array --
 * never throws -- when Instagram credentials aren't configured yet (JOS-58)
 * or the CMS is unreachable, so callers can treat "no posts" as a normal
 * state and fall back to the static placeholder grid.
 */
export async function fetchInstagramFeed(limit = 6): Promise<ApiInstagramPost[]> {
  try {
    const data = await request<{ configured: boolean; posts: ApiInstagramPost[] }>(
      `/instagram-feed?limit=${limit}`,
    );
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export async function createOrder(input: CreateOrderInput): Promise<ApiOrder> {
  const data = await request<{ doc: ApiOrder }>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.doc;
}

// ---------------------------------------------------------------------------
// Real payments (JOS-61) -- Portugal/EUR only. Angola stays on SWEG/AppyPay
// (JOS-57) + manual bank transfer via the plain createOrder() above.
// ---------------------------------------------------------------------------
export type StripeCheckoutSessionResult = { orderNumber: string; sessionUrl: string };
export type PaypalCreateOrderResult = { orderNumber: string; paypalOrderId: string };
export type PaypalCaptureResult = { orderNumber?: string; status: string };
export type AppyPayCreateOrderResult = {
  orderNumber: string;
  merchantTransactionId: string;
};

/** Creates the order (pending) + a Stripe Checkout Session in one call.
 * Caller should redirect the browser to `sessionUrl`. */
export async function createStripeCheckoutSession(
  input: CreateOrderInput,
): Promise<StripeCheckoutSessionResult> {
  return request<StripeCheckoutSessionResult>('/payments/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Creates the order (pending) + a PayPal order in one call. Returns the
 * PayPal order ID for the PayPal JS SDK button's `createOrder` callback. */
export async function createPaypalOrder(input: CreateOrderInput): Promise<PaypalCreateOrderResult> {
  return request<PaypalCreateOrderResult>('/payments/paypal/create-order', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Captures a previously-created PayPal order after the buyer approves it. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
  return request<PaypalCaptureResult>('/payments/paypal/capture-order', {
    method: 'POST',
    body: JSON.stringify({ paypalOrderId }),
  });
}

/** Creates the pending CMS order before mounting AppyPay's hosted widget. */
export async function createAppyPayOrder(input: CreateOrderInput): Promise<AppyPayCreateOrderResult> {
  return request<AppyPayCreateOrderResult>('/payments/appypay/create-order', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Lightweight order lookup (Phase 1 scope -- no customer accounts). */
export async function lookupOrder(orderNumber: string, email: string): Promise<PublicOrderStatus | null> {
  const data = await request<{ order: PublicOrderStatus | null }>('/order-lookup', {
    method: 'POST',
    body: JSON.stringify({ orderNumber, email }),
  });
  return data.order;
}

/** Help page "send us an email" form (JOS-64 follow-up). */
export async function submitContactMessage(input: { name: string; email: string; message: string }): Promise<void> {
  await request<{ ok: true }>('/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Admin endpoints -- require a logged-in Payload session (cookie-based).
// ---------------------------------------------------------------------------
export async function adminLogin(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
  return request('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }, { auth: true });
}

export async function adminLogout(): Promise<void> {
  await request('/users/logout', { method: 'POST' }, { auth: true });
}

export async function adminMe(): Promise<{ user: { id: string; email: string } | null }> {
  return request('/users/me', {}, { auth: true });
}

export async function adminListOrders(params: { status?: string; market?: string } = {}): Promise<ApiOrder[]> {
  const search = new URLSearchParams({ limit: '200', sort: '-createdAt' });
  if (params.status) search.set('where[status][equals]', params.status);
  if (params.market) search.set('where[market][equals]', params.market);
  const data = await request<{ docs: ApiOrder[] }>(`/orders?${search.toString()}`, {}, { auth: true });
  return data.docs;
}

export async function adminUpdateOrderStatus(id: string, status: string): Promise<ApiOrder> {
  const data = await request<{ doc: ApiOrder }>(
    `/orders/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { auth: true },
  );
  return data.doc;
}

export async function adminGetOrder(id: string): Promise<ApiOrder> {
  return request<ApiOrder>(`/orders/${id}`, {}, { auth: true });
}

export async function adminListCustomers(): Promise<ApiCustomer[]> {
  const data = await request<{ docs: ApiCustomer[] }>('/customers?limit=200&sort=-createdAt', {}, { auth: true });
  return data.docs;
}

export async function adminGetCustomer(id: string): Promise<ApiCustomer> {
  return request<ApiCustomer>(`/customers/${id}`, {}, { auth: true });
}

/** JOS-58 Phase 1 messaging foundation: conversation log (WhatsApp + Instagram). */
export async function adminListMessages(): Promise<ApiMessage[]> {
  const data = await request<{ docs: ApiMessage[] }>('/messages?limit=300&sort=-createdAt&depth=0', {}, { auth: true });
  return data.docs;
}

export async function adminUpdateMessageStatus(id: string, status: MessageStatus): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    `/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { auth: true },
  );
  return data.doc;
}

/** Admin-composed reply. `sentByAutomation` is left false so the backend's
 * `sendOutboundMessage` hook actually delivers it via WhatsApp/Instagram. */
export async function adminSendMessage(input: {
  channel: MessageChannel;
  contactHandle: string;
  customerName?: string;
  body: string;
  relatedOrder?: string;
}): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    '/messages',
    {
      method: 'POST',
      body: JSON.stringify({ ...input, direction: 'outbound', status: 'resolved', sentByAutomation: false }),
    },
    { auth: true },
  );
  return data.doc;
}

// ---------------------------------------------------------------------------
// Admin: catalogue taxonomies (2026-07-25). Full CRUD -- managed in the
// Product settings page; the ProductEditor only picks from these lists.
// Deletes are refused by the CMS (HTTP 400) while products still reference
// the doc; taxonomyErrorMessage() extracts that server message for the UI.
// ---------------------------------------------------------------------------
export function taxonomyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const body = JSON.parse(err.message.slice(err.message.indexOf('{'))) as { errors?: { message?: string }[] };
      const message = body.errors?.[0]?.message;
      if (message) return message;
    } catch {
      /* fall through */
    }
  }
  return fallback;
}
export async function adminListCategories(): Promise<ApiCategory[]> {
  const data = await request<{ docs: ApiCategory[] }>('/categories?limit=100&sort=createdAt&depth=1', {}, { auth: true });
  return data.docs;
}

export async function adminCreateCategory(input: { namePT: string; nameEN?: string }): Promise<ApiCategory> {
  const data = await request<{ doc: ApiCategory }>(
    '/categories',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminListMerchTags(): Promise<ApiMerchTag[]> {
  const data = await request<{ docs: ApiMerchTag[] }>('/merch-tags?limit=100&sort=createdAt', {}, { auth: true });
  return data.docs;
}

export async function adminCreateMerchTag(input: { labelPT: string; labelEN?: string }): Promise<ApiMerchTag> {
  const data = await request<{ doc: ApiMerchTag }>(
    '/merch-tags',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateCategory(
  id: string | number,
  input: { namePT?: string; nameEN?: string; image?: string | number | null },
): Promise<ApiCategory> {
  const data = await request<{ doc: ApiCategory }>(
    `/categories/${id}?depth=1`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminDeleteCategory(id: string | number): Promise<void> {
  await request(`/categories/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function adminUpdateMerchTag(id: string | number, input: { labelPT?: string; labelEN?: string }): Promise<ApiMerchTag> {
  const data = await request<{ doc: ApiMerchTag }>(
    `/merch-tags/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminDeleteMerchTag(id: string | number): Promise<void> {
  await request(`/merch-tags/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function adminListColors(): Promise<ApiColor[]> {
  const data = await request<{ docs: ApiColor[] }>('/colors?limit=200&sort=namePT', {}, { auth: true });
  return data.docs;
}

export async function adminCreateColor(input: { namePT: string; nameEN?: string; hex?: string; hex2?: string }): Promise<ApiColor> {
  const data = await request<{ doc: ApiColor }>(
    '/colors',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateColor(id: string | number, input: { namePT?: string; nameEN?: string; hex?: string | null; hex2?: string | null }): Promise<ApiColor> {
  const data = await request<{ doc: ApiColor }>(
    `/colors/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminDeleteColor(id: string | number): Promise<void> {
  await request(`/colors/${id}`, { method: 'DELETE' }, { auth: true });
}

export type SizeGuideInput = { name: string; rows: Omit<ApiSizeGuideRow, 'id'>[] };

export async function adminListSizeGuides(): Promise<ApiSizeGuide[]> {
  const data = await request<{ docs: ApiSizeGuide[] }>('/size-guides?limit=100&sort=name', {}, { auth: true });
  return data.docs;
}

export async function adminCreateSizeGuide(input: SizeGuideInput): Promise<ApiSizeGuide> {
  const data = await request<{ doc: ApiSizeGuide }>(
    '/size-guides',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateSizeGuide(id: string | number, input: Partial<SizeGuideInput>): Promise<ApiSizeGuide> {
  const data = await request<{ doc: ApiSizeGuide }>(
    `/size-guides/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminDeleteSizeGuide(id: string | number): Promise<void> {
  await request(`/size-guides/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function adminListProducts(): Promise<ApiProduct[]> {
  // depth=2 for the same swatch-population reason as fetchProducts above.
  const data = await request<{ docs: ApiProduct[] }>('/products?limit=200&depth=2', {}, { auth: true });
  return data.docs;
}

export async function adminCreateProduct(input: Partial<ApiProduct>): Promise<ApiProduct> {
  const data = await request<{ doc: ApiProduct }>(
    '/products',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateProduct(id: string | number, input: Partial<ApiProduct>): Promise<ApiProduct> {
  const data = await request<{ doc: ApiProduct }>(
    `/products/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUploadProductImage(file: File, alt: string): Promise<{ id: string | number; url?: string; alt?: string }> {
  const body = new FormData();
  body.append('file', file);
  body.append('_payload', JSON.stringify({ alt }));
  const res = await fetch(`${API_BASE}/media`, { method: 'POST', body, credentials: 'include' });
  if (!res.ok) throw new ApiError(`Image upload failed (${res.status}): ${await res.text().catch(() => '')}`, res.status);
  const data = await res.json() as { doc: { id: string | number; url?: string; alt?: string } };
  return data.doc;
}

export async function adminUpdateMarketSettings(input: Partial<MarketSettings>): Promise<MarketSettings> {
  return request<MarketSettings>(
    '/globals/market-settings',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}

export async function adminDeleteProduct(id: string | number): Promise<void> {
  await request<{ doc: ApiProduct }>(`/products/${id}`, { method: 'DELETE' }, { auth: true });
}

// General-purpose order update (address/contact/payment-status edits, on top
// of the status-only adminUpdateOrderStatus above) -- added 2026-07-25 for
// storefront-admin/Payload-admin parity. Deliberately does NOT expose line
// items/subtotal/total editing: those feed the inventory-reservation hook
// (see use-me-with-style-cms/src/lib/inventoryReservation.ts), and editing
// them from here without reproducing that logic risks a stock/order-total
// mismatch that isn't worth the rare use case. Payload's own raw admin has
// the same risk if used carelessly; this just doesn't offer the footgun.
export async function adminUpdateOrder(id: string, input: Record<string, unknown>): Promise<ApiOrder> {
  const data = await request<{ doc: ApiOrder }>(
    `/orders/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminListOrdersByEmail(email: string): Promise<ApiOrder[]> {
  const search = new URLSearchParams({
    limit: '200',
    sort: '-createdAt',
    'where[customerEmail][equals]': email,
  });
  const data = await request<{ docs: ApiOrder[] }>(`/orders?${search.toString()}`, {}, { auth: true });
  return data.docs;
}

export async function adminUpdateCustomer(id: string, input: Partial<ApiCustomer>): Promise<ApiCustomer> {
  const data = await request<{ doc: ApiCustomer }>(
    `/customers/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

// ---------------------------------------------------------------------------
// Admin: internal invoicing settings + issued invoices (2026-07-25, storefront-
// admin/Payload-admin parity). InvoiceSettings' own read/update access
// requires req.user (see globals/InvoiceSettings.ts), so unlike
// fetchMarketSettings/fetchLegalContent above these are admin-only reads too.
// ---------------------------------------------------------------------------
export async function adminFetchInvoiceSettings(): Promise<InvoiceSettings> {
  return request<InvoiceSettings>('/globals/invoice-settings', {}, { auth: true });
}

export async function adminUpdateInvoiceSettings(input: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
  return request<InvoiceSettings>(
    '/globals/invoice-settings',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}

export async function adminUpdateLegalContent(input: Partial<LegalContent>): Promise<LegalContent> {
  return request<LegalContent>(
    '/globals/legal-content',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}

export async function adminUpdateHomeContent(input: Partial<HomeContent>): Promise<HomeContent> {
  return request<HomeContent>(
    '/globals/home-content?depth=1',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}

/** Past saves of the home hero (2026-07-25 follow-up), newest first --
 * powers the "Previous versions" panel in Settings.tsx's HomeHeroSection.
 * Payload auto-snapshots the PREVIOUS doc on every save (versions.max: 20
 * on the global), so this list is capped at the last 20 saves. */
export async function adminListHomeContentVersions(): Promise<HomeContentVersion[]> {
  const data = await request<{ docs: HomeContentVersion[] }>(
    '/globals/home-content/versions?limit=20&sort=-createdAt&depth=1',
    {},
    { auth: true },
  );
  return data.docs;
}

/** Restores a past version as the current home hero content. Returns the
 * restored (now-current) doc so the caller can update its form state
 * without a second fetch. */
export async function adminRestoreHomeContentVersion(id: string | number): Promise<HomeContent> {
  const data = await request<{ doc: HomeContent }>(
    `/globals/home-content/versions/${id}?depth=1`,
    { method: 'POST' },
    { auth: true },
  );
  return data.doc;
}

export async function adminListInvoices(): Promise<ApiInvoice[]> {
  const data = await request<{ docs: ApiInvoice[] }>('/invoices?limit=200&sort=-issuedAt&depth=0', {}, { auth: true });
  return data.docs;
}

/** Direct download URL for an issued invoice's PDF -- see
 * use-me-with-style-cms/src/endpoints/internalInvoices.ts. Requires an
 * authenticated admin session cookie, sent automatically by the browser on a
 * normal link navigation. */
export function adminInvoicePdfUrl(id: string): string {
  return `${apiBase}/internal-invoices/${id}/pdf`;
}

// ---------------------------------------------------------------------------
// Admin: media library (2026-07-25, storefront-admin/Payload-admin parity).
// Standalone browse/upload/delete, independent of the per-product upload
// flow in ProductEditor (adminUploadProductImage above, kept as-is since
// it's still used there).
// ---------------------------------------------------------------------------
export async function adminListMedia(): Promise<ApiMedia[]> {
  const data = await request<{ docs: ApiMedia[] }>('/media?limit=200&sort=-createdAt', {}, { auth: true });
  return data.docs;
}

export async function adminUploadMedia(file: File, alt: string): Promise<ApiMedia> {
  const body = new FormData();
  body.append('file', file);
  body.append('_payload', JSON.stringify({ alt }));
  const res = await fetch(`${API_BASE}/media`, { method: 'POST', body, credentials: 'include' });
  if (!res.ok) throw new ApiError(`Upload failed (${res.status}): ${await res.text().catch(() => '')}`, res.status);
  const data = (await res.json()) as { doc: ApiMedia };
  return data.doc;
}

export async function adminDeleteMedia(id: string | number): Promise<void> {
  await request<{ doc: ApiMedia }>(`/media/${id}`, { method: 'DELETE' }, { auth: true });
}

// ---------------------------------------------------------------------------
// Admin: coupon codes (2026-07-25, discounts phase 2). Full CRUD -- the
// storefront never lists/browses codes, only validates one it already has
// (validateCoupon above).
// ---------------------------------------------------------------------------
export async function adminListCoupons(): Promise<ApiCoupon[]> {
  const data = await request<{ docs: ApiCoupon[] }>('/coupons?limit=200&sort=-createdAt', {}, { auth: true });
  return data.docs;
}

export type CouponInput = {
  code: string;
  active?: boolean;
  description?: string;
  type: 'percent' | 'fixed';
  percentOff?: number | null;
  fixedOffAOKz?: number | null;
  fixedOffPTEur?: number | null;
  minOrderValueAOKz?: number | null;
  minOrderValuePTEur?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  maxRedemptionsPerEmail?: number | null;
  availableAO?: boolean | null;
  availablePT?: boolean | null;
};

export async function adminCreateCoupon(input: CouponInput): Promise<ApiCoupon> {
  const data = await request<{ doc: ApiCoupon }>(
    '/coupons',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateCoupon(id: string | number, input: Partial<CouponInput>): Promise<ApiCoupon> {
  const data = await request<{ doc: ApiCoupon }>(
    `/coupons/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminDeleteCoupon(id: string | number): Promise<void> {
  await request<{ doc: ApiCoupon }>(`/coupons/${id}`, { method: 'DELETE' }, { auth: true });
}
