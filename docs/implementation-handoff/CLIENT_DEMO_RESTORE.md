# Client demo content restoration

Updated: 31 October 2026. Status: content restoration complete; refreshing the two Vercel testing builds.

The owner authorized restoring the local demonstration catalog, sizes, categories, B2B questionnaires and wholesale packs to the temporary API for client review. Prices and stock are sample values. The owner also requested removing the Phase 8 test products. Existing orders and inquiry history must be preserved.

## Verified through the public API

- Both B2C Phase 8 test products are inactive and absent from the public catalog. Their records remain available for order history.
- Seven active categories: Men, Men / Hoodies, Men / Sweatshirts, Women, Women / Hoodies, Women / Sweatshirts, and Women / Quarter-zips.
- All 11 retail products are complete, with 42 photos and 66 variants (S, M, L, XL, XXL, XXXL). Each variant has stock 25. The original local demo prices and manual discounts were retained; three products appear on the Sale page.
- Every product photo appears in the main gallery and all six size galleries, in the original order.
- The homepage New arrivals selection matches local products 4, 5, 6 and 7; Sale matches products 3 and 6. The original built-in section images are retained.
- The original six-row Demo hoodie size guide is restored and assigned only to the beige Unapologetic hoodie, as in the local reference. These are demonstration measurements, not newly approved manufacturing measurements.
- Five active bilingual B2B forms: Spinning, Weaving, Fabric, School Uniforms, and Wholesale. Each has the original six custom questions plus the fixed contact fields.
- Four wholesale packs are published and available: Logo hoodie, Everyday sweatshirt, Sport hoodie, and Quarter-zip sweatshirt. Each has 30 pieces per pouch and a source photo.
- Three packs use native B2B sources; the navy quarter-zip uses the restored B2C product with composition S 6, M 9, L 9, XL 6.
- Public English and Arabic reads returned HTTP 200 for catalog, category, form, and offer lists. No authenticated API calls were made outside the browser.

## Deployment refresh

The saved public HTML must be rebuilt after backend content changes. This documentation commit triggers the existing GitHub-to-Vercel workflow on `testing`. Both projects remain Preview deployments, with the branded review domains tracking `testing`. No production promotion or security-setting change is intended.

The public catalog and Sale page were checked in Chrome before the refresh. Final saved-homepage and deployment checks follow the two builds.

## Sources and evidence

- Retail reference: `B2C-Website/src/content/catalogue.js` and `B2C-Website/src/features/shop/fixtures.js`.
- B2B reference: `B2B-Website/src/features/inquiry/fixtures.js`.
- Local preparation and live ID ledger: `output/client-demo/manifest.json`.
- Public API readbacks: `output/client-demo/public-*.json` (English and Arabic).
- Assert-based verification: `output/client-demo/verification.json` (PASS: product counts, unique slugs, photo order in all size galleries, all sample prices/discounts/stock, category count, five forms, four available packs, local homepage order, and original size-guide rows).
- Preparation script: `tmp/prepare-client-demo.mjs`.

The verified final inventory is 11 retail products, 42 photos, 66 variants, seven categories, five questionnaires, one sample size guide, and four wholesale packs.

## Connection interruption

Chrome's debugger connection detached during the pink hoodie upload. The user reconnected the extension. The three pending photo uploads were reconciled in the editor, the fourth photo was added, and all four were saved. The separate Windows runtime had timed out on state capture; no native input was sent.

Some writes returned `SESSION_REFRESHED`. The retained edits were reviewed and saved again only after that explicit response; successful public readbacks confirmed the result. No uncertain product creation was blindly retried.

No orders, inquiries, accounts, shipping fees, payment settings, or existing order history were changed in this restoration.
