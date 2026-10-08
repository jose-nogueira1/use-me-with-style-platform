export type PortugalShippingConfig = {
  portugalStandardShippingPrice?: number | null;
  portugalTrackedShippingPrice?: number | null;
  portugalFreeShippingEnabled?: boolean | null;
  portugalFreeShippingThreshold?: number | null;
  portugalStandardWeightLimitGrams?: number | null;
  portugalHeavyMainlandShippingPrice?: number | null;
  portugalHeavyIslandsShippingPrice?: number | null;
};

// Angola delivery is done by Zygo (zygo.ao) in Luanda, priced by four zones. The
// neighbourhood -> zone map is fixed (and mirrored in the CMS, which is the
// authority); zone prices and the free-delivery threshold come from the market
// settings. The order's `city` stores the neighbourhood the customer picks.
export const ANGOLA_DELIVERY_ZONES = {
  centro: ['Ingombotas', 'Maianga', 'Alvalade', 'Maculusso', 'Mutamba', 'Cassenda'],
  sul: ['Talatona', 'Patriota', 'Belas', 'Camama', 'Benfica'],
  norte: ['Vila Alice', 'Sambizanga', 'Rangel', 'Cazenga', 'Hoji ya Henda'],
  periferia: ['Viana', 'Kilamba', 'Zango', 'Cacuaco', 'Funda'],
} as const;

export type AngolaZone = keyof typeof ANGOLA_DELIVERY_ZONES;
export const ANGOLA_ZONES = Object.keys(ANGOLA_DELIVERY_ZONES) as AngolaZone[];

export const DEFAULT_ANGOLA_ZONE_PRICES: Record<AngolaZone, number> = { centro: 3500, sul: 3500, norte: 3500, periferia: 5500 };

export function angolaZoneOf(neighbourhood: string | undefined): AngolaZone | null {
  return ANGOLA_ZONES.find((zone) => (ANGOLA_DELIVERY_ZONES[zone] as readonly string[]).includes(neighbourhood ?? '')) ?? null;
}

export type MarketShippingConfig = PortugalShippingConfig & {
  angolaZonePriceCentro?: number | null;
  angolaZonePriceSul?: number | null;
  angolaZonePriceNorte?: number | null;
  angolaZonePricePeriferia?: number | null;
  angolaFreeShippingEnabled?: boolean | null;
  angolaFreeShippingThreshold?: number | null;
};

const ZONE_SETTING: Record<AngolaZone, keyof MarketShippingConfig> = {
  centro: 'angolaZonePriceCentro',
  sul: 'angolaZonePriceSul',
  norte: 'angolaZonePriceNorte',
  periferia: 'angolaZonePricePeriferia',
};

export function normalizeAngolaShipping(config?: MarketShippingConfig | null) {
  const zonePrices = Object.fromEntries(ANGOLA_ZONES.map((zone) => {
    const value = Number(config?.[ZONE_SETTING[zone]]);
    return [zone, Number.isFinite(value) && value >= 0 ? value : DEFAULT_ANGOLA_ZONE_PRICES[zone]];
  })) as Record<AngolaZone, number>;
  const threshold = Number(config?.angolaFreeShippingThreshold);
  return {
    zonePrices,
    // Off unless an admin switches it on (Settings > Angola).
    freeEnabled: config?.angolaFreeShippingEnabled === true,
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
    freeEnabled: config?.portugalFreeShippingEnabled === true,
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

/** Fallback used before /tax-rates has loaded (or if it's unreachable) --
 * matches the CMS's own InvoiceSettings defaults (AO 14%, PT mainland/
 * Madeira/Azores 23/22/16%), so the very first paint already shows the
 * right numbers for an admin who hasn't touched these settings. Shared
 * between Checkout.tsx and Cart.tsx (2026-08-04, "VAT value should show on
 * cart as well not only on checkout") so both pages start from the exact
 * same default and can't drift apart. */
// Angola is 0 (2026-10-07): Regime Simplificado, so no VAT line is shown unless the
// CMS reports a rate (was 14 under Regime Geral).
export const DEFAULT_TAX_RATES: TaxRatesConfig = { AO: 0, PT: { mainland: 23, madeira: 22, azores: 16 } };

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
  neighbourhood?: string,
  totalWeightGrams = 0,
  postalCode?: string,
): number {
  if (market === 'AO') {
    const values = normalizeAngolaShipping(config);
    if (values.freeEnabled && merchandiseTotalAfterDiscount >= values.freeThreshold) return 0;
    const zone = angolaZoneOf(neighbourhood);
    return zone ? values.zonePrices[zone] : 0;
  }
  const prices = normalizePortugalShipping(config);
  if (prices.freeEnabled && merchandiseTotalAfterDiscount >= prices.freeThreshold) return 0;
  if (totalWeightGrams > prices.standardWeightLimitGrams) {
    return portugalDeliveryRegion(postalCode) === 'mainland' ? prices.heavyMainlandPrice : prices.heavyIslandsPrice;
  }
  return deliveryMethod === 'courier_pt' ? prices.trackedPrice : prices.standardPrice;
}
