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
  introPT?: string | null;
  introEN?: string | null;
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
  swatch?: string | number | { url?: string; sizes?: { small?: { url?: string } } } | null;
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

export type ApiPostBlock = {
  id?: string | null;
  kind: 'section' | 'paragraph' | 'bullets';
  headingPT?: string | null;
  headingEN?: string | null;
  textPT: string;
  textEN: string;
};

export type ApiPost = {
  id: string | number;
  titlePT: string;
  titleEN: string;
  slug: string;
  excerptPT: string;
  excerptEN: string;
  body: ApiPostBlock[];
  seoTitlePT: string;
  seoTitleEN: string;
  seoDescriptionPT: string;
  seoDescriptionEN: string;
  status: 'draft' | 'published';
  publishedAt?: string | null;
  availableAO: boolean;
  availablePT: boolean;
  updatedAt: string;
  createdAt: string;
};

export type ApiCategoryRef = string | number | ApiCategory;
export type ApiMerchTagRef = string | number | ApiMerchTag;
export type ApiColorRef = string | number | ApiColor;
export type ApiSizeGuideRef = string | number | ApiSizeGuide;

/** Variant-level inventory (2026-07-25): stock per colour+size row. */
export type ApiVariant = {
  id?: string | null;
  sku?: string | null;
  color?: ApiColorRef | null;
  size?: string | null;
  optionValueEN?: string | null;
  stockAO: number;
  stockPT: number;
};

export type ApiProductSpecification = {
  labelPT: string;
  labelEN?: string | null;
  valuePT: string;
  valueEN?: string | null;
};

export type ApiBundleComponent = {
  product: string | number | ApiProduct;
  variantId: string;
  qty: number;
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
  productType?: 'standard' | 'bundle';
  description?: string;
  descriptionPT?: string;
  descriptionEN?: string;
  sizeGuide?: ApiSizeGuideRef | null;
  fitNotePT?: string | null;
  fitNoteEN?: string | null;
  optionLabelPT?: string | null;
  optionLabelEN?: string | null;
  specifications?: ApiProductSpecification[] | null;
  returnEligible?: boolean | null;
  returnNotePT?: string | null;
  returnNoteEN?: string | null;
  /** hasMany since 2026-07-31 (admin bug report: "I can only select one
   * merchandising tag per item") -- a product can carry several badges at
   * once. Payload returns an array for hasMany relationships; an unpopulated
   * or empty product may still send null/undefined, so both are tolerated. */
  tag?: ApiMerchTagRef[] | null;
  // `color` (2026-08-07, per-colour galleries): optional, mirrors
  // variants[].color -- unset means "general", shown for every colour.
  images?: { id?: string | null; image: ApiProductImageRef; color?: ApiColorRef | null }[];
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
  bundleComponents?: ApiBundleComponent[] | null;
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
  if (p.productType === 'bundle') {
    const stocks = (p.bundleComponents ?? []).flatMap((component) => {
      const child = resolveRef(component.product);
      const variant = child?.variants?.find((row) => String(row.id) === String(component.variantId));
      return variant ? [Math.floor((Number(variant.stockAO) + Number(variant.stockPT)) / Math.max(1, Number(component.qty)))] : [];
    });
    return stocks.length > 0 && Math.min(...stocks) <= 2;
  }
  return p.variants.some((v) => v.stockAO + v.stockPT <= 2);
}

/** Stricter than productIsLowStock -- a variant genuinely sold out, not
 * just running low. Used by the admin notifications bell (2026-07-25) to
 * flag "urgent" only for products that can't be sold at all right now,
 * rather than every merely-low-stock one. */
export function productIsOutOfStock(p: ApiProduct): boolean {
  if (p.productType === 'bundle') {
    const stocks = (p.bundleComponents ?? []).flatMap((component) => {
      const child = resolveRef(component.product);
      const variant = child?.variants?.find((row) => String(row.id) === String(component.variantId));
      return variant ? [Number(variant.stockAO) + Number(variant.stockPT)] : [];
    });
    return stocks.length === 0 || stocks.some((stock) => stock === 0);
  }
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
  // 2026-07-31: free_shipping is a shipping waiver (no percentOff/fixedOff
  // amount of its own) rather than a merchandise discount -- see
  // couponPricing.ts's resolveCoupon (CMS) for how it's resolved.
  type: 'percent' | 'fixed' | 'free_shipping';
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
  // freeShipping (2026-07-31 "free delivery" coupon type): mirrors
  // couponPricing.ts's CouponResolution on the CMS side -- Checkout.tsx
  // zeroes its own shippingCost calc when this is true, same pattern as
  // discountAmount for merchandise discounts.
  | { valid: true; code: string; discountAmount: number; freeShipping: boolean; label: string }
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
  // Sale-price exclusion (2026-08-04) -- the subtotal of only the cart
  // lines NOT currently at a sale price. A percent-off coupon can only
  // discount this portion; omit to fall back to full-subtotal behaviour.
  eligibleSubtotal?: number;
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
  variantId?: string;
  size?: string;
  optionLabel?: string;
  optionValue?: string;
  productType?: 'standard' | 'bundle';
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
  /** First/last name collected separately at checkout (2026-08-04) --
   * customerName above is still the two joined together, which is what
   * every existing consumer (invoices, admin, emails) reads. These two are
   * additional, optional snapshot fields for future use (e.g. a shipping
   * label API that wants them split) -- nothing currently reads them back. */
  customerFirstName?: string;
  customerLastName?: string;
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
  // Automatic audit trail of status changes (2026-08-01 request) -- see
  // Orders.ts's beforeChange hook, which appends to this on every status
  // change (create included). Admin-read-only; there's no editable form for
  // it anywhere, it's only ever displayed.
  statusHistory?: { status: string; changedAt: string; changedBy?: string }[];
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
  /** Angola launches with AppyPay. Portugal checkout remains disabled until
   * the client has a Portuguese legal entity and approved providers. */
  angolaPaymentMethods: string[];
  angolaDeliveryMethods: string[];
  angolaMunicipalityPrices: Record<string, number>;
  angolaFreeShippingThreshold: number;
  portugalPaymentsEnabled: boolean;
  manualWhatsappNumber?: string;
  angolaWhatsappNumber?: string;
  portugalWhatsappNumber?: string;
  manualWhatsappMessagePT?: string;
  manualWhatsappMessageEN?: string;
  /** Shown at checkout while portugalPaymentsEnabled is off, PT/EN pair --
   * same pattern as angolaBankTransferInstructionsPT/EN above (2026-08-04
   * addition: PT checkout now offers a manual WhatsApp-coordination method
   * instead of hard-blocking with an error). */
  portugalManualCheckoutInstructionsPT?: string;
  portugalManualCheckoutInstructionsEN?: string;
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
  // Added 2026-08-01 for the Meta App Dashboard's "Data Deletion
  // Instructions URL" requirement (needed to publish the WhatsApp/
  // Instagram messaging app, JOS-58).
  dataDeletionTextPT?: string;
  dataDeletionTextEN?: string;
};

export type StorefrontFaqEntry = {
  id?: string | null;
  enabled?: boolean | null;
  questionPT: string;
  questionEN: string;
  answerPT: string;
  answerEN: string;
  answerPTPT?: string | null;
  answerENPT?: string | null;
  linkPath?: string | null;
  linkLabelPT?: string | null;
  linkLabelEN?: string | null;
};

export type StorefrontAboutValue = {
  id?: string | null;
  enabled?: boolean | null;
  titlePT: string;
  titleEN: string;
  bodyPT: string;
  bodyEN: string;
};

/** FAQ and standalone size-guide copy managed from the custom admin. */
export type StorefrontContent = {
  tiktokUrl?: string | null;
  homeSeoTitleAngolaPT?: string | null;
  homeSeoTitleAngolaEN?: string | null;
  homeSeoDescriptionAngolaPT?: string | null;
  homeSeoDescriptionAngolaEN?: string | null;
  homeSeoTitlePortugalPT?: string | null;
  homeSeoTitlePortugalEN?: string | null;
  homeSeoDescriptionPortugalPT?: string | null;
  homeSeoDescriptionPortugalEN?: string | null;
  aboutEyebrowPT?: string | null;
  aboutEyebrowEN?: string | null;
  aboutTitlePT?: string | null;
  aboutTitleEN?: string | null;
  aboutIntroPT?: string | null;
  aboutIntroEN?: string | null;
  aboutStoryTitlePT?: string | null;
  aboutStoryTitleEN?: string | null;
  aboutStoryBodyPT?: string | null;
  aboutStoryBodyEN?: string | null;
  aboutValuesTitlePT?: string | null;
  aboutValuesTitleEN?: string | null;
  aboutValues?: StorefrontAboutValue[] | null;
  aboutPresenceTitlePT?: string | null;
  aboutPresenceTitleEN?: string | null;
  aboutAngolaTitlePT?: string | null;
  aboutAngolaTitleEN?: string | null;
  aboutAngolaBodyPT?: string | null;
  aboutAngolaBodyEN?: string | null;
  aboutPortugalTitlePT?: string | null;
  aboutPortugalTitleEN?: string | null;
  aboutPortugalBodyPT?: string | null;
  aboutPortugalBodyEN?: string | null;
  aboutCtaLabelPT?: string | null;
  aboutCtaLabelEN?: string | null;
  aboutSeoTitlePT?: string | null;
  aboutSeoTitleEN?: string | null;
  aboutSeoDescriptionPT?: string | null;
  aboutSeoDescriptionEN?: string | null;
  faqTitlePT?: string | null;
  faqTitleEN?: string | null;
  faqIntroPT?: string | null;
  faqIntroEN?: string | null;
  faqSupportPromptPT?: string | null;
  faqSupportPromptEN?: string | null;
  faqSupportLabelPT?: string | null;
  faqSupportLabelEN?: string | null;
  faqSeoTitlePT?: string | null;
  faqSeoTitleEN?: string | null;
  faqSeoDescriptionPT?: string | null;
  faqSeoDescriptionEN?: string | null;
  faqEntries?: StorefrontFaqEntry[] | null;
  sizeGuideTitlePT?: string | null;
  sizeGuideTitleEN?: string | null;
  sizeGuideIntroPT?: string | null;
  sizeGuideIntroEN?: string | null;
  sizeGuideHowToTitlePT?: string | null;
  sizeGuideHowToTitleEN?: string | null;
  sizeGuideBustPT?: string | null;
  sizeGuideBustEN?: string | null;
  sizeGuideWaistPT?: string | null;
  sizeGuideWaistEN?: string | null;
  sizeGuideHipPT?: string | null;
  sizeGuideHipEN?: string | null;
  sizeGuideLengthPT?: string | null;
  sizeGuideLengthEN?: string | null;
  sizeGuideClosingPT?: string | null;
  sizeGuideClosingEN?: string | null;
  sizeGuideSupportLabelPT?: string | null;
  sizeGuideSupportLabelEN?: string | null;
  sizeGuideCatalogLabelPT?: string | null;
  sizeGuideCatalogLabelEN?: string | null;
  sizeGuideSeoTitlePT?: string | null;
  sizeGuideSeoTitleEN?: string | null;
  sizeGuideSeoDescriptionPT?: string | null;
  sizeGuideSeoDescriptionEN?: string | null;
};

/** Storefront home hero content (2026-07-25 admin request) -- was hardcoded
 * via i18n.ts translation keys with no admin-editable source. Same
 * bilingual PT/EN pattern as LegalContent above. `heroImage`, when set,
 * replaces the decorative placeholder graphic. */
// Home page content used to be one combined global (`home-content`) --
// split into three independent globals on 2026-08-04 (admin feedback: "I
// don't like the previous versions is a global preview of the whole home
// page... it should have previous versions of just each individually").
// Each now has its own fetch/save/version-history functions further down.
export type HomeHero = {
  heroEyebrowPT?: string;
  heroEyebrowEN?: string;
  heroHeadlinePT?: string;
  heroHeadlineEN?: string;
  heroSubtitlePT?: string;
  heroSubtitleEN?: string;
  heroCtaLabelPT?: string;
  heroCtaLabelEN?: string;
  // 2026-07-31 (fixes hero CTA pointing at the full catalogue instead of a
  // themed collection): replaces the old free-text heroCtaHref URL with a
  // type + slug pair, driven by a dropdown in Settings.tsx sourced from the
  // real categories/tags lists rather than hand-typed. See Home.tsx for how
  // the actual href is derived from these.
  heroCtaType?: 'all' | 'category' | 'tag';
  heroCtaCategorySlug?: string | null;
  heroCtaTagSlug?: string | null;
  heroImage?: string | number | ApiMedia | null;
  heroImageMobile?: string | number | ApiMedia | null;
};

// Homepage curation (2026-08-04, "admin should have total control here"
// over which categories and merch-tag shelves appear on the homepage).
// Both optional/empty by default -- Home.tsx falls back to the previous
// behaviour (every category shown; hardcoded New Arrivals/Featured
// sections) until an admin actually fills these in from Settings.
export type HomeCategories = {
  homepageCategorySlugs?: { id?: string; slug: string }[];
};

export type HomeCollections = {
  collections?: { id?: string; tagSlug: string; titlePT: string; titleEN: string; itemLimit?: number | null }[];
};

/** One auto-saved snapshot of a home-page global (2026-07-25 follow-up:
 * "save old homepage creations, in case I want to re-activate them
 * later"). Payload's built-in global versioning (versions.max on the
 * global, no drafts/publish workflow) snapshots the PREVIOUS doc on every
 * save -- `version` is the full shape as it existed at that point in time.
 * Generic over which of the three home globals it belongs to. */
export type HomeGlobalVersion<T> = {
  id: string | number;
  version: T;
  createdAt: string;
  updatedAt: string;
};
export type HomeHeroVersion = HomeGlobalVersion<HomeHero>;
export type HomeCategoriesVersion = HomeGlobalVersion<HomeCategories>;
export type HomeCollectionsVersion = HomeGlobalVersion<HomeCollections>;

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
  vatRatePortugalMainland: number;
  vatRatePortugalMadeira: number;
  vatRatePortugalAzores: number;
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
    thumbnail?: { url?: string; width?: number; height?: number };
    card?: { url?: string; width?: number; height?: number };
    small?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    large?: { url?: string; width?: number; height?: number };
    hero?: { url?: string; width?: number; height?: number };
  };
};

export type MessageChannel = 'instagram';
// Dormant channel for future reactivation:
// export type MessageChannel = 'instagram' | 'whatsapp';
export type MessageStatus = 'open' | 'auto_handled' | 'escalated' | 'resolved';
export type ConversationStatus = 'needs_reply' | 'waiting' | 'priority' | 'done';

export type ApiMessage = {
  id: string;
  channel: MessageChannel;
  direction: 'inbound' | 'outbound';
  contactHandle: string;
  customerName?: string;
  body: string;
  instagramContextType?: 'story_reply' | 'shared_post' | 'media' | 'inline_reply' | 'unsupported_media';
  instagramContextUrl?: string;
  instagramContextPermalink?: string;
  instagramContextMediaType?: string;
  replyToExternalId?: string;
  replyToText?: string;
  adminReadAt?: string;
  instagramSeenAt?: string;
  conversationStatus?: ConversationStatus;
  internalNote?: string;
  externalId?: string;
  status: MessageStatus;
  automationNote?: string;
  relatedOrder?: string | Pick<ApiOrder, 'id' | 'orderNumber' | 'market' | 'status' | 'paymentStatus' | 'createdAt'>;
  relatedCustomer?: string | Pick<ApiCustomer, 'id' | 'name' | 'email' | 'phone' | 'market'>;
  sentByAutomation: boolean;
  aiProcessingStatus?: 'queued' | 'processing' | 'draft_ready' | 'failed' | 'cancelled';
  aiDraftStatus?: 'queued' | 'draft_ready' | 'approved' | 'dismissed' | 'failed';
  aiDraft?: string;
  aiDraftConfidence?: number;
  aiDraftSourceRecordIds?: string[];
  aiDraftReason?: string;
  aiMarket?: 'angola' | 'portugal';
  aiIntent?: string;
  aiLanguage?: string;
  aiFacts?: {
    market?: 'AO' | 'PT' | null;
    intent?: string;
    product?: { sourceRecordId?: string; name?: string; price?: number | null; currency?: string; onSale?: boolean; availableInMarket?: boolean; matchedVariants?: Array<{ size?: string | null; colour?: string | null; stock?: number; available?: boolean }>; productUrl?: string | null } | null;
    alternatives?: Array<{ sourceRecordId?: string; name?: string; availableInMarket?: boolean; productUrl?: string | null }>;
    policy?: { kind?: string; text?: string } | null;
    coupon?: { code?: string; valid?: boolean; detail?: string | null } | null;
  };
  aiModel?: string;
  aiRequestId?: string;
  aiInputTokens?: number;
  aiOutputTokens?: number;
  aiTotalTokens?: number;
  aiEstimatedCostUsd?: number;
  aiRequiresHuman?: boolean;
  aiOutcome?: string;
  aiAutomationDecision?: string;
  aiBotPaused?: boolean;
  createdAt: string;
};

export type InstagramProfile = {
  id: string;
  name?: string;
  username?: string;
  profile_pic?: string;
  /** Compatibility with the business-profile Graph API response shape. */
  profile_picture_url?: string;
  is_verified_user?: boolean;
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
    `/products?where[slug][equals]=${encodeURIComponent(slug)}&where[active][equals]=true&where[${availabilityField(market)}][equals]=true&limit=1&depth=2`,
  );
  return data.docs[0] ?? null;
}

export async function fetchPosts(market: 'AO' | 'PT'): Promise<ApiPost[]> {
  const data = await request<{ docs: ApiPost[] }>(
    `/posts?where[status][equals]=published&where[${availabilityField(market)}][equals]=true&limit=100&sort=-publishedAt`,
  );
  return data.docs;
}

export async function fetchPostBySlug(slug: string, market: 'AO' | 'PT'): Promise<ApiPost | null> {
  const data = await request<{ docs: ApiPost[] }>(
    `/posts?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&where[${availabilityField(market)}][equals]=true&limit=1`,
  );
  return data.docs[0] ?? null;
}

/** Public: categories for the Browse filter pills/sidebar. Sorted by
 * creation so the original four keep their familiar order. */
export async function fetchCategories(): Promise<ApiCategory[]> {
  const data = await request<{ docs: ApiCategory[] }>('/categories?limit=100&sort=createdAt&depth=1');
  return data.docs;
}

/** Public measurement charts used by the crawlable size-guide page. */
export async function fetchSizeGuides(): Promise<ApiSizeGuide[]> {
  const data = await request<{ docs: ApiSizeGuide[] }>('/size-guides?limit=100&sort=name');
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

/** Public VAT rates (2026-08-04) -- Angola is flat, Portugal has one rate
 * per region (mainland/Madeira/Azores). Backed by a small dedicated
 * endpoint rather than reading the (auth-only) Invoice Settings global
 * directly -- that global also holds bank IBAN, issuer tax ID, etc., which
 * the public storefront has no business reading. Same rates the invoice PDF
 * uses (see the CMS's calculateIncludedVatInvoice), so the checkout display
 * and the eventual invoice always agree. */
export type TaxRates = {
  AO: number;
  PT: { mainland: number; madeira: number; azores: number };
};
export async function fetchTaxRates(): Promise<TaxRates> {
  return request<TaxRates>('/tax-rates');
}

export async function fetchLegalContent(): Promise<LegalContent> {
  return request<LegalContent>('/globals/legal-content');
}

export async function fetchStorefrontContent(): Promise<StorefrontContent> {
  return request<StorefrontContent>('/globals/storefront-content');
}

// depth=1 so heroImage resolves to a populated media doc (url/sizes)
// instead of just an id, same reason fetchProducts uses depth for swatches.
export async function fetchHomeHero(): Promise<HomeHero> {
  return request<HomeHero>('/globals/home-hero?depth=1');
}
export async function fetchHomeCategories(): Promise<HomeCategories> {
  return request<HomeCategories>('/globals/home-categories');
}
export async function fetchHomeCollections(): Promise<HomeCollections> {
  return request<HomeCollections>('/globals/home-collections');
}

export type ApiInstagramLookProduct = {
  id: string;
  slug: string;
  name: string;
  namePT: string;
  nameEN: string;
  imageUrl: string | null;
  imageAlt?: string | null;
  price: number;
  regularPrice: number;
  currency: 'AOA' | 'EUR';
  onSale: boolean;
  inStock: boolean;
  availableSizes: string[];
  selectedColorId: string | null;
  selectedColorNamePT: string | null;
  selectedColorNameEN: string | null;
};

export type ApiInstagramPost = {
  id: string;
  lookSlug: string;
  imageUrl: string;
  // 2026-08-08: real video posts, not just still frames -- see
  // use-me-with-style-cms's lib/instagramFeed.ts. `videoUrl` is only present
  // when mediaType is 'VIDEO'; CAROUSEL_ALBUM posts are still reported as
  // 'IMAGE' (their per-slide media isn't fetched yet).
  mediaType: 'IMAGE' | 'VIDEO';
  videoUrl?: string;
  permalink: string;
  caption: string;
  // Server-cleaned short caption (hashtags/newlines stripped, truncated),
  // always the real Instagram caption -- see use-me-with-style-cms's
  // lib/instagramFeed.ts's cleanCaptionForDisplay. No admin override exists
  // (2026-08-02 simplification: "just show the most recent 12 posts and
  // allow me to choose the highlighted post").
  captionDisplay: string;
  // 'large' for the one post the admin picked to highlight (CMS's
  // instagram-spotlight global), 'regular' for every other post.
  size: 'regular' | 'large';
  products?: ApiInstagramLookProduct[];
};

/** Instagram feed highlight (2026-08-02, simplified same day from an
 * ordered/labelled curation list -- "just show the most recent 12 posts and
 * allow me to choose the highlighted post"). A single choice: which recent
 * post's permalink gets the large tile. Empty/unset means nothing is
 * highlighted -- every tile renders the same size. */
export type InstagramSpotlight = {
  highlightedPermalink?: string | null;
  productTags?: Array<{
    mediaId?: string | null;
    permalink: string;
    products?: Array<string | number | ApiProduct> | null;
    variantSelections?: Record<string, string> | null;
    id?: string | null;
  }> | null;
};

export type InstagramFeedResult = {
  posts: ApiInstagramPost[];
};

/**
 * Real posts from the client's Instagram Business account, via the CMS's
 * Graph API proxy (GET /api/instagram-feed). Returns no posts -- never
 * throws -- when Instagram credentials aren't configured yet (JOS-58) or
 * the CMS is unreachable, so callers can treat "no posts" as a normal state
 * and fall back to the static placeholder grid.
 */
export async function fetchInstagramFeed(limit = 6, market: 'AO' | 'PT' = 'AO'): Promise<InstagramFeedResult> {
  try {
    const data = await request<{ configured: boolean; posts: ApiInstagramPost[] }>(
      `/instagram-feed?limit=${limit}&market=${market}`,
    );
    return { posts: data.posts ?? [] };
  } catch {
    return { posts: [] };
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
  cancellationToken: string;
  reservationExpiresAt: string;
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

export async function cancelAppyPayOrder(order: Pick<AppyPayCreateOrderResult, 'merchantTransactionId' | 'cancellationToken'>): Promise<void> {
  await request<{ cancelled: true }>('/payments/appypay/cancel-order', {
    method: 'POST',
    body: JSON.stringify(order),
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

/**
 * Help page "send us an email" form (JOS-64 follow-up). `lang` (added
 * 2026-08-06) is the storefront's active UI language -- it only decides the
 * language of the customer-facing auto-reply the CMS now sends back
 * (sendContactAutoReplyEmail in the CMS repo's lib/email.ts); the internal
 * team notification stays Portuguese-only regardless. Optional so this
 * keeps working unchanged if a caller doesn't pass it (CMS defaults to
 * 'pt').
 */
export async function submitContactMessage(input: { name: string; email: string; phone?: string; orderNumber?: string; message: string; lang?: 'pt' | 'en' }): Promise<void> {
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

// Orders.tsx/Dashboard.tsx fetch the whole list once and do all
// filtering/counting client-side (see Orders.tsx's countFor/marketCountFor
// comments for why) -- there's no server-side pagination on this page, so
// this limit is really "how many orders can exist before the admin list
// silently starts dropping older ones". Raised from 200 to 500 (2026-08-01)
// as a stopgap, paired with adminCountOrders below so the UI can at least
// WARN when the true count exceeds what was fetched, instead of silently
// truncating. A real fix (server-side pagination + a separate aggregate-
// count endpoint for the pill totals) is a bigger rearchitecture of this
// page's whole filtering model, not worth doing before order volume is
// anywhere near this limit.
export async function adminListOrders(params: { status?: string; market?: string } = {}): Promise<ApiOrder[]> {
  const search = new URLSearchParams({ limit: '500', sort: '-createdAt' });
  if (params.status) search.set('where[status][equals]', params.status);
  if (params.market) search.set('where[market][equals]', params.market);
  const data = await request<{ docs: ApiOrder[] }>(`/orders?${search.toString()}`, {}, { auth: true });
  return data.docs;
}

// True total order count, independent of the 500-row fetch cap above --
// `limit=0` still returns accurate Payload pagination metadata (docs: [],
// totalDocs: <real count>). Orders.tsx uses this to show a warning if
// adminListOrders() ever comes back truncated.
export async function adminCountOrders(): Promise<number> {
  const data = await request<{ totalDocs: number }>('/orders?limit=0', {}, { auth: true });
  return data.totalDocs;
}

// `extra` (2026-07-31, Orders QA) lets a status change carry additional
// fields in the SAME PATCH -- specifically paymentStatus, so "confirm
// payment" can move status and paymentStatus together in one atomic
// request instead of two separate calls (which previously let an admin
// advance an order's status while paymentStatus silently stayed
// 'pending', see OrderDetail.tsx's handleConfirmPayment).
export async function adminUpdateOrderStatus(id: string, status: string, extra?: Record<string, unknown>): Promise<ApiOrder> {
  const data = await request<{ doc: ApiOrder }>(
    `/orders/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status, ...extra }) },
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

/** Instagram-only admin inbox. Historical WhatsApp rows remain stored in the
 * CMS, but are intentionally excluded from this active storefront-admin UI. */
export async function adminListMessages(): Promise<ApiMessage[]> {
  const data = await request<{ docs: ApiMessage[] }>(
    '/messages?where[channel][equals]=instagram&limit=300&sort=-createdAt&depth=1',
    {},
    { auth: true },
  );
  return data.docs;
}

export async function adminMarkInstagramConversationRead(contactHandle: string): Promise<{ readAt: string; updatedIds: string[]; instagramSynced: boolean }> {
  return request('/instagram-conversations/read', {
    method: 'POST',
    body: JSON.stringify({ contactHandle }),
  }, { auth: true });
}

export async function adminUpdateConversationStatus(id: string, conversationStatus: ConversationStatus): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    `/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ conversationStatus }) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateMessageStatus(id: string, status: MessageStatus): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    `/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateMessageNote(id: string, internalNote: string): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    `/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ internalNote }) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateAiDraft(id: string, data: {
  aiProcessingStatus?: ApiMessage['aiProcessingStatus'];
  aiDraftStatus?: ApiMessage['aiDraftStatus'];
  aiAvailableAt?: string;
  aiDraft?: string;
  aiDraftReason?: string;
  aiAttempts?: number;
  aiOutcome?: string;
  aiBotPaused?: boolean;
}): Promise<ApiMessage> {
  const response = await request<{ doc: ApiMessage }>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, { auth: true });
  return response.doc;
}

export type AiAssistantStatus = {
  mode: 'off' | 'shadow' | 'approval' | 'hybrid';
  enabled: boolean;
  extractionModel: string;
  draftingModel: string;
  monthlyBudgetUsd: number | null;
  monthSpendUsd: number;
  automaticSending: boolean;
  settings: AiMessagingSettings;
};

export type AiAutoReplyIntent = 'greeting' | 'product_availability' | 'product_price' | 'product_sizing' | 'delivery' | 'payment' | 'coupon' | 'return_policy';

export type AiMessagingSettings = {
  assistantEnabled: boolean;
  emergencyStop: boolean;
  operatingMode: 'approval' | 'hybrid';
  autoReplyIntents: AiAutoReplyIntent[];
  autoReplyMarketClarification: boolean;
  autoReplyProductClarification: boolean;
  confidenceThreshold: number;
  replyDelaySeconds: number;
  maxAutoRepliesPerConversation: number;
  maxAutoRepliesPerHour: number;
  monthlyBudgetUsd: number;
  outOfStockRecoveryEnabled: boolean;
  outOfStockAllowOtherColours: boolean;
  outOfStockAllowOtherSizes: boolean;
  outOfStockMaxAlternatives: number;
  outOfStockPriceTolerancePercent: number;
  outOfStockCategoryWeight: number;
  outOfStockTagWeight: number;
};

export async function adminGetAiAssistantStatus(): Promise<AiAssistantStatus> {
  return request<AiAssistantStatus>('/ai/status', { cache: 'no-store' }, { auth: true });
}

export async function adminFetchAiMessagingSettings(): Promise<AiMessagingSettings> {
  return request<AiMessagingSettings>('/globals/ai-messaging-settings', { cache: 'no-store' }, { auth: true });
}

export async function adminUpdateAiMessagingSettings(input: AiMessagingSettings): Promise<AiMessagingSettings> {
  return request<AiMessagingSettings>(
    '/globals/ai-messaging-settings',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}

export async function adminGetInstagramProfile(contactHandle: string): Promise<InstagramProfile> {
  return request<InstagramProfile>(
    `/instagram-profile?contactHandle=${encodeURIComponent(contactHandle)}`,
    { cache: 'no-store' },
    { auth: true },
  );
}

/** Admin-composed Instagram reply. `sentByAutomation` is left false so the
 * backend's `sendOutboundMessage` hook delivers it through Instagram. */
export async function adminSendMessage(input: {
  contactHandle: string;
  customerName?: string;
  body: string;
  relatedOrder?: string;
}): Promise<ApiMessage> {
  const data = await request<{ doc: ApiMessage }>(
    '/messages',
    {
      method: 'POST',
      body: JSON.stringify({ ...input, channel: 'instagram', direction: 'outbound', status: 'open', conversationStatus: 'waiting', sentByAutomation: false }),
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

export async function adminUpdateColor(
  id: string | number,
  input: { namePT?: string; nameEN?: string; hex?: string | null; hex2?: string | null; swatch?: string | number | null },
): Promise<ApiColor> {
  const data = await request<{ doc: ApiColor }>(
    `/colors/${id}?depth=1`,
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
  return adminUploadMedia(file, alt, 'catalogue');
}

/** Payload wraps successful global updates in `{ message, result }`, unlike
 * global reads, which return the document directly. Keep that REST detail in
 * one place so admin forms receive the saved document rather than replacing
 * their state with the response envelope. */
async function adminUpdateGlobal<T>(path: string, input: Partial<T> | T): Promise<T> {
  const data = await request<{ message: string; result: T }>(
    path,
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.result;
}

export async function adminUpdateMarketSettings(input: Partial<MarketSettings>): Promise<MarketSettings> {
  return adminUpdateGlobal('/globals/market-settings', input);
}

export async function adminDeleteProduct(id: string | number): Promise<void> {
  await request<{ doc: ApiProduct }>(`/products/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function adminListPosts(): Promise<ApiPost[]> {
  const data = await request<{ docs: ApiPost[] }>('/posts?limit=200&sort=-publishedAt', {}, { auth: true });
  return data.docs;
}

export async function adminCreatePost(input: Omit<ApiPost, 'id' | 'slug' | 'updatedAt' | 'createdAt'>): Promise<ApiPost> {
  const data = await request<{ doc: ApiPost }>('/posts', { method: 'POST', body: JSON.stringify(input) }, { auth: true });
  return data.doc;
}

export async function adminUpdatePost(id: string | number, input: Partial<ApiPost>): Promise<ApiPost> {
  const data = await request<{ doc: ApiPost }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, { auth: true });
  return data.doc;
}

export async function adminDeletePost(id: string | number): Promise<void> {
  await request(`/posts/${id}`, { method: 'DELETE' }, { auth: true });
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
  return adminUpdateGlobal('/globals/invoice-settings', input);
}

export async function adminUpdateLegalContent(input: Partial<LegalContent>): Promise<LegalContent> {
  return adminUpdateGlobal('/globals/legal-content', input);
}

export async function adminUpdateStorefrontContent(input: StorefrontContent): Promise<StorefrontContent> {
  return adminUpdateGlobal('/globals/storefront-content', input);
}

export async function adminUpdateHomeHero(input: Partial<HomeHero>): Promise<HomeHero> {
  return adminUpdateGlobal('/globals/home-hero?depth=1', input);
}
export async function adminUpdateHomeCategories(input: Partial<HomeCategories>): Promise<HomeCategories> {
  return adminUpdateGlobal('/globals/home-categories', input);
}
export async function adminUpdateHomeCollections(input: Partial<HomeCollections>): Promise<HomeCollections> {
  return adminUpdateGlobal('/globals/home-collections', input);
}

/** Admin: Instagram feed curation (2026-08-02). Same self-contained
 * fetch/save pattern as adminUpdateLegalContent above -- own Settings tab,
 * own Save button. Public read (see fetchInstagramFeed above, used by the
 * storefront), auth required to write, matching every other Settings
 * global here. */
export async function adminFetchInstagramSpotlight(): Promise<InstagramSpotlight> {
  return request<InstagramSpotlight>('/globals/instagram-spotlight', {}, { auth: true });
}

export async function adminUpdateInstagramSpotlight(input: InstagramSpotlight): Promise<InstagramSpotlight> {
  return adminUpdateGlobal('/globals/instagram-spotlight', input);
}

/** Past saves of each home-page global (2026-07-25 follow-up, "save old
 * homepage creations, in case I want to re-activate them later"; split
 * into three independent histories 2026-08-04). Payload auto-snapshots the
 * PREVIOUS doc on every save (versions.max: 20 on each global), so each
 * list is capped at the last 20 saves of THAT section only. */
export async function adminListHomeHeroVersions(): Promise<HomeHeroVersion[]> {
  const data = await request<{ docs: HomeHeroVersion[] }>(
    '/globals/home-hero/versions?limit=20&sort=-createdAt&depth=1',
    {},
    { auth: true },
  );
  return data.docs;
}
export async function adminListHomeCategoriesVersions(): Promise<HomeCategoriesVersion[]> {
  const data = await request<{ docs: HomeCategoriesVersion[] }>(
    '/globals/home-categories/versions?limit=20&sort=-createdAt',
    {},
    { auth: true },
  );
  return data.docs;
}
export async function adminListHomeCollectionsVersions(): Promise<HomeCollectionsVersion[]> {
  const data = await request<{ docs: HomeCollectionsVersion[] }>(
    '/globals/home-collections/versions?limit=20&sort=-createdAt',
    {},
    { auth: true },
  );
  return data.docs;
}

/** Restores a past version as the current doc for that section. Returns
 * the restored (now-current) doc so the caller can update its form state
 * without a second fetch. */
export async function adminRestoreHomeHeroVersion(id: string | number): Promise<HomeHero> {
  const data = await request<{ doc: HomeHero }>(
    `/globals/home-hero/versions/${id}?depth=1`,
    { method: 'POST' },
    { auth: true },
  );
  return data.doc;
}
export async function adminRestoreHomeCategoriesVersion(id: string | number): Promise<HomeCategories> {
  const data = await request<{ doc: HomeCategories }>(
    `/globals/home-categories/versions/${id}`,
    { method: 'POST' },
    { auth: true },
  );
  return data.doc;
}
export async function adminRestoreHomeCollectionsVersion(id: string | number): Promise<HomeCollections> {
  const data = await request<{ doc: HomeCollections }>(
    `/globals/home-collections/versions/${id}`,
    { method: 'POST' },
    { auth: true },
  );
  return data.doc;
}

/* Admin request (2026-08-04, same follow-up as the collapsible version
 * panels): "Admin should have a way to delete old hero section, old
 * categories and old homepage collections [version history entries]."
 * Payload has no built-in delete for a single global version, so the CMS
 * exposes a custom DELETE /globals/<slug>/versions/:id endpoint (see
 * use-me-with-style-cms/src/endpoints/globalVersions.ts) -- these three
 * just call it. */
export async function adminDeleteHomeHeroVersion(id: string | number): Promise<void> {
  await request<void>(`/globals/home-hero/versions/${id}`, { method: 'DELETE' }, { auth: true });
}
export async function adminDeleteHomeCategoriesVersion(id: string | number): Promise<void> {
  await request<void>(`/globals/home-categories/versions/${id}`, { method: 'DELETE' }, { auth: true });
}
export async function adminDeleteHomeCollectionsVersion(id: string | number): Promise<void> {
  await request<void>(`/globals/home-collections/versions/${id}`, { method: 'DELETE' }, { auth: true });
}

export async function adminListInvoices(): Promise<ApiInvoice[]> {
  const data = await request<{ docs: ApiInvoice[] }>('/invoices?limit=200&sort=-issuedAt&depth=0', {}, { auth: true });
  return data.docs;
}

/** The single invoice (if any) generated for one order -- added so
 * OrderDetail.tsx can show/link the invoice directly on the order itself,
 * instead of only being reachable by cross-referencing the order number on
 * the separate Invoices page. An order only gets an invoice once
 * paymentStatus reaches 'paid' (see notifyOrderEvent.ts's justPaid branch),
 * so this is commonly null -- that's expected, not an error. */
export async function adminGetInvoiceForOrder(orderId: string): Promise<ApiInvoice | null> {
  const search = new URLSearchParams({ limit: '1', depth: '0', 'where[relatedOrder][equals]': orderId });
  const data = await request<{ docs: ApiInvoice[] }>(`/invoices?${search.toString()}`, {}, { auth: true });
  return data.docs[0] ?? null;
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

export async function adminUploadMedia(file: File, alt: string, uploadPurpose: 'hero' | 'catalogue' | 'brand' = 'catalogue'): Promise<ApiMedia> {
  const transientStatuses = new Set([500, 502, 503, 504]);
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const body = new FormData();
    body.append('file', file);
    body.append('_payload', JSON.stringify({ alt, uploadPurpose }));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/media`, { method: 'POST', body, credentials: 'include' });
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 400 * 2 ** (attempt - 1)));
      continue;
    }
    if (res.ok) {
      const data = (await res.json()) as { doc: ApiMedia };
      return data.doc;
    }
    const responseText = await res.text().catch(() => '');
    if (!transientStatuses.has(res.status) || attempt === maxAttempts) {
      throw new ApiError(`Upload failed (${res.status}): ${responseText}`, res.status);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 400 * 2 ** (attempt - 1)));
  }
  throw new ApiError('Upload failed after retrying.', 500);
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
  // 2026-07-31: free_shipping is a shipping waiver (no percentOff/fixedOff
  // amount of its own) rather than a merchandise discount -- see
  // couponPricing.ts's resolveCoupon (CMS) for how it's resolved.
  type: 'percent' | 'fixed' | 'free_shipping';
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
