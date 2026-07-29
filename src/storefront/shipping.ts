export type PortugalShippingConfig = {
  portugalStandardShippingPrice?: number | null;
  portugalTrackedShippingPrice?: number | null;
  portugalFreeShippingThreshold?: number | null;
};

export const LUANDA_MUNICIPALITIES = [
  'Luanda', 'Cacuaco', 'Cazenga', 'Viana', 'Belas', 'Talatona', 'Mussulo', 'Sambizanga',
  'Rangel', 'Maianga', 'Samba', 'Camama', 'Mulenvos', 'Kilamba', 'Hoji Ya Henda', 'Ingombota',
] as const;

export const DEFAULT_ANGOLA_MUNICIPALITY_PRICES: Record<string, number> = {
  Luanda: 3000, Cacuaco: 5000, Cazenga: 3500, Viana: 6000, Belas: 6500, Talatona: 4000,
  Mussulo: 8000, Sambizanga: 3000, Rangel: 3000, Maianga: 2500, Samba: 3500, Camama: 4500,
  Mulenvos: 5500, Kilamba: 5000, 'Hoji Ya Henda': 3500, Ingombota: 2500,
};

export type MarketShippingConfig = PortugalShippingConfig & {
  angolaMunicipalityPrices?: Record<string, unknown> | null;
  angolaFreeShippingThreshold?: number | null;
};

export function normalizeAngolaShipping(config?: MarketShippingConfig | null) {
  const municipalityPrices = Object.fromEntries(LUANDA_MUNICIPALITIES.map((municipality) => {
    const value = Number(config?.angolaMunicipalityPrices?.[municipality]);
    return [municipality, Number.isFinite(value) && value >= 0 ? value : DEFAULT_ANGOLA_MUNICIPALITY_PRICES[municipality]];
  }));
  const threshold = Number(config?.angolaFreeShippingThreshold);
  return {
    municipalityPrices,
    freeThreshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : 80_000,
  };
}

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
  config?: MarketShippingConfig | null,
  municipality?: string,
): number {
  if (market === 'AO') {
    const values = normalizeAngolaShipping(config);
    if (merchandiseTotalAfterDiscount >= values.freeThreshold) return 0;
    return values.municipalityPrices[municipality ?? ''] ?? 0;
  }
  const prices = normalizePortugalShipping(config);
  if (merchandiseTotalAfterDiscount >= prices.freeThreshold) return 0;
  return deliveryMethod === 'courier_pt' ? prices.trackedPrice : prices.standardPrice;
}
