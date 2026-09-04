import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, HelpCircle, Menu, Moon, Package, Search, ShoppingBag, Store, Sun, X } from 'lucide-react';
import { C, t, type Lang } from '../theme';
import { useApp } from '../state/AppContext';
import { Footer } from './components/Footer';
import { BrandLogo } from '../components/BrandLogo';
import { AnalyticsConsentManager } from './components/AnalyticsConsent';
import { SearchOverlay } from './components/SearchOverlay';
import { fetchCategories, fetchStorefrontContent, type ApiCategory } from '../lib/api';
import { useSeoDefaults } from '../lib/seo';
import { buildSiteStructuredData } from '../lib/siteStructuredData';
import { serializeJsonLd } from '../lib/jsonLd';
import { BreadcrumbJsonLd } from './components/BreadcrumbJsonLd';
import { MiniCartDrawer } from './components/MiniCartDrawer';
import { OPEN_MINI_CART_EVENT } from './miniCart';

// Matches the real Figma design (node 72:2, "Phase 1 Storefront -- High
// Fidelity"): plain header (logo center, hamburger/back left). Market,
// language, and theme controls were added on top of the Figma design (not
// shown there) per product decision. They're consolidated into ONE utility
// cluster (region switch + theme toggle + cart) that renders identically at
// every breakpoint -- previously the mobile action group and the desktop nav
// each rendered their own copy of the theme toggle, and an inline `display:
// flex` style out-specificity'd the CSS meant to hide the mobile copy on
// desktop, so both showed at once. Rendering one cluster unconditionally
// removes the duplication at the root instead of patching the CSS.
const ROOT_PATHS = ['/', '/catalogo'];
const STATIC_BREADCRUMB_LABELS: Record<string, { pt: string; en: string }> = {
  '/ajuda': { pt: 'Ajuda', en: 'Help' },
  '/perguntas-frequentes': { pt: 'Perguntas frequentes', en: 'Frequently asked questions' },
  '/guia-de-tamanhos': { pt: 'Guia de tamanhos', en: 'Size guide' },
  '/sobre': { pt: 'Sobre nós', en: 'About us' },
  '/politica-privacidade': { pt: 'Política de privacidade', en: 'Privacy policy' },
  '/termos-condicoes': { pt: 'Termos e condições', en: 'Terms and conditions' },
  '/eliminacao-de-dados': { pt: 'Eliminação de dados', en: 'Data deletion' },
};

export function StorefrontLayout() {
  const { lang, setLang, themeMode, setThemeMode, cart } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const isHome = location.pathname === '/';
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 2026-08-08 ("I noticed we don't have a search option in the homepage"):
  // site-wide search, reachable from every page including home -- see
  // SearchOverlay.tsx. headerRef wraps the whole sticky header (trigger
  // button + the panel itself), reusing the exact outside-click-closes
  // pattern LanguageSwitch already uses below, just scoped to the bigger
  // container so a click on the toggle button itself doesn't immediately
  // re-close what it just opened.
  const [searchOpen, setSearchOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tiktokUrl, setTikTokUrl] = useState('');
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const siteJsonLd = origin ? buildSiteStructuredData(origin, tiktokUrl) : null;
  const staticBreadcrumbLabel = STATIC_BREADCRUMB_LABELS[location.pathname]?.[lang];
  useEffect(() => { fetchCategories().then(setCategories).catch(() => undefined); }, []);
  useEffect(() => {
    fetchStorefrontContent()
      .then((content) => setTikTokUrl(content.tiktokUrl?.trim() ?? ''))
      .catch(() => undefined);
  }, []);
  const navItems = [
    { to: '/catalogo?cat=new', label: t('newArrivalsNav', lang) },
    { to: '/catalogo?sale=1', label: t('onSaleNav', lang) },
    ...categories.slice(0, 6).map((category) => ({ to: `/catalogo?cat=${encodeURIComponent(category.slug || '')}`, label: (lang === 'en' ? category.nameEN : category.namePT) || category.namePT })),
    { to: '/conta', label: t('orderLookupNav', lang) },
  ];

  // Route-aware title, description, social metadata and canonical URL. The
  // canonical uses the live market origin and clean pathname; query filters,
  // sorting, checkout return parameters and fragments are intentionally not
  // indexable URL variants. See src/lib/seo.ts for effect ordering details.
  useSeoDefaults(lang, location.pathname, location.search);

  // Real brand wordmark (see components/BrandLogo.tsx for why gold is
  // synthesized via a CSS mask rather than loaded from a separate asset).
  // Gold matches the original design's use of the accent color for the Home
  // hero header, in either theme -- and now actually adapts between light
  // and dark mode via C.heroAccent, same as the hero's other text. Away
  // from Home it's plain ink-colored like the rest of the header text --
  // Black in light mode, White in dark mode.

  // The hamburger only ever makes sense as a mobile pattern -- the button
  // itself is CSS-hidden at desktop widths (.ump-mobile-menu-btn), but also
  // close any open panel on navigation/resize so it can't get stuck open.
  useEffect(() => {
    // Route changes are an external navigation event; close the transient UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setMiniCartOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const open = () => {
      setSearchOpen(false);
      setMobileMenuOpen(false);
      setMiniCartOpen(true);
    };
    window.addEventListener(OPEN_MINI_CART_EVENT, open);
    return () => window.removeEventListener(OPEN_MINI_CART_EVENT, open);
  }, []);

  // Close the search panel on Escape or a click/tap outside the header
  // (which contains both the trigger button and the panel itself -- see
  // headerRef above), same pattern as LanguageSwitch's own dropdown below.
  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [searchOpen]);

  return (
    <div
      className="ump-shell"
      data-theme={themeMode}
      style={{
        minHeight: '100vh',
        background: isHome ? C.heroBg : C.paper,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {siteJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }}
        />
      ) : null}
      {staticBreadcrumbLabel ? (
        <BreadcrumbJsonLd items={[
          { name: lang === 'pt' ? 'Início' : 'Home', path: '/' },
          { name: staticBreadcrumbLabel, path: location.pathname },
        ]} />
      ) : null}
      <div
        ref={headerRef}
        style={{
          flexShrink: 0,
          background: isHome ? C.heroBg : C.paper,
          borderBottom: isHome ? 'none' : `1px solid ${C.ruleLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="ump-content-width"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {isRoot ? (
            <IconButton
              dark={isHome}
              onClick={() => {
                setMobileMenuOpen((o) => !o);
                setSearchOpen(false);
              }}
              label={mobileMenuOpen ? (lang === 'pt' ? 'Fechar menu' : 'Close menu') : 'Menu'}
              className="ump-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </IconButton>
          ) : (
            <IconButton dark={isHome} onClick={() => navigate(-1)} label={lang === 'pt' ? 'Voltar' : 'Back'} className="ump-mobile-menu-btn">
              <ChevronLeft size={20} />
            </IconButton>
          )}

          <Link to="/" style={{ textAlign: 'center', textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
            {isHome ? (
              <BrandLogo tone="gold" goldColor={C.heroAccent} height={46} />
            ) : (
              <BrandLogo tone={themeMode === 'dark' ? 'white' : 'black'} height={46} />
            )}
          </Link>

          <nav className="ump-desktop-nav" style={{ gap: 18, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: item.to.includes('sale=1') ? C.dangerStrong : (location.pathname === item.to ? C.ink : C.inkSoft),
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <LanguageSwitch lang={lang} setLang={setLang} dark={isHome} />
            <ThemeToggle mode={themeMode} onChange={setThemeMode} dark={isHome} lang={lang} />
            {/* 2026-08-08: a persistent search icon, present on every page
                including home -- this used to only exist as a repurposed
                cart-page icon that just navigated to the catalogue, with no
                actual way to type a query until you were already there. */}
            <IconButton
              dark={isHome}
              onClick={() => {
                setSearchOpen((o) => !o);
                setMobileMenuOpen(false);
              }}
              label={searchOpen ? t('closeSearch', lang) : t('navSearch', lang)}
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </IconButton>
            <div style={{ position: 'relative' }}>
              <IconButton dark={isHome} onClick={() => { setSearchOpen(false); setMobileMenuOpen(false); setMiniCartOpen(true); }} label={t('cart', lang)}>
                <ShoppingBag size={16} />
              </IconButton>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: C.gold,
                    color: C.black,
                    fontSize: 9,
                    fontWeight: 800,
                    borderRadius: 10,
                    minWidth: 15,
                    height: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            className="ump-mobile-menu ump-slide-up"
            style={{ borderTop: `1px solid ${isHome ? 'rgba(255,255,255,0.12)' : C.ruleLight}`, padding: '4px 16px 12px' }}
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 4px',
                  fontSize: 14,
                  fontWeight: 800,
                  color: item.to.includes('sale=1') ? C.dangerStrong : (isHome ? C.heroText : C.ink),
                  textDecoration: 'none',
                  borderBottom: `1px solid ${isHome ? 'rgba(255,255,255,0.08)' : C.ruleLight}`,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
      <AnalyticsConsentManager />
      <MiniCartDrawer
        open={miniCartOpen}
        onClose={() => setMiniCartOpen(false)}
        onViewCart={() => { setMiniCartOpen(false); navigate('/carrinho'); }}
      />

      <div className="ump-bottom-nav">
        <BottomNav lang={lang} />
      </div>
    </div>
  );
}

// Language-only control (PT/EN). Market used to share this dropdown, but
// Angola and Portugal are now separate storefronts (ao./pt. subdomains) --
// "switching" means leaving the site entirely, which deserves its own
// distinct, explicit control (MarketSwitchLink below) rather than living
// inside the same same-page toggle as language.
function LanguageSwitch({
  lang,
  setLang,
  dark,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`${t('language', lang)}: ${lang.toUpperCase()}`}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          height: 34,
          padding: '0 10px',
          borderRadius: 8,
          background: dark ? C.heroFieldBg : C.paper,
          border: `1px solid ${dark ? C.heroFieldBorder : C.fieldBorder}`,
          color: dark ? C.heroAccent : C.ink,
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <span>{lang.toUpperCase()}</span>
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div
          className="ump-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 30,
            width: 160,
            background: C.paper,
            border: `1px solid ${C.fieldBorder}`,
            borderRadius: 10,
            padding: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
          }}
        >
          <PillGroup
            heading={t('language', lang)}
            options={(['pt', 'en'] as const).map((l) => ({ key: l, label: l.toUpperCase() }))}
            active={lang}
            onSelect={(v) => {
              setLang(v as Lang);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function PillGroup({
  heading,
  options,
  active,
  onSelect,
}: {
  heading: string;
  options: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
        {heading}
      </div>
      <div style={{ display: 'flex', background: C.subtleBg, borderRadius: 8, padding: 4, gap: 4 }}>
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              background: active === opt.key ? C.ctaBg : 'transparent',
              border: `1px solid ${active === opt.key ? C.ctaBorder : 'transparent'}`,
              color: active === opt.key ? C.onDarkGold : C.inkSoft,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Single dark/light control -- a sliding switch (not a plain icon button) so
// it reads clearly as a two-state toggle at a glance, matching the visual
// weight of the region chip beside it.
function ThemeToggle({
  mode,
  onChange,
  dark,
  lang,
}: {
  mode: 'light' | 'dark';
  onChange: (m: 'light' | 'dark') => void;
  dark?: boolean;
  lang: Lang;
}) {
  const isDark = mode === 'dark';
  return (
    <button
      className="ump-theme-toggle"
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      aria-label={mode === 'dark' ? (lang === 'pt' ? 'Usar tema claro' : 'Use light theme') : (lang === 'pt' ? 'Usar tema escuro' : 'Use dark theme')}
      aria-pressed={isDark}
      style={{
        position: 'relative',
        width: 50,
        height: 30,
        flexShrink: 0,
        borderRadius: 15,
        background: isDark ? C.black : C.subtleBg,
        border: `1px solid ${dark ? C.heroFieldBorder : C.fieldBorder}`,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: isDark ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: C.champagne,
          color: C.black,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.2s ease',
        }}
      >
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}

function IconButton({
  children,
  onClick,
  label,
  dark,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={className}
      style={{
        width: 34,
        height: 34,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        background: dark ? C.heroFieldBg : C.paper,
        border: `1px solid ${dark ? C.heroFieldBorder : C.fieldBorder}`,
        color: dark ? C.heroAccent : C.ink,
      }}
    >
      {children}
    </button>
  );
}

const BOTTOM_NAV_ITEMS = [
  { to: '/catalogo', labelKey: 'navShop', icon: Store },
  { to: '/catalogo', labelKey: 'navSearch', icon: Search },
  { to: '/conta', labelKey: 'navOrders', icon: Package },
  { to: '/ajuda', labelKey: 'navHelp', icon: HelpCircle },
];

function BottomNav({ lang }: { lang: Lang }) {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  // iOS 26 WebKit can intermittently paint `position: fixed; bottom: 0`
  // against the layout viewport after momentum scrolling, leaving the bar
  // floating above/below the actually visible bottom edge. Correct only the
  // difference between those two viewports; on browsers without a visual
  // viewport (and whenever they already agree) this remains exactly 0px.
  // Writing directly to the element avoids rerendering the storefront on
  // every Safari toolbar animation frame.
  useEffect(() => {
    const viewport = window.visualViewport;
    const nav = navRef.current;
    if (!viewport || !nav) return;
    let frame = 0;
    const syncBottom = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visibleBottom = viewport.offsetTop + viewport.height;
        const correction = Math.max(0, window.innerHeight - visibleBottom);
        nav.style.bottom = `${correction}px`;
      });
    };
    syncBottom();
    viewport.addEventListener('resize', syncBottom);
    viewport.addEventListener('scroll', syncBottom);
    window.addEventListener('resize', syncBottom);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', syncBottom);
      viewport.removeEventListener('scroll', syncBottom);
      window.removeEventListener('resize', syncBottom);
    };
  }, []);

  return (
    <div
      ref={navRef}
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${C.ruleLight}`,
        background: C.paper,
        display: 'flex',
        padding: '10px 0 max(16px, env(safe-area-inset-bottom))',
        // Fixed (not sticky) so the bar is always pinned to the viewport
        // bottom while browsing, the standard mobile app tab-bar pattern --
        // it used to be `position: sticky`, which only pins while scrolling
        // through the middle of the page and releases back into normal flow
        // once the true end of the page (the footer) scrolls into view. At
        // that point it settled in flow *below* the footer's own 84px
        // bottom padding (reserved specifically to clear this bar), instead
        // of overlaying it -- producing a block of dead empty space between
        // the footer and the bar whenever the page was short enough, or the
        // user scrolled, to reach the bottom. Fixed removes the bar from
        // flow entirely, so it only ever overlays that reserved padding,
        // never stacks after it.
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        // A dedicated compositing layer prevents Safari from leaving the
        // old painted position behind while its toolbar animates.
        transform: 'translateZ(0)',
        willChange: 'bottom',
      }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = location.pathname === item.to || (item.labelKey === 'navShop' && location.pathname === '/catalogo');
        const Icon = item.icon;
        return (
          <Link
            key={item.labelKey}
            to={item.to}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
            }}
          >
            <Icon size={18} color={active ? C.goldDeep : C.inkSoft} strokeWidth={active ? 2.25 : 1.75} />
            <span style={{ fontSize: 9, fontWeight: 800, color: active ? C.goldDeep : C.inkSoft }}>{t(item.labelKey, lang)}</span>
          </Link>
        );
      })}
    </div>
  );
}
