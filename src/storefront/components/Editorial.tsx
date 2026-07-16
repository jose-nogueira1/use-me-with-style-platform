import { Link } from 'react-router-dom';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { ProductPhoto, type ProductTone } from '../../components/ProductPhoto';

// Homepage "Editorial" section (2026-07-10 addition). Static, hand-written
// cards -- there's no articles/CMS collection backing this yet, so each card
// links to a related in-app view (catalogue filter or a real product) rather
// than a standalone article page that doesn't exist. Swap CARDS for
// CMS-backed content later without touching the layout below.
const CARDS: { tagKey: string; titleKey: string; excerptKey: string; tone: ProductTone; to: string }[] = [
  { tagKey: 'editorial1Tag', titleKey: 'editorial1Title', excerptKey: 'editorial1Excerpt', tone: 'blue', to: '/catalogo?cat=leggings' },
  { tagKey: 'editorial2Tag', titleKey: 'editorial2Title', excerptKey: 'editorial2Excerpt', tone: 'sage', to: '/catalogo?cat=new' },
  { tagKey: 'editorial3Tag', titleKey: 'editorial3Title', excerptKey: 'editorial3Excerpt', tone: 'rose', to: '/produto/vestido-aurora' },
];

export function Editorial() {
  const { lang } = useApp();

  return (
    <div className="ump-content-width" style={{ padding: '28px 20px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontSize: 10, letterSpacing: 3, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
          {t('editorialHeading', lang)}
        </div>
        <Link to="/catalogo" style={{ fontSize: 11, color: C.goldDeep, fontWeight: 800, textDecoration: 'none' }}>
          {t('editorialViewAll', lang)} →
        </Link>
      </div>

      <div className="ump-editorial-grid">
        {CARDS.map((card) => (
          <Link
            key={card.titleKey}
            to={card.to}
            className="ump-hover-lift"
            style={{
              display: 'block',
              background: C.paper,
              border: `1px solid ${C.ruleLight}`,
              borderRadius: 10,
              overflow: 'hidden',
              textDecoration: 'none',
            }}
          >
            <div style={{ height: 150 }}>
              <ProductPhoto tone={card.tone} radius={0} />
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.5, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                {t(card.tagKey, lang)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.35, marginBottom: 6 }}>{t(card.titleKey, lang)}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{t(card.excerptKey, lang)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
