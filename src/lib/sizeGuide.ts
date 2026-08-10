import type { ApiCategory, ApiSizeGuide, ApiSizeGuideRow } from './api';
import type { SizeGuideRow } from '../types/product';
import type { Lang } from '../theme';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function publicSizeGuideName(name: string, categories: ApiCategory[], lang: Lang): string {
  const publicName = name.split(/\s+[—–-]\s+/, 1)[0].trim() || name.trim();
  const normalizedName = normalize(publicName);
  const category = categories.find((candidate) => {
    const names = [candidate.slug, candidate.namePT, candidate.nameEN].filter(Boolean) as string[];
    return names.some((value) => normalize(value) === normalizedName);
  });
  return (lang === 'en' ? category?.nameEN : category?.namePT) || category?.namePT || publicName;
}

export function sizeGuideRows(rows: ApiSizeGuideRow[]): SizeGuideRow[] {
  return rows
    .filter((row) => row.size.trim().length > 0)
    .map((row) => ({
      size: row.size.trim(),
      ...(row.bust != null ? { bust: row.bust } : {}),
      ...(row.waist != null ? { waist: row.waist } : {}),
      ...(row.hip != null ? { hip: row.hip } : {}),
      ...(row.length != null ? { length: row.length } : {}),
    }));
}

export function usableSizeGuides(guides: ApiSizeGuide[]): ApiSizeGuide[] {
  return guides.filter((guide) => sizeGuideRows(guide.rows).length > 0);
}
