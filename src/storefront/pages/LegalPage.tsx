import { useEffect, useState } from 'react';
import { C, F, pickBilingual } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchLegalContent, type LegalContent } from '../../lib/api';
import { Link } from 'react-router-dom';

// Shared renderer for Privacy Policy and Terms & Conditions (added
// 2026-07-24, user request) -- same "fetch once, split on blank lines"
// pattern as Help.tsx's policy sections, just as a full page instead of an
// accordion item, since these are read top-to-bottom rather than looked up.
//
// IMPORTANT: the seeded text for both pages is an AI-drafted generic
// template, not client-provided or lawyer-reviewed copy (unlike the returns
// policy / shipping info, which are the client's own words). See the
// comment in cms/src/globals/LegalContent.ts and scripts/seed.ts.
type LegalPageProps = {
  heading: string;
  pendingNotice: string;
  loadingNotice: string;
  getTextPT: (content: LegalContent) => string | undefined;
  getTextEN: (content: LegalContent) => string | undefined;
};

export function LegalPage({ heading, pendingNotice, loadingNotice, getTextPT, getTextEN }: LegalPageProps) {
  const { lang } = useApp();
  const [content, setContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLegalContent()
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch(() => {
        if (!cancelled) setContent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const text = content ? pickBilingual(getTextPT(content), getTextEN(content), lang) : null;
  const sections = (text ?? '').split(/\n{2,}/).map((paragraph) => {
    const colon = paragraph.indexOf(':');
    if (colon > 0 && colon < 100) return { heading: paragraph.slice(0, colon).trim(), body: paragraph.slice(colon + 1).trim() };
    const numbered = paragraph.match(/^(\d+[.)]\s+[^.]{2,80})\.\s+([\s\S]+)$/);
    return numbered ? { heading: numbered[1], body: numbered[2] } : { heading: null, body: paragraph };
  });

  return (
    <article className="ump-reading-width" style={{ padding: '40px 20px 56px', textAlign: 'left' }}>
      <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, margin: '0 0 24px', textAlign: 'center' }}>
        {heading}
      </h1>
      {loading ? (
        <div role="status" style={{ textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
          {loadingNotice}
        </div>
      ) : text ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map((section, i) => (
            <section key={i}>
              {section.heading && <h2 style={{ fontFamily: F.display, fontSize: 18, color: C.ink, margin: '8px 0 8px' }}>{section.heading}</h2>}
              {section.body && <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.75, margin: 0 }}>{section.body}</p>}
            </section>
          ))}
          <nav aria-label={lang === 'pt' ? 'Informação relacionada' : 'Related information'} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', paddingTop: 16, borderTop: `1px solid ${C.ruleLight}`, fontSize: 13, fontWeight: 750, color: C.goldDeep }}>
            <Link to="/ajuda">{lang === 'pt' ? 'Contactar o apoio' : 'Contact support'}</Link>
            <Link to="/politica-privacidade">{lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}</Link>
            <Link to="/termos-condicoes">{lang === 'pt' ? 'Termos e Condições' : 'Terms and Conditions'}</Link>
          </nav>
        </div>
      ) : (
        <div role="status" style={{ textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
          {pendingNotice}
        </div>
      )}
    </article>
  );
}
