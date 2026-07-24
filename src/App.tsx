import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { C, F, LIGHT_VARS, DARK_VARS } from './theme';
import { AppProvider } from './state/AppContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const StorefrontLayout = lazy(() => import('./storefront/StorefrontLayout').then((m) => ({ default: m.StorefrontLayout })));
const Home = lazy(() => import('./storefront/pages/Home').then((m) => ({ default: m.Home })));
const Browse = lazy(() => import('./storefront/pages/Browse').then((m) => ({ default: m.Browse })));
const ProductDetail = lazy(() => import('./storefront/pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./storefront/pages/Cart').then((m) => ({ default: m.Cart })));
const Checkout = lazy(() => import('./storefront/pages/Checkout').then((m) => ({ default: m.Checkout })));
const ConfirmationLookup = lazy(() => import('./storefront/pages/ConfirmationLookup').then((m) => ({ default: m.ConfirmationLookup })));
const Help = lazy(() => import('./storefront/pages/Help').then((m) => ({ default: m.Help })));
const About = lazy(() => import('./storefront/pages/About').then((m) => ({ default: m.About })));
const PrivacyPolicy = lazy(() => import('./storefront/pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./storefront/pages/Terms').then((m) => ({ default: m.Terms })));
const AdminRoutes = lazy(() => import('./admin/AdminRoutes').then((m) => ({ default: m.AdminRoutes })));
const NotFound = lazy(() => import('./storefront/pages/NotFound').then((m) => ({ default: m.NotFound })));

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
        :focus-visible { outline: 3px solid ${C.gold}; outline-offset: 3px; }
        .ump-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }

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

        /* Form/reading-width pages (Cart, Checkout, About, Help, order
           lookup/confirmation, Privacy Policy, Terms, 404) -- added
           2026-07-24 per the responsive audit. These pages all used
           .ump-narrow directly, which never widens past 480px at any
           breakpoint (unlike .ump-shell/.ump-content-width above), so on a
           real desktop monitor each one rendered as a narrow column pinned
           to the left with roughly two-thirds of the screen empty --
           especially noticeable on Checkout, the page most likely to be
           open on a customer's desktop right before they pay. This isn't
           meant to be a full bespoke desktop layout like Home/Browse/Product
           Detail (Figma's inventory doesn't design desktop versions of these
           screens) -- just enough width to stop the page looking abandoned. */
        .ump-form-width { max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 860px) { .ump-form-width { max-width: 640px; } }

        /* Cart & Checkout: two-column desktop layout (Phase 4, 2026-07-24 --
           follow-up to the .ump-form-width fix above). Figma's screen
           inventory doesn't include desktop mockups for either page, so
           this is an original layout built from the same Section/Field/
           card components and spacing already used everywhere else, not a
           literal design handoff -- item list/form on the left, order
           summary + the checkout/pay button sticky on the right, the
           pattern most ecommerce sites use so the total and CTA stay
           visible while scrolling a long form or cart.
           Two steps, not one: single-column widening at 720px (matching
           .ump-form-width's own cutover, so a page using one class doesn't
           visually seam against a page using the other), then the actual
           grid split at 860px -- later than Browse/Product Detail's 720px
           cutover on purpose. Their sidebar is a slim 220px; the summary
           column here is 360px, proportionally much wider, so it needs more
           total width before splitting into two columns reads as
           comfortable rather than cramped. */
        .ump-checkout-layout,
        .ump-cart-layout { max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 720px) {
          .ump-checkout-layout,
          .ump-cart-layout { max-width: 640px; }
        }
        @media (min-width: 860px) {
          .ump-checkout-layout,
          .ump-cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 48px; align-items: start; max-width: 1040px; }
        }
        .ump-checkout-summary,
        .ump-cart-summary { margin-top: 20px; }
        @media (min-width: 860px) {
          /* top: 90px clears the storefront header, which is
             position: sticky; top: 0 and roughly 68-70px tall (14px
             vertical padding + a 38px logo) -- 90px leaves a little
             breathing room below it rather than the summary card touching
             the header on scroll. */
          .ump-checkout-summary,
          .ump-cart-summary { margin-top: 0; position: sticky; top: 90px; }
        }

        /* Header: mobile shows the same utility cluster (region + theme +
           cart) as desktop -- only the text nav links are desktop-only.
           Breakpoint matches .ump-footer-grid/.ump-cat-row below (720px),
           not the 860px used elsewhere for hero/browse/product layouts --
           this is the "mobile chrome vs. desktop chrome" cutover
           specifically, so it can't disagree with the content around it
           (previously this was 860px while the footer/category grids below
           already went desktop-style at 720px, so a resized window in that
           720-860px gap showed a hamburger + bottom tab bar stacked above
           already-desktop-looking content). */
        .ump-desktop-nav { display: none; }
        @media (min-width: 720px) {
          .ump-desktop-nav { display: flex; }
        }

        /* Hamburger/back button + its dropdown menu are a mobile-only
           pattern -- desktop already has the full text nav above, so both
           are force-hidden with !important past 720px (same breakpoint as
           .ump-desktop-nav above -- they're a matched pair, never move one
           without the other). !important is needed here, not just a plain
           override, because the button also carries an inline display:flex
           style for its own layout -- inline styles beat a plain class rule,
           so a non-important rule would silently lose and the button would
           keep showing on desktop, same bug as the earlier duplicate
           theme-toggle issue. */
        @media (min-width: 720px) {
          .ump-mobile-menu-btn { display: none !important; }
          .ump-mobile-menu { display: none !important; }
        }

        /* Bottom tab bar is a mobile pattern; desktop uses the header nav.
           Same 720px cutover as the header chrome above -- it used to be
           860px, which left the bar (and the hamburger above) showing
           alongside the already-desktop-styled 4-column footer/category
           grids in the 720-860px range. This wrapper is just a show/hide
           switch -- it used to be display: flex with no flex-direction
           (defaults to row), so its one child (the actual nav bar) had no
           flex-grow and shrank to fit its own content instead of stretching
           full-width. Barely visible on a true phone-width viewport
           (shrink-to-fit is close to the screen width by coincidence), but
           obvious as a small box hugging the left edge at any wider
           in-between width, e.g. a resized desktop window. Plain block lets
           the child fill the available width like any normal block-level
           element. */
        .ump-bottom-nav { display: block; }
        @media (min-width: 720px) { .ump-bottom-nav { display: none; } }

        /* Site footer: stacked sections on mobile, a 4-column grid (wider
           brand column) on desktop. Extra bottom padding on mobile clears
           the fixed bottom tab bar so the last footer row/copyright never
           sits underneath it -- matches the bar's own breakpoint (720px)
           above, not 860px, for the same reason. */
        .ump-footer { padding-bottom: 84px; }
        @media (min-width: 720px) { .ump-footer { padding-bottom: 0; } }
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
        /* Product grid (Browse, Home featured, recommendations): 150px is
           deliberately low so two cards still fit on the narrowest phones
           this app targets (150*2 + 10px gap fits inside a 320px screen's
           ~280px content width) -- raising that floor would break mobile,
           so it can't just be bumped everywhere. At the very wide end
           (.ump-content-width caps out at 1900px), a 150px floor works out
           to ~12 columns of fairly small, dense cards. Verified fine at
           ~1560px (7 comfortable columns); this override only engages above
           1800px -- past what could be checked directly in this environment
           -- as a light safeguard against cards getting too small/cramped
           on a genuine ultra-wide monitor (2026-07-24, responsive audit,
           Finding 7). */
        @media (min-width: 1800px) { .ump-grid-auto { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); } }

        /* Home: Instagram feed (2026-07-10) -- 3 columns on mobile (matches
           the real Instagram grid feel at small sizes), 6 on desktop so all
           tiles sit in a single row. */
        .ump-instagram-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (min-width: 720px) { .ump-instagram-grid { grid-template-columns: repeat(6, 1fr); gap: 10px; } }
        .ump-instagram-tile-overlay { transition: opacity 0.15s ease; }
        .ump-instagram-tile:hover .ump-instagram-tile-overlay { opacity: 1 !important; }

        .ump-cat-row { display: flex; gap: 10px; overflow-x: auto; }
        @media (min-width: 720px) { .ump-cat-row { display: grid; grid-template-columns: repeat(4, 1fr); overflow-x: visible; } }

        /* Browse: sidebar filter panel on desktop (per "D02. Desktop Browse
           and Filter"), inline pills + slide-down panel on mobile. Breakpoint
           lowered from 860px to 720px 2026-07-24 (responsive audit, Finding
           3): 720px is where the header/footer/nav chrome already switches
           to its desktop form (.ump-desktop-nav, .ump-footer-grid, etc), so
           860px left a real tablet-portrait gap (iPad portrait is 768px,
           most Android tablets 744-800px) where the header looked "desktop"
           but Browse still rendered the mobile category-pill row and
           slide-down filter panel instead of the sidebar, even though there
           was clearly enough width for it. Verified at 768px: 220px sidebar
           + auto-fill product grid both fit comfortably at that width. */
        .ump-browse-layout { display: block; }
        .ump-browse-sidebar { display: none; }
        @media (min-width: 720px) {
          .ump-browse-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; max-width: 1240px; margin: 0 auto; }
          .ump-browse-sidebar { display: block; padding: 20px; border-right: 1px solid ${C.ruleLight}; }
          .ump-browse-catpills { display: none !important; }
          .ump-browse-filter-toggle { display: none !important; }
        }
        @media (min-width: 1400px) { .ump-browse-layout { max-width: 1600px; } }
        @media (min-width: 1800px) { .ump-browse-layout { max-width: 1900px; } }

        /* Product detail: stacked image-then-info on mobile, side-by-side on
           desktop (per "D03. Desktop Product Detail"). Breakpoint lowered
           860px -> 720px 2026-07-24 for the same reason as Browse above --
           at 768px (tablet portrait) the product photo was rendering as a
           near-full-width square dominating the whole screen with a
           cramped info column stacked underneath, when the side-by-side
           layout (two ~340px columns at 720px viewport) reads much better
           and fits fine. Kept in lockstep with .ump-sticky-cta/.ump-pd-width
           below, and with the header/footer's own 720px cutover, so there's
           no width range where some chrome looks desktop and some looks
           mobile at once. */
        .ump-product-layout { display: block; }
        @media (min-width: 720px) {
          .ump-product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: flex-start; max-width: 1000px; margin: 0 auto; }
        }
        /* Bottom offset clears the fixed bottom tab bar (~58px tall) on true
           mobile widths, where both this CTA and the tab bar are visible at
           once -- otherwise the tab bar (position: fixed, always pinned)
           would sit on top of the Add to Cart button instead of below it.
           Above 720px the tab bar is hidden entirely (see .ump-bottom-nav),
           so there's nothing left to clear. */
        .ump-sticky-cta { position: sticky; bottom: 58px; }
        @media (min-width: 720px) { .ump-sticky-cta { bottom: 0; position: static; border-top: none !important; box-shadow: none !important; } }
        .ump-pd-width { }
        @media (min-width: 720px) { .ump-pd-width { max-width: 1000px; margin: 0 auto; } }

        /* --- Admin: desktop-first, degrades gracefully on narrower screens. --- */
        .ump-admin-shell { display: flex; min-height: 100vh; }
        .ump-admin-sidebar { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; }
        .ump-admin-groups { display: flex; flex-direction: column; }
        .ump-admin-user-block { margin-top: auto; }
        /* Admin content had no upper width bound at all -- unlike the
           storefront (.ump-content-width caps at 1240-1900px depending on
           breakpoint), the column next to the sidebar was plain flex: 1
           with nothing capping the top end. Harmless up to ~1800px (verified
           up to ~1560px this session -- metric cards, tables, and grids all
           still read fine), but on a genuine ultra-wide monitor everything
           in it (Dashboard's metric cards, every table row) would stretch
           very wide with no real benefit, hurting scannability. Added
           2026-07-24 (responsive audit, Finding 4) as a no-downside cap: it
           only ever engages above 1800px, well past what was actually
           tested. */
        .ump-admin-content-width { max-width: 1800px; margin: 0 auto; }
        /* Sticky sidebar (added 2026-07-24, responsive audit): without this,
           the sidebar is just a normal flex child that scrolls away with the
           rest of the page -- on any admin screen taller than one viewport
           (Settings, ProductEditor, OrderDetail all commonly are), scrolling
           down to read/edit content also scrolls the primary nav
           (Dashboard/Orders/Products/Settings) out of view, so getting back
           to another section means scrolling all the way back to the top
           first. Gated to desktop widths only (mobile's horizontal top bar
           has no equivalent problem -- it's already short and always at the
           very top of the page). overflow-y: auto lets the sidebar scroll
           independently on the rare case its own content (many nav items)
           exceeds the viewport height, instead of clipping. */
        @media (min-width: 861px) {
          .ump-admin-sidebar { position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        }
        /* "More" dropdown toggle for the secondary nav group (Customers,
           Messages, Invoices, Media): a normal inline list on desktop, a
           single toggle button + dropdown panel on mobile. Added
           2026-07-24 (admin responsive audit, Finding 1).
           The panel is positioned via inline style (position: fixed, with
           top/left computed from the toggle button's own on-screen rect in
           AdminLayout.tsx) rather than CSS anchoring -- the mobile sidebar
           has overflow-x: auto, which per the CSS spec silently forces its
           other axis (overflow-y) to 'auto' too as soon as one axis is
           non-visible, so a plain position: absolute panel nested inside
           it was getting clipped to the bar's own height instead of
           floating over the page content below. position: fixed escapes
           that clipping entirely, since its containing block is the
           viewport, not the scrolling sidebar. */

        .ump-admin-more-toggle { display: none; }
        .ump-admin-more-panel { z-index: 40; min-width: 190px; }
        @media (max-width: 860px) {
          .ump-admin-shell { flex-direction: column; }
          .ump-admin-sidebar { width: 100%; flex-direction: row; align-items: center; overflow-x: auto; padding: 10px 12px; }
          .ump-admin-groups { flex-direction: row; gap: 2px; margin-bottom: 0 !important; }
          .ump-admin-group-label { display: none; }
          .ump-admin-user-block { display: none; }
          .ump-admin-nav-item { border-left: none !important; border-bottom: 3px solid transparent; white-space: nowrap; }
          .ump-admin-secondary-list { display: none !important; }
          .ump-admin-more-toggle { display: inline-flex !important; }
        }
        .ump-admin-table-wrap { overflow-x: auto; }
        @media (max-width: 860px) { .ump-admin-table-wrap > * { min-width: 640px; } }

        /* PageHeader's search/notification popovers are positioned
           right: 0 relative to their own icon button so they line up under
           the icon on desktop, where the button cluster sits at the far
           right of the header row. Below 860px the header row wraps and the
           icon cluster moves to the left edge (see PageHeader.tsx's
           space-between layout with only one item on the wrapped line), so a
           fixed 360px-wide, right-anchored popover would extend off-screen
           to the left. Re-anchor to the button's left edge and cap the width
           to the viewport instead. */
        @media (max-width: 860px) {
          .ump-admin-popover { left: 0 !important; right: auto !important; width: min(340px, calc(100vw - 56px)) !important; }
        }

        /* Admin two/three-column card grids (dashboard, orders + side panel,
           settings cards, product editor fields): stack to one column below
           the point where columns would get too cramped to read. */
        /* minmax(0, 1fr), not bare 1fr: a plain 1fr track's minimum size
           defaults to its content's min-content width, not 0 -- so a single
           stacked column can still refuse to shrink below whatever its
           widest child needs (a <select>, an unbroken label, a nested grid)
           and overflow the page at narrow widths instead of wrapping/
           shrinking. Verified overflowing by 8px at 320px on ProductEditor
           before this fix (admin responsive audit, Finding 2, 2026-07-24).
           minmax(0, 1fr) removes that implicit floor. */
        @media (max-width: 1000px) {
          .ump-admin-dashboard-grid, .ump-admin-orders-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .ump-admin-fields-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }

        .ump-mensagens-shell { display: flex; height: 100vh; }
        .ump-mensagens-list { width: 320px; flex-shrink: 0; }
        @media (max-width: 860px) {
          .ump-mensagens-shell { flex-direction: column; height: auto; }
          .ump-mensagens-list { width: 100%; max-height: 40vh; }
        }
      `}</style>

      <AppErrorBoundary>
        <BrowserRouter>
          <AppProvider>
          <Suspense fallback={<div role="status" style={{ padding: 40, textAlign: 'center', color: C.inkSoft }}>…</div>}><Routes>
            <Route element={<StorefrontLayout />}>
              <Route index element={<Home />} />
              <Route path="catalogo" element={<Browse />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="encomenda-confirmada/:orderNumber" element={<ConfirmationLookup />} />
              <Route path="conta" element={<ConfirmationLookup />} />
              <Route path="ajuda" element={<Help />} />
              <Route path="sobre" element={<About />} />
              <Route path="politica-privacidade" element={<PrivacyPolicy />} />
              <Route path="termos-condicoes" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/*" element={<AdminRoutes />} />
          </Routes></Suspense>
          </AppProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </div>
  );
}
