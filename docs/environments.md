# Environment Strategy

Use Me With Style uses three persistent environments:

- `development` for local/internal development.
- `staging` for client QA and production-like validation.
- `production` for real customers, real orders, and live integrations.

## Environment Files

Tracked files contain safe defaults only:

- `.env.example` - full variable manifest with placeholders.
- `.env.development` - local development public defaults.
- `.env.staging` - staging public defaults.
- `.env.production` - production public defaults.

Untracked files hold secrets and local overrides:

- `.env.local`
- `.env.development.local`
- `.env.staging.local`
- `.env.production.local`

Do not commit real API keys, tokens, database URLs, webhook secrets, merchant credentials, or private storage keys.

## Platform Mapping

| App env | Frontend | API/CMS | Database | Payments | Media |
| --- | --- | --- | --- | --- | --- |
| `development` | Local Vite/Vercel dev | Local/Railway dev | Dev PostgreSQL | Sandbox/test | Dev Cloudinary/S3 folder |
| `staging` | Vercel Preview, usually `staging` branch | Railway staging | Staging PostgreSQL | Sandbox/test | Staging Cloudinary/S3 folder |
| `production` | Vercel Production | Railway production | Production PostgreSQL | Live | Production Cloudinary/S3 folder |

## Frontend Variables

These are exposed to the browser bundle because they use the `VITE_` prefix:

- `VITE_APP_ENV`
- `VITE_APP_NAME`
- `VITE_SITE_URL`
- `VITE_API_BASE_URL`
- `VITE_CMS_URL`
- `VITE_DEFAULT_MARKET`
- `VITE_PAYMENT_MODE`
- `VITE_ENABLE_MOCK_DATA`
- `VITE_ENABLE_LIVE_PAYMENTS`
- `VITE_ENABLE_MESSAGING_AUTOMATION`
- `VITE_ENABLE_ANALYTICS`

Never put secrets in `VITE_` variables.

## Backend / Integration Variables

These are server-only and should live in Railway, Vercel environment variables, or untracked `.local` files:

- PostgreSQL: `DATABASE_URL`, `DIRECT_DATABASE_URL`
- Payload CMS: `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`
- Media: `CLOUDINARY_*`, `S3_*`
- Payments: `STRIPE_*`, `PAYPAL_*`, `MBWAY_*`, `APPY_PAY_*`, `MULTICAIXA_*`
- Messaging/social: `WHATSAPP_*`, `INSTAGRAM_*`, `META_*`

## Commands

```bash
npm run dev
npm run dev:staging
npm run build
npm run build:staging
npm run build:production
npm run env:check
npm run env:check:staging
npm run env:check:production
```

## Rules

- Development and staging must use sandbox payment credentials.
- Production is the only environment allowed to use live payment credentials.
- Each environment must have its own database.
- Each environment should have separate media folders/buckets.
- Staging should be production-like enough to validate checkout, order capture, admin flows, and messaging automation before launch.
