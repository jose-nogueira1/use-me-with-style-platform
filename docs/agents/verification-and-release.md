# Verification and release

Canonical shared playbook. Run checks appropriate to the change; do not repeatedly run an unchanged suite without a reason.

## Local and PR checks

Platform: `npm run verify` runs lint, typecheck, unit tests and the SPA build. `npm run test:e2e` runs mocked browser journeys. CI installs the pinned Playwright Chromium; local runs use Chrome. CI must start its own Vite server.

CMS: `npm run verify` runs lint, generated-route typechecking, unit tests and the Next/Payload build. `npm run test:sqlite` runs isolated SQLite migration behavior. Supply a disposable `TEST_POSTGRES_URL` for PostgreSQL tests: the test user needs CREATE/DROP DATABASE privileges. CI provisions PostgreSQL and fails if that variable is absent. A local run with skipped PostgreSQL tests does not establish migration safety.

PR workflows use no production secrets. Required status checks are `Platform checks` and `CMS checks` in their respective repositories. Defining workflows does not enable GitHub branch protection; configure required checks separately after the workflows are published and have run.

## React Doctor (platform only)

`.github/workflows/react-doctor.yml` runs the official React Doctor v2 action separately from the required validation suite. Pull requests report newly introduced findings (`scope: changed`) with full Git history. `blocking: none` keeps findings advisory; do not make its score a merge requirement. Pushes to main and manual runs scan the full project.

Review findings for actual correctness, accessibility, performance and maintenance value. Do not automatically apply fixes, suppress findings to improve the score, or replace typechecks, behavioral tests and browser verification. Consider blocking new errors only after the team has reviewed the signal and explicitly decided to enforce it.

The action manages its own scanner installation. It uses GitHub's repository token for summary/inline comments and status reporting; it needs no additional project secret. A local full scan can be run with `npx react-doctor@latest`; review the installed CLI help before using options. See the [official CI documentation](https://www.react.doctor/docs/ci-and-prs/github-actions-setup).

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
