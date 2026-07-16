import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';

// About-page scaffold. It is deliberately not routed or linked yet because
// the client confirmed on 2026-07-16 that final About content is still
// outstanding and placeholder copy must not ship. Once approved copy and
// imagery are supplied, wire this page to /sobre and restore the footer link.
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

      <div className="ump-content-width ump-narrow" style={{ padding: '32px 20px' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
          {t('aboutMissionTitle', lang)}
        </div>
        <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, marginBottom: 32 }}>{t('aboutMissionBody', lang)}</div>

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
