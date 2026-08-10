import { useEffect, useState } from 'react';
import { C, F, pickBilingual } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchLegalContent, type LegalContent } from '../../lib/api';

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

  return (
    <div className="ump-form-width" style={{ padding: '40px 20px 56px', textAlign: 'left' }}>
      <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, margin: '0 0 24px', textAlign: 'center' }}>
        {heading}
      </h1>
      {loading ? (
        <div role="status" style={{ textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
          {loadingNotice}
        </div>
      ) : text ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {text.split(/\n{2,}/).map((paragraph, i) => (
            <p key={i} style={{ fontSize: 13, color: C.ink, lineHeight: 1.75, margin: 0 }}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <div role="status" style={{ textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
          {pendingNotice}
        </div>
      )}
    </div>
  );
}
