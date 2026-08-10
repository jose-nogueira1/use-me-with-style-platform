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
  priority = false,
}: {
  tone: ProductTone;
  radius?: number;
  image?: ProductImage;
  variant?: 'full' | 'card' | 'thumbnail';
  /** 2026-08-07 ("images taking a bit long to load"): the ONE above-the-fold
   * hero photo on a page (ProductDetail's main image) shouldn't be
   * `loading="lazy"` -- lazy defers a fetch until the browser decides the
   * image is about to enter the viewport, which is pure downside for
   * something that's already visible the instant the page paints. Every
   * other use of this component (grid cards, thumbnails, cart rows) is
   * correctly lazy by default. */
  priority?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  // 'full' still exists for callers that genuinely want the original
  // (e.g. a future zoom/lightbox), but variant='card' is what ProductDetail's
  // hero now requests: at a fixed ~440px display height, a 3000x3000
  // original (150KB+ and a much heavier decode) was pure waste over the
  // 600x800 "card" size Payload already generates for this exact purpose.
  const imageUrl = variant === 'thumbnail'
    ? image?.thumbnailUrl || image?.cardUrl || image?.url
    : variant === 'card'
      ? image?.cardUrl || image?.url
      : image?.url;
  // Last-resort accessibility/SEO guard. Product data normally arrives via
  // adaptApiProduct(), which builds a product/colour/category-specific alt;
  // this keeps direct callers and stale persisted data from ever rendering
  // the audit's former alt="" failure mode.
  const imageAlt = image?.alt?.trim() || 'Produto — Use Me With Style';

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <img
        data-artwork
        src={imageUrl}
        alt={imageAlt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onError={() => setFailedUrl(imageUrl)}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: radius }}
      />
    );
  }

  // Keep image fallbacks renderable even if stale persisted/UI data ever
  // supplies an unknown tone. ProductTone prevents this in typed callers,
  // while the runtime guard prevents one missing product image from taking
  // down the entire storefront through the app error boundary.
  const s = TONE_STYLES[tone] ?? TONE_STYLES.gold;
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
