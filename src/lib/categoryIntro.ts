import type { ApiCategory } from './api';

export type CategoryIntro = {
  title: string;
  body: string;
};

/**
 * Category copy belongs to a single landing-page subject. The catalogue's
 * multi-select filters can combine categories, so no intro is shown unless
 * exactly one real CMS category is selected.
 */
export function getSingleCategoryIntro(
  categories: ApiCategory[],
  activeCategorySlugs: string[],
  lang: 'pt' | 'en',
): CategoryIntro | null {
  if (activeCategorySlugs.length !== 1) return null;

  const category = categories.find((item) => item.slug === activeCategorySlugs[0]);
  if (!category) return null;

  const title = (lang === 'en' ? category.nameEN : category.namePT)?.trim() || category.namePT.trim();
  const preferredIntro = lang === 'en' ? category.introEN : category.introPT;
  const fallbackIntro = lang === 'en' ? category.introPT : category.introEN;
  const body = preferredIntro?.trim() || fallbackIntro?.trim();

  return body ? { title, body } : null;
}
