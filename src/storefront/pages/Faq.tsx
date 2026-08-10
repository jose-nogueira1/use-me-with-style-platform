import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchMarketSettings, fetchStorefrontContent, type MarketSettings, type StorefrontContent } from '../../lib/api';
import { buildFaqEntries, buildFaqStructuredData } from '../../lib/faqContent';
import { serializeJsonLd } from '../../lib/jsonLd';
import { Seo } from '../../lib/seo';
import { normalizeStorefrontContent } from '../../lib/storefrontContent';

export function Faq() {
  const { lang, market } = useApp();
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [content, setContent] = useState<StorefrontContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMarketSettings().then((value) => {
      if (!cancelled) setSettings(value);
    }).catch(() => {
      if (!cancelled) setSettings(null);
    });
    fetchStorefrontContent().then((value) => {
      if (!cancelled) setContent(value);
    }).catch(() => {
      if (!cancelled) setContent(null);
    });
    return () => { cancelled = true; };
  }, []);

  const entries = useMemo(() => buildFaqEntries(market, lang, settings, content), [content, lang, market, settings]);
  const structuredData = useMemo(() => buildFaqStructuredData(entries), [entries]);
  const copy = normalizeStorefrontContent(content);
  const title = lang === 'pt' ? copy.faqSeoTitlePT : copy.faqSeoTitleEN;
  const description = lang === 'pt' ? copy.faqSeoDescriptionPT : copy.faqSeoDescriptionEN;

  return (
    <div className="ump-form-width" style={{ padding: '40px 20px 56px' }}>
      <Seo title={title} description={description} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />

      <header style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          {lang === 'pt' ? (market === 'AO' ? 'Loja Angola' : 'Loja Portugal') : (market === 'AO' ? 'Angola store' : 'Portugal store')}
        </div>
        <h1 style={{ fontFamily: F.display, fontSize: 28, lineHeight: 1.2, color: C.ink, fontWeight: 800, margin: 0 }}>
          {lang === 'pt' ? copy.faqTitlePT : copy.faqTitleEN}
        </h1>
        <p style={{ maxWidth: 520, margin: '12px auto 0', color: C.inkSoft, fontSize: 13, lineHeight: 1.65 }}>
          {lang === 'pt' ? copy.faqIntroPT : copy.faqIntroEN}
        </p>
      </header>

      <section aria-label={lang === 'pt' ? 'Respostas a perguntas frequentes' : 'Frequently asked question answers'} style={{ borderTop: `1px solid ${C.rule}` }}>
        {entries.map((entry, index) => (
          <details key={entry.question} open={index === 0} style={{ borderBottom: `1px solid ${C.rule}` }}>
            <summary style={{ padding: '18px 4px', color: C.ink, fontFamily: F.display, fontSize: 15, fontWeight: 800, lineHeight: 1.45, cursor: 'pointer' }}>
              {entry.question}
            </summary>
            <div style={{ padding: '0 4px 20px', color: C.inkSoft, fontSize: 12.5, lineHeight: 1.75 }}>
              <p style={{ margin: 0 }}>{entry.answer}</p>
              {entry.link && (
                <Link to={entry.link.to} style={{ display: 'inline-block', marginTop: 10, color: C.goldDeep, fontWeight: 800 }}>
                  {entry.link.label}
                </Link>
              )}
            </div>
          </details>
        ))}
      </section>

      <aside style={{ marginTop: 28, padding: 18, borderRadius: 8, background: C.subtleBg, textAlign: 'center', color: C.inkSoft, fontSize: 12.5, lineHeight: 1.65 }}>
        {lang === 'pt' ? copy.faqSupportPromptPT : copy.faqSupportPromptEN}{' '}
        <Link to="/ajuda" style={{ color: C.goldDeep, fontWeight: 800 }}>
          {lang === 'pt' ? copy.faqSupportLabelPT : copy.faqSupportLabelEN}
        </Link>
      </aside>
    </div>
  );
}
