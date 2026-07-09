import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { C, F, t, type Lang } from '../../theme';
import { useApp } from '../../state/AppContext';

// Site-wide footer, rendered once from StorefrontLayout so it appears on
// every storefront page -- previously the only "footer" was a two-line
// tagline baked into Home.tsx alone. Links only point at routes that
// actually exist in this app (no invented /privacy or /terms pages); the
// WhatsApp link reuses the same placeholder href as Help.tsx pending a real
// business number.
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
  const { lang } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="ump-footer" style={{ background: C.subtleBg, borderTop: `1px solid ${C.ruleLight}` }}>
      <div className="ump-content-width ump-footer-grid">
        <div className="ump-footer-col">
          <div style={{ fontFamily: F.sans, fontSize: 22, color: C.ink, lineHeight: 1 }}>Use Me</div>
          <div style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: C.goldDeep, marginTop: 4, marginBottom: 14, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            with style
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, maxWidth: 260 }}>{t('footerAbout', lang)}</div>
          <a
            href="https://wa.me/"
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
          <InfoLine label={t('shipping', lang)} value={t('footerShippingNote', lang, { pt: t('businessDays', lang), ao: t('manualCoordination', lang) })} />
          <InfoLine label={t('returns', lang)} value={t('footerReturnsNote', lang, { days: t('fourteenDays', lang) })} />
          <InfoLine label={t('prices', lang)} value={t('footerPricesNote', lang)} />
          <div style={{ marginTop: 4, fontSize: 9, letterSpacing: 2, color: C.inkSoft, textTransform: 'uppercase' }}>{t('footerMarkets', lang)}</div>
        </div>
      </div>

      <div className="ump-content-width ump-footer-bottom">
        <div style={{ fontSize: 11, color: C.inkSoft }}>{t('copyrightNote', lang, { year })}</div>
      </div>
    </footer>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!label) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.ink, marginTop: 2, lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}
