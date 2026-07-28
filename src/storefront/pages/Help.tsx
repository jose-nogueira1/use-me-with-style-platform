import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, F, t, pickBilingual } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchMarketSettings, submitContactMessage, type MarketSettings } from '../../lib/api';

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
// field is still empty in the admin) rather than showing nothing. (See
// pickBilingual in theme/i18n.ts -- extracted there 2026-07-24 once the
// Privacy Policy / Terms pages needed the same logic.)

// Collapsed-by-default accordion (added 2026-07-24 per feedback -- these
// three policy blocks were previously always-expanded static text, which
// made the page long). Each section toggles independently rather than
// closing its siblings, since there's no strong reason a customer reading
// the shipping info would want the returns policy to snap shut.
function AccordionSection({
  heading,
  text,
  loading,
  open,
  onToggle,
}: {
  heading: string;
  text: string | null;
  loading: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  if (!loading && !text) return null;
  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${C.rule}` }}>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 0',
          background: 'none',
          border: 'none',
          cursor: loading ? 'default' : 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: F.display, fontSize: 15, color: C.ink, fontWeight: 800 }}>{heading}</span>
        {!loading && (
          <ChevronDown
            size={18}
            color={C.inkSoft}
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        )}
      </button>
      {open && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20, textAlign: 'left' }}>
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

const inputStyle = {
  padding: '10px 12px',
  fontSize: 13,
  border: `1px solid ${C.rule}`,
  borderRadius: 6,
  background: C.paper,
  fontFamily: 'inherit',
} as const;

export function Help() {
  const { lang, market } = useApp();
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSendState('sending');
    try {
      await submitContactMessage({ name: contactName.trim(), email: contactEmail.trim(), message: contactMessage.trim() });
      setSendState('sent');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (err) {
      console.error('Contact form submit failed', err);
      setSendState('error');
    }
  };

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
    <div className="ump-form-width" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: F.display, fontSize: 22, color: C.ink, fontWeight: 800, marginBottom: 10 }}>{t('needAHand', lang)}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        {t('helpBody', lang)}
      </div>
      <a
        href="https://wa.me/244933617878"
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

      <div style={{ marginTop: 20 }}>
        <AccordionSection
          heading={t('businessHoursHeading', lang)}
          text={hoursText}
          loading={loading}
          open={openSections.has('hours')}
          onToggle={() => toggleSection('hours')}
        />
        <AccordionSection
          heading={t('shippingHeading', lang)}
          text={shippingText}
          loading={loading}
          open={openSections.has('shipping')}
          onToggle={() => toggleSection('shipping')}
        />
        <AccordionSection
          heading={t('returnsPolicyHeading', lang)}
          text={returnsText}
          loading={loading}
          open={openSections.has('returns')}
          onToggle={() => toggleSection('returns')}
        />
      </div>
      {!loading && !returnsText && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.rule}`, fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>
          {t('returnsPolicyUnavailable', lang)}
        </div>
      )}

      <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${C.rule}`, textAlign: 'left' }}>
        <div style={{ fontFamily: F.display, fontSize: 16, color: C.ink, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>
          {t('emailUsHeading', lang)}
        </div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 16, textAlign: 'center' }}>
          {t('emailUsBody', lang)}
        </div>
        <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t('contactNamePlaceholder', lang)}
            required
            style={inputStyle}
          />
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('contactEmailPlaceholder', lang)}
            type="email"
            required
            style={inputStyle}
          />
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder={t('contactMessagePlaceholder', lang)}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button
            type="submit"
            disabled={sendState === 'sending'}
            style={{
              padding: 12,
              background: C.black,
              color: C.onDarkGold,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderRadius: 8,
              border: 'none',
              cursor: sendState === 'sending' ? 'default' : 'pointer',
            }}
          >
            {sendState === 'sending' ? '…' : t('sendMessage', lang)}
          </button>
        </form>
        {sendState === 'sent' && (
          <div role="status" style={{ marginTop: 12, fontSize: 12.5, color: C.successText, textAlign: 'center' }}>
            {t('contactMessageSent', lang)}
          </div>
        )}
        {sendState === 'error' && (
          <div role="alert" style={{ marginTop: 12, fontSize: 12.5, color: '#A6483A', textAlign: 'center' }}>
            {t('contactMessageFailed', lang)}
          </div>
        )}
      </div>
    </div>
  );
}
