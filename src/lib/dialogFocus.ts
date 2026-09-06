export function wrappedDialogFocusIndex(
  activeIndex: number,
  focusableCount: number,
  backward: boolean,
): number | null {
  if (focusableCount === 0) return -1;
  if (backward && activeIndex <= 0) return focusableCount - 1;
  if (!backward && activeIndex >= focusableCount - 1) return 0;
  return null;
}

export function useModalDialog(
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (root) root.inert = true;

    const focusables = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => element.offsetParent !== null);
    const initial = panelRef.current?.querySelector<HTMLElement>('[data-dialog-initial-focus]')
      ?? focusables()[0]
      ?? panelRef.current;
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const activeIndex = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = wrappedDialogFocusIndex(activeIndex, items.length, event.shiftKey);
      if (nextIndex === null) return;
      event.preventDefault();
      if (nextIndex === -1) panelRef.current?.focus();
      else items[nextIndex]?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = false;
      previousFocus?.focus();
    };
  }, [onClose, open, panelRef]);
}
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
