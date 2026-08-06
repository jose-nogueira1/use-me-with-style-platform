const STORAGE_KEY = 'ump-pending-order-email';

type PendingRecord = { orderNumber?: string; email?: string };

/**
 * AppyPay's widget redirect is a full top-level navigation (script.dataset
 * .redirectUri), which wipes Checkout's in-memory form state -- including
 * the email ConfirmationLookup needs to auto-poll order status without
 * making the customer retype it. Stashed here right when the AppyPay order
 * is created, since that's the last moment we know both the order number
 * and the checkout email in the same place.
 */
export function stashPendingOrderEmail(orderNumber: string, email: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ orderNumber, email } satisfies PendingRecord));
  } catch {
    // Storage unavailable (private browsing, quota) -- ConfirmationLookup
    // just falls back to its manual, email-gated lookup form.
  }
}

/** Read-only lookup, safe to call from a useState lazy initializer (which
 * React may invoke more than once per commit in dev StrictMode) -- does not
 * consume the record. Returns null if nothing is stashed for this order. */
export function peekPendingOrderEmail(orderNumber: string): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRecord;
    return parsed.orderNumber === orderNumber && parsed.email ? parsed.email : null;
  } catch {
    return null;
  }
}

/** One-time cleanup once a landing has actually consumed the stashed email
 * (call from an effect, not from render). */
export function clearPendingOrderEmail(orderNumber: string) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PendingRecord;
    if (parsed.orderNumber === orderNumber) sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
