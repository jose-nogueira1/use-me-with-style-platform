import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchCategories, fetchSizeGuides, type ApiCategory, type ApiSizeGuide } from '../../lib/api';
import { Seo } from '../../lib/seo';
import { publicSizeGuideName, sizeGuideRows, usableSizeGuides } from '../../lib/sizeGuide';
import { SizeGuideTable } from '../components/SizeGuideTable';

export function SizeGuide() {
  const { lang } = useApp();
  const [guides, setGuides] = useState<ApiSizeGuide[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSizeGuides(), fetchCategories().catch(() => [] as ApiCategory[])])
      .then(([nextGuides, nextCategories]) => {
        if (!cancelled) {
          setGuides(usableSizeGuides(nextGuides));
          setCategories(nextCategories);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const title = lang === 'pt' ? 'Guia de tamanhos | Use Me With Style' : 'Size guide | Use Me With Style';
  const description = lang === 'pt'
    ? 'Consulte o guia de tamanhos de leggings, tops, vestidos e conjuntos Use Me With Style e compare busto, cintura e anca em centímetros.'
    : 'Use our size guide for leggings, tops, dresses and sets, and compare bust, waist and hip measurements in centimetres.';

  return (
    <div className="ump-form-width" style={{ padding: '40px 20px 56px' }}>
      <Seo title={title} description={description} />
      <header style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Use Me With Style</div>
        <h1 style={{ fontFamily: F.display, fontSize: 30, lineHeight: 1.2, color: C.ink, margin: 0 }}>{lang === 'pt' ? 'Guia de tamanhos' : 'Size guide'}</h1>
        <p style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.7, margin: '14px auto 0', maxWidth: 570 }}>
          {lang === 'pt'
            ? 'Encontre o tamanho certo para leggings, tops, vestidos e conjuntos. Tire as suas medidas sem apertar a fita e compare-as, em centímetros, com a tabela da categoria da peça.'
            : 'Find the right size for leggings, tops, dresses and sets. Take your measurements without pulling the tape tight, then compare them in centimetres with the chart for your item category.'}
        </p>
      </header>

      <section aria-labelledby="how-to-measure" style={{ background: C.subtleBg, borderRadius: 10, padding: 20, marginBottom: 28 }}>
        <h2 id="how-to-measure" style={{ fontFamily: F.display, color: C.ink, fontSize: 19, margin: '0 0 12px' }}>{lang === 'pt' ? 'Como medir' : 'How to measure'}</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.inkSoft, fontSize: 12.5, lineHeight: 1.75 }}>
          <li><strong style={{ color: C.ink }}>{lang === 'pt' ? 'Busto:' : 'Bust:'}</strong> {lang === 'pt' ? 'meça à volta da parte mais larga do peito.' : 'measure around the fullest part of your chest.'}</li>
          <li><strong style={{ color: C.ink }}>{lang === 'pt' ? 'Cintura:' : 'Waist:'}</strong> {lang === 'pt' ? 'meça à volta da parte mais estreita do tronco.' : 'measure around the narrowest part of your torso.'}</li>
          <li><strong style={{ color: C.ink }}>{lang === 'pt' ? 'Anca:' : 'Hip:'}</strong> {lang === 'pt' ? 'meça à volta da parte mais larga das ancas.' : 'measure around the fullest part of your hips.'}</li>
          <li><strong style={{ color: C.ink }}>{lang === 'pt' ? 'Comprimento:' : 'Length:'}</strong> {lang === 'pt' ? 'compare com o comprimento indicado para a peça; o ponto inicial varia conforme o tipo de produto.' : 'compare with the garment length shown; the starting point varies by product type.'}</li>
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
        {lang === 'pt' ? 'A tabela associada à página de cada produto é sempre a referência principal. Entre dois tamanhos ou ainda com dúvidas?' : 'The chart assigned to each product page is always the primary reference. Between sizes or still unsure?'}{' '}
        <a href="mailto:support@usemewithstyle.shop" style={{ color: C.goldDeep, fontWeight: 800 }}>{lang === 'pt' ? 'Fale connosco' : 'Contact us'}</a>.{' '}
        <Link to="/catalogo" style={{ color: C.goldDeep, fontWeight: 800 }}>{lang === 'pt' ? 'Explorar o catálogo' : 'Browse the catalogue'}</Link>
      </aside>
    </div>
  );
}
