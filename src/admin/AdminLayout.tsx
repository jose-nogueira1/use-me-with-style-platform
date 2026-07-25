import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { C } from '../theme';
import { useAdminAuth } from './AdminAuthContext';
import { adminListOrders, adminListProducts } from '../lib/api';
import { BrandLogo } from '../components/BrandLogo';
import { AdminLanguageSwitch } from './AdminTranslation';
import { NotificationsButton, SearchButton } from './components/PageHeader';

// Sidebar matches the Figma admin design system exactly: only four
// persistent nav items (Dashboard, Orders, Products, Settings) appear in
// every one of the nine high-fidelity admin screens -- Phase 2/3 surfaces
// (analytics, marketing, Meta Ads, inventory, automation) are deliberately
// absent from the nav and only mentioned as a text note at the bottom.
// Customers and Messages are existing Phase 1 features without a dedicated
// Figma screen of their own, so they're kept as a secondary group beneath a
// divider rather than promoted into the primary four.
const SECONDARY_NAV = [
  { to: '/admin/clientes', label: 'Customers' },
  { to: '/admin/mensagens', label: 'Messages' },
  { to: '/admin/faturas', label: 'Invoices' },
  { to: '/admin/media', label: 'Media' },
];

export function AdminLayout() {
  const { user, loading, logout } = useAdminAuth();
  const location = useLocation();
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  // Mobile nav drawer (added 2026-07-24, admin responsive audit, Finding 1;
  // reworked same day into a standard hamburger + drawer after a real-device
  // recording showed the horizontal-scrolling-bar version still wasn't
  // landing as "responsive" for real users -- a horizontally scrolling top
  // bar is an unusual pattern; a hamburger opening a full nav list is the
  // one almost every mobile user already recognises on sight. Below 861px
  // the sidebar's normal content (identical to desktop -- primary nav,
  // secondary nav, user block) renders as a full-height off-canvas panel
  // instead of an inline column; a slim top bar with just the logo and the
  // hamburger button takes its place in normal document flow.
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    adminListOrders({ status: 'payment_review' })
      .then((rows) => setOrdersCount(rows.length))
      .catch(() => setOrdersCount(null));
    adminListProducts()
      .then((rows) => setProductsCount(rows.length))
      .catch(() => setProductsCount(null));
  }, [user]);

  // Close on Escape -- standard drawer/dialog behaviour.
  useEffect(() => {
    if (!navOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navOpen]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: C.black }} />;
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const primaryNav = [
    { to: '/admin', label: 'Dashboard', end: true, badge: undefined as number | null | undefined },
    { to: '/admin/encomendas', label: 'Orders', badge: ordersCount },
    { to: '/admin/produtos', label: 'Products', badge: productsCount },
    { to: '/admin/definicoes', label: 'Settings', badge: undefined },
  ];
  const closeNav = () => setNavOpen(false);

  return (
    <div className="ump-admin-shell" style={{ background: C.subtleBg }}>
      {/* Mobile-only top bar (<=860px): logo, search + notifications, and
          the hamburger trigger. Sits in normal document flow, replacing the
          old horizontal nav bar. Hidden entirely on desktop, where the
          sidebar below is the real nav and search/notifications live in
          each page's own PageHeader instead (2026-07-25, user request:
          these are global actions, so on mobile they belong in the
          persistent navbar rather than repeated at the top of every page). */}
      <div className="ump-admin-mobile-bar" style={{ background: C.black }}>
        <BrandLogo tone="gold" goldColor={C.onDarkGold} height={34} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SearchButton />
          <NotificationsButton />
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 6, border: `1px solid ${C.rule}`, color: C.ink, background: C.paper }}
          >
            <Menu size={15} />
          </button>
        </div>
      </div>

      {/* Backdrop: mobile only, shown behind the open drawer, closes it on tap. */}
      {navOpen && <div className="ump-admin-nav-backdrop" onClick={closeNav} />}

      {/* Sidebar / drawer: identical content and desktop appearance as
          before. On mobile it's off-canvas (translateX(-100%)) until
          .ump-admin-sidebar-open is added, then it slides in as a
          full-height panel over the page -- see App.tsx for the mobile
          media query. */}
      <div className={`ump-admin-sidebar${navOpen ? ' ump-admin-sidebar-open' : ''}`} style={{ background: C.black, padding: '22px 18px' }}>
        <button
          type="button"
          onClick={closeNav}
          aria-label="Close menu"
          className="ump-admin-drawer-close"
          style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1px solid #3B332A', color: C.onDarkGold, background: 'transparent', marginLeft: 'auto', marginBottom: 14 }}
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BrandLogo tone="gold" goldColor={C.onDarkGold} height={44} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}><AdminLanguageSwitch dark /></div>
        </div>

        <div className="ump-admin-groups" style={{ gap: 6, marginBottom: 20 }}>
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} onClick={closeNav} />
          ))}
        </div>

        <div className="ump-admin-groups" style={{ gap: 6, marginBottom: 'auto' }}>
          <div className="ump-admin-group-label" style={{ fontSize: 9, letterSpacing: 1.5, color: '#6C6656', textTransform: 'uppercase', padding: '4px 11px 2px' }}>
            More
          </div>
          {SECONDARY_NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} onClick={closeNav} />
          ))}
        </div>

        <div className="ump-admin-user-block">
          <div
            style={{
              background: '#12100D',
              border: '1px solid #5F4A1B',
              borderRadius: 8,
              padding: '15px 13px',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: C.onDarkGold, marginBottom: 6 }}>Phase 1 launch admin</div>
            <div style={{ fontSize: 10, color: '#C9C0B5', lineHeight: 1.5 }}>
              Deferred: AI campaigns, Meta Ads, advanced analytics, roles, full accounts, wishlist, loyalty, and VIP.
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#BEB8AE', marginBottom: 6, wordBreak: 'break-all' }}>{user.email}</div>
          <button onClick={() => logout()} style={{ fontSize: 11, color: C.onDarkGold, textDecoration: 'underline' }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ump-admin-content-width">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, label, end, badge, onClick }: { to: string; label: string; end?: boolean; badge?: number | null; onClick?: () => void }) {
  const location = useLocation();
  const active = end ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className="ump-admin-nav-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '13px 11px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        color: active ? C.onDarkGold : '#BEB8AE',
        background: active ? '#221C12' : 'transparent',
        border: `1px solid ${active ? '#765E24' : 'transparent'}`,
        textDecoration: 'none',
      }}
    >
      {label}
      {typeof badge === 'number' && <NavBadge count={badge} active={active} />}
    </Link>
  );
}

function NavBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      style={{
        minWidth: 20,
        height: 20,
        padding: '0 4px',
        borderRadius: 6,
        background: active ? C.tagBg : C.paper,
        border: `1px solid ${active ? '#E8D28D' : C.rule}`,
        color: active ? C.goldDeep : C.ink,
        fontSize: 9,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {count}
    </span>
  );
}
