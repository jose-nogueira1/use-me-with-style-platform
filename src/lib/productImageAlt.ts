const BRAND_NAME = 'Use Me With Style';

type ProductImageAltInput = {
  productName?: string | null;
  colorName?: string | null;
  productType?: string | null;
};

const VERIFIED_PRODUCT_TYPES: Record<string, { pt: string; en: string }> = {
  // Photography reviewed in the 2026-09-05 audit. Keep the storefront's
  // descriptive image text accurate while the CMS relationships await edit.
  '31': { pt: 'Vestidos', en: 'Dresses' }, // Active Court
  '25': { pt: 'Conjuntos', en: 'Sets' }, // Aura
};

export function verifiedProductType(
  productId: string | number,
  lang: 'pt' | 'en',
  cmsProductType: string,
): string {
  return VERIFIED_PRODUCT_TYPES[String(productId)]?.[lang] ?? cmsProductType;
}

/**
 * Builds the descriptive fallback used when a CMS image has no authored alt
 * text. Keep this deliberately factual: product, photographed colour and
 * product/category type, followed by the brand named in the SEO audit.
 */
export function buildProductImageAlt({ productName, colorName, productType }: ProductImageAltInput): string {
  const details = [productName, colorName, productType]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return details.length > 0 ? `${details.join(' ')} — ${BRAND_NAME}` : `Produto — ${BRAND_NAME}`;
}

export function usableProductImageAlt(authoredAlt: string | null | undefined, fallback: ProductImageAltInput): string {
  const value = authoredAlt?.trim();
  const categoryWords = value?.match(/\b(?:conjuntos?|sets?|vestidos?|dresses?)\b/gi) ?? [];
  const categoryMatches = categoryWords.length === 0 || categoryWords.every((word) => fallback.productType?.toLowerCase().includes(word.toLowerCase()));
  if (value && categoryMatches && !/^(?:blob:|data:|https?:\/\/|\/)/i.test(value)) return value;
  return buildProductImageAlt(fallback);
}
