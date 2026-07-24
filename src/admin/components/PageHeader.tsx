import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Clock, MessageCircle, Package, Search, ShoppingBag, User } from 'lucide-react';
import { C, F } from '../../theme';
import {
  adminListCustomers,
  adminListMessages,
  adminListOrders,
  adminListProducts,
  productIsLowStock,
  type ApiCustomer,
  type ApiOrder,
  type ApiProduct,
} from '../../lib/api';

// Every admin screen in the Figma design shares this exact header pattern:
// a small eyebrow breadcrumb, a large bold title, a one-line subtitle, and a
// right-aligned action row (search icon, notify icon, one primary black CTA
// whose label changes per screen).
//
// Search and Notifications were originally inert placeholder buttons (2026-
// 07-25, user report: "not working"). Both are now self-contained, fetching
// their own data the same way AdminLayout's sidebar badges and every other
// admin page already does (no shared data-fetching layer exists yet in this
// codebase, so this follows the established per-component-fetch pattern
// rather than introducing a new one).
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  cta,
  onCta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        flexWrap: 'wrap',
        padding: '24px 28px 0',
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{eyebrow}</div>
        <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <SearchButton />
        <NotificationsButton />
        {cta && (
          <button
            onClick={onCta}
            style={{ padding: '0 20px', height: 42, borderRadius: 6, background: C.black, color: C.onDarkGold, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

// Shared "click outside or Escape closes the popover" behaviour -- same
// pattern as Checkout.tsx's phone-country combobox.
function usePopover(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);
  return ref;
}

function IconButton({ label, active, badge, onClick, children }: { label: string; active: boolean; badge?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 42,
        height: 42,
        borderRadius: 6,
        background: active ? C.subtleBg : C.paper,
        border: `1px solid ${active ? C.goldDeep : C.rule}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.ink,
      }}
    >
      {children}
      {typeof badge === 'number' && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: '#B95545',
            color: '#FFFDF8',
            fontSize: 9,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function Popover({ children }: { children: ReactNode }) {
  return (
    <div
      className="ump-admin-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        width: 360,
        maxHeight: 440,
        background: C.paper,
        border: `1px solid ${C.rule}`,
        borderRadius: 8,
        boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function ResultRow({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', padding: '8px 8px', borderRadius: 6, background: 'transparent', color: C.ink }}
    >
      <span style={{ color: C.goldDeep, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10.5, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </span>
    </button>
  );
}

function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 8px 2px' }}>{label}</div>
      {children}
    </div>
  );
}

// Client-side search across orders/products/customers -- fetched once when
// the popover first opens (same up-to-200-rows lists every other admin list
// page already pulls), then filtered locally on every keystroke. No new
// backend search endpoint needed at this data scale.
function SearchButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = () => setOpen(false);
  const wrapRef = usePopover(close);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (loaded || loading) return;
    // Triggering the fetch itself is the point of this effect (open the
    // popover -> load once); setLoading(true) here just flips the spinner on
    // before the async call resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([adminListOrders(), adminListProducts(), adminListCustomers()])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setCustomers(c);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, [open, loaded, loading]);

  const q = query.trim().toLowerCase();
  const matchedOrders = useMemo(
    () => (q ? orders.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q)).slice(0, 6) : []),
    [orders, q],
  );
  const matchedProducts = useMemo(
    () =>
      q
        ? products
            .filter((p) => p.name.toLowerCase().includes(q) || (p.namePT ?? '').toLowerCase().includes(q) || (p.nameEN ?? '').toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
            .slice(0, 6)
        : [],
    [products, q],
  );
  const matchedCustomers = useMemo(
    () => (q ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 6) : []),
    [customers, q],
  );
  const hasResults = matchedOrders.length > 0 || matchedProducts.length > 0 || matchedCustomers.length > 0;

  const goTo = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <IconButton label="Search" active={open} onClick={() => setOpen((o) => !o)}>
        <Search size={15} />
      </IconButton>
      {open && (
        <Popover>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, products, customers…"
            style={{ margin: 10, padding: '9px 11px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
          />
          <div style={{ overflowY: 'auto', padding: '0 6px 8px' }}>
            {loading && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>Loading…</div>}
            {!loading && q && !hasResults && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>No matches.</div>}
            {!loading && !q && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>Type to search orders, products, and customers.</div>}
            {matchedOrders.length > 0 && (
              <ResultGroup label="Orders">
                {matchedOrders.map((o) => (
                  <ResultRow key={o.id} icon={<ShoppingBag size={13} />} title={`#${o.orderNumber}`} subtitle={o.customerName} onClick={() => goTo(`/admin/encomendas/${o.id}`)} />
                ))}
              </ResultGroup>
            )}
            {matchedProducts.length > 0 && (
              <ResultGroup label="Products">
                {matchedProducts.map((p) => (
                  <ResultRow key={p.id} icon={<Package size={13} />} title={p.name} subtitle={p.slug} onClick={() => goTo(`/admin/produtos/${p.id}`)} />
                ))}
              </ResultGroup>
            )}
            {matchedCustomers.length > 0 && (
              <ResultGroup label="Customers">
                {matchedCustomers.map((c) => (
                  <ResultRow key={c.id} icon={<User size={13} />} title={c.name} subtitle={c.email} onClick={() => goTo(`/admin/clientes/${c.id}`)} />
                ))}
              </ResultGroup>
            )}
          </div>
        </Popover>
      )}
    </div>
  );
}

type NotificationItem = { key: string; icon: ReactNode; title: string; subtitle: string; path: string };

// Surfaces the three things an admin actually needs to act on: orders stuck
// in payment review, products running low on stock (same threshold as the
// Products list's "Low stock" filter -- see productIsLowStock), and
// WhatsApp/Instagram messages awaiting a reply. Fetched on mount (not only
// on open) so the badge count is visible without having to click first.
function NotificationsButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const close = () => setOpen(false);
  const wrapRef = usePopover(close);

  useEffect(() => {
    Promise.all([adminListOrders({ status: 'payment_review' }), adminListProducts(), adminListMessages()])
      .then(([reviewOrders, products, messages]) => {
        const next: NotificationItem[] = [];
        for (const o of reviewOrders) {
          next.push({
            key: `order-${o.id}`,
            icon: <Clock size={13} />,
            title: `#${o.orderNumber} needs payment review`,
            subtitle: o.customerName,
            path: `/admin/encomendas/${o.id}`,
          });
        }
        for (const p of products) {
          if (!productIsLowStock(p)) continue;
          next.push({
            key: `product-${p.id}`,
            icon: <AlertTriangle size={13} />,
            title: `${p.name} is low on stock`,
            subtitle: 'Check sizes',
            path: `/admin/produtos/${p.id}`,
          });
        }
        for (const m of messages.filter((m) => m.status === 'open' || m.status === 'escalated').slice(0, 20)) {
          next.push({
            key: `message-${m.id}`,
            icon: <MessageCircle size={13} />,
            title: `${m.customerName || m.contactHandle} sent a message`,
            subtitle: m.status === 'escalated' ? 'Escalated' : 'Needs review',
            path: '/admin/mensagens',
          });
        }
        setItems(next);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <IconButton label="Notifications" active={open} badge={items.length} onClick={() => setOpen((o) => !o)}>
        <Bell size={15} />
      </IconButton>
      {open && (
        <Popover>
          <div style={{ overflowY: 'auto', padding: 6 }}>
            {!loaded && <div style={{ padding: '10px 8px', fontSize: 12, color: C.inkSoft }}>Loading…</div>}
            {loaded && items.length === 0 && <div style={{ padding: '10px 8px', fontSize: 12, color: C.inkSoft }}>All caught up -- no notifications.</div>}
            {items.map((item) => (
              <ResultRow key={item.key} icon={item.icon} title={item.title} subtitle={item.subtitle} onClick={() => goTo(item.path)} />
            ))}
          </div>
        </Popover>
      )}
    </div>
  );
}
