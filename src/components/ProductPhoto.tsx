import { useState } from 'react';
import { C } from '../theme';
import type { ProductImage } from '../types/product';

// Replaces the old category-shaped silhouettes. The real Figma design uses
// one abstract "placeholder photo" treatment for every product regardless
// of category: a tone-colored background, a lighter "highlight" wash across
// the top, and a centered garment block with a repeating pinstripe overlay.
// Client media will eventually replace these placeholders (see CMS README).
export type ProductTone = 'gold' | 'rose' | 'sage' | 'dark' | 'blue';

const TONE_STYLES: Record<
  ProductTone,
  { bg: string; highlight: string; garment: string; stripe: string; stripeOpacity: number }
> = {
  gold: { bg: '#D0B165', highlight: '#EEE4D4', garment: C.gold, stripe: C.champagne, stripeOpacity: 0.36 },
  rose: { bg: '#B8796E', highlight: '#EFE0D8', garment: C.rose, stripe: C.champagne, stripeOpacity: 0.36 },
  sage: { bg: '#9BA28F', highlight: '#E9E1D1', garment: C.sage, stripe: C.champagne, stripeOpacity: 0.36 },
  dark: { bg: C.photoDarkBg, highlight: C.ink, garment: C.black, stripe: C.garmentStripeDark, stripeOpacity: 0.35 },
  blue: { bg: '#7A99A0', highlight: '#E2EBEC', garment: C.blue, stripe: C.champagne, stripeOpacity: 0.36 },
};

// Static design token colocated with the component that owns its meaning.
// eslint-disable-next-line react-refresh/only-export-components
export const TONE_CYCLE: ProductTone[] = ['gold', 'rose', 'sage', 'dark', 'blue'];

export function ProductPhoto({
  tone,
  radius = 8,
  image,
  variant = 'full',
}: {
  tone: ProductTone;
  radius?: number;
  image?: ProductImage;
  variant?: 'full' | 'card' | 'thumbnail';
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl = variant === 'thumbnail'
    ? image?.thumbnailUrl || image?.cardUrl || image?.url
    : variant === 'card'
      ? image?.cardUrl || image?.url
      : image?.url;

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <img
        data-artwork
        src={imageUrl}
        alt={image?.alt || ''}
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(imageUrl)}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: radius }}
      />
    );
  }

  const s = TONE_STYLES[tone];
  return (
    // data-artwork (2026-07-30): marks this as imagery for the contrast
    // guard in e2e/helpers/contrast.ts. The placeholder is built from plain
    // background colours -- no <img>, no gradient, no <svg> -- so there is
    // nothing for the guard to detect heuristically, and anything painted on
    // top of it would otherwise be scored against the page colour behind it
    // instead of the artwork actually under it. Purely a test hook; it has
    // no styling or behavioural effect.
    <div data-artwork style={{ position: 'relative', width: '100%', height: '100%', background: s.bg, overflow: 'hidden', borderRadius: radius }}>
      <div style={{ position: 'absolute', inset: 0, height: '45%', background: s.highlight, opacity: 0.42 }} />
      <div
        style={{
          position: 'absolute',
          left: '36%',
          right: '36%',
          top: '20%',
          bottom: '20%',
          background: s.garment,
          borderRadius: 2,
        }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${36 + i * 5.6}%`,
            top: '20%',
            bottom: '20%',
            width: '2.8%',
            background: s.stripe,
            opacity: s.stripeOpacity,
          }}
        />
      ))}
    </div>
  );
}
