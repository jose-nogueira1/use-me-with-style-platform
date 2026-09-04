export type SalePricingCurrency = 'AO' | 'EUR';

export function calculateSalePrice(regularValue: string | number | null | undefined, percentageValue: string | number | null | undefined, currency: SalePricingCurrency): number | null {
  const regular = Number(String(regularValue ?? '').replaceAll(',', ''));
  const percentage = Number(String(percentageValue ?? '').replace('%', ''));
  if (!Number.isFinite(regular) || regular <= 0 || !Number.isFinite(percentage) || percentage <= 0 || percentage >= 100) return null;
  const sale = regular * (1 - percentage / 100);
  return currency === 'AO' ? Math.round(sale) : Math.round(sale * 100) / 100;
}
