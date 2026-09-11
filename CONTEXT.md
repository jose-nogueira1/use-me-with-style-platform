# Use Me With Style domain context

## Application map

This repository contains the storefront and custom admin. The companion [CMS repository](https://github.com/jose-nogueira1/use-me-with-style-cms) owns persistence, authorization and server-side commerce behavior. The local sibling checkout is `../use-me-with-style-cms` when available.

## Shared vocabulary

| Term | Meaning |
| --- | --- |
| Market | AO (Angola) or PT (Portugal), controlling availability, stock, currency and market settings. Independent of language. |
| Language | PT (Portuguese) or EN (English) presentation. Do not confuse Portuguese language with the Portugal market. |
| Product | Catalog item, with supported product type, images and optional variant selections. |
| Variant | A purchasable option combination with stock per market; not every product requires colour and size. |
| Customer contact | Existing lightweight customer record associated with commerce; does not imply login access. |
| Admin user | Authenticated administrative identity. Do not reuse it as the definition of a shopper account. |
| Customer account | Stage 2 authenticated shopper identity; ownership, historical-order linking and guest behavior require explicit decisions. |
| Order | Server-owned commercial record; displayed cart totals are not authoritative payment evidence. |
| Reservation | Time-limited inventory allocation with explicit release/expiry behavior. |
| Hero | Homepage campaign artwork and bilingual copy, with separate mobile/desktop crops and positions. |
| Global version | Historical CMS snapshot; schema changes may also affect version tables and restore behavior. |
| Implemented / enabled / approved / live | Separate states: code exists / configuration activates it / business approval exists / deployed and verified. |

## Decision authority

1. [Approved Phase 1 closeout baseline](docs/decisions/phase-1-closeout-baseline-2026-08-20.md).
2. [Earlier architecture decisions](docs/decisions/phase-1-architecture-and-blockers.md), only where not superseded.
3. Other relevant approved decisions and operations runbooks; README descriptions may be historical.

Do not infer commercial launch authorization from feature completion. Do not activate a payment provider or deferred Stage 2 flow merely because its implementation exists.

## Engineering routes

- [CMS/admin/storefront changes](docs/agents/cms-storefront-changes.md)
- [Verification and release](docs/agents/verification-and-release.md)
- [Linear mapping](docs/agents/issue-tracker.md)
