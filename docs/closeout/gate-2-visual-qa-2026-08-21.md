# Gate 2 — Catalogue and storefront visual QA

Date: 21 August 2026

Technical reviewer: José Paulo / Codex

Client approver: Raisa

Visual and brand approver: José Paulo

## Status

**OPEN — conditional technical pass.** The implemented storefront passed the technical visual QA below after one responsive defect was corrected. Gate 2 remains open until Raisa completes the delivery-time catalogue and content approvals in sections 3.1–3.4 and José Paulo records final visual/brand approval.

## Client-owned delivery checks

- [ ] 3.1 Raisa freezes the active catalogue and deactivates filler products.
- [ ] 3.2 Raisa uploads and assigns final product photography.
- [ ] 3.3 Raisa approves product names, prices, variants, stock, image/colour assignments and alt text.
- [ ] 3.4 Raisa approves final storefront copy and removes any remaining filler copy.
- [x] 3.5 Angola customer-facing returns baseline is 14 days and is editable in the admin.
- [x] 3.6 Technical storefront visual QA completed.
- [ ] José Paulo records final visual and brand approval after Raisa completes 3.1–3.4.

## Technical QA matrix

| Market / language | Desktop 1440×1000 | Tablet 834×1112 | Phone 390×844 | Result |
| --- | --- | --- | --- | --- |
| Angola / Portuguese | Home | Catalogue | Product | Pass |
| Portugal / English | Home | Catalogue | Product | Pass |
| Angola / English | — | Help | FAQ | Pass |
| Portugal / Portuguese | About | Style guide | Size guide | Pass after fix |

Verified behaviours:

- Navigation, language switching, page hierarchy and major content blocks render correctly.
- No browser console errors were observed on the production pages reviewed.
- Product and category layouts remain usable at the reviewed breakpoints.
- The Portugal dress size-guide table no longer clips its rightmost column on 390 px or 320 px screens.
- Compact mobile table headings retain full accessible names through `aria-label`.
- The live Angola FAQ and returns policy now consistently state 14 days.
- Live Angola and Portugal payment FAQs now describe the current WhatsApp fallback; AppyPay remains disabled until the external approvals are complete.

## Remaining approval notes

- Several active catalogue entries still use graphical placeholder artwork. This is expected until Raisa completes final photography and catalogue freeze.
- Raisa must confirm all product-specific copy and alt text after final images are assigned.
- Raisa should confirm the Angola About-page wording concerning Multicaixa Express / Reference as part of the final copy review.

## Evidence

The QA screenshots are stored locally in:

`output/gate2-visual-qa-2026-08-21/`

Automated regression coverage was added for the mobile size-guide behaviour. Platform lint and all 149 unit tests pass; CMS lint and all applicable tests pass.

## Gate 2 exit condition

Gate 2 becomes **GO** only when every unchecked client-owned item above is completed and the final visual/brand approval is recorded. Until then, this document is evidence of technical readiness, not client acceptance.
