# Use Me With Style Platform

Production repository for the Use Me With Style ecommerce platform.

Phase 1 focuses on the launch foundation: mobile-first storefront, catalogue, product detail, cart, checkout/order capture, admin product/order operations, market/payment/delivery configuration, and WhatsApp/Instagram messaging automation foundation.

## Current Stack

- React
- TypeScript
- Vite
- Lucide React icons

## Environments

The repo is configured for three persistent environments:

- `development` for local/internal development.
- `staging` for client QA and production-like validation.
- `production` for real customers, real orders, and live integrations.

Tracked env files contain safe public defaults only: `.env.development`, `.env.staging`, `.env.production`, and `.env.example`.

Secrets belong in untracked `.local` files, Vercel environment variables, Railway environment variables, or the relevant payment/media provider dashboard. See `docs/environments.md`.

## Phase 1 Scope

- Angola and Portugal launch markets.
- Portugal payments: PayPal, Stripe, MBWay.
- Angola payments: Appy Pay under evaluation.
- Angola fulfilment: manual coordination.
- Portugal fulfilment: CTT and courier.
- Manual admin catalogue entry.
- Placeholder product media until final client assets are provided.
- Lightweight order lookup/order confirmation.
- Desktop-first admin, with mobile admin as a stretch goal.
- WhatsApp/Instagram messaging automation foundation.

Deferred by default: AI campaigns, Meta Ads automation, advanced analytics, team permissions, full customer accounts, wishlist, and loyalty/VIP segmentation.

## Local Development

```bash
npm install
npm run dev
```

## Useful Commands

```bash
npm run build
npm run build:staging
npm run build:production
npm run env:check
npm run lint
npm run preview
```

## Project Docs

- Phase 1 storefront high-fidelity pack: `docs/phase-1-storefront-high-fidelity.html`
- Phase 1 wireframe pack: `docs/phase-1-mobile-storefront-wireframes.html`
- Environment strategy: `docs/environments.md`
- Prototype guide EN: `docs/use-me-prototype-guide-en.md`
- Prototype guide PT: `docs/use-me-prototype-guide-pt.md`

## External Project Sources

- Figma: https://www.figma.com/design/vIsxsnPzYLGFBSsts3yHXO
- Linear: https://linear.app/joses-workspace-1/project/use-me-with-style-platform-37c7b8734a16
- Notion hub: https://www.notion.so/35fcb5a5fd7a8110ab69f4abb538de98
- Vercel production: https://use-me-with-style-platform.vercel.app
