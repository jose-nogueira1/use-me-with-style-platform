// Auto-suggest bilingual colour names from a hex value (2026-07-25 admin
// request): when the admin picks a hex in Product settings and hasn't
// typed a name yet, ColorsPanel finds the closest match below and
// pre-fills namePT/nameEN as an editable suggestion -- it never overwrites
// text the admin already typed.
//
// This is presentation-only, separate from the CMS's colorPresets.ts,
// which backfills exact Portuguese colour NAMES already in the catalogue
// (matching a known word, not a hex distance). The two lists are
// intentionally not shared across the two repos.
const NAMED_COLOR_SWATCHES: { namePT: string; nameEN: string; hex: string }[] = [
  { namePT: 'Preto', nameEN: 'Black', hex: '#111111' },
  { namePT: 'Carvão', nameEN: 'Charcoal', hex: '#2B2B2B' },
  { namePT: 'Antracite', nameEN: 'Anthracite', hex: '#3B3B3D' },
  { namePT: 'Cinza Escuro', nameEN: 'Dark Grey', hex: '#5A5A57' },
  { namePT: 'Cinza', nameEN: 'Grey', hex: '#9B9B93' },
  { namePT: 'Cinza Claro', nameEN: 'Light Grey', hex: '#C7C6BF' },
  { namePT: 'Branco', nameEN: 'White', hex: '#F7F5F0' },
  { namePT: 'Marfim', nameEN: 'Ivory', hex: '#F1E9D8' },
  { namePT: 'Creme', nameEN: 'Cream', hex: '#EFE3C8' },
  { namePT: 'Bege', nameEN: 'Beige', hex: '#D9C6A5' },
  { namePT: 'Caqui', nameEN: 'Khaki', hex: '#BDB07A' },
  { namePT: 'Camel', nameEN: 'Camel', hex: '#C19A6B' },
  { namePT: 'Caramelo', nameEN: 'Caramel', hex: '#A9702F' },
  { namePT: 'Castanho Claro', nameEN: 'Tan', hex: '#B08863' },
  { namePT: 'Castanho', nameEN: 'Brown', hex: '#6B4A34' },
  { namePT: 'Azeitona', nameEN: 'Olive', hex: '#6E7245' },
  { namePT: 'Verde', nameEN: 'Green', hex: '#5C7A5A' },
  { namePT: 'Verde Escuro', nameEN: 'Dark Green', hex: '#2E4634' },
  { namePT: 'Verde Menta', nameEN: 'Mint', hex: '#A3D2C4' },
  { namePT: 'Verde Água', nameEN: 'Teal', hex: '#3F7C77' },
  { namePT: 'Azul', nameEN: 'Blue', hex: '#3B5D82' },
  { namePT: 'Azul Marinho', nameEN: 'Navy', hex: '#1F2E44' },
  { namePT: 'Noite', nameEN: 'Midnight', hex: '#14171F' },
  { namePT: 'Azul Céu', nameEN: 'Sky Blue', hex: '#8FB8D6' },
  { namePT: 'Roxo', nameEN: 'Purple', hex: '#6B4E71' },
  { namePT: 'Lilás', nameEN: 'Lilac', hex: '#C6A9CF' },
  { namePT: 'Rosa', nameEN: 'Pink', hex: '#E6A8B8' },
  { namePT: 'Rosa Choque', nameEN: 'Fuchsia', hex: '#C23B7A' },
  { namePT: 'Vermelho', nameEN: 'Red', hex: '#B23A3A' },
  { namePT: 'Bordô', nameEN: 'Burgundy', hex: '#6E2A34' },
  { namePT: 'Laranja', nameEN: 'Orange', hex: '#D97A3F' },
  { namePT: 'Coral', nameEN: 'Coral', hex: '#E8785A' },
  { namePT: 'Amarelo', nameEN: 'Yellow', hex: '#E8C84A' },
  { namePT: 'Mostarda', nameEN: 'Mustard', hex: '#C9A227' },
  { namePT: 'Dourado', nameEN: 'Gold', hex: '#C8A96A' },
  { namePT: 'Prateado', nameEN: 'Silver', hex: '#B9BCC0' },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// "redmean" weighted distance -- a cheap approximation of perceptual colour
// difference that's noticeably better than plain Euclidean RGB distance
// for almost no extra cost, so a hex close to "Vermelho" doesn't get
// mismatched to "Rosa Choque".
function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

function nearestColorName(hex: string): { namePT: string; nameEN: string } | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  let best: (typeof NAMED_COLOR_SWATCHES)[number] | undefined;
  let bestDistance = Infinity;
  for (const entry of NAMED_COLOR_SWATCHES) {
    const distance = colorDistance(hex, entry.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return best ? { namePT: best.namePT, nameEN: best.nameEN } : undefined;
}

/** Suggests a bilingual name for a hex, or a joined "A & B" name for a
 * two-tone combination (hex + hex2). Returns undefined if hex isn't a
 * valid 6-digit colour yet (e.g. mid-typing). */
export function suggestColorName(hex: string, hex2?: string): { namePT: string; nameEN: string } | undefined {
  const first = nearestColorName(hex);
  if (!first) return undefined;
  if (!hex2) return first;
  const second = nearestColorName(hex2);
  if (!second || second.namePT === first.namePT) return first;
  return { namePT: `${first.namePT} & ${second.namePT}`, nameEN: `${first.nameEN} & ${second.nameEN}` };
}
