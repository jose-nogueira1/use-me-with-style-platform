# End-to-end QA report — 28 July 2026

## Scope

This release was audited locally and, after deployment, against the production storefront and administration surface. Coverage includes responsive navigation, catalogue and product detail, market isolation, cart and checkout, coupon behaviour, administration reads and writes, backend commerce rules, schema migration safety, builds, linting, and dependency security.

## Release changes under test

- Upgraded the platform runtime/tooling and the Payload/Next CMS stack.
- Added PostgreSQL migration tests for fresh, fully migrated, and partially migrated schemas.
- Added commerce-rule tests for authoritative pricing, sales, coupons, inventory reservations, and invoice totals.
- Made coupon validation and usage claiming part of the order transaction, with a PostgreSQL row lock for concurrent redemptions.
- Resolved the two React hook warnings in the coupon and media admin pages.
- Configured Playwright to use the installed Chrome browser and restored all checkout browser tests.
- Labelled the old demo repository as a legacy prototype.
- Localized the CMS coupon validation messages shown by the Portuguese checkout.

## Local QA environment

- Platform: production-mode Vite build plus isolated local dev server.
- CMS: production Next.js build plus an isolated SQLite copy of development data.
- PostgreSQL: disposable PostgreSQL 16 cluster and one disposable database per migration scenario.
- Browsers/viewports: Chrome at 390 px, 768 px, and 1440 px widths.
- Test writes were confined to the copied local database and removed after verification.

## Local results

### Storefront

| Area | Result | Evidence |
| --- | --- | --- |
| Responsive route matrix | PASS | 12 routes × 3 widths = 36 combinations; no horizontal overflow or browser console errors |
| Catalogue/filtering | PASS | Product data loaded; category filter returned the expected subset |
| Product detail | PASS | Variant selectors, stock state, recommendations, and add-to-cart worked |
| Cart | PASS | Quantity change updated totals; AO cart persisted independently while PT cart remained empty |
| Checkout | PASS | AO/PT delivery, payment, currency, totals, and coupon revalidation paths exercised |
| Coupon error language | FIXED/PASS | Invalid Portuguese checkout code now displays `Este código não foi encontrado.` |
| Unknown route | PASS | Application not-found experience rendered without overflow or console errors |

Routes sampled: `/`, `/catalogo`, a filtered catalogue, product detail, cart, checkout, order lookup, help, about, privacy, terms, and an unknown route.

### Storefront admin

| Area | Result | Evidence |
| --- | --- | --- |
| Authentication | PASS | Login and authenticated application shell loaded |
| Responsive route matrix | PASS | 18 routes × 3 widths = 54 combinations; no horizontal overflow or unexpected console errors |
| Dashboard/orders/products | PASS | Live copied data, counts, charts, low-stock notification, lists, and existing detail records rendered |
| Customers/messages/invoices/media | PASS | Empty/populated states rendered as applicable |
| Coupon administration | PASS | Created, edited from 15% to 20%, and deleted a temporary coupon |
| Settings | PASS | Markets, policies, invoicing, legal, home, and product settings routes loaded |
| Invalid customer URL | EXPECTED | `/admin/clientes/1` returned 404 because the copied database has no customer with ID 1; the customer list correctly showed an empty state |

### Automated verification

| Check | Result |
| --- | --- |
| Platform unit tests | PASS — 5/5 |
| Checkout Playwright tests | PASS — 3/3 |
| Platform ESLint | PASS |
| Platform production build | PASS |
| CMS unit/integration tests | PASS — 17/17 (PostgreSQL-only cases intentionally skipped in the generic run) |
| PostgreSQL migration tests | PASS — 3/3 |
| CMS ESLint | PASS |
| CMS production build/type-check | PASS |

## Dependency security review

- CMS production audit: no high or critical vulnerabilities. Six moderate findings remain in Payload's transitive Drizzle development tooling (`esbuild`); npm reports no available fix and the affected development server is not exposed by the production runtime.
- Platform production audit: npm reports the React Router RSC-mode CSRF advisory against the current latest release. This storefront is a client-only Vite SPA and does not enable React Server Components or server actions, so the vulnerable execution path is absent. Downgrading to npm's suggested older release was not accepted as a security upgrade.

## Production QA

| Area | Result | Evidence |
| --- | --- | --- |
| Deployment | PASS | Vercel reported the platform commit deployed successfully; Railway CMS product and admin endpoints returned HTTP 200 |
| Responsive storefront matrix | PASS | 12 routes × 3 widths = 36 combinations on the canonical Vercel production URL; no overflow or page errors |
| Live catalogue/product | PASS | Production data loaded and the in-stock `Vestido Teste` detail/variant state rendered |
| Live cart/checkout | PASS | Add-to-cart, Kz 16,500 total, checkout rendering, and invalid-coupon request completed without creating an order or payment |
| Coupon localization | PASS | Production checkout displayed `Este código não foi encontrado.` |
| Admin access guard/login | PASS | `/admin` redirected to `/admin/login`; PT login UI rendered without overflow at 390/768/1440 px and without console errors |
| Authenticated production admin | NOT RUN | No production password was available to this isolated browser session. Destructive/live admin writes were not guessed or attempted; the authenticated 54-case matrix and CRUD test passed locally against the isolated data copy |
| Custom domain | BLOCKED | `usemewithstyle.com` returned no DNS records/resolution from the QA environment. The deployed build was therefore tested at `https://use-me-with-style-platform.vercel.app` |

## Findings and release assessment

- One user-visible defect was found locally and fixed: untranslated coupon rejection messages in Portuguese checkout.
- No blocking responsive, navigation, catalogue, cart, checkout, admin rendering, build, lint, commerce-rule, or migration defect remains from the local pass.
- The custom storefront domain DNS is the only production release blocker found; Vercel's canonical production domain and the Railway backend are healthy.
- Production-only integrations that can create real payments or send real messages are verified non-destructively; no live charge, outbound message, or irreversible admin mutation is performed as part of QA.
