# Verification and release

Canonical shared playbook. Run checks appropriate to the change; do not repeatedly run an unchanged suite without a reason.

## Local and PR checks

Platform: `npm run verify` runs lint, typecheck, unit tests and the SPA build. `npm run test:e2e` runs mocked browser journeys. CI installs the pinned Playwright Chromium; local runs use Chrome. CI must start its own Vite server.

CMS: `npm run verify` runs lint, generated-route typechecking, unit tests and the Next/Payload build. `npm run test:sqlite` runs isolated SQLite migration behavior. Supply a disposable `TEST_POSTGRES_URL` for PostgreSQL tests: the test user needs CREATE/DROP DATABASE privileges. CI provisions PostgreSQL and fails if that variable is absent. A local run with skipped PostgreSQL tests does not establish migration safety.

PR workflows use no production secrets. Required status checks are `Platform checks` and `CMS checks` in their respective repositories. Defining workflows does not enable GitHub branch protection; configure required checks separately after the workflows are published and have run.

## Browser matrix

For visual changes: affected mobile, tablet and desktop breakpoints; relevant PT/EN copy and light/dark states. Preserve previously accepted layouts outside the request.

For catalogue/commerce: relevant AO/PT availability, in/low/out-of-stock products, colour/size combinations and option-less products, sale states, cart/coupon transitions, and admin save/reload. When accounts are introduced, include guest/authenticated and cross-customer access denial. Avoid multiplying every state for an unrelated CSS edit.

## Publish when requested

1. Inspect branch/status and preserve unrelated work. Run the relevant checks and review the complete diff. Do not treat a skill's default commit step as authorization to push or deploy.
2. For schema work, verify a current backup/recovery path using the CMS `docs/operations-observability.md` runbook. Deploy additive, backward-compatible CMS changes and explicitly run migrations before the dependent frontend.
3. Verify deployed API fields, then deploy the frontend. The production `npm run build` includes CMS-backed prerendering and verification; the offline PR SPA build is not a substitute for this release check.
4. Check the affected public/admin flows on the deployed revision. Use test-safe data and never send customer messages or create real payments as a smoke test without explicit authorization.
5. Record both repository SHAs, deployment identifiers, checks performed and unresolved limitations. A successful Git push alone does not prove deployment or migration success.

## Rollback

For additive fields, normally roll back the frontend first and leave compatible database columns in place. Do not run a destructive down migration reflexively: it can delete edits made since deployment. Restore data only through the documented backup/recovery process. Delay removal of old fields until every consumer has stopped using them.
