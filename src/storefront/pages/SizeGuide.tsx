import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchCategories, fetchSizeGuides, fetchStorefrontContent, type ApiCategory, type ApiSizeGuide, type StorefrontContent } from '../../lib/api';
import { Seo } from '../../lib/seo';
import { publicSizeGuideName, sizeGuideRows, usableSizeGuides } from '../../lib/sizeGuide';
import { SizeGuideTable } from '../components/SizeGuideTable';
import { normalizeStorefrontContent } from '../../lib/storefrontContent';

export function SizeGuide() {
  const { lang } = useApp();
  const [guides, setGuides] = useState<ApiSizeGuide[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [content, setContent] = useState<StorefrontContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSizeGuides(), fetchCategories().catch(() => [] as ApiCategory[]), fetchStorefrontContent().catch(() => null)])
      .then(([nextGuides, nextCategories, nextContent]) => {
        if (!cancelled) {
          setGuides(usableSizeGuides(nextGuides));
          setCategories(nextCategories);
          setContent(nextContent);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const copy = normalizeStorefrontContent(content);
  const title = lang === 'pt' ? copy.sizeGuideSeoTitlePT : copy.sizeGuideSeoTitleEN;
  const description = lang === 'pt' ? copy.sizeGuideSeoDescriptionPT : copy.sizeGuideSeoDescriptionEN;
  const instructions = lang === 'pt'
    ? [copy.sizeGuideBustPT, copy.sizeGuideWaistPT, copy.sizeGuideHipPT, copy.sizeGuideLengthPT]
    : [copy.sizeGuideBustEN, copy.sizeGuideWaistEN, copy.sizeGuideHipEN, copy.sizeGuideLengthEN];

  return (
    <div className="ump-form-width" style={{ padding: '40px 20px 56px' }}>
      <Seo title={title} description={description} />
      <header style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Use Me With Style</div>
        <h1 style={{ fontFamily: F.display, fontSize: 30, lineHeight: 1.2, color: C.ink, margin: 0 }}>{lang === 'pt' ? copy.sizeGuideTitlePT : copy.sizeGuideTitleEN}</h1>
        <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.7, margin: '14px auto 0', maxWidth: 570 }}>
          {lang === 'pt' ? copy.sizeGuideIntroPT : copy.sizeGuideIntroEN}
        </p>
      </header>

      <section aria-labelledby="how-to-measure" style={{ background: C.subtleBg, borderRadius: 10, padding: 20, marginBottom: 28 }}>
        <h2 id="how-to-measure" style={{ fontFamily: F.display, color: C.ink, fontSize: 19, margin: '0 0 12px' }}>{lang === 'pt' ? copy.sizeGuideHowToTitlePT : copy.sizeGuideHowToTitleEN}</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.inkSoft, fontSize: 12.5, lineHeight: 1.75 }}>
          {instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
        </ul>
      </section>

      <section aria-label={lang === 'pt' ? 'Tabelas de tamanhos' : 'Size charts'} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {guides.map((guide) => (
          <article key={guide.id} data-size-guide style={{ border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: 20 }}>
            <h2 style={{ fontFamily: F.display, color: C.ink, fontSize: 19, margin: '0 0 8px' }}>{publicSizeGuideName(guide.name, categories, lang)}</h2>
            <SizeGuideTable rows={sizeGuideRows(guide.rows)} lang={lang} />
          </article>
        ))}
        {!loading && guides.length === 0 && (
          <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.7 }}>
            {lang === 'pt' ? 'As tabelas estão temporariamente indisponíveis. Contacte support@usemewithstyle.shop para aconselhamento.' : 'The charts are temporarily unavailable. Contact support@usemewithstyle.shop for advice.'}
          </p>
        )}
        {loading && <div role="status" style={{ color: C.inkSoft, textAlign: 'center' }}>…</div>}
      </section>

      <aside style={{ marginTop: 28, color: C.inkSoft, fontSize: 12.5, lineHeight: 1.7, textAlign: 'center' }}>
        {lang === 'pt' ? copy.sizeGuideClosingPT : copy.sizeGuideClosingEN}{' '}
        <a href="mailto:support@usemewithstyle.shop" style={{ color: C.goldDeep, fontWeight: 800 }}>{lang === 'pt' ? copy.sizeGuideSupportLabelPT : copy.sizeGuideSupportLabelEN}</a>.{' '}
        <Link to="/catalogo" style={{ color: C.goldDeep, fontWeight: 800 }}>{lang === 'pt' ? copy.sizeGuideCatalogLabelPT : copy.sizeGuideCatalogLabelEN}</Link>
      </aside>
    </div>
  );
}
