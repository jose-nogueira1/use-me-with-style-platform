export type PortugalShippingConfig = {
  portugalStandardShippingPrice?: number | null;
  portugalTrackedShippingPrice?: number | null;
  portugalFreeShippingThreshold?: number | null;
  portugalStandardWeightLimitGrams?: number | null;
  portugalHeavyMainlandShippingPrice?: number | null;
  portugalHeavyIslandsShippingPrice?: number | null;
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
  standardWeightLimitGrams: 2000,
  heavyMainlandPrice: 9.9,
  heavyIslandsPrice: 14.9,
} as const;

export function normalizePortugalShipping(config?: PortugalShippingConfig | null) {
  const valid = (value: number | null | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
  return {
    standardPrice: valid(config?.portugalStandardShippingPrice, DEFAULT_PORTUGAL_SHIPPING.standardPrice),
    trackedPrice: valid(config?.portugalTrackedShippingPrice, DEFAULT_PORTUGAL_SHIPPING.trackedPrice),
    freeThreshold: valid(config?.portugalFreeShippingThreshold, DEFAULT_PORTUGAL_SHIPPING.freeThreshold),
    standardWeightLimitGrams: valid(config?.portugalStandardWeightLimitGrams, DEFAULT_PORTUGAL_SHIPPING.standardWeightLimitGrams),
    heavyMainlandPrice: valid(config?.portugalHeavyMainlandShippingPrice, DEFAULT_PORTUGAL_SHIPPING.heavyMainlandPrice),
    heavyIslandsPrice: valid(config?.portugalHeavyIslandsShippingPrice, DEFAULT_PORTUGAL_SHIPPING.heavyIslandsPrice),
  };
}

export function portugalDeliveryRegion(postalCode: unknown): 'mainland' | 'madeira' | 'azores' | null {
  const match = String(postalCode ?? '').trim().match(/^(\d{4})-\d{3}$/);
  if (!match) return null;
  const prefix = Number(match[1]);
  if (prefix >= 9000 && prefix <= 9499) return 'madeira';
  if (prefix >= 9500 && prefix <= 9999) return 'azores';
  return 'mainland';
}

export type TaxRatesConfig = {
  AO: number;
  PT: { mainland: number; madeira: number; azores: number };
};

/** VAT included-in-price breakdown (2026-08-04). Angola is a flat rate
 * regardless of settlement currency -- this is about the customer's
 * market/jurisdiction, not which gateway happens to process the charge.
 * Portugal depends on the postal code's region, same
 * mainland/Madeira/Azores classification checkoutShippingCost above uses
 * for shipping, falling back to mainland's rate before a valid postal code
 * is entered -- matches the CMS's own fallback (see resolveVatRate's
 * comment in the CMS's internalInvoice.ts) so checkout and the eventual
 * invoice never disagree. Backs the net amount out of the final total
 * (rather than summing per-line) -- the same approach
 * calculateIncludedVatInvoice uses, so the two always match exactly. */
export function vatIncludedAmount(
  market: 'AO' | 'PT',
  total: number,
  taxRates: TaxRatesConfig,
  postalCode?: string,
): { rate: number; amount: number } {
  const rate = market === 'AO' ? taxRates.AO : taxRates.PT[portugalDeliveryRegion(postalCode) ?? 'mainland'];
  const net = rate > 0 ? total / (1 + rate / 100) : total;
  return { rate, amount: Math.max(0, total - net) };
}

export function checkoutShippingCost(
  market: 'AO' | 'PT',
  deliveryMethod: string,
  merchandiseTotalAfterDiscount: number,
  config?: MarketShippingConfig | null,
  municipality?: string,
  totalWeightGrams = 0,
  postalCode?: string,
): number {
  if (market === 'AO') {
    const values = normalizeAngolaShipping(config);
    if (merchandiseTotalAfterDiscount >= values.freeThreshold) return 0;
    return values.municipalityPrices[municipality ?? ''] ?? 0;
  }
  const prices = normalizePortugalShipping(config);
  if (merchandiseTotalAfterDiscount >= prices.freeThreshold) return 0;
  if (totalWeightGrams > prices.standardWeightLimitGrams) {
    return portugalDeliveryRegion(postalCode) === 'mainland' ? prices.heavyMainlandPrice : prices.heavyIslandsPrice;
  }
  return deliveryMethod === 'courier_pt' ? prices.trackedPrice : prices.standardPrice;
}
