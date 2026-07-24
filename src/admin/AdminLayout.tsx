import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) return;
    adminListOrders({ status: 'payment_review' })
      .then((rows) => setOrdersCount(rows.length))
      .catch(() => setOrdersCount(null));
    adminListProducts()
      .then((rows) => setProductsCount(rows.length))
      .catch(() => setProductsCount(null));
  }, [user]);

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

        <div className="ump-admin-groups" style={{ gap: 6, marginBottom: 'auto' }}>
          <div className="ump-admin-group-label" style={{ fontSize: 9, letterSpacing: 1.5, color: '#6C6656', textTransform: 'uppercase', padding: '4px 11px 2px' }}>
            More
          </div>
          {SECONDARY_NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} />
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

function NavItem({ to, label, end, badge }: { to: string; label: string; end?: boolean; badge?: number | null }) {
  const location = useLocation();
  const active = end ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
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
