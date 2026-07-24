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

export type ApiProduct = {
  // Payload returns numeric IDs with the local SQLite adapter and string IDs
  // with PostgreSQL. Treat both as valid so admin routes work in every env.
  id: string | number;
  name: string;
  namePT?: string;
  nameEN?: string;
  slug: string;
  category: 'vestidos' | 'tops' | 'leggings' | 'conjuntos';
  description?: string;
  descriptionPT?: string;
  descriptionEN?: string;
  tag?: string;
  images?: { image: ApiProductImageRef }[];
  colors: { color: string }[];
  priceAOKz: number;
  pricePTEur: number;
  sizes: { size: string; stockAO: number; stockPT: number }[];
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

export type OrderItemInput = {
  product: string | number;
  productName: string;
  size: string;
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
  'orderNumber' | 'status' | 'paymentStatus' | 'total' | 'currency' | 'updatedAt'
>;

export type MarketSettings = {
  angolaPaymentLive: boolean;
  angolaBankTransferInstructions?: string;
  /** Per-market payment/delivery method lists (2026-07-10 decision). Angola:
   * Multicaixa Express (AppyPay) + Stripe + PayPal (Stripe/PayPal settle in
   * EUR). Portugal: PayPal + Stripe + MB WAY, unchanged. */
  angolaPaymentMethods: string[];
  angolaDeliveryMethods: string[];
  portugalPaymentMethods: string[];
  portugalDeliveryMethods: string[];
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
  phaseOneDisclaimer: string;
  invoicingEnabledAO: boolean;
  issuerNameAO?: string;
  issuerTaxIdAO?: string;
  issuerAddressAO?: string;
  vatRateAO: number;
  taxNoteAO?: string;
  invoicePrefixAO?: string;
  invoiceFooterAO?: string;
  invoicingEnabledPT: boolean;
  issuerNamePT?: string;
  issuerTaxIdPT?: string;
  issuerAddressPT?: string;
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

export async function fetchProducts(market: 'AO' | 'PT'): Promise<ApiProduct[]> {
  const data = await request<{ docs: ApiProduct[] }>(
    `/products?where[active][equals]=true&where[${availabilityField(market)}][equals]=true&limit=100&depth=1`,
  );
  return data.docs;
}

export async function fetchProductBySlug(slug: string, market: 'AO' | 'PT'): Promise<ApiProduct | null> {
  const data = await request<{ docs: ApiProduct[] }>(
    `/products?where[slug][equals]=${encodeURIComponent(slug)}&where[${availabilityField(market)}][equals]=true&limit=1&depth=1`,
  );
  return data.docs[0] ?? null;
}

export async function fetchMarketSettings(): Promise<MarketSettings> {
  return request<MarketSettings>('/globals/market-settings');
}

export async function fetchLegalContent(): Promise<LegalContent> {
  return request<LegalContent>('/globals/legal-content');
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

export async function adminListProducts(): Promise<ApiProduct[]> {
  const data = await request<{ docs: ApiProduct[] }>('/products?limit=200&depth=1', {}, { auth: true });
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
