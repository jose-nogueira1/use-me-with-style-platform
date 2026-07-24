import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';

// Real client-provided brand story, wired in 2026-07-24 (JOS-64 follow-up).
// Replaces the interim launch copy approved 2026-07-16.
//
// Photo layout, revised same day per feedback ("don't like image-right/
// text-left, figure out another structure"): rather than a full-bleed
// banner or a side-by-side split, the portrait is a small centered framed
// card that overlaps the bottom of the hero band -- a "signature photo"
// treatment instead of an editorial two-column layout. The source image
// (an Instagram screenshot) had its UI chrome cropped off and its grey
// studio backdrop swapped for the brand cream (matches C.heroBg) via a
// GrabCut cutout, so it reads as an intentional brand asset.
const PHOTO_SIZE = 220;
const VALUES: { titleKey: string; bodyKey: string; tone: ProductTone }[] = [
  { titleKey: 'aboutValue1Title', bodyKey: 'aboutValue1Body', tone: 'gold' },
  { titleKey: 'aboutValue2Title', bodyKey: 'aboutValue2Body', tone: 'rose' },
  { titleKey: 'aboutValue3Title', bodyKey: 'aboutValue3Body', tone: 'blue' },
];

export function About() {
  const { lang } = useApp();

  return (
    <div>
      <div style={{ background: C.heroBg, color: C.heroText, padding: '40px 0 32px' }}>
        <div className="ump-content-width ump-narrow" style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.heroAccent, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>
            Use Me With Style
          </div>
          <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            {t('aboutTitle', lang)}
          </div>
          <div style={{ fontSize: 14, color: C.heroSubtitle, lineHeight: 1.7 }}>{t('aboutIntro', lang)}</div>
        </div>
      </div>

      <div className="ump-content-width ump-narrow" style={{ padding: '0 20px', textAlign: 'center', marginTop: -56 }}>
        <div
          style={{
            display: 'inline-block',
            padding: 6,
            borderRadius: '50%',
            background: `linear-gradient(160deg, ${C.champagne}, ${C.gold})`,
            boxShadow: '0 12px 28px rgba(5,5,5,0.18)',
          }}
        >
          <img
            src="/brand/about-photo.jpg"
            alt="Use Me With Style"
            style={{
              display: 'block',
              width: PHOTO_SIZE,
              height: PHOTO_SIZE,
              objectFit: 'cover',
              objectPosition: 'top center',
              borderRadius: '50%',
              border: `4px solid ${C.paper}`,
            }}
          />
        </div>
      </div>

      <div className="ump-content-width ump-narrow" style={{ padding: '24px 20px 32px' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
          {t('aboutMissionTitle', lang)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {t('aboutMissionBody', lang)
            .split(/\n{2,}/)
            .map((paragraph, i) => (
              <p key={i} style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, margin: 0 }}>
                {paragraph}
              </p>
            ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>
          {t('aboutValuesTitle', lang)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
          {VALUES.map((v) => (
            <div key={v.titleKey} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                <ProductPhoto tone={v.tone} radius={10} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 3 }}>{t(v.titleKey, lang)}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{t(v.bodyKey, lang)}</div>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/catalogo"
          style={{
            display: 'inline-block',
            padding: '13px 22px',
            background: C.black,
            color: C.onDarkGold,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          {t('aboutCta', lang)}
        </Link>
      </div>
    </div>
  );
}
