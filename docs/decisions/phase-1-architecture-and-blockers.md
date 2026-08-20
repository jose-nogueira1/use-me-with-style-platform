# Phase 1 — Architecture & Open-Blocker Decisions

Status: superseded · Last updated: 2026-08-20
Covers Linear: JOS-20 (architecture), JOS-57 (Appy Pay), JOS-52 (launch decisions)

> **Superseded:** This June 2026 recommendation is retained as historical
> context. It is no longer the controlling Phase 1 delivery or launch decision.
> The current approved baseline is
> [`phase-1-closeout-baseline-2026-08-20.md`](./phase-1-closeout-baseline-2026-08-20.md).
> In particular, SWEG is not yet selected, the existing invoice implementation
> is accepted for initial launch, and WhatsApp remains an administrator-enabled
> payment fallback after AppyPay becomes the primary flow.

This document moves the three overdue Phase 1 blockers forward by recording a
recommended decision for each, what is already settled, and what is still
needed from whom. Items marked **NEEDS CLIENT** or **NEEDS APPYPAY** are the
only true external dependencies.

---

## 1. Production architecture (JOS-20)

### The open question
The current `use-me-with-style-platform` repo is the prototype carried over: a
React + Vite single-page app with mock data (`src/App.tsx`, ~7k lines), no real
backend yet. The blueprint proposed a full headless stack (Next.js + NestJS +
Payload + Postgres). We need to resolve SPA-vs-headless for Phase 1 without
over-building.

### Recommendation
Ship Phase 1 as **existing React+Vite SPA frontend + Payload CMS as the data/
admin/API layer**, on the hosting already wired in `.env.production`:

| Layer | Phase 1 choice | Rationale |
|-------|----------------|-----------|
| Storefront + Admin UI | Existing React + Vite SPA | Already built; Phase 1 traffic is Instagram-driven, not SEO-driven |
| Backend / API / Admin data | **Payload CMS** (`cms.usemewithstyle.shop/admin`) | Gives products, orders, customers, settings models + REST/GraphQL API + auth out of the box — no separate service to build |
| Database | PostgreSQL (Railway) | Accessed by the CMS service; storefront API requests use the same-origin Vercel rewrite |
| Media | Cloudinary / S3 | Placeholders until client photography |
| Payments | Stripe, PayPal, MBWay (PT) · Appy Pay (AO) | Via Payload endpoints / serverless functions |
| Hosting | Vercel (frontend) + Railway (Payload/DB) | Already provisioned |

**Deferred to Phase 2/3:** the separate NestJS service (only justified once
custom AI/analytics logic exists) and a **Next.js migration of the storefront**
for SSR/SEO — this aligns with the contract's Phase 3 "SEO optimisation across
all three markets" deliverable.

### Tradeoff to confirm — **NEEDS CLIENT/JAY-P CALL**
Staying on the SPA for Phase 1 means weaker out-of-the-box SEO at launch. Given
Instagram/WhatsApp-led discovery this is acceptable for launch, with SEO handled
by the Phase 3 Next.js migration. Confirm you are comfortable deferring SEO.

---

## 2. Angola payments + invoicing — SWEG (JOS-57)

### DECISION (2026-06-11): use **SWEG** for Angola invoicing + payments.

SWEG (sweg.ao, by WEBTECH, LDA) is an **AGT-certified** cloud platform that
bundles electronic invoicing + payments + management, with **AppyPay integrated
out of the box**. It covers two needs in one tool: AppyPay payment collection
*and* legally-compliant AGT e-invoicing — the latter is a gap nothing else in
the project addresses.

### Why SWEG over raw AppyPay
- **AppyPay alone** = payment gateway only (Multicaixa Express / Unitel Money via
  phone-number auth; documented API at appypay.stoplight.io). It does **not**
  produce a legal AGT invoice.
- **SWEG** sits on top of AppyPay and adds: AGT e-invoicing with an integrated
  payment reference, automatic payment confirmation, auto-receipts, and
  management of items/customers/sales/stock. Flow: issue invoice (AppyPay ref) →
  customer pays (MCX Express / bank ref) → SWEG auto-confirms via AppyPay →
  invoice marked paid + receipt created.
- **Regulatory driver:** AGT e-invoicing is mandatory in Angola from 2026-01-01
  (large taxpayers / state suppliers), all companies by 2027. Certified software
  is required. SWEG is certified (WEBTECH v1.8, valid from 2023-01-01).

### Pricing (annual; monthly available; all plans unlimited users)
- SWEG Start — 120,000 Kz/yr (e-invoicing, reference, auto-confirm, receipts, basic mgmt)
- SWEG Business — 170,000 Kz/yr (adds supplier mgmt, advanced stock, reports, permissions, reminders)
- SWEG Enterprise — contact (HR, accounting, assets, dashboards, priority support)

### Integration path — depends on SWEG API (docs requested, **arriving soon**)
- **If SWEG exposes an API/webhooks:** integrate SWEG as the single Angola
  backend — storefront checkout creates a SWEG invoice (AppyPay reference) and
  receives the paid/receipt webhook. One integration = payments + AGT invoices.
  Order stores: `sweg_invoice_id`, `appypay_reference`, `method`, `status`, `paid_at`.
- **If SWEG has no API (UI-only):** storefront integrates **AppyPay directly**
  for checkout payment; SWEG used as back-office to issue the AGT invoice per
  order (manual issue is fine at launch — Angola is already manual-fulfilment,
  low volume). Either way SWEG covers invoicing compliance.

### Still needed
1. **SWEG API documentation** — requested from SWEG team, arriving soon (decides path above).
2. SWEG account + plan selection (Start vs Business) for Prime Essencial — **NEEDS CLIENT**.
3. AppyPay merchant onboarding (handled via SWEG) — KYC in Prime Essencial's name.

### Fallback
If SWEG onboarding stalls, launch Angola with manual bank transfer (BAI IBAN) +
manual Payment Review in admin; migrate to SWEG once active. Invoicing still done
in SWEG to stay AGT-compliant.

SWEG contact: comercial@sweg.ao · +244 933 373 266 · sweg.ao

---

## 3. Phase 1 launch decisions (JOS-52)

All business decisions are **confirmed**. Angola payments/invoicing resolved to
SWEG (§2); only the SWEG API doc / integration path is pending (JOS-57):

- Markets: Angola + Portugal (international deferred).
- PT payments: PayPal, Stripe, MBWay · delivery: CTT + courier.
- AO payments + invoicing: **SWEG** (AppyPay-backed, AGT-certified, see §2) · fulfilment: manual.
- Catalogue: manual admin entry · media: placeholders until client assets.
- Accounts/wishlist deferred to Phase 2; lightweight order lookup in Phase 1.
- Admin: desktop-first; mobile admin a stretch goal.
- Order statuses: New, Payment Review, Processing, Shipped, Delivered, Cancelled.
- Checkout fields: name, phone/WhatsApp, email, address, city, country, payment
  method, delivery method, notes.
- Phase 1 adds WhatsApp/Instagram messaging automation foundation.
- Deferred: AI campaigns, Meta Ads, advanced analytics, team permissions,
  loyalty/VIP.

**JOS-52 can close once §2 (SWEG integration path) resolves.** The Angola
payment/invoicing tool is decided (SWEG); only the API-vs-manual integration
detail is pending the SWEG docs. Everything else is locked.
