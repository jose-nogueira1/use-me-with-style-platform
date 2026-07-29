export const PT_FREE_SHIPPING_THRESHOLD_EUR = 75;

const PT_DELIVERY_PRICES_EUR: Record<string, number> = {
  // Historical values are retained in the API/database: `ctt` is Correio
  // Normal (untracked), while `courier_pt` is CTT Correio Registado
  // (tracked). Renaming the stored values would invalidate older orders.
  ctt: 4.9,
  courier_pt: 6.9,
};

export function checkoutShippingCost(
  market: 'AO' | 'PT',
  deliveryMethod: string,
  merchandiseTotalAfterDiscount: number,
): number {
  if (market === 'AO') return 0;
  if (merchandiseTotalAfterDiscount >= PT_FREE_SHIPPING_THRESHOLD_EUR) return 0;
  return PT_DELIVERY_PRICES_EUR[deliveryMethod] ?? 0;
}
