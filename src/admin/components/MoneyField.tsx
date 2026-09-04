import { C } from '../../theme';
import { formatMoneyInput, normalizeMoneyInput } from './moneyFormatting';

export type MoneyCurrency = 'AO' | 'EUR' | 'USD';

type MoneyFieldProps = {
  label: string;
  value: string | number | null | undefined;
  currency: MoneyCurrency;
  lang: 'en' | 'pt';
  onChange: (value: string) => void;
  compact?: boolean;
  readOnly?: boolean;
};

function validMoney(value: string, currency: MoneyCurrency): boolean {
  return currency === 'AO' ? /^\d*$/.test(value) : /^\d*(\.\d{0,2})?$/.test(value);
}

export function MoneyField({ label, value, currency, lang, onChange, compact = false, readOnly = false }: MoneyFieldProps) {
  const handleChange = (next: string) => {
    const normalized = normalizeMoneyInput(next);
    if (validMoney(normalized, currency)) onChange(normalized);
  };
  const hint = lang === 'pt'
    ? currency === 'AO' ? 'Apenas números inteiros · ex.: 28000' : 'Até 2 casas decimais · ex.: 74.90'
    : currency === 'AO' ? 'Whole numbers only · e.g. 28000' : 'Up to 2 decimals · e.g. 74.90';

  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: compact ? 9 : 10, fontWeight: 800, color: C.goldDeep, marginBottom: 6 }}>{label}</div>
      <input
        type="text"
        inputMode={currency === 'AO' ? 'numeric' : 'decimal'}
        readOnly={readOnly}
        value={formatMoneyInput(value, currency)}
        onChange={(event) => handleChange(event.target.value)}
        aria-label={`${label} (${currency})`}
        style={{ width: '100%', padding: compact ? '8px 10px' : '11px 10px', fontSize: compact ? 11 : 12, fontWeight: 700, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
      />
      <div style={{ marginTop: 4, fontSize: 9, color: C.inkSoft }}>{hint}</div>
    </label>
  );
}
