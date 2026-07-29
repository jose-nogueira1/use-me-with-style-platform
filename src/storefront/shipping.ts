export type PortugalShippingConfig = {
  portugalStandardShippingPrice?: number | null;
  portugalTrackedShippingPrice?: number | null;
  portugalFreeShippingThreshold?: number | null;
};

export const DEFAULT_PORTUGAL_SHIPPING = {
  standardPrice: 4.9,
  trackedPrice: 6.9,
  freeThreshold: 75,
} as const;

export function normalizePortugalShipping(config?: PortugalShippingConfig | null) {
  const valid = (value: number | null | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
  return {
    standardPrice: valid(config?.portugalStandardShippingPrice, DEFAULT_PORTUGAL_SHIPPING.standardPrice),
    trackedPrice: valid(config?.portugalTrackedShippingPrice, DEFAULT_PORTUGAL_SHIPPING.trackedPrice),
    freeThreshold: valid(config?.portugalFreeShippingThreshold, DEFAULT_PORTUGAL_SHIPPING.freeThreshold),
  };
}

export function checkoutShippingCost(
  market: 'AO' | 'PT',
  deliveryMethod: string,
  merchandiseTotalAfterDiscount: number,
  config?: PortugalShippingConfig | null,
): number {
  if (market === 'AO') return 0;
  const prices = normalizePortugalShipping(config);
  if (merchandiseTotalAfterDiscount >= prices.freeThreshold) return 0;
  return deliveryMethod === 'courier_pt' ? prices.trackedPrice : prices.standardPrice;
}
