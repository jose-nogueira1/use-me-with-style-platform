import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { C } from '../../theme';
import type { ToastState } from '../lib/toastNavigation';

/** Renders a confirmation passed via router state, then clears it so a
 * refresh or a Back navigation doesn't resurrect a stale message. */
export function RouteToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const incoming = location.state as ToastState | null;
  const [message, setMessage] = useState<string | null>(null);
  const [consumedId, setConsumedId] = useState<string | null>(null);

  // Adjusting state during render rather than in an effect, matching the
  // pattern used elsewhere in this codebase (see Browse.tsx's URL sync) and
  // per https://react.dev/learn/you-might-not-need-an-effect -- it avoids an
  // extra render pass and the react-hooks/set-state-in-effect rule.
  if (incoming?.toastId && incoming.toastId !== consumedId) {
    setConsumedId(incoming.toastId);
    setMessage(incoming.toast ?? null);
  }

  // Drop the message from history once shown, so a refresh or a Back
  // navigation doesn't resurrect it. Navigation, not setState, so it's a
  // legitimate effect.
  useEffect(() => {
    if (!incoming?.toastId) return;
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [incoming?.toastId, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 24,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 'calc(100vw - 32px)',
        padding: '11px 14px',
        borderRadius: 8,
        background: C.black,
        border: `1px solid ${C.ctaBorder}`,
        color: C.onDark,
        fontSize: 12.5,
        fontWeight: 700,
        boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
      }}
    >
      <Check size={15} style={{ color: C.onDarkGold, flexShrink: 0 }} aria-hidden />
      <span style={{ minWidth: 0 }}>{message}</span>
      <button
        onClick={() => setMessage(null)}
        aria-label="OK"
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: C.onDark, opacity: 0.75 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
