import type { Lang } from '../theme';

export function saleDiscountLabel(regularPrice: number, salePrice: number, lang: Lang): string | null {
  const percentage = saleDiscountPercent(regularPrice, salePrice);
  if (percentage === null) return null;
  return lang === 'pt' ? `${percentage}% DESCONTO` : `${percentage}% OFF`;
}

export function saleDiscountPercent(regularPrice: number, salePrice: number): number | null {
  if (!Number.isFinite(regularPrice) || !Number.isFinite(salePrice) || regularPrice <= 0 || salePrice >= regularPrice) return null;
  const percentage = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  if (percentage <= 0) return null;
  return percentage;
}

export function saleUrgencyLabel(endDate: string | null | undefined, lang: Lang, now = new Date()): string | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime()) || end <= now) return null;
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  if (days <= 7) {
    if (lang === 'pt') return `Termina em ${days} ${days === 1 ? 'dia' : 'dias'}`;
    return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  const date = new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(end);
  return lang === 'pt' ? `Termina a ${date}` : `Ends ${date}`;
}
