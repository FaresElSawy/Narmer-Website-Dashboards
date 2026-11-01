# Product color recognition and semantic option types

The owner requested frontend-only color-name matching after a new Gold value displayed a neutral gray circle. The old storefront palette did not contain Gold. The deleted legacy product also used a generic option key despite a Color display label; the replacement Hoodie product already uses the correct `color`, `gold` and `blue` keys.

## Changes

- The storefront recognizes all 148 standard CSS color names. CSS provides their colors; the existing catalog's 13 distinct custom shades (14 names including gray/grey) take precedence to preserve its appearance. Gold now has an explicit shade.
- Display names are checked before saved keys. English case, whitespace, hyphens and underscores are normalized. Common Arabic names, spelling variants, diacritics and definite articles are supported. Unknown names retain a neutral circle with their visible name.
- One helper serves product details and Quick Shop. It returns the same value during server and browser rendering, accepts only palette aliases and standard names, and excludes transparent, currentColor and arbitrary CSS expressions.
- The product editor explicitly distinguishes Color, Size and Other options. New first and second options default to Color and Size. Renaming their display labels preserves the canonical API keys required by swatches and filters.
- Staff can explicitly correct an older generic option's type. Variant selections are remapped while value keys, variant IDs, price, stock and media remain intact. No saved product is migrated automatically.
- No backend fields, dependencies or live product records were changed.

## Verification

- All 150 shared Node tests passed, covering name matching, Arabic aliases, invalid CSS-like values, option typing, duplicate prevention, stable identifiers and variant selection preservation.
- Local integration preview read the owner's actual Hoodie product. Gold rendered as `rgb(212, 175, 55)` and Blue as `rgb(99, 135, 170)` in both languages. Selecting Blue changed the selected group correctly.
- Arabic at 390 px retained both circles and had no horizontal overflow. The fixture editor defaulted to Color then Size, and renaming Color retained its semantic type.
- B2C lint and targeted formatting passed. The staging build passed content, metadata and asset checks for 38 public English/Arabic pages.
- Chrome automation remained blocked by an extension UI; the local checks used the in-app browser. Physical devices and Safari were not tested.

Screenshots: `output/color-option-review/`. Deployment verification is recorded in the delivery response; local preview checks alone are not deployment acceptance.

Standard names: https://www.w3.org/TR/css-color-4/#named-colors
