import { t, type Lang } from '../i18n';

// Raw stored values (mirrors Checkout.tsx's own PAYMENT_LABEL_KEYS/
// DELIVERY_LABEL_KEYS on the storefront side) -- shown as human labels
// instead of the bare enum value. Previously duplicated ad hoc inside
// OrderDetail.tsx and Orders.tsx (2026-07-31 QA fixes); pulled into one
// shared module once Dashboard.tsx's "Recent orders" row turned out to
// have the exact same raw-value bug, rather than copy it a third time.
export const PAYMENT_METHOD_KEY: Record<string, string> = {
  paypal: 'paymentMethodPaypal',
  stripe: 'paymentMethodStripe',
  mbway: 'paymentMethodMbway',
  multicaixa_express: 'paymentMethodMulticaixaExpress',
};
export const DELIVERY_METHOD_KEY: Record<string, string> = {
  ctt: 'deliveryMethodCtt',
  courier_pt: 'deliveryMethodCourierPt',
  courier_ao: 'deliveryMethodCourierAo',
};
export const DELIVERY_METHODS = Object.keys(DELIVERY_METHOD_KEY);

export function paymentMethodLabel(value: string, lang: Lang) {
  return PAYMENT_METHOD_KEY[value] ? t(PAYMENT_METHOD_KEY[value], lang) : value;
}
export function deliveryMethodLabel(value: string, lang: Lang) {
  return DELIVERY_METHOD_KEY[value] ? t(DELIVERY_METHOD_KEY[value], lang) : value;
}
