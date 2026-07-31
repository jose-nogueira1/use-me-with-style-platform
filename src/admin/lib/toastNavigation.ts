import type { useNavigate } from 'react-router-dom';

/** Message handed to the NEXT screen after a navigation.
 *
 * Saving a product navigates back to the list, which unmounts the editor --
 * so the editor can't own its own confirmation. It passes the message
 * through router state instead, and the admin layout picks it up on arrival
 * (2026-07-30: previously a successful save produced no feedback at all, so
 * there was no way to tell whether anything had happened).
 *
 * Kept in its own module rather than alongside the component so the Toast
 * file only exports components, which is what react-refresh needs to hot-
 * reload it properly. */
export type ToastState = { toast?: string; toastId?: string };

export function navigateWithToast(
  navigate: ReturnType<typeof useNavigate>,
  to: string,
  toast: string,
) {
  // The id is what makes the toast fire again when the SAME message repeats
  // -- saving the same product twice in a row would otherwise look identical
  // to the already-consumed one and show nothing the second time.
  const state: ToastState = {
    toast,
    toastId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  navigate(to, { state });
}
