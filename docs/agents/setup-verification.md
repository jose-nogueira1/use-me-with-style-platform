# Workflow setup verification — 11 September 2026

## Delivery state at initial verification

The preceding hero work was pushed to main: platform `be15c40`, CMS `caaf684`.
At initial verification, the subsequent engineering setup was on `codex/project-workflow-setup` in both repositories and had not yet been pushed. This section records that historical state; use Git history for the current delivery state. The parent workspace map is local because the parent directory is not a Git repository.

## Implemented

- Repository guidance, single-context domain maps and an existing-decision authority map.
- Documented Linear tracker and default triage mapping, with no remote tracker mutations.
- Shared CMS/admin/storefront and verification/release playbooks, maintained in the platform and linked from CMS.
- Explicit typecheck and verification commands; fixed the 17 existing platform type diagnostics.
- PR workflows for deterministic validation. CMS CI provisions PostgreSQL 18, checks generated artifacts, and refuses to skip migrations because of a missing database URL.
- Isolated SQLite hero migration tests for defaults, historical versions and preservation of edits across repeated runs.
- Extracted hero positioning controls and preview from Settings; browser coverage includes save, reload and independent reset.
- Updated obsolete sidebar browser tests to use the current filter drawer. Fixed two contrast failures: vivid sale red is now #D60000 on light backgrounds; the footer country-switch uses the stronger existing border token. The empty contrast-exception baseline remains unchanged.

## Verification evidence

- Platform `npm run verify`: lint, typecheck, 228 tests, SPA build passed.
- Platform `CI=true npm run test:e2e`: all 38 tests passed using Playwright Chromium and a fresh Vite server.
- CMS `npm run verify` against a disposable PostgreSQL database: lint, typecheck, all 194 tests (zero skipped) and Next/Payload build passed.
- CMS `npm run test:sqlite`: both disposable SQLite tests passed; also included in the 194-test suite.
- Negative check: CI migration command without TEST_POSTGRES_URL failed with the intended configuration error.
- Regenerated Payload types and admin import map matched committed artifacts.
- Both workflow YAML files parsed successfully; diff whitespace checks passed.

Local checks used Node 26 and PostgreSQL 16; the workflows specify Node 22 and PostgreSQL 18. GitHub Actions has not run this unpublished setup. Production CMS-backed frontend prerendering and deployed smoke checks were not repeated for this local setup task.

## External activation checklist

Publishing the setup commits activates the workflows and makes main-branch documentation links available. After the checks run, configure branch protection to require Platform checks / CMS checks respectively; branch protection was not modified here. Verify existing Linear labels before the first tracker write. Existing operational automation remains in place.
