export type MoneyFormattingCurrency = 'AO' | 'EUR' | 'USD';

export function normalizeMoneyInput(value: string | number | null | undefined): string {
  return String(value ?? '').replaceAll(',', '');
}

export function formatMoneyInput(value: string | number | null | undefined, currency: MoneyFormattingCurrency): string {
  const raw = normalizeMoneyInput(value);
  if (!raw) return '';

  const [wholePart, decimalPart] = raw.split('.');
  const whole = (wholePart || '0').replace(/^0+(?=\d)/, '');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (currency === 'AO' || decimalPart === undefined) return grouped;
  return `${grouped}.${decimalPart}`;
}
