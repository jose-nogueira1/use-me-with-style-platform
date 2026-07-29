# Production domain and market-routing cutover

Status: engineering-ready; blocked only by purchase and ownership of the final domain.

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
5. Set the CMS `CORS_ORIGINS` to the Vercel canonical URL plus the four storefront origins. Set `PUBLIC_SITE_URL=https://usemewithstyle.shop`. The apex is intentional: Stripe returns there and the storefront routes to a market.
6. Set storefront `VITE_SITE_URL=https://usemewithstyle.shop` and `VITE_CMS_URL=https://cms.usemewithstyle.shop/admin`; redeploy production. The browser API remains same-origin through the Vercel `/api/*` rewrite.
7. Run `npm run domain:check`. Then manually verify apex geo-routing from AO and a non-AO location, direct AO/PT access, market switching with a deep link, checkout return URLs, Admin login, catalogue reads, and TLS on every host.
8. Only after verification, raise DNS TTL and configure the same domain in Stripe, PayPal, AppyPay, Resend, Meta, analytics, and search-console properties where required.

## Rollback

Keep `https://use-me-with-style-platform.vercel.app` in CMS CORS. If custom-domain routing fails, remove or correct the bad DNS record; the Vercel canonical deployment and Railway canonical CMS URL remain available while DNS is repaired.
