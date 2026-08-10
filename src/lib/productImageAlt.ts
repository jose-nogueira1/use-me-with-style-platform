const BRAND_NAME = 'Use Me With Style';

type ProductImageAltInput = {
  productName?: string | null;
  colorName?: string | null;
  productType?: string | null;
};

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
