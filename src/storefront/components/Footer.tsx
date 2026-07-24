import { Link } from 'react-router-dom';
import { MessageCircle, FileText } from 'lucide-react';
import { C, t, type Lang } from '../../theme';
import { useApp, type Market } from '../../state/AppContext';
import wordmarkBlack from '../../assets/brand/wordmark-black.png';
import wordmarkWhite from '../../assets/brand/wordmark-white.png';
import { clearAnalyticsConsent } from '../../lib/analyticsConsent';

// Site-wide footer, rendered once from StorefrontLayout so it appears on
// every storefront page -- previously the only "footer" was a two-line
// tagline baked into Home.tsx alone. The WhatsApp temporarily routes to the
// developer's number until the client business account is ready for
// handoff.
//
// Legal links (added 2026-07-24, user request): Privacy Policy and Terms &
// Conditions link to real pages now (/politica-privacidade,
// /termos-condicoes -- see LegalPage.tsx). Portugal additionally requires a
// visible, highlighted link to the electronic complaints book
// (livroreclamacoes.pt) for any business selling online -- Decreto-Lei
// 156/2005, mandatory since 2021, fines up to EUR15,000 for non-compliance.
// That's a market-specific legal obligation, not a design choice, so it only
// renders when market === 'PT'. Links to the general portal for now; swap in
// the business's specific operator URL once registered at
// livroreclamacoes.pt/Operador/RegistoOperadores.
const SHOP_LINKS = [
  { to: '/catalogo?cat=new', labelKey: 'newArrivalsNav' },
  { to: '/catalogo?cat=vestidos', labelKey: 'dresses' },
  { to: '/catalogo?cat=tops', labelKey: 'tops' },
  { to: '/catalogo?cat=leggings', labelKey: 'leggings' },
  { to: '/catalogo?cat=conjuntos', labelKey: 'sets' },
];

const SUPPORT_LINKS = [
  { to: '/conta', labelKey: 'orderLookupNav' },
  { to: '/ajuda', labelKey: 'navHelp' },
  { to: '/carrinho', labelKey: 'cart' },
];

export function Footer() {
  const { lang, market, setMarket, themeMode } = useApp();
  const year = new Date().getFullYear();
  const logoSrc = themeMode === 'dark' ? wordmarkWhite : wordmarkBlack;

  return (
    <footer className="ump-footer" style={{ background: C.subtleBg, borderTop: `1px solid ${C.ruleLight}` }}>
      <div className="ump-content-width ump-footer-grid">
        <div className="ump-footer-col">
          <img src={logoSrc} alt="Use Me With Style" style={{ height: 34, width: 'auto', marginBottom: 14 }} />
          <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, maxWidth: 260 }}>{t('footerAbout', lang)}</div>
          <a
            href="https://wa.me/244939615501"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 16,
              padding: '9px 14px',
              borderRadius: 8,
              background: C.paper,
              border: `1px solid ${C.rule}`,
              color: C.ink,
              fontSize: 11,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={14} color={C.goldDeep} />
            {t('chatOnWhatsapp', lang)}
          </a>
        </div>

        <FooterCol heading={t('footerShopHeading', lang)} links={SHOP_LINKS} lang={lang} />
        <FooterCol heading={t('footerSupportHeading', lang)} links={SUPPORT_LINKS} lang={lang} />

        <div className="ump-footer-col">
          <FooterHeading>{t('footerInfoHeading', lang)}</FooterHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <Link to="/sobre" style={{ display: 'block', color: C.ink, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
              {t('aboutNav', lang)}
            </Link>
            <Link to="/politica-privacidade" style={{ display: 'block', color: C.ink, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
              {t('privacyPolicyNav', lang)}
            </Link>
            <Link to="/termos-condicoes" style={{ display: 'block', color: C.ink, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
              {t('termsNav', lang)}
            </Link>
          </div>
          <InfoLine label={t('shipping', lang)} value={market === 'AO' ? t('localCourierDelivery', lang) : t('businessDays', lang)} />
          <InfoLine
            label={t('returns', lang)}
            value={t('footerReturnsNote', lang, { days: t(market === 'AO' ? 'fortyEightHours' : 'fourteenDays', lang) })}
            to="/ajuda"
          />
          <InfoLine label={t('prices', lang)} value={t(market === 'AO' ? 'footerPricesNoteAo' : 'footerPricesNotePt', lang)} />
          <div style={{ marginTop: 4, fontSize: 9, letterSpacing: 2, color: C.inkSoft, textTransform: 'uppercase' }}>
            {t(market === 'AO' ? 'angola' : 'portugal', lang)}
          </div>
        </div>
      </div>

      <div
        className="ump-content-width ump-footer-bottom"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div style={{ fontSize: 11, color: C.inkSoft }}>{t('copyrightNote', lang, { year })}</div>
        <button onClick={clearAnalyticsConsent} style={{ fontSize: 11, color: C.inkSoft, textDecoration: 'underline' }}>
          {lang === 'pt' ? 'Preferências de cookies' : 'Cookie preferences'}
        </button>
        {market === 'PT' && <ComplaintsBookLink lang={lang} />}
        <MarketSwitchLink market={market} setMarket={setMarket} lang={lang} />
      </div>
    </footer>
  );
}

// Explicit "go to the other store" link -- a single click straight to the
// sibling market's subdomain (via setMarket(), which does a real
// cross-origin navigation once the hostname is market-locked; see
// AppContext/lib/market.ts). Lives in the footer rather than the navbar
// (product decision): Angola and Portugal are separate storefronts, so this
// reads as "leave for the other site," not a quick in-page toggle.
function MarketSwitchLink({
  market,
  setMarket,
  lang,
}: {
  market: Market;
  setMarket: (m: Market) => void;
  lang: Lang;
}) {
  const other: Market = market === 'AO' ? 'PT' : 'AO';
  const label = t(other === 'AO' ? 'shopAngolaStore' : 'shopPortugalStore', lang);

  return (
    <button
      onClick={() => setMarket(other)}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 8,
        background: C.paper,
        border: `1px solid ${C.rule}`,
        color: C.ink,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      <span aria-hidden>{other === 'AO' ? '🇦🇴' : '🇵🇹'}</span>
      <span>{label}</span>
    </button>
  );
}

// Portugal's electronic complaints book requirement: "access to the book
// must be on the seller's website in a visible and highlighted form" -- so
// this gets the same bordered-badge treatment as the market-switch link
// next to it, not a plain text link buried in a list.
function ComplaintsBookLink({ lang }: { lang: Lang }) {
  return (
    <a
      href="https://www.livroreclamacoes.pt/Inicio/"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 8,
        background: C.paper,
        border: `1px solid ${C.rule}`,
        color: C.ink,
        fontSize: 11,
        fontWeight: 800,
        textDecoration: 'none',
      }}
    >
      <FileText size={13} color={C.goldDeep} />
      <span>{t('complaintsBookLabel', lang)}</span>
    </a>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function FooterCol({
  heading,
  links,
  lang,
}: {
  heading: string;
  links: { to: string; labelKey: string }[];
  lang: Lang;
}) {
  return (
    <div className="ump-footer-col">
      <FooterHeading>{heading}</FooterHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {links.map((l) => (
          <Link key={l.to + l.labelKey} to={l.to} style={{ fontSize: 13, color: C.ink, textDecoration: 'none' }}>
            {t(l.labelKey, lang)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoLine({ label, value, to }: { label: string; value: string; to?: string }) {
  if (!label) return null;
  const valueStyle = { fontSize: 12, color: C.ink, marginTop: 2, lineHeight: 1.4 };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {to ? (
        <Link to={to} style={{ ...valueStyle, textDecoration: 'underline', display: 'inline-block' }}>
          {value}
        </Link>
      ) : (
        <div style={valueStyle}>{value}</div>
      )}
    </div>
  );
}
