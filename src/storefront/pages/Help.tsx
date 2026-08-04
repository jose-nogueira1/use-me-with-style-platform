import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, Search } from 'lucide-react';
import { C, F, t, pickBilingual } from '../../theme';
import { useApp } from '../../state/AppContext';
import { fetchMarketSettings, submitContactMessage, type MarketSettings } from '../../lib/api';

// Minimal Phase 1 placeholder -- the Figma inventory names "Help" as a
// bottom-nav destination but doesn't design its content in the high-fidelity
// screens fetched so far. Email is the official support channel; telephone
// details are collected only so the team can escalate outbound when needed.
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
  border: `1px solid ${C.fieldBorder}`,
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
  const [contactPhone, setContactPhone] = useState('');
  const [contactOrder, setContactOrder] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSendState('sending');
    try {
      await submitContactMessage({
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        orderNumber: contactOrder.trim(),
        message: contactMessage.trim(),
      });
      setSendState('sent');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactOrder('');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, textAlign: 'left' }}>
        <Link to="/conta" style={{ padding: 16, border: `1px solid ${C.rule}`, borderRadius: 8, background: C.paper, color: C.ink, textDecoration: 'none' }}>
          <Search size={18} color={C.goldDeep} />
          <div style={{ marginTop: 10, fontFamily: F.display, fontWeight: 800 }}>{t('orderHelpHeading', lang)}</div>
          <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.55, color: C.inkSoft }}>{t('orderHelpBody', lang)}</div>
        </Link>
        <a href="mailto:support@usemewithstyle.shop?subject=Order%20support%20%E2%80%94%20%5Border%20number%5D" style={{ padding: 16, border: `1px solid ${C.rule}`, borderRadius: 8, background: C.paper, color: C.ink, textDecoration: 'none' }}>
          <Mail size={18} color={C.goldDeep} />
          <div style={{ marginTop: 10, fontFamily: F.display, fontWeight: 800 }}>{t('supportEmailAction', lang)}</div>
          <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.55, color: C.inkSoft }}>support@usemewithstyle.shop</div>
        </a>
      </div>
      <div style={{ marginTop: 12, padding: 14, background: C.subtleBg, borderRadius: 8, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6 }}>
        {t('supportEmailGuidance', lang)}
      </div>

      <div style={{ marginTop: 20 }}>
        <AccordionSection
          heading={t('paymentHelpHeading', lang)}
          text={t('paymentHelpBody', lang)}
          loading={false}
          open={openSections.has('payment')}
          onToggle={() => toggleSection('payment')}
        />
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
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder={t('contactPhonePlaceholder', lang)}
            type="tel"
            required
            style={inputStyle}
          />
          <input
            value={contactOrder}
            onChange={(e) => setContactOrder(e.target.value)}
            placeholder={t('contactOrderPlaceholder', lang)}
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
              background: sendState === 'sending' ? C.disabledBg : C.ctaBg,
              color: sendState === 'sending' ? C.disabledFg : C.onDarkGold,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderRadius: 8,
              border: `1px solid ${sendState === 'sending' ? C.disabledBg : C.ctaBorder}`,
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
          <div role="alert" style={{ marginTop: 12, fontSize: 12.5, color: C.danger, textAlign: 'center' }}>
            {t('contactMessageFailed', lang)}
          </div>
        )}
      </div>
    </div>
  );
}
