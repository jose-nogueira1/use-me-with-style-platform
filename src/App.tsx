import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { C, F, LIGHT_VARS, DARK_VARS } from './theme';
import { AppProvider } from './state/AppContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';

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
const DataDeletion = lazy(() => import('./storefront/pages/DataDeletion').then((m) => ({ default: m.DataDeletion })));
const ShopInstagram = lazy(() => import('./storefront/pages/ShopInstagram').then((m) => ({ default: m.ShopInstagram })));
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

        /* Generic loading placeholder (2026-07-26, cart-pricing QA fix) --
           used wherever real data hasn't arrived yet and showing a real-
           looking but wrong number (e.g. "0 Kz") would be misleading. Plain
           background-color rather than the theme's --c-* vars so it stays
           visible against both light and dark subtle-bg tones. */
        @keyframes ump-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .ump-skeleton { display: inline-block; border-radius: 4px; background: currentColor; opacity: 0.16; animation: ump-pulse 1.4s ease-in-out infinite; }
        @keyframes appypay-payment-spin { to { transform: rotate(360deg); } }
        .appypay-payment-spinner { animation: appypay-payment-spin 0.8s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .appypay-payment-spinner { animation-duration: 1.8s; } }

        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        a { color: inherit; }
        :focus-visible { outline: 3px solid ${C.gold}; outline-offset: 3px; }
        .ump-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }

        /* --- Responsive storefront: mobile-first, desktop-ready --- */
        /* The shell always fills the viewport. Content rows below provide
           their own readable max-widths. The previous 480px shell cap stayed
           active all the way to the 720px desktop breakpoint, producing a
           phone-width storefront with large side gutters on tablets, split
           view, and zoomed browser windows in the 481-719px range. */
        .ump-shell { width: 100%; }

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
        /* padding-bottom (2026-07-30): in the stacked single-column layout
           neither column had any bottom spacing, so the summary card --
           "Finalizar compra" on cart, "Pagar agora" on checkout -- butted
           straight against the top edge of the footer with no gap, reading
           as if the two were one block. Applied to the shared container
           rather than to .ump-*-summary so the items/form column clears the
           footer too whenever it happens to be the taller of the two. */
        .ump-checkout-layout,
        .ump-cart-layout { max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 32px; }
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
        @media (max-width: 340px) {
          .ump-theme-toggle { display: none !important; }
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

        /* Home hero: headline above the photo on mobile, side-by-side on
           desktop (per "07. Desktop Home and Collection").
           The mobile rule used to be "display: none", which hid the hero
           visual outright on every viewport under 860px -- i.e. on every
           phone, the single most-viewed screen opened with a wall of text
           and no imagery, on a fashion storefront (2026-07-30 fix). The
           vestigial "margin-top: 20px" on that same hidden rule is the
           giveaway that stacking was always the intent. It now shows at the
           260px height the element already carries inline, with the desktop
           override lifting it to 360px alongside the copy. */
        .ump-hero-grid { display: block; }
        .ump-hero-photo { display: block; margin-top: 20px; }
        @media (min-width: 860px) {
          .ump-hero-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; }
          .ump-hero-photo { display: block; margin-top: 0; height: 360px !important; }
        }

        .ump-grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 10px; }
        /* Product grid (Browse, Home featured, recommendations): 150px is
           the target card width, but minmax(min(150px, 100%), 1fr) -- not
           minmax(150px, 1fr) -- is what actually keeps this safe.
           minmax(150px, 1fr) sets an unconditional 150px floor per track;
           the browser then has to pick a column count whose floors add up
           to no more than the container's width. At true narrow-phone
           widths that math doesn't work out the way the original version
           of this comment assumed: a 320px screen's actual content width
           here is ~274px (verified directly, not the ~280px this comment
           previously guessed), which is *less* than the 310px two 150px
           columns plus a 10px gap need. Chrome quietly self-corrects by
           collapsing to one column instead of forcing the impossible
           layout, so this looked fine there -- but a real-device recording
           (2026-07-25) showed Safari rendering two 150px-floor columns
           anyway and overflowing the page. min(150px, 100%) caps the
           per-track floor at the container's own width, so the minimum a
           track can ever demand is "the whole row" -- it can never add up
           to more than what's actually there, in any browser, regardless
           of how that browser's auto-fill implementation counts columns.
           At the very wide end (.ump-content-width caps out at 1900px), a
           150px floor works out to ~12 columns of fairly small, dense
           cards; this override raises the floor to 190px above 1800px as a
           light safeguard against cards getting too small/cramped on a
           genuine ultra-wide monitor (2026-07-24, responsive audit,
           Finding 7). */
        @media (min-width: 1800px) { .ump-grid-auto { grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr)); } }

        /* Home: Instagram feed (2026-08-02 redesign) -- full-bleed,
           auto-scrolling/draggable strip instead of a fixed-column grid, so
           tiles can be meaningfully larger than the old 6-column layout
           allowed inside .ump-content-width. Portrait 4:5 tiles (closer to
           how the photos actually look on Instagram than the old 1:1 crop).
           Scrollbar hidden across browsers since the strip auto-scrolls and
           is drag/swipe-able -- a visible scrollbar would be redundant and
           fight the edge-fade mask below. Edge fade masks give the strip a
           "continues past the viewport" feel appropriate for a full-bleed
           row instead of a hard-clipped edge. */
        .ump-instagram-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 4px 20px;
          cursor: grab;
          /* Native panning allowed in both axes now (2026-08-07 bug fix) --
             touch/pen drag is no longer intercepted in JS (see
             InstagramFeed.tsx's onPointerDown), so the browser needs to be
             free to handle horizontal touch scrolling itself. Previously
             just pan-y, which told the browser to hand X-axis touch
             gestures to JS instead of scrolling natively -- correct in
             theory, but WebKit's handoff for that combination is unreliable
             in practice, and the net effect was a strip that felt "stuck"
             on real iPhones. Still excludes pinch-zoom so a two-finger
             gesture on the strip doesn't zoom the page. */
          touch-action: pan-x pan-y;
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
        }
        .ump-instagram-track::-webkit-scrollbar { display: none; }
        .ump-instagram-track:active { cursor: grabbing; }
        /* Fewer than MIN_TILES_TO_LOOP tiles (e.g. a freshly-curated set of
           1-3 posts) aren't duplicated for the auto-scroll loop (see
           InstagramFeed.tsx) -- centered so a short row reads as a
           deliberate, curated selection instead of a few tiles stranded at
           the left edge of a full-bleed section. */
        .ump-instagram-track--compact { justify-content: center; }
        /* Tiles are <button>s now (2026-08-02 round 2 -- they open an
           in-page lightbox rather than being a link), so browser button
           defaults (border, background, font, text-align) are reset here. */
        .ump-instagram-tile {
          position: relative;
          display: block;
          flex: 0 0 auto;
          width: 190px;
          aspect-ratio: 4 / 5;
          border-radius: 10px;
          overflow: hidden;
          user-select: none;
          -webkit-user-drag: none;
          border: none;
          background: none;
          padding: 0;
          font: inherit;
          text-align: inherit;
          cursor: pointer;
        }
        .ump-instagram-tile:disabled { cursor: default; }
        @media (min-width: 560px) { .ump-instagram-tile { width: 230px; } }
        @media (min-width: 900px) { .ump-instagram-tile { width: 260px; } }
        @media (min-width: 1400px) { .ump-instagram-tile { width: 300px; } }
        /* "Large" tiles (curated, or the every-4th-tile fallback pattern)
           break the otherwise-uniform row -- roughly 1.3x a regular tile at
           every breakpoint, not just the widest one. */
        .ump-instagram-tile.ump-instagram-tile--large { width: 250px; }
        @media (min-width: 560px) { .ump-instagram-tile.ump-instagram-tile--large { width: 305px; } }
        @media (min-width: 900px) { .ump-instagram-tile.ump-instagram-tile--large { width: 345px; } }
        @media (min-width: 1400px) { .ump-instagram-tile.ump-instagram-tile--large { width: 400px; } }
        /* Hover-only "expand" cue -- supplementary to the always-visible
           caption below, not a replacement for it (hover doesn't exist on
           touch, so it can never be the only thing telling someone a tile
           is interactive/has content). */
        .ump-instagram-tile-hover {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${C.scrimSoft};
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .ump-instagram-tile:hover .ump-instagram-tile-hover,
        .ump-instagram-tile:focus-visible .ump-instagram-tile-hover { opacity: 1; }
        /* Persistent caption -- "a reason to exist beyond a photo". Always
           visible (not hover-gated), 2-line clamp so a long fallback
           caption never overruns a regular-width tile. */
        .ump-instagram-tile-caption {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: 20px 10px 10px;
          background: linear-gradient(to top, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.38) 55%, transparent 100%);
          pointer-events: none;
        }
        .ump-instagram-tile-caption span {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 11.5px;
          font-weight: 700;
          line-height: 1.35;
          color: ${C.onDark};
          text-align: left;
        }
        .ump-instagram-shop-badge {
          position: absolute; top: 9px; left: 9px;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 8px; border-radius: 999px;
          background: rgba(5,5,5,0.78); color: ${C.onDarkGold};
          font-size: 9px; font-weight: 850; line-height: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          pointer-events: none;
        }

        /* Lightbox (2026-08-02 round 2: "don't send people away
           immediately" -- clicking a tile opens this instead of an instant
           navigation to Instagram; the storefront's only other lightbox-
           style overlay is ProductDetail's size-guide modal, whose
           role="dialog"/scrim/close-button pattern this follows). */
        .ump-instagram-lightbox-backdrop {
          position: fixed; inset: 0; z-index: 40;
          background: ${C.scrim};
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .ump-instagram-lightbox {
          position: relative;
          background: ${C.paper};
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.28);
        }
        /* flex-shrink: 0 (2026-08-07 bug fix, "shoppable lightbox looks cut
           on mobile"): this box sizes itself from aspect-ratio, but as a
           flex-column child it's still a shrink target by default. When the
           body below it has enough content to push the column past the
           modal's max-height (18px more likely with the shoppable "Comprar
           este look" product card than with a plain caption alone), the flex
           algorithm shrank THIS box to help fit -- and shrinking a box with
           aspect-ratio set doesn't just clip it, it recomputes both
           dimensions to preserve the ratio, squashing the photo narrower
           than the panel and making the crop line jump around. Pinning
           flex-shrink to 0 keeps the photo exactly as tall as its own
           aspect-ratio/max-height says, every time, regardless of the body's
           height -- only the body (below) is allowed to give ground. */
        .ump-instagram-lightbox-image { aspect-ratio: 4 / 5; max-height: 60vh; flex-shrink: 0; }
        /* flex: 1 1 auto + min-height: 0 (same fix): without min-height: 0,
           a flex child defaults to a min-height equal to its own content
           size, which blocks it from ever shrinking down to "whatever's
           left after the image" -- so on a tall shoppable post the combined
           column overshot the modal's max-height: 90vh, and since the modal
           itself clips with overflow: hidden (needed for its rounded
           corners), the overflow-y: auto here never got a chance to kick in;
           it just got silently cut off at the container edge instead of
           scrolling. With min-height: 0, this box actually shrinks to the
           remaining space and its own scrollbar takes over from there. */
        .ump-instagram-lightbox-body { padding: 16px 18px 18px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
        .ump-instagram-product-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin-top: 9px; }
        @media (min-width: 760px) {
          .ump-instagram-lightbox.ump-instagram-lightbox--shoppable {
            max-width: 860px;
            display: grid;
            grid-template-columns: minmax(300px, 0.9fr) minmax(340px, 1.1fr);
            align-items: stretch;
          }
          .ump-instagram-lightbox--shoppable .ump-instagram-lightbox-image {
            aspect-ratio: auto;
            min-height: 560px;
            max-height: 86vh;
          }
          .ump-instagram-lightbox--shoppable .ump-instagram-lightbox-body { max-height: 86vh; padding: 24px; }
        }
        .ump-instagram-lightbox-close {
          position: absolute; top: 10px; right: 10px; z-index: 1;
          width: 32px; height: 32px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5,5,5,0.5); color: ${C.onDark};
          border: none; cursor: pointer;
        }

        .ump-shop-instagram-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr));
          gap: 18px;
        }
        .ump-shop-instagram-detail { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 28px; align-items: start; }
        .ump-shop-instagram-products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 760px) {
          .ump-shop-instagram-detail { grid-template-columns: minmax(0, 1fr); }
          .ump-shop-instagram-products { grid-template-columns: minmax(0, 1fr); }
        }

        .ump-cat-row { display: flex; gap: 10px; overflow-x: auto; }
        @media (min-width: 720px) { .ump-cat-row { display: grid; grid-template-columns: repeat(4, 1fr); overflow-x: visible; } }
        /* Category tiles (2026-07-25 redesign: full-bleed portrait photo with
           an overlaid label instead of a tiny thumbnail floating in a mostly-
           empty card). Tiles use aspect-ratio for their height, which needs an
           explicit width to resolve against in the mobile flex row -- the
           desktop grid below overrides this via grid-template-columns instead. */
        .ump-cat-tile { flex: 0 0 42%; }
        @media (min-width: 720px) { .ump-cat-tile { flex: none; } }

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
        /* padding-top (2026-08-07 bug fix, "image is touching the nav bar
           on top"): this layout had zero top spacing at any width, so the
           edge-to-edge hero photo sat flush against the sticky header below
           it with no gap at all -- same 20px the browse sidebar already
           uses for its own top breathing room. */
        .ump-product-layout { display: block; padding-top: 20px; }
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
        /* Mobile nav: hamburger + off-canvas drawer. Added 2026-07-24
           (admin responsive audit, Finding 1), reworked same day from an
           earlier horizontal-scrolling-bar attempt after a real-device
           recording (Safari, true phone width) showed it still didn't read
           as "responsive" -- a scrolling top bar is an unusual pattern users
           have to discover, where a hamburger opening a full list is
           instantly recognisable. Below 861px the sidebar (same JSX/content
           as desktop, unchanged) becomes a fixed, full-height off-canvas
           panel; a separate slim .ump-admin-mobile-bar takes its place in
           normal document flow with just the logo and the hamburger
           trigger. .ump-admin-sidebar-open (toggled by React state) slides
           it in with a transform, and a semi-transparent backdrop behind it
           closes it on tap -- both are inert (display: none) above 861px so
           resizing back to desktop can't leave the drawer's fixed
           positioning or backdrop engaged. */
        .ump-admin-mobile-bar { display: none; }
        .ump-admin-nav-backdrop { display: none; }
        .ump-admin-drawer-close { display: none; }
        @media (max-width: 860px) {
          .ump-admin-shell { flex-direction: column; }
          .ump-admin-mobile-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; z-index: 20; }
          /* Search/notifications move into .ump-admin-mobile-bar above on
             mobile (AdminLayout.tsx), so PageHeader's own copies (desktop:
             top-right of every page) are redundant here -- hide them,
             keeping just the page-specific CTA button visible. */
          .ump-admin-header-actions { display: none !important; }
          .ump-admin-nav-backdrop { display: block; position: fixed; inset: 0; background: rgba(11, 10, 8, 0.55); z-index: 45; }
          .ump-admin-drawer-close { display: flex !important; }
          .ump-admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: min(300px, 84vw);
            height: 100vh;
            z-index: 50;
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 220ms ease;
          }
          .ump-admin-sidebar-open { transform: translateX(0); }
        }
        .ump-admin-table-wrap { overflow-x: auto; }
        @media (max-width: 860px) { .ump-admin-table-wrap > * { min-width: 640px; } }

        /* Dashboard's metric cards, the Products grid, and the Media grid
           each used an inline repeat(auto-fit/auto-fill, minmax(Npx, 1fr))
           with no CSS class and no mobile override -- unlike every other
           admin grid, they were never brought under the
           .ump-admin-*-grid / minmax(0, 1fr) treatment (2026-07-24, admin
           responsive audit, Finding 2), because auto-fit/auto-fill is
           *supposed* to be self-sufficient: it's designed to keep reducing
           the column count as the container shrinks, never intentionally
           overflowing. A real-device recording (Safari, true phone width)
           showed that assumption failing in practice -- the metric row
           rendered two 160px+ cards side by side and ran off the right edge
           of the screen instead of collapsing to one column. Rather than
           chase the exact browser-specific cause, these three now get an
           explicit, deterministic column count below 480px
           (minmax(0, 1fr), not auto-fit's own sizing), which can't depend on
           any particular browser's auto-fit implementation to get it right. */
        @media (max-width: 480px) {
          .ump-admin-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .ump-admin-media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .ump-admin-product-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }

        /* Mobile search/notification controls live at the right edge of the
           persistent admin bar. Keep their popovers right-anchored so they
           grow back into the viewport; left-anchoring here made the panel
           extend beyond the right edge and clip its content. */
        @media (max-width: 860px) {
          .ump-admin-popover { left: auto !important; right: 0 !important; width: min(340px, calc(100vw - 32px)) !important; }
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

        .ump-mensagens-shell { display: flex; height: calc(100vh - 190px); }
        .ump-mensagens-list { width: 320px; flex-shrink: 0; }
        @media (max-width: 860px) {
          .ump-mensagens-shell { flex-direction: column; height: auto; }
          .ump-mensagens-list { width: 100%; max-height: 40vh; }
          .ump-mensagens-context { width: 100% !important; flex-basis: auto !important; border-left: 0 !important; border-top: 1px solid ${C.ruleLight}; }
        }

        /* Packing slip (2026-08-01, OrderDetail.tsx) -- .ump-packing-slip
           renders off-screen at all times (display: none) and is only made
           visible, full-width, when the browser's print dialog is actually
           open, with every other element on the page hidden. Standard
           "print only this one element" technique -- no separate print
           route or PDF generation needed. */
        .ump-packing-slip { display: none; }
        @media print {
          body * { visibility: hidden; }
          .ump-packing-slip, .ump-packing-slip * { visibility: visible; }
          .ump-packing-slip { display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 24px; color: #000; }
        }
      `}</style>

      <AppErrorBoundary>
        <BrowserRouter>
          <AppProvider>
          <ScrollToTop />
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
              <Route path="shop-instagram" element={<ShopInstagram />} />
              <Route path="shop-instagram/:lookSlug" element={<ShopInstagram />} />
              <Route path="politica-privacidade" element={<PrivacyPolicy />} />
              <Route path="termos-condicoes" element={<Terms />} />
              <Route path="eliminacao-de-dados" element={<DataDeletion />} />
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
