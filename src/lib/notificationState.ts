// Seen/cleared state for the admin notifications bell (2026-07-25 request).
// Notifications themselves are computed fresh on every load from live data
// (orders stuck in payment review, low-stock products, open messages -- see
// PageHeader.tsx's NotificationsButton) rather than stored anywhere, so
// there's no backend record to mark read or delete. What persists here is
// just which of those (stable, source-derived) keys the admin has already
// seen or explicitly cleared, following the same small-localStorage-value
// pattern as lib/analyticsConsent.ts: versioned key, plain functions, a
// CustomEvent so the desktop header and the mobile top bar (two separate
// NotificationsButton instances) stay in sync with each other.
const SEEN_STORAGE_KEY = 'use-me-admin-notifications-seen-v1';
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

// Drops stored seen/cleared entries that no longer match a live
// notification (e.g. an order left payment review, a product restocked),
// so the two sets don't grow forever as the underlying data changes.
export function pruneNotificationState(liveKeys: string[]): void {
  const live = new Set(liveKeys);
  const seen = readKeys(SEEN_STORAGE_KEY);
  const cleared = readKeys(CLEARED_STORAGE_KEY);
  const prunedSeen = new Set([...seen].filter((k) => live.has(k)));
  const prunedCleared = new Set([...cleared].filter((k) => live.has(k)));
  if (prunedSeen.size !== seen.size) writeKeys(SEEN_STORAGE_KEY, prunedSeen);
  if (prunedCleared.size !== cleared.size) writeKeys(CLEARED_STORAGE_KEY, prunedCleared);
}
