import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, HelpCircle, Menu, Moon, Package, Search, ShoppingBag, Store, Sun, X } from 'lucide-react';
import { C, t, type Lang } from '../theme';
import { useApp } from '../state/AppContext';
import { Footer } from './components/Footer';
import wordmarkBlack from '../assets/brand/wordmark-black.png';
import wordmarkWhite from '../assets/brand/wordmark-white.png';
import wordmarkGold from '../assets/brand/wordmark-gold.png';

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

export function StorefrontLayout() {
  const { lang, setLang, themeMode, setThemeMode, cart } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const isHome = location.pathname === '/';
  const isCart = location.pathname === '/carrinho';
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real brand wordmark (public/brand -- Logos & Brand Guide/New Logos),
  // replacing the plain-text "Use Me / with style" placeholder. Gold matches
  // the original design's use of the accent color for the Home hero header,
  // in either theme; away from Home it's plain ink-colored like the rest of
  // the header text -- Black in light mode, White in dark mode.
  const logoSrc = isHome ? wordmarkGold : themeMode === 'dark' ? wordmarkWhite : wordmarkBlack;

  // The hamburger only ever makes sense as a mobile pattern -- the button
  // itself is CSS-hidden at desktop widths (.ump-mobile-menu-btn), but also
  // close any open panel on navigation/resize so it can't get stuck open.
  useEffect(() => {
    // Route changes are an external navigation event; close the transient UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

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
      <div
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
              onClick={() => setMobileMenuOpen((o) => !o)}
              label={mobileMenuOpen ? 'Close menu' : 'Menu'}
              className="ump-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </IconButton>
          ) : (
            <IconButton dark={isHome} onClick={() => navigate(-1)} label="Back" className="ump-mobile-menu-btn">
              <ChevronLeft size={20} />
            </IconButton>
          )}

          <Link to="/" style={{ textAlign: 'center', textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img src={logoSrc} alt="Use Me With Style" style={{ height: 38, width: 'auto' }} />
          </Link>

          <nav className="ump-desktop-nav" style={{ gap: 18, alignItems: 'center' }}>
            {DESKTOP_NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: location.pathname === item.to ? C.ink : C.inkSoft,
                  textDecoration: 'none',
                }}
              >
                {t(item.labelKey, lang)}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <LanguageSwitch lang={lang} setLang={setLang} dark={isHome} />
            <ThemeToggle mode={themeMode} onChange={setThemeMode} dark={isHome} />
            <div style={{ position: 'relative' }}>
              <IconButton dark={isHome} onClick={() => navigate(isCart ? '/catalogo' : '/carrinho')} label={isCart ? 'Search' : 'Cart'}>
                {isCart ? <Search size={16} /> : <ShoppingBag size={16} />}
              </IconButton>
              {!isCart && cartCount > 0 && (
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
            {DESKTOP_NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 4px',
                  fontSize: 14,
                  fontWeight: 800,
                  color: isHome ? C.heroText : C.ink,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${isHome ? 'rgba(255,255,255,0.08)' : C.ruleLight}`,
                }}
              >
                {t(item.labelKey, lang)}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>

      <Footer />

      <div className="ump-bottom-nav">
        <BottomNav lang={lang} />
      </div>
    </div>
  );
}

const DESKTOP_NAV_ITEMS = [
  { to: '/catalogo?cat=new', labelKey: 'newArrivalsNav' },
  { to: '/catalogo?cat=vestidos', labelKey: 'dresses' },
  { to: '/catalogo?cat=tops', labelKey: 'tops' },
  { to: '/catalogo?cat=conjuntos', labelKey: 'sets' },
  { to: '/conta', labelKey: 'orderLookupNav' },
];

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
        aria-label={t('language', lang)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          height: 34,
          padding: '0 10px',
          borderRadius: 8,
          background: dark ? C.heroFieldBg : C.paper,
          border: `1px solid ${dark ? C.heroFieldBorder : C.rule}`,
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
            border: `1px solid ${C.rule}`,
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
              background: active === opt.key ? C.black : 'transparent',
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
}: {
  mode: 'light' | 'dark';
  onChange: (m: 'light' | 'dark') => void;
  dark?: boolean;
}) {
  const isDark = mode === 'dark';
  return (
    <button
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      style={{
        position: 'relative',
        width: 50,
        height: 30,
        flexShrink: 0,
        borderRadius: 15,
        background: isDark ? C.black : C.subtleBg,
        border: `1px solid ${dark ? C.heroFieldBorder : C.rule}`,
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
        border: `1px solid ${dark ? C.heroFieldBorder : C.rule}`,
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
  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${C.ruleLight}`,
        background: C.paper,
        display: 'flex',
        padding: '10px 0 16px',
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
