import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { C, F, LIGHT_VARS, DARK_VARS } from './theme';
import { AppProvider } from './state/AppContext';
import { StorefrontLayout } from './storefront/StorefrontLayout';
import { Home } from './storefront/pages/Home';
import { Browse } from './storefront/pages/Browse';
import { ProductDetail } from './storefront/pages/ProductDetail';
import { Cart } from './storefront/pages/Cart';
import { Checkout } from './storefront/pages/Checkout';
import { ConfirmationLookup } from './storefront/pages/ConfirmationLookup';
import { Help } from './storefront/pages/Help';
import { AdminRoutes } from './admin/AdminRoutes';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: C.subtleBg, fontFamily: F.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* Theme (dark/light mode) -- storefront only, per product decision;
           the admin panel's dark sidebar + light content is a fixed part of
           the Figma design, not a toggle. :root carries the light values
           everywhere (including admin, which never sets data-theme), and
           .ump-shell[data-theme='dark'] overrides them only inside the
           storefront's own root element. */
        :root {
${Object.entries(LIGHT_VARS).map(([k, v]) => `          ${k}: ${v};`).join('\n')}
        }
        .ump-shell[data-theme='dark'] {
${Object.entries(DARK_VARS).map(([k, v]) => `          ${k}: ${v};`).join('\n')}
        }

        * { box-sizing: border-box; }
        body { margin: 0; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.rule}; border-radius: 3px; }

        @keyframes ump-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ump-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ump-fade-in { animation: ump-fade-in 0.4s ease both; }
        .ump-slide-up { animation: ump-slide-up 0.4s ease both; }
        .ump-hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .ump-hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        a { color: inherit; }

        /* --- Responsive storefront: mobile-first, desktop-ready --- */
        /* The shell itself is full-bleed on desktop (header/hero/footer
           backgrounds span the whole browser width, matching the Figma
           desktop frames) -- only a phone-width column on mobile, where
           there's no "page chrome vs. content" distinction yet. Individual
           content rows use .ump-content-width below to stay a readable
           max-width without capping the surrounding page background. */
        .ump-shell { max-width: 480px; margin: 0 auto; width: 100%; }
        @media (min-width: 720px) { .ump-shell { max-width: none; } }

        /* Content rows stay a comfortable reading width on typical monitors,
           but scale up further on larger/ultra-wide screens instead of
           capping out at a fixed desktop width -- that fixed cap was what
           made the app look "boxed" with dead space on wide displays. */
        .ump-content-width { max-width: 1240px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 1400px) { .ump-content-width { max-width: 1600px; } }
        @media (min-width: 1800px) { .ump-content-width { max-width: 1900px; } }

        .ump-narrow { max-width: 480px; margin: 0 auto; }

        /* Header: mobile shows the same utility cluster (region + theme +
           cart) as desktop -- only the text nav links are desktop-only. */
        .ump-desktop-nav { display: none; }
        @media (min-width: 860px) {
          .ump-desktop-nav { display: flex; }
        }

        /* Hamburger/back button + its dropdown menu are a mobile-only
           pattern -- desktop already has the full text nav above, so both
           are force-hidden with !important past 860px. !important is
           needed here, not just a plain override, because the button also
           carries an inline display:flex style for its own layout --
           inline styles beat a plain class rule, so a non-important rule
           would silently lose and the button would keep showing on desktop,
           same bug as the earlier duplicate theme-toggle issue. */
        @media (min-width: 860px) {
          .ump-mobile-menu-btn { display: none !important; }
          .ump-mobile-menu { display: none !important; }
        }

        /* Bottom tab bar is a mobile pattern; desktop uses the header nav.
           This wrapper is just a show/hide switch -- it used to be display:
           flex with no flex-direction (defaults to row), so its one child
           (the actual nav bar) had no flex-grow and shrank to fit its own
           content instead of stretching full-width. Barely visible on a
           true phone-width viewport (shrink-to-fit is close to the screen
           width by coincidence), but obvious as a small box hugging the
           left edge at any wider in-between width, e.g. a resized desktop
           window. Plain block lets the child fill the available width like
           any normal block-level element. */
        .ump-bottom-nav { display: block; }
        @media (min-width: 860px) { .ump-bottom-nav { display: none; } }

        /* Site footer: stacked sections on mobile, a 4-column grid (wider
           brand column) on desktop. Extra bottom padding on mobile clears
           the sticky bottom tab bar so the last footer row never sits
           underneath it. */
        .ump-footer { padding-bottom: 84px; }
        @media (min-width: 860px) { .ump-footer { padding-bottom: 0; } }
        .ump-footer-grid { display: flex; flex-direction: column; gap: 28px; padding: 32px 20px 24px; }
        @media (min-width: 720px) {
          .ump-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; padding: 44px 20px 28px; }
        }
        .ump-footer-bottom { padding: 16px 20px 22px; border-top: 1px solid ${C.ruleLight}; }

        /* Home hero: single column on mobile, headline + photo side-by-side
           on desktop (per "07. Desktop Home and Collection"). */
        .ump-hero-grid { display: block; }
        .ump-hero-photo { display: none; margin-top: 20px; }
        @media (min-width: 860px) {
          .ump-hero-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; }
          .ump-hero-photo { display: block; margin-top: 0; height: 360px !important; }
        }

        .ump-grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }

        .ump-cat-row { display: flex; gap: 10px; overflow-x: auto; }
        @media (min-width: 720px) { .ump-cat-row { display: grid; grid-template-columns: repeat(4, 1fr); overflow-x: visible; } }

        /* Browse: sidebar filter panel on desktop (per "D02. Desktop Browse
           and Filter"), inline pills + slide-down panel on mobile. */
        .ump-browse-layout { display: block; }
        .ump-browse-sidebar { display: none; }
        @media (min-width: 860px) {
          .ump-browse-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; max-width: 1240px; margin: 0 auto; }
          .ump-browse-sidebar { display: block; padding: 20px; border-right: 1px solid ${C.ruleLight}; }
          .ump-browse-catpills { display: none !important; }
          .ump-browse-filter-toggle { display: none !important; }
        }
        @media (min-width: 1400px) { .ump-browse-layout { max-width: 1600px; } }
        @media (min-width: 1800px) { .ump-browse-layout { max-width: 1900px; } }

        /* Product detail: stacked image-then-info on mobile, side-by-side on
           desktop (per "D03. Desktop Product Detail"). */
        .ump-product-layout { display: block; }
        @media (min-width: 860px) {
          .ump-product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: flex-start; max-width: 1000px; margin: 0 auto; }
        }
        .ump-sticky-cta { position: sticky; bottom: 0; }
        @media (min-width: 860px) { .ump-sticky-cta { position: static; border-top: none !important; box-shadow: none !important; } }
        .ump-pd-width { }
        @media (min-width: 860px) { .ump-pd-width { max-width: 1000px; margin: 0 auto; } }

        /* --- Admin: desktop-first, degrades gracefully on narrower screens. --- */
        .ump-admin-shell { display: flex; min-height: 100vh; }
        .ump-admin-sidebar { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; }
        .ump-admin-groups { display: flex; flex-direction: column; }
        .ump-admin-user-block { margin-top: auto; }
        @media (max-width: 860px) {
          .ump-admin-shell { flex-direction: column; }
          .ump-admin-sidebar { width: 100%; flex-direction: row; align-items: center; overflow-x: auto; padding: 10px 12px; }
          .ump-admin-groups { flex-direction: row; gap: 2px; margin-bottom: 0 !important; }
          .ump-admin-group-label { display: none; }
          .ump-admin-user-block { display: none; }
          .ump-admin-nav-item { border-left: none !important; border-bottom: 3px solid transparent; white-space: nowrap; }
        }
        .ump-admin-table-wrap { overflow-x: auto; }
        @media (max-width: 860px) { .ump-admin-table-wrap > * { min-width: 640px; } }

        /* Admin two/three-column card grids (dashboard, orders + side panel,
           settings cards, product editor fields): stack to one column below
           the point where columns would get too cramped to read. */
        @media (max-width: 1000px) {
          .ump-admin-dashboard-grid, .ump-admin-orders-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .ump-admin-fields-grid { grid-template-columns: 1fr !important; }
        }

        .ump-mensagens-shell { display: flex; height: 100vh; }
        .ump-mensagens-list { width: 320px; flex-shrink: 0; }
        @media (max-width: 860px) {
          .ump-mensagens-shell { flex-direction: column; height: auto; }
          .ump-mensagens-list { width: 100%; max-height: 40vh; }
        }
      `}</style>

      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route element={<StorefrontLayout />}>
              <Route index element={<Home />} />
              <Route path="catalogo" element={<Browse />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="encomenda-confirmada/:orderNumber" element={<ConfirmationLookup />} />
              <Route path="conta" element={<ConfirmationLookup />} />
              <Route path="ajuda" element={<Help />} />
            </Route>
            <Route path="admin/*" element={<AdminRoutes />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </div>
  );
}
