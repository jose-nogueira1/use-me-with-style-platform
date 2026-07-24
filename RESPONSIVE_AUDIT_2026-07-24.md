# Responsive / UI-UX Audit — Storefront + Storefront Admin

Date: 2026-07-24
Scope: `use-me-with-style-platform` — every storefront route and every storefront-admin route.

## Methodology

Two passes, combined:

1. **Source review** — read every page/component in `src/storefront/**` and `src/admin/**`, plus the full embedded stylesheet in `App.tsx` (every breakpoint, every `.ump-*` class), to find fixed widths, missing responsive classes, and structural layout risk before ever loading a browser.
2. **Live visual sweep** — rendered the running app (storefront + logged-in admin) at a spread of real widths and screenshotted: **320/375/390** (small–standard phone), **500** (this tool's effective floor below 375 — see note), **768** (iPad portrait / common tablet), **1024** (small laptop / tablet landscape), and **~1560** (standard laptop/desktop). Findings below are marked **[Verified]** where a screenshot confirms them, or **[Inferred]** where they're grounded in source but not separately screenshotted (mostly because they're the *same* code pattern as an already-verified page).

Note on the floor: the resize tool in this session could not go below ~500px effective width. This doesn't limit the audit — nothing in the stylesheet has a breakpoint between 320 and 480px, so 500px already exercises every mobile CSS path the app has.

Not covered: cross-browser rendering (Chrome only), real touch-device testing, print styles.

---

## Executive summary

The app is in reasonably good shape overall — Home, Browse, and Product Detail all have real, deliberate desktop layouts (per the Figma "Desktop" screens), and last session's pass already fixed the worst admin mobile bugs (popover overflow, Login overflow, an unwrapped table). But two **systemic** gaps stand out, each touching several pages with the exact same root cause, plus a handful of smaller polish items:

| # | Finding | Area | Severity | Pages affected |
|---|---|---|---|---|
| 1 | No sticky sidebar — admin nav scrolls away on any tall page | Admin, desktop | **High** | All admin pages |
| 2 | Seven storefront pages are permanently capped at 480px wide, even on a 1920px monitor | Storefront, desktop | **High** | Cart, Checkout, About, Help, Order Lookup/Confirmation, Privacy Policy, Terms, 404 |
| 3 | Tablet portrait (≈720–860px) gets stretched mobile layouts instead of the desktop treatment | Storefront, tablet | Medium | Browse, Product Detail |
| 4 | No upper bound on admin content width | Admin, ultra-wide | Low | All admin pages with grids/tables |
| 5 | Phone country popover could crowd a very narrow screen | Storefront, small mobile | Low | Checkout |
| 6 | AppyPay iframe is a fixed 720px tall regardless of viewport | Storefront, short viewports | Low | Checkout (AO, Multicaixa Express) |
| 7 | Browse's product grid has no column cap on ultra-wide | Storefront, ultra-wide | Low (unverified) | Browse, recommendations, Home featured |

Findings 1 and 2 are the ones worth fixing first — they're each one root cause with an outsized effect on how "finished" the product looks, and neither is cosmetic-only: #1 makes primary navigation genuinely hard to reach on any admin page longer than one screen, and #2 makes seven pages look unstyled/abandoned on the majority of real desktop monitors.

---

## Finding 1 — Admin sidebar is not sticky (High) **[Verified]**

**Where:** `src/admin/AdminLayout.tsx` + `.ump-admin-shell` / `.ump-admin-sidebar` in `App.tsx`.

At desktop widths (≥860px), the sidebar is a normal flex child inside `.ump-admin-shell` — it has no `position: sticky` / `position: fixed` and no independent scroll container. Screenshotted at 1024px width on the Settings page: after scrolling down about one screen, the primary nav (**Dashboard, Orders, Products, Settings**) has scrolled completely out of view, leaving only the secondary nav (Customers/Messages/Invoices/Media) and the logout block visible. To get back to Dashboard or Orders, the user has to scroll all the way back to the top of whatever page they're on.

This gets worse the longer the page — Settings, ProductEditor, and OrderDetail are all long enough on a typical 900px-tall laptop screen that this happens on nearly every visit.

**Fix direction:** make `.ump-admin-sidebar` `position: sticky; top: 0; height: 100vh; overflow-y: auto;` at desktop widths only (inside the existing `@media (min-width: 861px)` implicit default, i.e. outside the `max-width: 860px` block). Mobile should stay exactly as it is today (horizontal top bar, no sidebar scroll concerns there).

---

## Finding 2 — Seven storefront pages never got a desktop layout (High) **[Verified for Cart, Checkout, About; inferred for the rest — identical code pattern]**

**Where:** every page below renders its content inside `className="ump-narrow"`, and `.ump-narrow { max-width: 480px; margin: 0 auto; }` has no responsive override anywhere in the stylesheet — unlike `.ump-shell`/`.ump-content-width`, which both widen at larger breakpoints.

- `Cart.tsx`
- `Checkout.tsx`
- `About.tsx` (combined with `.ump-content-width`, but `.ump-narrow` is declared later in the stylesheet so it wins the cascade and still caps at 480px)
- `Help.tsx`
- `ConfirmationLookup.tsx`
- `LegalPage.tsx` (shared by both Privacy Policy and Terms & Conditions)
- `NotFound.tsx`

Screenshotted Cart, Checkout, and About at ~1560px width: each renders its actual content in a narrow column pinned to the left edge, with roughly two-thirds of the screen sitting empty. Compare this to Home, Browse, and Product Detail, which all have genuine Figma-designed desktop layouts (hero side-by-side, sidebar + grid, image + info side-by-side) — the contrast makes Cart/Checkout/About look unfinished by comparison, especially since Checkout is the page most likely to be open on a customer's desktop at the moment they're about to pay.

**Fix direction:** this doesn't need seven different bespoke desktop designs. The simplest, lowest-risk fix is a new class (e.g. `.ump-form-width`) that behaves like `.ump-narrow` below 860px but widens to something like 640–720px above it — enough to stop the page looking broken, without pretending these are full Figma "desktop" screens. Cart and Checkout could reasonably go a little further (e.g. a two-column summary-beside-form layout) since Figma's inventory doesn't include desktop mockups for them, but that's a design decision, not just a CSS one — flagging it as a design question rather than presuming an answer here.

---

## Finding 3 — Tablet portrait gets a stretched mobile layout (Medium) **[Verified at 768px]**

**Where:** `.ump-browse-layout` and `.ump-product-layout` both switch to their desktop form at `min-width: 860px`. Real tablets are very commonly narrower than that — iPad portrait is 768px, most Android tablets are 744–800px.

Screenshotted at 768px:
- **Browse**: still shows the mobile category-pill row and the "Filters" slide-down toggle instead of the sidebar, even though 768px is comfortably wide enough for the 220px sidebar used at 860px+. Not broken, just not using the space well.
- **Product Detail**: the product photo renders as a nearly full-width square dominating the whole top of the screen, with the info column stacked awkwardly narrow underneath — again, the desktop side-by-side layout would fit fine at 768px and reads much better.

**Fix direction:** lower the breakpoint for these two layouts specifically (e.g. to 720px, matching the header/footer/nav breakpoint already used elsewhere) or add an intermediate tablet treatment. This is lower priority than #1/#2 because nothing is actually broken — it's a "could look noticeably better" gap, not a bug.

---

## Finding 4 — No max-width on admin content (Low) **[Inferred — not screenshotted above ~1560px]**

Storefront content is deliberately capped (`.ump-content-width`, max 1240–1900px depending on breakpoint) so it doesn't stretch uncomfortably on ultra-wide monitors. Admin has no equivalent — the content column next to the sidebar is just `flex: 1, minWidth: 0` with nothing capping the top end. On a 2560px+ ultra-wide monitor, Dashboard's metric cards (`repeat(auto-fit, minmax(160px,1fr))`) and every table row would stretch very wide, likely hurting scannability. Worth a quick visual check on an actual ultra-wide display before deciding whether it's worth a fix; flagging it here so it isn't missed, not because it's confirmed broken.

## Finding 5 — Phone country popover on very narrow phones (Low) **[Inferred / edge case]**

`Checkout.tsx`'s `PhoneField` popover is a fixed 270px wide, anchored `left: 0` to a button that sits right after the page's 20px padding. At the narrowest phones this app is likely to see in practice (~360–375px) this fits with room to spare (verified). Only genuinely tiny/old devices below ~310px would be at any risk of the popover's right edge crowding the screen edge — noting it as a "keep an eye on it" rather than a real bug, since nothing in the current test range showed an issue.

## Finding 6 — AppyPay widget iframe has a fixed height (Low, third-party) **[Inferred]**

`AppyPayWidget.tsx` renders its iframe at a hardcoded `height: 720`. On a short viewport (landscape phone, small laptop with browser chrome) this forces a lot of scrolling to reach the widget's own payment buttons. This is a third-party embed (AppyPay's own hosted widget), so control is limited — worth a light-touch fix (e.g. `min-height` instead of fixed `height`, or wrapping in a scrollable container) but not high priority since it's a checkout edge case, not a broken layout.

## Finding 7 — Browse/Home product grids have no column cap (Low, unverified) **[Inferred]**

`.ump-grid-auto` (`repeat(auto-fill, minmax(150px, 1fr))`) combined with `.ump-content-width`'s 1900px cap at very wide viewports could produce a lot of columns with a lot of gutter — at 1560px it already looked fine (7 columns, comfortably sized cards), so this is likely a non-issue, but wasn't checked above ~1560px. Flagging for a quick look, not a confirmed problem.

---

## What's already solid (no action needed)

- Home, Browse (≥860px), Product Detail (≥860px): real desktop layouts, verified good at ~1560px and mobile widths.
- Storefront header/nav, footer, bottom tab bar, hamburger menu: all correctly breakpoint-matched at 720px, verified at mobile and desktop widths.
- Checkout's phone-country combobox: renders and searches correctly at mobile width (this and the NIF field were fixed earlier this session).
- Admin Dashboard, Orders, OrderDetail, ProductEditor, Settings (all 4 tabs), Customers, CustomerDetail, Invoices, Media, Mensagens: all verified stacking correctly at mobile width (390px) and behaving sensibly at 768px/1024px, aside from Finding 1 above.
- Admin Login, PageHeader search/notifications popover, CustomerDetail order-history table: fixed earlier this session, reverified working in this pass.

---

## Suggested phasing

**Phase 1 — high-impact, low-risk fixes**
1. Sticky admin sidebar (Finding 1) — one CSS change, immediately fixes navigation on every admin page.
2. Give Cart/Checkout/About/Help/ConfirmationLookup/LegalPage/NotFound a real desktop max-width instead of 480px forever (Finding 2) — one new CSS class + swapping `ump-narrow` for it on seven pages.

**Phase 2 — polish**
3. Tablet breakpoint gap for Browse/Product Detail (Finding 3).
4. Admin content max-width on ultra-wide (Finding 4) — verify first, then decide.

**Phase 3 — nice-to-have / low priority**
5. Phone popover edge-case safety margin (Finding 5).
6. AppyPay iframe flexible height (Finding 6).
7. Confirm Browse/Home grid column count looks fine above 1560px (Finding 7).

Ready to start with Phase 1 whenever you are.
