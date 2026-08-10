import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchStorefrontContent, type StorefrontContent } from '../../lib/api';
import { Seo } from '../../lib/seo';
import { normalizeStorefrontContent } from '../../lib/storefrontContent';

export function About() {
  const { lang } = useApp();
  const [content, setContent] = useState<StorefrontContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStorefrontContent()
      .then((value) => {
        if (!cancelled) setContent(value);
      })
      .catch(() => {
        /* keep the complete local fallback below */
      });
    return () => { cancelled = true; };
  }, []);

  const copy = normalizeStorefrontContent(content);
  const localized = (pt: string, en: string) => lang === 'en' ? en : pt;
  const story = localized(copy.aboutStoryBodyPT, copy.aboutStoryBodyEN);
  const values = copy.aboutValues.filter((value) => value.enabled !== false);

  return (
    <div>
      <Seo
        title={localized(copy.aboutSeoTitlePT, copy.aboutSeoTitleEN)}
        description={localized(copy.aboutSeoDescriptionPT, copy.aboutSeoDescriptionEN)}
      />
      <header style={{ background: C.heroBg, color: C.heroText, padding: '48px 0 40px' }}>
        <div className="ump-form-width" style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.heroAccent, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>
            {localized(copy.aboutEyebrowPT, copy.aboutEyebrowEN)}
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 34, fontWeight: 800, lineHeight: 1.15, margin: '0 0 18px' }}>
            {localized(copy.aboutTitlePT, copy.aboutTitleEN)}
          </h1>
          <p style={{ maxWidth: 680, fontSize: 15, color: C.heroSubtitle, lineHeight: 1.75, margin: 0 }}>
            {localized(copy.aboutIntroPT, copy.aboutIntroEN)}
          </p>
        </div>
      </header>

      <main className="ump-form-width" style={{ padding: '40px 20px 56px' }}>
        <section aria-labelledby="about-story-title" style={{ marginBottom: 42 }}>
          <SectionLabel id="about-story-title">{localized(copy.aboutStoryTitlePT, copy.aboutStoryTitleEN)}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {story.split(/\n{2,}/).filter(Boolean).map((paragraph) => (
              <p key={paragraph} style={{ fontSize: 14, color: C.ink, lineHeight: 1.8, margin: 0 }}>{paragraph}</p>
            ))}
          </div>
        </section>

        {values.length > 0 && (
          <section aria-labelledby="about-values-title" style={{ marginBottom: 42 }}>
            <SectionLabel id="about-values-title">{localized(copy.aboutValuesTitlePT, copy.aboutValuesTitleEN)}</SectionLabel>
            <div className="ump-admin-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {values.map((value, index) => (
                <article key={value.id ?? `${value.titlePT}-${index}`} style={{ border: `1px solid ${C.ruleLight}`, background: C.subtleBg, borderRadius: 10, padding: 20 }}>
                  <div aria-hidden="true" style={{ color: C.goldDeep, fontFamily: F.display, fontSize: 22, fontWeight: 800, marginBottom: 14 }}>{String(index + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: '0 0 7px' }}>{localized(value.titlePT, value.titleEN)}</h3>
                  <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>{localized(value.bodyPT, value.bodyEN)}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="about-presence-title" style={{ marginBottom: 38 }}>
          <SectionLabel id="about-presence-title">{localized(copy.aboutPresenceTitlePT, copy.aboutPresenceTitleEN)}</SectionLabel>
          <div className="ump-admin-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <PresenceCard
              market="AO"
              title={localized(copy.aboutAngolaTitlePT, copy.aboutAngolaTitleEN)}
              body={localized(copy.aboutAngolaBodyPT, copy.aboutAngolaBodyEN)}
            />
            <PresenceCard
              market="PT"
              title={localized(copy.aboutPortugalTitlePT, copy.aboutPortugalTitleEN)}
              body={localized(copy.aboutPortugalBodyPT, copy.aboutPortugalBodyEN)}
            />
          </div>
        </section>

        <Link to="/catalogo" style={{ display: 'inline-block', padding: '13px 22px', background: C.ctaBg, border: `1px solid ${C.ctaBorder}`, color: C.onDarkGold, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 8, textDecoration: 'none' }}>
          {localized(copy.aboutCtaLabelPT, copy.aboutCtaLabelEN)}
        </Link>
      </main>
    </div>
  );
}

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} style={{ fontFamily: F.display, fontSize: 21, color: C.ink, margin: '0 0 18px' }}>{children}</h2>;
}

function PresenceCard({ market, title, body }: { market: 'AO' | 'PT'; title: string; body: string }) {
  return (
    <article style={{ border: `1px solid ${C.ruleLight}`, borderRadius: 10, padding: 20, background: C.paper }}>
      <div style={{ color: C.goldDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, marginBottom: 8 }}>{market}</div>
      <h3 style={{ fontFamily: F.display, color: C.ink, fontSize: 18, margin: '0 0 10px' }}>{title}</h3>
      <p style={{ color: C.inkSoft, fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>{body}</p>
    </article>
  );
}
