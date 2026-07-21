import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { C } from '../../theme';
import { ANALYTICS_CONSENT_EVENT, getAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from '../../lib/analyticsConsent';
import { trackPageView } from '../../lib/metaAnalytics';
import { publicEnv } from '../../config/env';
import { useApp } from '../../state/AppContext';

export function AnalyticsConsentManager() {
  const { lang } = useApp();
  const location = useLocation();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => getAnalyticsConsent());

  useEffect(() => {
    const sync = () => setConsent(getAnalyticsConsent());
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (consent === 'accepted') trackPageView();
  }, [consent, location.pathname, location.search]);

  if (!publicEnv.analyticsEnabled || consent !== null) return null;
  const choose = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <section aria-label={lang === 'pt' ? 'Preferências de cookies' : 'Cookie preferences'} style={{ position: 'fixed', zIndex: 100, left: 16, right: 16, bottom: 16, maxWidth: 560, margin: '0 auto', padding: 18, borderRadius: 10, background: C.paper, color: C.ink, border: `1px solid ${C.rule}`, boxShadow: '0 14px 40px rgba(0,0,0,.2)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{lang === 'pt' ? 'A sua privacidade' : 'Your privacy'}</div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: C.inkSoft }}>
        {lang === 'pt' ? 'Usamos cookies analíticos opcionais da Meta para medir visitas e compras e melhorar a loja. Pode recusar sem afetar a sua compra.' : 'We use optional Meta analytics cookies to measure visits and purchases and improve the shop. You can reject them without affecting your purchase.'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={() => choose('rejected')} style={{ padding: '10px 14px', border: `1px solid ${C.rule}`, borderRadius: 7, color: C.ink, fontWeight: 700 }}>{lang === 'pt' ? 'Recusar' : 'Reject'}</button>
        <button onClick={() => choose('accepted')} style={{ padding: '10px 14px', borderRadius: 7, background: C.black, color: C.onDarkGold, fontWeight: 800 }}>{lang === 'pt' ? 'Aceitar' : 'Accept'}</button>
      </div>
    </section>
  );
}
