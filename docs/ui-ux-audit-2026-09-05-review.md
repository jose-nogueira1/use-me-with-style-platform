# Storefront UI/UX remediation review — 5 September 2026

The storefront remediation was merged into `main` in commit `132c390` and deployed to production on 6 September 2026. The merged tree is based on `551f5688eddd8c8c984a7917f50e0a6847989f21`. Following explicit approval, the production CMS was updated only for finding 3: the PT/EN Terms payment paragraph and four AO/PT manual WhatsApp instruction fields. No other CMS record was changed and no real order, payment, or customer form was submitted.

## Finding status

| ID | Status | Implementation and verification evidence |
|---|---|---|
| 01 | Fixed and verified | Cart lines now resolve the image from the persisted variant ID/colour. Bloom & Pearl Rosa used `IMG_2901` in confirmation and cart after reload at 320 and 1440 px in Day and Night; size, colour, quantity and price stayed unchanged. |
| 02 | Fixed and verified | The size guide is portalled outside the inert storefront root, receives initial focus, wraps Tab/Shift+Tab, closes with Escape/backdrop, locks body scroll and restores trigger focus. Verified at 320 and 1440 px in both themes. |
| 03 | Approved and implemented; recipient number pending | Checkout lists only enabled methods and explains that continuing creates a pending order and opens WhatsApp for payment coordination. The approved PT/EN Terms paragraph and all four AO/PT handoff-instruction fields were saved to the production CMS on 6 September 2026; the live Angola Terms page was verified. Local code also corrects stale FAQ, Help, About and Angola metadata claims. A verified WhatsApp recipient number is still required and was not invented. |
| 04 | Fixed and verified | The theme control remains present at 320–340 px in a compact header form. Day/Night changes persisted after reload at 320, 340, 341 and 375 px. |
| 05 | Fixed and verified | Header logo, gaps, language control, theme control and safe-area padding now fit narrow viewports. Document width equals client width on product, cart, checkout and all inspected templates at 375 px; the cart control and badge remain reachable. |
| 06 | Fixed and verified | Checkout, help and lookup fields have persistent associated labels. The phone input is named; the country-code control and its search are localized. Browser inspection verified every text field had a label/name in AO/PT and PT/EN combinations. |
| 07 | Fixed and verified | Add confirmation and mini-cart expose a primary direct Checkout action plus a distinct Review cart action. Confirmation review goes directly to the full cart. Existing native validation and stock guards remain active. |
| 08 | Fixed and verified | One locale-aware formatter now covers product prices, original prices, cart lines/totals/VAT, checkout discounts/shipping/tax and Instagram product cards. AO/PT and PT/EN unit tests cover currency presence and separators; browser flow shows `36 990 Kz` consistently. Calculations were not changed. |
| 09 | Fixed and verified | Footer teasers are market-specific: Angola says exchanges must be requested within 14 days; Portugal says returns must be communicated within 14 days. Links still open the approved detailed policy, whose wording was not changed. |
| 10 | Blocked — independent code work complete | Photography confirms Active Court is a dress and Aura is a set. Exact CMS category changes are proposed for product IDs 31 and 25. Active Court needs measured garment lengths before assigning a new guide. Verified ID-based storefront overrides keep both products' image text accurate until the CMS category edits are approved; browser evidence shows Active Court as `Vestidos`. No live catalogue relationship was changed. |
| 11 | Fixed and verified | Checkout, help and lookup controls render at 16 px on mobile; persistent labels are at least 12 px with improved spacing. Long English/Portuguese labels and native validation were checked at 375 px. Physical mobile keyboards were not available. |
| 12 | Fixed and verified | Empty carts identify the active market, explain cart isolation, show the retained other-market item count with correct plurals, and offer a return-store action. Browser evidence confirms the AO cart remains in storage after switching to an empty PT cart and returns intact. |
| 13 | Fixed and verified | Category pills remain visible at 768 and 1024 px until full desktop navigation appears at 1080 px. They reuse existing category names and filtering behavior. |
| 14 | Fixed and verified | FAQ uses the shared disclosure presentation, while Help and product disclosures use matching trailing chevrons, spacing and focus treatment. FAQ keeps native `details` semantics and keyboard behavior; equivalent sections default collapsed unless linked content warrants opening. |
| 15 | Fixed and verified | Shared reading, listing and page-header widths align support, editorial listing and article templates while preserving a narrower reading measure. Representative mobile, tablet and desktop screenshots were inspected. |
| 16 | Fixed and verified | Legal text is split without rewriting it, promoting existing paragraph prefixes/numbered labels to semantic `h2` sections. Related policy and support links were added. Verified across privacy, terms and data-deletion templates in both themes. |
| 17 | Fixed and verified | Singular/plural Instagram labels, Fresh Fit spelling, localized home shelf names, active-filter counts, country-code labels, technical image alts and initial order-lookup heading were corrected. Code-side fallbacks protect the storefront while exact CMS cleanup values remain documented. |

## Verification

All public API data used by the current-run browser evidence was fetched with read-only GET requests, cached under `output/playwright/ui-ux-2026-09-05/public-cache`, and replayed to both an unchanged detached baseline at `localhost:5174` and the changed branch at `localhost:5173`. Browser routing rejected API mutations. No checkout, contact or other form was submitted.

Commands and results:

- `npm run lint` — passed.
- `npm run build` — Vite build, 64-page market-aware prerender and prerender verification passed.
- Targeted audit regression suite — 28/28 passed, covering the approved PT/EN Terms replacement, stale payment FAQ/About/metadata protection, variant imagery, money, market carts, dialog wrapping, exact Active Court/Aura image-type overrides, image-alt sanitization, Fresh Fit spelling, direct checkout and disclosure wiring.
- Full `npm test` — 221/221 passed. The stale baseline source assertion for the retired mobile low-stock class was aligned with the current responsive behavior; no storefront behavior changed for that test-only correction.
- Browser baseline/after capture — catalogue/header at 320, 375, 768, 1024, 1280 and 1440 px; product/cart/checkout/dialog at narrow mobile and desktop; support, FAQ, editorial, Instagram and legal templates at representative mobile/tablet/desktop widths.
- Browser interaction matrix — 26/26 checks passed across AO/PT, Portuguese/English, Day/Night persistence, responsive header/category discovery, modal focus/Tab/Escape/restore, persistent labels/16 px fields, validation presentation, search empty-state recovery, filter drawer Escape/restore, market cart retention and variant flow.

Physical devices, native virtual keyboards, screen readers, payment-provider widgets, completed orders and post-purchase tracking were not exercised. This report does not claim full accessibility compliance.

## Production release verification — 6 September 2026

Vercel deployment `dpl_GfTw4XR7NoZcZBsLQPdC5GF8S8xh` reached `READY` and was assigned to `usemewithstyle.shop`, `ao.usemewithstyle.shop`, `pt.usemewithstyle.shop`, `www.usemewithstyle.shop`, and the Vercel production alias. Live smoke checks confirmed:

- AO/Portuguese at 320 px and PT/English at 375 px: appearance control visible, no document overflow, approved Terms copy, accurate pending-payment FAQ, and market-specific returns teaser.
- AO product dialog at 1440 px: initial focus, Escape dismissal, and trigger-focus restoration.
- AO cart at 320 px: Bloom & Pearl Rosa kept `IMG_2901`, size S and `36 990 Kz` from confirmation through cart reload, then reached the WhatsApp checkout.
- Vercel production error-log scan after the smoke checks returned no errors.

Machine-readable production evidence and screenshots are stored locally under `output/playwright/ui-ux-2026-09-06-production`.

## Current-run screenshot evidence

| Change | Before | After |
|---|---|---|
| Rosa variant in cart, 320 px | `output/playwright/ui-ux-2026-09-05/before/flow-cart-320-light.png` | `output/playwright/ui-ux-2026-09-05/after/flow-cart-320-light.png` |
| Size guide, desktop Day | `output/playwright/ui-ux-2026-09-05/before/size-guide-1440-day.png` | `output/playwright/ui-ux-2026-09-05/after/size-guide-1440-day.png` |
| Narrow header/catalogue Day | `output/playwright/ui-ux-2026-09-05/before/catalogue-320-day.png` | `output/playwright/ui-ux-2026-09-05/after/catalogue-320-day.png` |
| Empty Portugal cart after market switch | `output/playwright/ui-ux-2026-09-05/before/market-switch-portugal-empty.png` | `output/playwright/ui-ux-2026-09-05/after/market-switch-portugal-empty.png` |
| Checkout form, 375 px | `output/playwright/ui-ux-2026-09-05/before/checkout-375-day.png` | `output/playwright/ui-ux-2026-09-05/after/forms-AO-pt-light-checkout.png` |

Machine-readable evidence is in `output/playwright/ui-ux-2026-09-05/before/metrics.json`, `after/metrics.json`, `before/flow-results.json`, `after/flow-results.json` and `after/qa-results.json`.

Approved findings 3 and 9 were rechecked on 6 September in AO/PT Portuguese and PT/English. Evidence is in `after/approved-findings-3-9.json`, `after/approved-terms-AO-pt.png`, `after/approved-terms-PT-en.png`, `after/approved-payment-faq-AO-pt.png` and `after/approved-payment-faq-PT-en.png`.

## Business and content dependencies

See `docs/ui-ux-audit-2026-09-05-content-proposals.md` for the approved Terms and market-setting copy, verified category/media IDs and replacement values. The production CMS copy for finding 3 was updated on 6 September. Remaining inputs, intentionally left alone, are:

1. Supply the verified WhatsApp destination number and decide whether AO/PT share it.
2. Supply Active Court garment measurements before a dress-specific size guide is assigned.
