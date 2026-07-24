import { useEffect, useState } from 'react';
import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchMarketSettings } from '../../lib/api';

// Minimal Phase 1 placeholder -- the Figma inventory names "Help" as a
// bottom-nav destination but doesn't design its content in the high-fidelity
// screens fetched so far. Points customers to WhatsApp, matching the
// messaging automation already live (see JOS-58).
//
// Returns & exchanges policy (JOS-64, added 2026-07-23, bilingual
// 2026-07-24): pulled from MarketSettings rather than hardcoded, since
// Angola and Portugal/EU have materially different legal terms (48h
// exchange-only vs. 14-day statutory withdrawal with refund). PT is the
// client-provided legal text; EN is our translation of it -- selected by
// the storefront's language toggle like everything else, falling back to
// whichever one is actually filled in (e.g. if the EN field is still empty
// in the admin) rather than showing nothing.
export function Help() {
  const { lang, market } = useApp();
  const [policyText, setPolicyText] = useState<string | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMarketSettings()
      .then((settings) => {
        if (cancelled) return;
        const pt = (market === 'AO' ? settings.angolaReturnsPolicyTextPT : settings.portugalReturnsPolicyTextPT)?.trim();
        const en = (market === 'AO' ? settings.angolaReturnsPolicyTextEN : settings.portugalReturnsPolicyTextEN)?.trim();
        const preferred = lang === 'en' ? en : pt;
        setPolicyText(preferred || en || pt || null);
      })
      .catch(() => {
        if (!cancelled) setPolicyText(null);
      })
      .finally(() => {
        if (!cancelled) setPolicyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market, lang]);

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

      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${C.rule}`, textAlign: 'left' }}>
        <div style={{ fontFamily: F.display, fontSize: 16, color: C.ink, fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>
          {t('returnsPolicyHeading', lang)}
        </div>
        {policyLoading ? (
          <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>{t('returnsPolicyLoading', lang)}</div>
        ) : policyText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {policyText.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>{t('returnsPolicyUnavailable', lang)}</div>
        )}
      </div>
    </div>
  );
}
