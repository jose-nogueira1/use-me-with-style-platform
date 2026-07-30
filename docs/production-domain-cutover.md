# Production domain and market-routing cutover

Status: complete. Final production gate passed on 2026-07-30.

## Intended production hosts

| Host | Service | Behaviour |
| --- | --- | --- |
| `usemewithstyle.shop` | Vercel storefront | Geo-detect: Angola to `ao`, all other countries to `pt` |
| `www.usemewithstyle.shop` | Vercel storefront | Same as apex; may be redirected to apex by Vercel |
| `ao.usemewithstyle.shop` | Vercel storefront | Angola catalogue, Kz pricing, AO stock and checkout |
| `pt.usemewithstyle.shop` | Vercel storefront | Portugal catalogue, EUR pricing, PT stock and checkout |
| `cms.usemewithstyle.shop` | Railway CMS | Payload Admin and API |

## Cutover checklist

1. Purchase and confirm ownership of the final apex domain (`usemewithstyle.shop`).
2. In the Vercel production project, add the apex, `www`, `ao`, and `pt` domains. Use the DNS records Vercel displays for this project; do not copy generic or historic record values.
3. In Railway, add `cms.<apex>` as the CMS custom domain and use the DNS record Railway displays.
4. Add those records at the registrar. Keep TTL low during cutover. Wait until both platforms show valid ownership and certificates.
5. Set the CMS `CORS_ORIGINS` to the Vercel canonical URL plus the four storefront origins. Set `PUBLIC_SITE_URL=https://usemewithstyle.shop` for general storefront links. Stripe return URLs are pinned to `https://pt.usemewithstyle.shop` because Stripe checkout is Portugal-only and must not be reclassified by geo-routing after payment.
6. Set storefront `VITE_SITE_URL=https://usemewithstyle.shop` and `VITE_CMS_URL=https://cms.usemewithstyle.shop/admin`; redeploy production. The browser API remains same-origin through the Vercel `/api/*` rewrite.
7. Run `npm run domain:check`. Then manually verify apex geo-routing from AO and a non-AO location, direct AO/PT access, market switching with a deep link, checkout return URLs, Admin login, catalogue reads, and TLS on every host.
8. Only after verification, raise DNS TTL and configure the same domain in Stripe, PayPal, AppyPay, Resend, Meta, analytics, and search-console properties where required.

## Final production evidence — 2026-07-30

| Gate | Result |
| --- | --- |
| DNS and HTTPS | PASS — apex, `www`, `ao`, `pt`, and `cms` returned HTTPS successfully; each presented a valid Let's Encrypt certificate for its exact hostname, valid through 2026-10-27. |
| Domain checker | PASS — `npm run domain:check` passed all five final hosts. |
| Geo-routing | PASS — `/api/geo` returned `AO` from the Luanda QA location and the apex redirected to `ao.usemewithstyle.shop`. |
| Deep-link market switching | PASS — `/catalogo?cat=vestidos#products` was preserved when switching from AO to PT; the resulting PT storefront rendered EUR pricing. |
| Admin and API | PASS — `cms.usemewithstyle.shop/admin` returned 200; products, categories, and market settings returned 200 through the final storefront/CMS hosts. Stripe and AppyPay webhook routes reached their handlers and rejected unsigned test payloads with the expected 400/401 responses. |
| Canonical metadata | PASS — AO and PT routes emit self-referencing canonical and `og:url` values using their final market host, without filter queries or fragments. |
| Payment return URLs | PASS — Stripe success/cancel URLs are pinned to the PT storefront; AppyPay's async redirect/webhook URI uses `cms.usemewithstyle.shop`; PayPal completes inline and has no browser return URL. |
| Browser console | PASS — no warnings or errors during apex routing and AO-to-PT deep-link switching. |

Browser artefacts are stored under `output/playwright/domain-gate-20260730/` in the local QA workspace.

## Rollback

Keep `https://use-me-with-style-platform.vercel.app` in CMS CORS. If custom-domain routing fails, remove or correct the bad DNS record; the Vercel canonical deployment and Railway canonical CMS URL remain available while DNS is repaired.
