import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Bug fix, 2026-08-07: React Router's client-side navigation (unlike a real
// page load) never touches scroll position on its own -- so following any
// link near the bottom of a long page (the footer, in particular) swaps in
// the new page's content while the browser is still scrolled to wherever it
// was, forcing the visitor to scroll back up to see the top of what they
// just navigated to. Rendered once inside <BrowserRouter> in App.tsx.
//
// Keyed on `pathname` only, not the full location (search/hash) -- an
// in-place filter change on the same route (e.g. /catalogo?cat=vestidos ->
// ?cat=tops) is not "a new page" and shouldn't yank the shopper's scroll
// position away from the product grid they're actively browsing.
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
