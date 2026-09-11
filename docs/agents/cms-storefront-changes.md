# Changes spanning CMS, admin and storefront

Canonical shared playbook; the CMS links here. Scope the checklist to the feature.

1. State the user-visible acceptance criteria and affected repositories. Specify old-record defaults, invalid input behavior, and whether historical versions are restored.
2. Update the Payload collection/global and validation. Preserve access restrictions; server-side commerce and ownership checks are authoritative.
3. Add a PostgreSQL migration and register it in `src/migrations/index.ts`. For versioned fields, include the corresponding version schema. Keep additive changes compatible with the previous frontend.
4. Update local SQLite synchronization. Verify on disposable fixtures, including legacy values and a repeated run. Do not run migration tests against production or a personal working database.
5. Run `npm run generate:types` in the CMS and review its diff. Update the platform's handwritten API types and adapters. Preserve numeric relationship IDs where Payload requires them.
6. Implement admin editing and storefront behavior. Global update responses use `{ message, result }`; collection and read response shapes differ. Verify saved values after reload, defaults on older records, and recoverable failures.
7. Run targeted behavior tests, typechecks and the repository verification commands. Include real PostgreSQL migration tests for schema work. The isolated SQLite hero test verifies that migration seam, not the entire historical synchronization script.
8. Record the two revisions and release dependency. For an additive change, migrate/verify the compatible CMS first, then publish the dependent frontend. Consult the release playbook for rollback and smoke checks.

For accounts, resolve customer/admin identity, guest orders, account linking and order ownership before implementing the schema. No account feature is implicitly authorized by this playbook.
