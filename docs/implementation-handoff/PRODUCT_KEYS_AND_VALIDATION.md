# Automatic product option keys and field validation

The owner approved generating option/value identifiers internally after an uppercase `Red` key triggered local product validation and appeared as a generic request error. The owner also requested visible, specific feedback for missing or incorrect fields.

## Result

- The B2C product editor no longer asks staff to enter option or value machine keys. Staff enter the English/Arabic names.
- New option/value identifiers derive from the English name using the existing slugify dependency. Generated identifiers satisfy the backend's lowercase/length rules, avoid reserved keys and receive suffixes for collisions.
- Temporary identifiers allow adding variants before names are complete. Renaming an unsaved option/value updates affected variant selections without losing the selection, price, stock, images or identity.
- Saved option/value identifiers remain stable when their display names change. Temporary editor markers are stripped from outgoing option/value objects.
- Product validation identifies missing English/Arabic names, category, slug, option/value translations, sellable variants and variant selections. It also checks money, discounts, stock, text limits and duplicate combinations.
- Save shows red field borders and inline messages in the current language, opens the relevant product tab/disclosure, focuses the first incorrect field, and preserves the draft. Warnings update as fields are corrected.
- Structured backend field errors are shown against matching product fields, including bracket-index paths. A duplicate product slug also marks and reveals the slug field. Unstructured backend errors retain their existing general feedback.
- The product editor opts into this validation through the existing RecordEditor. Other B2C editors keep native validation. The shared select control accepts an optional error message; B2B behavior and appearance are unchanged when that prop is absent.
- Existing write uncertainty, permissions, rate-limit guards and media upload protections remain in place. Validation does not retry a write.

## Verification

- All 143 shared Node tests passed, including new identifier generation, collision/reserved-key handling, length/prefix constraints, selection remapping, saved-key preservation, marker stripping, missing-field paths, zero prices/stock, discounts and duplicate combinations.
- Connected Chrome fixture checks passed for missing fields submitted from Images, automatic switching/focus, red borders with accessible messages, correcting names/category, opening a collapsed definitions section for a missing Arabic value, opening a collapsed variant for invalid discount/stock, and clearing corrected warnings.
- A corrected fixture variant product saved successfully and continued to Images. Subsequent label changes retained its saved selection identifiers. Duplicate variants were rejected with messages at their combination fields.
- English desktop and Arabic mobile layouts were inspected. Arabic viewport settings of 390 and 320 px showed no horizontal overflow and retained first-field focus.
- B2C/shared lint and formatting passed. Both staging builds passed: 36 B2C and 28 B2B English/Arabic public pages had content, metadata and valid assets at build time.
- The existing product editor QA script has focused regression assertions and passed syntax validation. Its full Chromium/WebKit matrix was not rerun; equivalent targeted interactions ran in connected Chrome.

Local screenshots and evidence: `output/product-validation/`.

No live product was created or updated for these checks. Physical-device and Safari checks were not performed. The client-review update uses the existing `testing` branch and Vercel preview deployments.
