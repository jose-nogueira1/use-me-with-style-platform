import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bell, Clock, MessageCircle, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { C, F } from '../../theme';
import { useApp } from '../../state/AppContext';
import { t } from '../i18n';
import {
  adminListCustomers,
  adminListMessages,
  adminListOrders,
  adminListProducts,
  productIsLowStock,
  productIsOutOfStock,
  type ApiCustomer,
  type ApiOrder,
  type ApiProduct,
} from '../../lib/api';
import {
  clearAllNotifications,
  clearNotification,
  getClearedKeys,
  getClickedKeys,
  getSeenKeys,
  markNotificationClicked,
  markNotificationsSeen,
  NOTIFICATIONS_STATE_EVENT,
  pruneNotificationState,
} from '../../lib/notificationState';

// Danger/urgent palette (2026-07-25) -- matches the red already used
// throughout the admin for errors and destructive actions (Badge.tsx's
// "red" variant, the Escalate button in Mensagens.tsx, etc.) rather than
// inventing a new one.
const DANGER_BG = '#FFF0EB';
const DANGER_BORDER = '#E1B3AA';
const DANGER_TEXT = '#B95545';

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
  ctaBusy,
  backTo,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta?: string;
  onCta?: () => void;
  /** Disables the CTA and shows a pending state. Without this the header
   * button gave no sign it had done anything, which read as "the top save
   * button is broken" while the identical one at the bottom of the form --
   * which does show a pending state -- appeared to work (2026-07-30). */
  ctaBusy?: boolean;
  /** Renders a back control above the title. Detail screens previously had
   * only the breadcrumb text, which isn't clickable, so the only way back to
   * a list was the sidebar or the browser's Back button. */
  backTo?: string;
  backLabel?: string;
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
        {backTo && (
          <Link
            to={backTo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
              padding: '5px 10px 5px 7px',
              borderRadius: 6,
              border: `1px solid ${C.rule}`,
              background: C.paper,
              color: C.ink,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={13} />
            {backLabel}
          </Link>
        )}
        <div style={{ fontSize: 10, fontWeight: 800, color: C.goldDeep, marginBottom: 4 }}>{eyebrow}</div>
        <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {/* Hidden on mobile (<=860px, see App.tsx) -- these two live in the
            mobile top bar / nav drawer instead (2026-07-25, user request:
            search and notifications should be in the navbar on mobile, not
            repeated inside every page's header). The CTA button stays here
            at every width since it's page-specific, not a global action. */}
        <div className="ump-admin-header-actions" style={{ display: 'flex', gap: 8 }}>
          <SearchButton />
          <NotificationsButton />
        </div>
        {cta && (
          <button
            onClick={onCta}
            disabled={ctaBusy}
            aria-busy={ctaBusy || undefined}
            style={{
              padding: '0 20px',
              height: 42,
              borderRadius: 6,
              background: ctaBusy ? C.disabledBg : C.black,
              color: ctaBusy ? C.disabledFg : C.onDarkGold,
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: ctaBusy ? 'default' : 'pointer',
            }}
          >
            {ctaBusy ? '…' : cta}
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

function IconButton({
  label,
  active,
  badge,
  badgeUrgent,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  badge?: number;
  /** Switches the badge to the danger palette (2026-07-25): the bell uses
   * this when an unclicked notification is urgent, so the count itself
   * flags that something needs immediate handling, not just that
   * something's unread. */
  badgeUrgent?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
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
            background: badgeUrgent ? DANGER_TEXT : C.goldDeep,
            boxShadow: badgeUrgent ? '0 0 0 3px rgba(185,85,69,0.25)' : 'none',
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
export function SearchButton() {
  const { lang } = useApp();
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
      <IconButton label={t('search', lang)} active={open} onClick={() => setOpen((o) => !o)}>
        <Search size={15} />
      </IconButton>
      {open && (
        <Popover>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder', lang)}
            style={{ margin: 10, padding: '9px 11px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.subtleBg, color: C.ink }}
          />
          <div style={{ overflowY: 'auto', padding: '0 6px 8px' }}>
            {loading && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>}
            {!loading && q && !hasResults && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>{t('noMatches', lang)}</div>}
            {!loading && !q && <div style={{ padding: '8px 10px', fontSize: 12, color: C.inkSoft }}>{t('typeToSearch', lang)}</div>}
            {matchedOrders.length > 0 && (
              <ResultGroup label={t('resultGroupOrders', lang)}>
                {matchedOrders.map((o) => (
                  <ResultRow key={o.id} icon={<ShoppingBag size={13} />} title={`#${o.orderNumber}`} subtitle={o.customerName} onClick={() => goTo(`/admin/encomendas/${o.id}`)} />
                ))}
              </ResultGroup>
            )}
            {matchedProducts.length > 0 && (
              <ResultGroup label={t('resultGroupProducts', lang)}>
                {matchedProducts.map((p) => (
                  <ResultRow key={p.id} icon={<Package size={13} />} title={p.name} subtitle={p.slug} onClick={() => goTo(`/admin/produtos/${p.id}`)} />
                ))}
              </ResultGroup>
            )}
            {matchedCustomers.length > 0 && (
              <ResultGroup label={t('resultGroupCustomers', lang)}>
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

type NotificationItem = { key: string; icon: ReactNode; title: string; subtitle: string; path: string; urgent: boolean };

// One notification row (2026-07-25 seen/clicked/urgent request). Background
// is the primary signal, in priority order:
// 1. clicked -- dealt with, de-emphasised (dim, no tint).
// 2. urgent (and not yet clicked) -- danger tint + left accent bar, needs
//    attention now.
// 3. neither -- the default gold "not yet clicked" tint (covers both
//    never-opened and opened-but-ignored items, per the request that those
//    two only need ONE shared treatment).
// The small dot is a lighter-weight detail layered on top: gold if truly
// unseen, otherwise invisible -- it doesn't get its own background.
function NotificationRow({
  icon,
  title,
  subtitle,
  unseen,
  clicked,
  urgent,
  onClick,
  onClear,
  dismissLabel,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  unseen: boolean;
  clicked: boolean;
  urgent: boolean;
  onClick: () => void;
  onClear: () => void;
  dismissLabel: string;
}) {
  const bg = clicked ? 'transparent' : urgent ? DANGER_BG : C.tagBg;
  const accentColor = clicked ? C.goldDeep : urgent ? DANGER_TEXT : C.goldDeep;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 6,
        background: bg,
        border: `1px solid ${urgent && !clicked ? DANGER_BORDER : 'transparent'}`,
        borderLeft: `3px solid ${urgent && !clicked ? DANGER_TEXT : 'transparent'}`,
        opacity: clicked ? 0.6 : 1,
      }}
    >
      <button
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, textAlign: 'left', padding: '8px 4px 8px 6px', borderRadius: 6, background: 'transparent', color: C.ink }}
      >
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: unseen && !clicked ? C.goldDeep : 'transparent', flexShrink: 0 }} />
        <span style={{ color: accentColor, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: clicked ? 500 : urgent ? 800 : unseen ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10.5, color: C.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
        </span>
      </button>
      <button
        aria-label={dismissLabel}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        style={{ flexShrink: 0, width: 22, height: 22, marginRight: 4, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkSoft }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// Surfaces the three things an admin actually needs to act on: orders stuck
// in payment review, products running low on stock (same threshold as the
// Products list's "Low stock" filter -- see productIsLowStock), and
// WhatsApp/Instagram messages awaiting a reply. Fetched on mount (not only
// on open) so the badge count is visible without having to click first.
//
// Seen/clicked/cleared state (2026-07-25 request, extended same day):
// notifications are recomputed fresh from live data every time (there's no
// backend record for them), so all three are tracked client-side by the
// item's stable source-derived key (lib/notificationState.ts). "Urgent"
// flags the subset that genuinely needs handling now -- an order stuck in
// payment review for over 24h, a product that's fully sold out (not just
// low) in some variant, or an escalated message -- and only applies while
// unclicked, since clicking through means it's been dealt with. The badge
// counts unclicked items (opening the popover shouldn't make the count
// disappear -- only acting on something should) and switches to the danger
// colour whenever an unclicked item is urgent.
const PAYMENT_REVIEW_URGENT_AFTER_MS = 24 * 60 * 60 * 1000;

export function NotificationsButton() {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [seenKeys, setSeenKeys] = useState<Set<string>>(() => getSeenKeys());
  const [clickedKeys, setClickedKeys] = useState<Set<string>>(() => getClickedKeys());
  const close = () => setOpen(false);
  const wrapRef = usePopover(close);

  useEffect(() => {
    Promise.all([adminListOrders({ status: 'payment_review' }), adminListProducts(), adminListMessages()])
      .then(([reviewOrders, products, messages]) => {
        const next: NotificationItem[] = [];
        for (const o of reviewOrders) {
          const stuckSince = new Date(o.createdAt).getTime();
          const urgent = Number.isFinite(stuckSince) && Date.now() - stuckSince > PAYMENT_REVIEW_URGENT_AFTER_MS;
          next.push({
            key: `order-${o.id}`,
            icon: <Clock size={13} />,
            title: t('notifNeedsPaymentReview', lang, { n: o.orderNumber }),
            subtitle: urgent ? t('notifWaitingOver24h', lang) : o.customerName,
            path: `/admin/encomendas/${o.id}`,
            urgent,
          });
        }
        for (const p of products) {
          if (!productIsLowStock(p)) continue;
          const urgent = productIsOutOfStock(p);
          next.push({
            key: `product-${p.id}`,
            icon: <AlertTriangle size={13} />,
            title: urgent ? t('notifOutOfStock', lang, { name: p.name }) : t('notifLowOnStock', lang, { name: p.name }),
            subtitle: t('notifCheckSizes', lang),
            path: `/admin/produtos/${p.id}`,
            urgent,
          });
        }
        for (const m of messages.filter((m) => m.status === 'open' || m.status === 'escalated').slice(0, 20)) {
          next.push({
            key: `message-${m.id}`,
            icon: <MessageCircle size={13} />,
            title: t('notifSentAMessage', lang, { name: m.customerName || m.contactHandle }),
            subtitle: m.status === 'escalated' ? t('msgEscalated', lang) : t('msgNeedsReview', lang),
            path: '/admin/mensagens',
            urgent: m.status === 'escalated',
          });
        }
        // Prune against the full live set (before filtering out cleared
        // items) -- pruning against the post-filter list would immediately
        // forget any item the admin just cleared, since a cleared item is
        // by definition missing from that filtered list.
        pruneNotificationState(next.map((item) => item.key));
        const cleared = getClearedKeys();
        setItems(next.filter((item) => !cleared.has(item.key)));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [lang]);

  // Keeps this button's seen/clicked state in sync with the other
  // NotificationsButton instance (desktop header vs. mobile top bar render
  // separately).
  useEffect(() => {
    const onStateChange = () => {
      setSeenKeys(getSeenKeys());
      setClickedKeys(getClickedKeys());
    };
    window.addEventListener(NOTIFICATIONS_STATE_EVENT, onStateChange);
    return () => window.removeEventListener(NOTIFICATIONS_STATE_EVENT, onStateChange);
  }, []);

  const togglePopover = () => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen && items.length > 0) {
        markNotificationsSeen(items.map((item) => item.key));
        setSeenKeys(getSeenKeys());
      }
      return willOpen;
    });
  };

  const handleClear = (key: string) => {
    clearNotification(key);
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleClearAll = () => {
    clearAllNotifications(items.map((item) => item.key));
    setItems([]);
  };

  const goTo = (item: NotificationItem) => {
    markNotificationClicked(item.key);
    setClickedKeys(getClickedKeys());
    setOpen(false);
    navigate(item.path);
  };

  const unclickedItems = items.filter((item) => !clickedKeys.has(item.key));
  const unclickedCount = unclickedItems.length;
  const hasUrgentPending = unclickedItems.some((item) => item.urgent);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <IconButton label={t('notifications', lang)} active={open} badge={unclickedCount} badgeUrgent={hasUrgentPending} onClick={togglePopover}>
        <Bell size={15} />
      </IconButton>
      {open && (
        <Popover>
          {loaded && items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px 4px' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.goldDeep, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('notifications', lang)}</span>
              <button onClick={handleClearAll} style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft }}>
                {t('clearAll', lang)}
              </button>
            </div>
          )}
          <div style={{ overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!loaded && <div style={{ padding: '10px 8px', fontSize: 12, color: C.inkSoft }}>{t('loadingEllipsis', lang)}</div>}
            {loaded && items.length === 0 && <div style={{ padding: '10px 8px', fontSize: 12, color: C.inkSoft }}>{t('allCaughtUp', lang)}</div>}
            {items.map((item) => (
              <NotificationRow
                key={item.key}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                unseen={!seenKeys.has(item.key)}
                clicked={clickedKeys.has(item.key)}
                urgent={item.urgent}
                onClick={() => goTo(item)}
                onClear={() => handleClear(item.key)}
                dismissLabel={t('dismissNotification', lang)}
              />
            ))}
          </div>
        </Popover>
      )}
    </div>
  );
}
