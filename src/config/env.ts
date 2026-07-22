type AppEnv = "development" | "staging" | "production";
type PaymentMode = "sandbox" | "live";

const appEnvs: AppEnv[] = ["development", "staging", "production"];
const paymentModes: PaymentMode[] = ["sandbox", "live"];

function oneOf<T extends string>(value: string | undefined, allowed: T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function bool(value: string | undefined, fallback = false) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export const publicEnv = {
  appEnv: oneOf(import.meta.env.VITE_APP_ENV, appEnvs, "development"),
  appName: import.meta.env.VITE_APP_NAME || "Use Me With Style",
  siteUrl: import.meta.env.VITE_SITE_URL || "http://localhost:5173",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  cmsUrl: import.meta.env.VITE_CMS_URL || "http://localhost:3000/admin",
  defaultMarket: import.meta.env.VITE_DEFAULT_MARKET || "AO",
  paymentMode: oneOf(import.meta.env.VITE_PAYMENT_MODE, paymentModes, "sandbox"),
  // Public PayPal client ID (JOS-61) -- used client-side to load the PayPal
  // JS SDK button. This is a public identifier by design, safe to expose;
  // the matching secret (PAYPAL_CLIENT_SECRET) stays server-side only, in
  // the CMS's own env, never here.
  paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
  // AppyPay explicitly requires these public values as data attributes on
  // its hosted Charges Widget. Server-to-server credentials never belong in
  // VITE_ variables and remain in the CMS environment only.
  appyPayApiKey: import.meta.env.VITE_APPYPAY_WIDGET_API_KEY || "",
  appyPayClientId: import.meta.env.VITE_APPYPAY_WIDGET_CLIENT_ID || "",
  appyPayMerchantName: import.meta.env.VITE_APPYPAY_MERCHANT_NAME || "",
  appyPayWidgetSrc: import.meta.env.VITE_APPYPAY_WIDGET_SRC || "https://widget.appypay.co.ao/main.js",
  appyPayRedirectUri: import.meta.env.VITE_APPYPAY_REDIRECT_URI || "",
  appyPayMerchantLogoUrl: import.meta.env.VITE_APPYPAY_MERCHANT_LOGO_URL || "",
  appyPayPaymentMethods: import.meta.env.VITE_APPYPAY_PAYMENT_METHODS || "",
  // JSON object containing optional custom keys configured in the AppyPay
  // portal. The official widget exposes this through `data-options`.
  appyPayOptions: import.meta.env.VITE_APPYPAY_OPTIONS || "",
  livePaymentsEnabled: bool(import.meta.env.VITE_ENABLE_LIVE_PAYMENTS),
  messagingAutomationEnabled: bool(import.meta.env.VITE_ENABLE_MESSAGING_AUTOMATION),
  analyticsEnabled: bool(import.meta.env.VITE_ENABLE_ANALYTICS),
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || "",
};

export function isAppyPayWidgetConfigured() {
  return Boolean(publicEnv.appyPayApiKey && publicEnv.appyPayClientId && publicEnv.appyPayMerchantName);
}

export function applyRuntimeEnvMetadata() {
  document.documentElement.dataset.appEnv = publicEnv.appEnv;
  document.documentElement.dataset.paymentMode = publicEnv.paymentMode;
}
