/** Tracks whether a form's current value differs from the value it was
 * loaded with (2026-07-31 admin report: Save should be disabled until
 * something has actually changed -- clicking it with no edits re-saved
 * identical data with no feedback that nothing had happened).
 *
 * Plain JSON.stringify comparison: every caller's "current" and "baseline"
 * are built by the same code path (the same setForm-shaped object each
 * time), so key order is stable and a deep-equality library isn't needed.
 * `baseline === null` (data still loading, or a brand-new record with
 * nothing to compare against yet) reads as "not dirty" -- callers that want
 * a new record's Save always enabled should gate on `isNew` themselves
 * rather than rely on this hook, since "unchanged from blank" isn't a
 * meaningful state to block on the way "unchanged from what's saved" is. */
export function useDirty<T>(current: T, baseline: T | null): boolean {
  if (baseline === null) return false;
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
