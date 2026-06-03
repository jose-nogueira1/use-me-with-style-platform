# Figma Import Kit

This folder keeps the Phase 1 storefront design ready for a low-call Figma transfer.

## Files

- `phase-1-storefront-import-payload.json` - source-of-truth tokens, frame list, and implementation notes.
- `phase-1-storefront-import-script.js` - self-contained JavaScript for one `use_figma` MCP call.

## How To Use After Figma Pro Is Active

1. Open the Use Me With Style Figma design file.
2. Run the contents of `phase-1-storefront-import-script.js` through the Figma MCP `use_figma` tool.
3. The script creates a new page named `Phase 1 Storefront - High Fidelity` and builds editable frames for the storefront.
4. Use exported screenshots in `docs/design-review/storefront-phase-1/` as visual QA references.

## Notes

- The import uses editable Figma primitives and text layers, not a flat screenshot.
- Product media remains placeholder art until client photography is provided.
- Logo treatment is represented with editable wordmark text in the import script to avoid asset upload calls.
