# Phase 2 — customer return self-service

Phase 1 intentionally keeps return creation in the authenticated storefront admin. For Phase 2, add a customer-facing request form from verified order lookup.

Required scope:

- Verify order number and customer email before revealing eligible items.
- Enforce AO/PT return windows and each product's `returnEligible` flag server-side.
- Let customers choose item quantities, reason, preferred resolution and upload evidence.
- Store uploads privately and scan/validate file types and sizes.
- Create a `requested` return only; approval, refund, store credit and inventory restocking remain human-controlled.
- Add abuse protection, rate limiting, request confirmation, accessibility and bilingual copy.
- Never expose internal notes, refund references, inventory decisions or other customers' data.
- Integrate provider-native refunds once AppyPay/PayPal/Stripe or their replacements are live. Provider callbacks must be idempotent, update `refundStatus`/`refundReference`, and must never trigger inventory restocking.
