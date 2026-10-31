# Product option setup visibility

The owner reported that the small, muted “Color and size definitions” disclosure was hard to find in the B2C variant product editor.

## Change

- A pale brand surface, border, larger “Colors and sizes” title and option count make the setup area distinct from the sellable variant list.
- A short English/Arabic explanation describes defining colors and sizes before adding variants with prices and stock.
- Products without option definitions start expanded, with a prominent text-labelled Add option button above the fields.
- Adding an option keeps the section open. Configured products start collapsed to preserve the compact editor; the title and guidance remain visible.
- Native disclosure keyboard behavior and all existing option/variant validation and limits are retained. No B2B or backend changes are included.

## Verification

- Chrome fixture checks passed for empty-state expansion, visible Add option, adding an option without collapsing its fields, Enter to collapse/reopen, and preserving draft options across product editor tabs.
- A configured fixture product with two definitions started collapsed with the new heading and guidance visible.
- English desktop and Arabic mobile layouts were visually inspected. Arabic checks at 390 and 320 px viewport settings had no horizontal overflow; the Add option button measured 48 px high.
- Local screenshots are in `output/product-option-visibility/`.
- All seven focused catalog tests, B2C/shared lint, formatting and the staging build passed. The build verified content, metadata and assets for 34 English/Arabic public pages.
- The existing product editor QA script now includes disclosure regression assertions and passed a syntax check. Its full Chromium/WebKit matrix was not rerun; equivalent focused interactions were checked in connected Chrome.

No live products were created or saved during these checks. Physical-device and Safari testing were not performed for this focused change.
