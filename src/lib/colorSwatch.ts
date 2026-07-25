// Shared swatch-rendering helper (2026-07-25 combination-colours follow-up).
// Every screen that draws a colour dot -- storefront filter pills and
// product-detail chips, admin colour chips and the stock matrix, the
// Product settings colour panel -- used to repeat the same
// `swatchUrl ? url(...) : hex` ternary. Centralising it here also adds the
// two-tone case: when hex2 is set (a "combination" colour, e.g. red &
// white), the swatch renders as a clean left/right split instead of a
// solid fill. A swatch image (patterns/multicolour fabrics a flat split
// can't represent) always wins over both hex values.
export type SwatchInput = {
  hex?: string | null;
  hex2?: string | null;
  swatchUrl?: string | null;
};

export function hasSwatch(c: SwatchInput): boolean {
  return Boolean(c.swatchUrl || c.hex || c.hex2);
}

export function swatchBackground(c: SwatchInput): string | undefined {
  if (c.swatchUrl) return `center / cover url(${c.swatchUrl})`;
  if (c.hex && c.hex2 && c.hex2 !== c.hex) return `linear-gradient(90deg, ${c.hex} 50%, ${c.hex2} 50%)`;
  return c.hex ?? undefined;
}
