import { C, F, t } from '../../theme';
import { useApp } from '../../state/AppContext';

// Minimal Phase 1 placeholder -- the Figma inventory names "Help" as a
// bottom-nav destination but doesn't design its content in the high-fidelity
// screens fetched so far. Points customers to WhatsApp, matching the
// messaging automation already live (see JOS-58).
export function Help() {
  const { lang } = useApp();
  return (
    <div className="ump-narrow" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, marginBottom: 10 }}>{t('needAHand', lang)}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        {t('helpBody', lang)}
      </div>
      <a
        href="https://wa.me/"
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
    </div>
  );
}
