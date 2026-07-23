# Use Me With Style — End-to-End Audit

Date: 2026-07-22

## Remediation update

The P0-P3 code findings in this report were addressed on 2026-07-22:

- The CMS now recalculates catalogue prices, currency, shipping, and totals; validates market, payment, delivery, variants, and available stock; and payment providers consume the stored authoritative order values.
- Public order status uses a rate-limited, minimal lookup endpoint instead of public Orders collection access.
- Cart contents persist per market and survive refreshes.
- Storefront and admin catch-all routes now provide recovery instead of blank screens.
- Order creation now reserves inventory atomically inside the database transaction. Paid orders commit the reservation; failed, cancelled, or expired sessions release it. An authenticated/secret-protected cleanup endpoint supports scheduled expiry processing.
- Storefront routes now expose semantic headings and a main landmark; checkout choices are native radio groups; errors, icon controls, focus, reduced motion, and admin autocomplete were corrected.
- Favourites persist per market, unfinished admin routes redirect to the roadmap, and both loopback development origins are accepted.
- Storefront routes are lazy-loaded. The initial production JavaScript chunk fell from approximately 402 KB to 242 KB before gzip; admin code now ships separately.
- Both apps now have executable unit tests, structured operational events, and an inventory-cleanup/alerting runbook. Live browser and disposable-database checks passed, including simultaneous last-stock checkouts and expiry restoration.

The remaining P3 launch dependency is final product photography. Placeholder artwork remains as a deliberate fallback until the client supplies approved assets; this is not safely replaceable through code alone. External alert delivery and the five-minute cleanup scheduler must also be enabled in the production hosting environment using the documented events and `CRON_SECRET` endpoint.

The historical findings below are retained as the evidence and rationale for those changes.

## Executive summary

The storefront, catalogue, product detail, cart, checkout form, admin login screen, and CMS all build and render. The visual system is coherent and the responsive layouts do not create horizontal overflow at the tested 1280 px and 390 px widths.

The app is not launch-ready yet. Two issues are launch blockers: the public order-lookup journey cannot read orders, and checkout/payment endpoints trust browser-supplied prices and totals. The cart also disappears after a refresh, unknown URLs render a blank page, and the current HTML structure has broad accessibility and SEO gaps.

## Scope and method

- Storefront routes: home, catalogue, product detail, cart, checkout, order lookup, invalid route.
- Responsive checks: desktop (1280 px) and mobile (390 px).
- Admin: unauthenticated redirect and login screen. Authenticated admin pages could not be exercised without a test account.
- Backend: production build, lint, public product/settings endpoints, protected collections, and checkout/order data path.
- Payments: request and code-path review only. No real payment was submitted and no external provider credentials were used.

## Build and baseline health

| Check | Result |
|---|---|
| Storefront production build | Pass |
| Storefront lint | Pass |
| CMS production build and TypeScript | Pass |
| CMS lint | Pass |
| Staging public environment check | Pass |
| Production public environment check | Pass |
| Automated unit tests | Pass — cart and inventory reservation rules |
| Browser smoke flow | Pass — home → product → cart → checkout, semantic control inspection |
| Concurrent inventory integration | Pass — one final-stock reservation accepted, competing checkout rejected, expiry restored stock |

## Bugs and risks

### P0 — Fix before any live payments

1. **Checkout trusts client-supplied prices, shipping, currency, and totals.**
   - Evidence: the storefront sends `unitPrice`, `subtotal`, `shippingCost`, and `total`; the public order create path and payment `createPendingOrder` store those values directly. Stripe/PayPal sessions are then created from the submitted items.
   - Impact: a buyer can alter the request and create or potentially pay an order at an incorrect amount. The same request can also submit product names and market/currency combinations not derived from the catalogue.
   - Required fix: accept only product ID, size, colour, quantity, market, delivery choice, and customer details. On the server, load authoritative products, validate market availability and stock, calculate unit prices/shipping/currency/total, reject mismatches, and reserve/decrement stock transactionally.

### P1 — Launch blockers

2. **Public order lookup is broken.**
   - Evidence: the UI calls `GET /api/orders?...`, while the Orders collection only grants public `create`. A direct unauthenticated lookup returned HTTP 403.
   - Impact: every customer lookup is presented as “not found,” including valid orders; genuine server errors are indistinguishable from an incorrect order number.
   - Required fix: create a purpose-built public lookup endpoint that accepts order number + normalized email, rate-limits requests, returns only a minimal safe response, and uses constant/generic not-found behavior. Do not make the full Orders collection publicly readable.

3. **Cart contents disappear after refresh or direct revisit.**
   - Evidence: cart state is initialized with an empty reducer and is not persisted. The item was present during SPA navigation and gone after a full page navigation to `/carrinho`.
   - Impact: shoppers lose progress on refresh, browser restart, payment-provider return, or some deep-link flows.
   - Required fix: version and persist the cart in local storage, restore defensively, reconcile against current catalogue/stock, and clear it only after confirmed order completion.

4. **Unknown routes render a completely blank page.**
   - Evidence: `/this-route-does-not-exist` produced zero visible text and no links; React Router logged “No routes matched location.”
   - Impact: mistyped, stale, or shared URLs look like the site crashed and provide no recovery path.
   - Required fix: add storefront and admin catch-all routes with a branded 404, search/shop links, and a route-level error boundary.

### P2 — Important quality and accessibility issues

5. **Pages have no semantic headings or main landmark.**
   - Evidence: home, catalogue, product detail, cart, checkout, and order lookup all rendered zero `h1`/`h2` elements; the storefront home rendered no `main` element.
   - Impact: poor screen-reader navigation, weak document outline, and reduced search-engine clarity.
   - Fix: use one descriptive `h1` per route, structured `h2` subsections, and wrap primary route content in `main`.

6. **Several icon-only controls have unclear or incorrect accessible names.**
   - Evidence: cart uses the English label “Cart” while the Portuguese UI is active; the product image search/zoom control is named “Search”; quantity and remove controls appear as unnamed buttons in the accessibility tree. Instagram tile links also have no accessible names.
   - Impact: screen-reader and voice-control users cannot reliably understand or invoke core controls.
   - Fix: localize labels and provide explicit purpose-specific names such as “Abrir carrinho,” “Ampliar imagem,” “Diminuir quantidade,” “Aumentar quantidade,” and descriptive Instagram-link labels.

7. **Custom radio-style payment and delivery buttons do not expose radio semantics.**
   - Evidence: AppyPay, Stripe, PayPal, and delivery options appear as ordinary buttons rather than a radio group with selected state.
   - Impact: assistive technology cannot identify the relationship between options or which option is active.
   - Fix: use native radio inputs with `fieldset`/`legend`, or complete `radiogroup`/`radio` semantics and keyboard behavior.

8. **Errors are not announced and order lookup collapses all failures into “not found.”**
   - Evidence: checkout/order-lookup error containers have no `role="alert"` or live region; lookup catches any API/network/authorization error and sets `not_found`.
   - Impact: users receive misleading recovery guidance, and screen-reader users may not learn that the state changed.
   - Fix: separate invalid credentials/order from service failures, attach errors to fields when relevant, move focus to the summary, and announce updates with a live region.

9. **Admin login fields lack password-manager metadata.**
   - Evidence: both login inputs have empty `autocomplete` values.
   - Impact: reduced usability and higher password-entry friction.
   - Fix: set `autocomplete="username"` and `autocomplete="current-password"`; add a visible recovery route if password reset is supported.

10. **Local development is hostname-sensitive.**
    - Evidence: the frontend loaded from `127.0.0.1:5173`, but the CMS only allowed `http://localhost:5173`; product loading failed with a CORS/fetch error. Loading the same app through `localhost:5173` succeeded.
    - Impact: inconsistent developer and QA behavior depending on how the preview URL is opened.
    - Fix: standardize the documented dev URL and/or allow both loopback origins in development only.

### P3 — Product and engineering improvements

11. **No automated regression safety net.**
    - Add unit tests for cart/pricing/market rules; API tests for access control, order creation, lookup, stock, and webhook idempotency; E2E tests for AO/PT catalogue → cart → checkout → confirmation/lookup and admin CRUD.

12. **Prototype product artwork is still being used.**
    - Product imagery is internally consistent, but it reads as placeholder silhouettes rather than sellable fashion photography. Replace with optimized, responsive product media and meaningful alt text before launch.

13. **Several admin destinations are deliberately “Coming Soon.”**
    - Analytics, marketing, Meta Ads, inventory, and automation routes are placeholders. Hide them from production navigation or label them explicitly as unavailable until they have usable content.

14. **Cart and favourite state have no cross-session behavior.**
    - Favourites are also memory-only. Decide whether favourites are Phase 1; if visible, persist them and clearly communicate device-only behavior.

15. **Observability is too thin for checkout operations.**
    - Add structured request IDs, sanitized payment/order event logs, error monitoring, alerting for failed webhooks and confirmation emails, and a dashboard for checkout-to-order conversion and provider failures. Never log customer or payment secrets.

16. **Performance can improve before catalogue growth.**
    - The storefront ships one ~402 KB JavaScript bundle before gzip. Add route-level lazy loading (especially admin), image sizing/formats, and bundle budgets.

## Flow-by-flow health

| Step | Flow | Health | Notes |
|---:|---|---|---|
| 1 | Storefront home | Needs improvement | Loads products and looks coherent; missing semantic headings/main and real product photography. |
| 2 | Catalogue/search/filter surface | Mostly healthy | Catalogue data and controls render; accessibility semantics and heading structure need work. |
| 3 | Product detail and selection | Mostly healthy | Size/colour selection and add-to-cart work; image control and heading semantics need correction. |
| 4 | Cart | Broken across reloads | Works during in-app navigation but is not persisted. |
| 5 | Checkout form | High risk | Form and client validation render; server-side price/stock authority is insufficient. |
| 6 | Payment handoff | Not safely verifiable | External payment was not submitted; code review found the pricing trust boundary defect. |
| 7 | Confirmation/order lookup | Broken | Public lookup receives 403 and reports it as not found. |
| 8 | Mobile reflow | Mostly healthy | No horizontal overflow at 390 px; bottom navigation and form reflow render. Keyboard/focus testing remains. |
| 9 | Admin login | Healthy with minor issues | Correctly redirects unauthenticated users; add autocomplete and recovery affordances. |
| 10 | Authenticated admin operations | Blocked | No test credentials were available, so dashboard, catalogue CRUD, orders, customers, messages, and settings were not exercised live. |
| 11 | CMS/API build and public catalogue | Healthy | Build/lint pass; products and market settings respond. |
| 12 | Invalid URL recovery | Broken | Blank page with no 404 or recovery action. |

## Recommended work order

1. Make server pricing, stock, shipping, currency, and payment creation authoritative.
2. Replace direct Orders collection lookup with a secure, minimal public lookup endpoint.
3. Persist and reconcile cart state; add payment-return recovery.
4. Add automated API and E2E coverage for both AO and PT flows.
5. Add 404/error boundaries and production observability.
6. Complete semantic HTML, control labels, error announcements, and keyboard/focus testing.
7. Run authenticated admin CRUD/status/messaging/settings tests with a dedicated QA account.
8. Replace placeholder media, hide unfinished admin areas, and tune performance.

## Evidence limits

- No real Stripe, PayPal, AppyPay, email, WhatsApp, Instagram, S3, or production-domain transaction was triggered.
- Authenticated admin pages were not tested because a QA account was not provided.
- Visual checks can identify accessibility risks, but they do not establish WCAG conformance. A keyboard and screen-reader pass is still required.
- The audit used the current local database and codebase; production runtime logs and deployed environment secrets were not inspected.
