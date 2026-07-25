// Seen/clicked/cleared state for the admin notifications bell (2026-07-25
// request, extended same day to distinguish clicked from merely-seen).
// Notifications themselves are computed fresh on every load from live data
// (orders stuck in payment review, low-stock products, open messages -- see
// PageHeader.tsx's NotificationsButton) rather than stored anywhere, so
// there's no backend record to mark read or delete. What persists here is
// just which of those (stable, source-derived) keys the admin has already
// seen, clicked through to, or explicitly cleared, following the same
// small-localStorage-value pattern as lib/analyticsConsent.ts: versioned
// keys, plain functions, a CustomEvent so the desktop header and the mobile
// top bar (two separate NotificationsButton instances) stay in sync with
// each other.
//
// seen: the item was present in the list the last time the popover was
// opened -- drives the small unseen dot, a minor detail.
// clicked: the admin actually navigated to it -- means "dealt with",
// drives both the row background and the bell's badge count (2026-07-25:
// the badge counts NOT-CLICKED items, not just unseen ones, since opening
// the popover shouldn't by itself make the count disappear).
const SEEN_STORAGE_KEY = 'use-me-admin-notifications-seen-v1';
const CLICKED_STORAGE_KEY = 'use-me-admin-notifications-clicked-v1';
const CLEARED_STORAGE_KEY = 'use-me-admin-notifications-cleared-v1';
export const NOTIFICATIONS_STATE_EVENT = 'use-me:admin-notifications-state';

function readKeys(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeKeys(storageKey: string, value: Set<string>) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...value]));
  } catch {
    // Storage unavailable (private browsing, quota) -- seen/cleared state
    // just won't persist across reloads; the notification itself still
    // works from live data either way.
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_STATE_EVENT));
}

export function getSeenKeys(): Set<string> {
  return readKeys(SEEN_STORAGE_KEY);
}

export function getClickedKeys(): Set<string> {
  return readKeys(CLICKED_STORAGE_KEY);
}

export function getClearedKeys(): Set<string> {
  return readKeys(CLEARED_STORAGE_KEY);
}

export function markNotificationsSeen(keys: string[]): void {
  if (keys.length === 0) return;
  const seen = readKeys(SEEN_STORAGE_KEY);
  const before = seen.size;
  for (const key of keys) seen.add(key);
  if (seen.size !== before) writeKeys(SEEN_STORAGE_KEY, seen);
}

export function markNotificationClicked(key: string): void {
  const clicked = readKeys(CLICKED_STORAGE_KEY);
  if (clicked.has(key)) return;
  clicked.add(key);
  writeKeys(CLICKED_STORAGE_KEY, clicked);
}

export function clearNotification(key: string): void {
  const cleared = readKeys(CLEARED_STORAGE_KEY);
  cleared.add(key);
  writeKeys(CLEARED_STORAGE_KEY, cleared);
}

export function clearAllNotifications(keys: string[]): void {
  const cleared = readKeys(CLEARED_STORAGE_KEY);
  for (const key of keys) cleared.add(key);
  writeKeys(CLEARED_STORAGE_KEY, cleared);
}

// Drops stored seen/clicked/cleared entries that no longer match a live
// notification (e.g. an order left payment review, a product restocked),
// so the three sets don't grow forever as the underlying data changes.
export function pruneNotificationState(liveKeys: string[]): void {
  const live = new Set(liveKeys);
  for (const storageKey of [SEEN_STORAGE_KEY, CLICKED_STORAGE_KEY, CLEARED_STORAGE_KEY]) {
    const current = readKeys(storageKey);
    const pruned = new Set([...current].filter((k) => live.has(k)));
    if (pruned.size !== current.size) writeKeys(storageKey, pruned);
  }
}
