# Stable input layout during validation

The owner reported that inputs moved out of alignment when an adjacent field displayed a validation error. The shared `.field` component is a CSS grid. When the surrounding row grew for an error, its automatic grid tracks stretched the neighboring label and input rows.

The shared field now uses `align-content: start`. Labels and controls retain their natural height and top alignment; inline messages remain below the controls and can expand the content beneath them normally. No fixed error heights, absolute positioning, hidden messages or validation changes were introduced. Both websites use this shared rule.

## Evidence

- Before the fix, reproducing the owner's missing Arabic color name stretched the neighboring English input from 48 px to 63.2 px and moved it down 15.2 px. A neighboring select grew from 47 px to 62.2 px when price validation appeared.
- With the fix, English/Arabic color name inputs retain their 48 px height and matching top position when errors appear, clear and return. The variant Color select and Price input retain matching top positions and their normal heights.
- Arabic desktop name fields kept identical positions before and after validation. At a verified 390 px viewport, the invalid input retained its 48 px height and original document position, with no horizontal overflow.
- The existing product editor QA script includes regression assertions for input height and alignment around a missing variant price. It passed syntax checks; its full Chromium/WebKit matrix was not rerun. Targeted interactions used the local in-app browser.
- Both staging builds passed their content, metadata and asset checks: 38 B2C and 28 B2B public English/Arabic pages. Formatting, lint and diff checks passed.

Local screenshots: `output/field-alignment/`. No live products were created or saved. Physical devices and Safari were not tested.
