# Figma Import Kit

This folder keeps the Phase 1 storefront and admin designs ready for low-call Figma transfer.

## Files

- `phase-1-storefront-import-payload.json` - storefront source-of-truth tokens, frame list, and implementation notes.
- `phase-1-storefront-import-script.js` - self-contained storefront JavaScript for one `use_figma` MCP call.
- `phase-1-admin-import-payload.json` - admin source-of-truth tokens, frame list, and implementation notes.
- `phase-1-admin-import-script.js` - self-contained admin JavaScript for one `use_figma` MCP call.

## How To Use After Figma Pro Is Active

1. Open the Use Me With Style Figma design file.
2. Run the contents of `phase-1-storefront-import-script.js` through the Figma MCP `use_figma` tool for the storefront page.
3. Run the contents of `phase-1-admin-import-script.js` through the Figma MCP `use_figma` tool for the admin page.
4. The scripts create pages named `Phase 1 Storefront - High Fidelity` and `Phase 1 Admin - High Fidelity`.
5. Use exported screenshots in `docs/design-review/storefront-phase-1/` and `docs/design-review/admin-phase-1/` as visual QA references.

## Notes

- The import uses editable Figma primitives and text layers, not a flat screenshot.
- Product media remains placeholder art until client photography is provided.
- Logo treatment is represented with editable wordmark text in the import script to avoid asset upload calls.
- Admin frames are desktop-first, with mobile admin retained as a stretch-reference frame.
