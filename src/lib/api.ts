import { publicEnv } from '../config/env';

// Thin REST client for the use-me-with-style-cms Payload backend. Payload's
// default REST shape: collections return { docs, totalDocs, ... } on list,
// and a single document object on find-by-id/create/update. Globals return
// the global's fields directly (no `docs` wrapper).
const API_BASE = `${publicEnv.apiBaseUrl.replace(/\/$/, '')}/api`;

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
export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  category: 'vestidos' | 'tops' | 'leggings' | 'conjuntos';
  description?: string;
  tag?: string;
  images?: { image: { url: string; alt?: string } }[];
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

export type OrderItemInput = {
  product: string;
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
  city: string;
  country: string;
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
};

export type ApiOrder = CreateOrderInput & {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

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
  returnsPolicyText?: string;
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

/** Lightweight order lookup (Phase 1 scope -- no customer accounts). */
export async function lookupOrder(orderNumber: string, email: string): Promise<ApiOrder | null> {
  const data = await request<{ docs: ApiOrder[] }>(
    `/orders?where[orderNumber][equals]=${encodeURIComponent(orderNumber)}&where[customerEmail][equals]=${encodeURIComponent(email)}&limit=1`,
  );
  return data.docs[0] ?? null;
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

export async function adminUpdateProduct(id: string, input: Partial<ApiProduct>): Promise<ApiProduct> {
  const data = await request<{ doc: ApiProduct }>(
    `/products/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    { auth: true },
  );
  return data.doc;
}

export async function adminUpdateMarketSettings(input: Partial<MarketSettings>): Promise<MarketSettings> {
  return request<MarketSettings>(
    '/globals/market-settings',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: true },
  );
}
