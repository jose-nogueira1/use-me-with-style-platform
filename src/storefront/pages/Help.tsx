import { useEffect, useState } from 'react';
import { C, F, t, type Lang } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchMarketSettings, type MarketSettings } from '../../lib/api';

// Minimal Phase 1 placeholder -- the Figma inventory names "Help" as a
// bottom-nav destination but doesn't design its content in the high-fidelity
// screens fetched so far. Points customers to WhatsApp, matching the
// messaging automation already live (see JOS-58).
//
// Business hours, shipping & delivery, and returns & exchanges policy (JOS-64,
// added 2026-07-23/24): pulled from MarketSettings rather than hardcoded, all
// bilingual PT/EN -- PT is client-provided copy, EN is our translation of it.
// Each section picks the field matching the storefront's language toggle,
// falling back to whichever language is actually filled in (e.g. if an EN
// field is still empty in the admin) rather than showing nothing.
function pickBilingual(pt: string | undefined, en: string | undefined, lang: Lang): string | null {
  const ptTrimmed = pt?.trim();
  const enTrimmed = en?.trim();
  const preferred = lang === 'en' ? enTrimmed : ptTrimmed;
  return preferred || enTrimmed || ptTrimmed || null;
}

function InfoSection({ heading, text, loading }: { heading: string; text: string | null; loading: boolean }) {
  if (!loading && !text) return null;
  return (
    <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.rule}`, textAlign: 'left' }}>
      <div style={{ fontFamily: F.display, fontSize: 16, color: C.ink, fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>
        {heading}
      </div>
      {loading ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(text ?? '').split(/\n{2,}/).map((paragraph, i) => (
            <p key={i} style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Help() {
  const { lang, market } = useApp();
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMarketSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hoursText = pickBilingual(settings?.businessHoursTextPT, settings?.businessHoursTextEN, lang);

  const marketShippingText =
    market === 'AO'
      ? pickBilingual(settings?.angolaShippingTextPT, settings?.angolaShippingTextEN, lang)
      : pickBilingual(settings?.portugalShippingTextPT, settings?.portugalShippingTextEN, lang);
  const internationalShippingText = pickBilingual(settings?.internationalShippingTextPT, settings?.internationalShippingTextEN, lang);
  const shippingText = [marketShippingText, internationalShippingText].filter(Boolean).join('\n\n') || null;

  const returnsText =
    market === 'AO'
      ? pickBilingual(settings?.angolaReturnsPolicyTextPT, settings?.angolaReturnsPolicyTextEN, lang)
      : pickBilingual(settings?.portugalReturnsPolicyTextPT, settings?.portugalReturnsPolicyTextEN, lang);

  return (
    <div className="ump-narrow" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, marginBottom: 10 }}>{t('needAHand', lang)}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        {t('helpBody', lang)}
      </div>
      <a
        href="https://wa.me/244939615501"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
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
        {t('chatOnWhatsapp', lang)}
      </a>

      <InfoSection heading={t('businessHoursHeading', lang)} text={hoursText} loading={loading} />
      <InfoSection heading={t('shippingHeading', lang)} text={shippingText} loading={loading} />
      <InfoSection heading={t('returnsPolicyHeading', lang)} text={returnsText} loading={loading} />
      {!loading && !returnsText && (
        <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.rule}`, fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>
          {t('returnsPolicyUnavailable', lang)}
        </div>
      )}
    </div>
  );
}
