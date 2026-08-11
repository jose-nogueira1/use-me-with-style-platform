import wordmarkBlack from '../assets/brand/wordmark-black.png';
import wordmarkWhite from '../assets/brand/wordmark-white.png';

// Single source of truth for the "Use Me With Style" wordmark everywhere
// it appears (storefront header, footer, admin sidebar/mobile bar, admin
// login) -- added 2026-07-25 after user feedback that the logo looked bad
// across the site. Two concrete problems this fixes:
//
// 1. Inconsistency: every placement except the storefront's Home-page
//    header used the clean text-only wordmark-black/white.png. Home alone
//    swapped in wordmark-gold.png, a DIFFERENT asset that also bundles in
//    the dress-hanger icon and has visibly rougher, wobblier linework than
//    the clean black/white files -- so the brand mark literally changed
//    shape depending on what page you were on.
// 2. The gold version couldn't react to light/dark mode: it's a static
//    PNG baked to one fixed gold hue, while everything else in the Home
//    hero (eyebrow text, etc) uses the theme-reactive heroAccent token,
//    which deliberately flips to a darker gold in light mode and a paler
//    gold in dark mode for contrast. The static gold logo silently
//    mismatched that in whichever mode it wasn't tuned for.
//
// Fix: there is no clean gold-colored wordmark asset, so gold is
// synthesized from the clean black file via a CSS mask (masks use the
// alpha channel, so the fill color is free to be anything, including a
// CSS var that flips with theme) instead of ever loading wordmark-gold.png.
// This gives every placement the exact same crisp letterforms, just
// recolored -- true one-mark consistency using only existing artwork.
const WORDMARK_ASPECT = 700 / 315;

export function BrandLogo({
  tone,
  height,
  goldColor,
  className,
}: {
  tone: 'black' | 'white' | 'gold';
  height: number;
  /** Required when tone === 'gold'. Pass a theme token (C.heroAccent,
   * C.onDarkGold, ...) rather than a literal hex so the mark stays
   * correctly tuned for whichever surface/theme it sits on. */
  goldColor?: string;
  className?: string;
}) {
  if (tone === 'gold') {
    return (
      <span
        role="img"
        aria-label="Use Me With Style"
        className={className}
        style={{
          display: 'inline-block',
          height,
          width: height * WORDMARK_ASPECT,
          backgroundColor: goldColor,
          WebkitMaskImage: `url(${wordmarkBlack})`,
          maskImage: `url(${wordmarkBlack})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    );
  }
  return (
    <img
      src={tone === 'white' ? wordmarkWhite : wordmarkBlack}
      alt="Use Me With Style"
      height={height}
      width={Math.round(height * WORDMARK_ASPECT)}
      decoding="async"
      className={className}
      style={{ height, width: height * WORDMARK_ASPECT, display: 'block' }}
    />
  );
}
