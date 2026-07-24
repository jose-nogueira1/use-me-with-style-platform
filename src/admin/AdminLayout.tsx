import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { C } from '../theme';
import { useAdminAuth } from './AdminAuthContext';
import { adminListOrders, adminListProducts } from '../lib/api';
import wordmarkGold from '../assets/brand/wordmark-gold.png';
import { AdminLanguageSwitch } from './AdminTranslation';

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
  // Mobile-only "More" dropdown for the secondary nav group (Customers,
  // Messages, Invoices, Media) -- added 2026-07-24 (admin responsive audit,
  // Finding 1). Below 861px the sidebar becomes a horizontal scrolling bar;
  // with all 8 primary + secondary items inline it only had room to show
  // 2 items before getting cut off, with no visual hint that the rest was
  // reachable by scrolling sideways. Collapsing the secondary group behind
  // a single toggle means the bar only ever needs to fit 5 items.
  const [moreOpen, setMoreOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const moreToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!user) return;
    adminListOrders({ status: 'payment_review' })
      .then((rows) => setOrdersCount(rows.length))
      .catch(() => setOrdersCount(null));
    adminListProducts()
      .then((rows) => setProductsCount(rows.length))
      .catch(() => setProductsCount(null));
  }, [user]);

  // Close on any click/tap outside the dropdown -- standard menu behaviour,
  // since there's no overlay backdrop to catch outside taps here.
  useEffect(() => {
    if (!moreOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (secondaryRef.current && !secondaryRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [moreOpen]);

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
  const secondaryActive = SECONDARY_NAV.some((item) => location.pathname.startsWith(item.to));

  return (
    <div className="ump-admin-shell" style={{ background: C.subtleBg }}>
      <div className="ump-admin-sidebar" style={{ background: C.black, padding: '22px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img src={wordmarkGold} alt="Use Me With Style" style={{ height: 38, width: 'auto' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}><AdminLanguageSwitch dark /></div>
        </div>

        <div className="ump-admin-groups" style={{ gap: 6, marginBottom: 20 }}>
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        <div ref={secondaryRef} className="ump-admin-groups ump-admin-secondary-wrap" style={{ gap: 6, marginBottom: 'auto', position: 'relative' }}>
          <div className="ump-admin-group-label" style={{ fontSize: 9, letterSpacing: 1.5, color: '#6C6656', textTransform: 'uppercase', padding: '4px 11px 2px' }}>
            More
          </div>
          <div className="ump-admin-secondary-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SECONDARY_NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </div>
          <button
            ref={moreToggleRef}
            type="button"
            className="ump-admin-nav-item ump-admin-more-toggle"
            onClick={() => {
              // The panel is position: fixed (see note below), positioned
              // from the toggle's own on-screen rect rather than CSS anchoring,
              // so it has to be recomputed each time the menu opens.
              const rect = moreToggleRef.current?.getBoundingClientRect();
              if (rect) setPanelPos({ top: rect.bottom + 6, left: rect.left });
              setMoreOpen((open) => !open);
            }}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            style={{
              alignItems: 'center',
              gap: 6,
              padding: '13px 11px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              color: secondaryActive ? C.onDarkGold : '#BEB8AE',
              background: secondaryActive ? '#221C12' : 'transparent',
              border: `1px solid ${secondaryActive ? '#765E24' : 'transparent'}`,
              whiteSpace: 'nowrap',
            }}
          >
            More
            <span aria-hidden="true" style={{ fontSize: 9, display: 'inline-block', transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>
              ▾
            </span>
          </button>
          {moreOpen && panelPos && (
            <div
              className="ump-admin-more-panel"
              style={{
                position: 'fixed',
                top: panelPos.top,
                left: panelPos.left,
                background: '#15120C',
                border: '1px solid #3B332A',
                borderRadius: 8,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
              }}
            >
              {SECONDARY_NAV.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} onClick={() => setMoreOpen(false)} />
              ))}
            </div>
          )}
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
