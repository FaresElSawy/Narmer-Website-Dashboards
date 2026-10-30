# Narmer backend/design alignment review

Later checkpoint: [BACKEND_UPDATE_REVIEW_2026-10-23.md](BACKEND_UPDATE_REVIEW_2026-10-23.md) reviews the subsequent 43-file delivery. It resolves the image-only/numeric mismatch described below at the current contract level. Preserve this document as the earlier 42-file baseline; use the latest review and implementation plan for current decisions and integration requirements.

Date: 23 October 2026. Scope: the delivered Old Backend Files and New Backend Files packages, the existing Vite app files, supplied asset inventory, current design records and targeted live CURRENT Figma inspection. This is a documentation/static-contract review, not a backend-source audit or live integration test.

## Result and authority

Use `Backend Files/New Backend Files` for integration. The old package is preserved for history. The old frontend developer handoff requested extensions; it is not the current API specification. The new backend response explicitly maps all five requested families to implemented contracts. The owner now wants a phased implementation plan in a new session and explicitly prohibits immediate coding.

### Fresh static checks performed here

| Check                                                 | Old package | New package |
| ----------------------------------------------------- | ----------: | ----------: |
| Delivered files inspected/read by the package checker |          37 |          42 |
| Explicit business operations                          |         135 |         159 |
| Health operations                                     |           2 |           2 |
| OpenAPI and Postman operations                        |         137 |         161 |
| Module/infrastructure documents                       |          16 |          20 |

All delivered JSON and JSONL parsed. Both manifests' listed file hashes matched. Local Markdown file targets existed and stayed inside the delivered folder. Fenced JSON examples parsed. Route inventories and OpenAPI method/path sets matched after parameter-syntax normalization. Local OpenAPI references resolved. Saved Postman JSON response examples parsed. Business routes were covered by contract-coverage inventories. Assertions passed. New package checks included 454 local file links, 85 fenced JSON examples and 157 local OpenAPI references.

There are 24 added operations and **no removed operation**. Eleven file pairs are byte-identical; repeated prose was not reread when its hash proved it identical. Changed module/reference pairs were compared through complete unified diffs. All 20 new module/infrastructure documents were read in bounded chunks by the three focused reviewers; main review integrated and checked the material findings. Narrative flows, transport, audits, references and API setup were reviewed in ordered groups. Generated exports were structurally parsed, not treated as prose. Exact inventory/hashes/deltas are in [backend-package-audit.json](backend-package-audit.json), reproducible with `node docs/implementation-handoff/audit-backend-packages.mjs`.

These assertions establish delivered-package consistency, not that source code implements every statement. No backend `server/` checkout exists here, and no running API origin was supplied. The package's backend tests, MongoDB runs, Apidog remote readbacks and Bunny checks are dated author-supplied evidence, not tests rerun in this review.

## What changed from the old package

| Previous FE request                        | Current documented delivery                                                              | Frontend implication                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| GAP-01: filters/sort/facets/Sale browsing  | Products extension and new public `/products/facets`                                     | Use exact allowed stable keys, supported sorts, integer-piastre min/max and same-real-variant matching. No invented general search. |
| GAP-02: size guides                        | Six Size Charts operations, optional Product assignment/public projection                | Backend guide is an image per language, not editable measurement rows. See the unresolved Figma conflict below.                     |
| GAP-03: limited homepage controls          | Eight operations across the two sites, fixed slot manifest and B2C curated product lists | Implement fixed image overrides/alt and ordered selections only; no arbitrary CMS.                                                  |
| GAP-04: dashboard reporting                | Three B2C admin/superAdmin reporting GETs                                                | Use canonical cohorts, fields and dates; moderators cannot see reports; no B2B reporting.                                           |
| GAP-05: public contact/social/SEO settings | Six independent per-site public/admin operations                                         | Versioned partial bilingual saves, provider URL validation, immediate publication. No fake contacts.                                |

The route delta is facets + 6 Size Charts + 6 Site Settings + 8 Homepage + 3 Reports = 24. The new package also adds historical `items[].category` to checkout/Order item snapshots, nullable for older data, and leaves older recorded categories unknown. Existing B2B Forms/Wholesale/Leads, Users, Sales, Coupons, Shipping, Notifications and internal Email module files are unchanged by hash. Auth's substantive difference is a desktop Apidog cookie-capture note, not permission for browser code to read HttpOnly cookies. Cart/Wishlist clarify that size-chart data is not carried in their DTOs; fetch Product detail when needed.

## Verified design/API mismatch: do not decide silently

**D13 Size charts and the customer guide:** live CURRENT Figma D13 EN mobile `191:18946` and AR mobile `191:19169` still contain Size/Chest/Length/Sleeve numeric rows. Desktop variants are `191:18790` and `191:19013`. The source content also has a measurement-unit/table editor and an illustrative assigned-product count.

`SIZECHARTS_FRONTEND.md:9` explicitly says there is no measurement-table editor. Its DTO at lines 83–103 is bilingual names/alt and per-language public images. Lines 34–36/103 state no assignment list/count. This is not resolved merely because a Size Charts module now exists.

The implementation planner must ask the owner to choose: adapt this UI/guide to image upload/display in the approved visual system, or request a backend contract extension for numeric measurements. Do not fabricate a `measurements` payload, client-only save masquerading as persisted data, derived assignment count from one product page, or silent Figma redesign. This affects the size-guide slice, not every unrelated route.

## Other planning checks and missing configuration

| Item                              | Evidence/current state                                                                                                  | Required behavior                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API base URL                      | Owner explicitly says not configured; conventions line 26 is a deployment-supplied origin with a localhost example only | Ask for development/staging origin and exact CORS/frontend site arrangement before live calls. Plan environment configuration; do not use an assumed server.                       |
| Tailwind                          | Neither app package or Vite config contains Tailwind                                                                    | Keep React/Vite/JavaScript and requested Tailwind. Propose setup in the plan and wait approval. Do not claim an installed existing CSS framework.                                  |
| Homepage editor scope             | `HOMEPAGE_FRONTEND.md:26–54, 134–150`: fixed keys, images/alt, curation; no layout/copy/nav editing                     | Map D14/current UI controls to supported fields, identify excess controls and ask before implementing them. B2B needs the independent equivalent despite no B2B retail selections. |
| Reports and Figma sample captions | backend-response and REPORTS contract settle all-status placement vs delivered ranking and event markers                | Present exact backend definitions in the plan. Flag misleading sample labels; do not infer profit/bank settlement/net cash or re-open approved definitions.                        |
| Forms/content                     | Forms start unpublished; no approved client questionnaires or required supplied-material policy supplied                | Ask for launch configuration/content or plan honest empty/configuration states. Keep optional email optional; guest and account flows are already approved.                        |
| Production facts                  | Contact/social/policies/prices/catalog/destination mapping/sample order number remain non-factual design data           | Use verified client/backend values. Never use the unrelated reference business's actual URLs or invent backend `orderNumber`.                                                      |
| Fonts                             | Brice/Cairo files provided; live English Figma preview uses Inter                                                       | Plan final Brice implementation/typography review; no permanent silent Inter substitution.                                                                                         |
| Guest secret persistence          | Draft/order/lead credentials are distinct, one-time and private; lost-link recovery absent                              | Propose storage/shared-device/refresh behavior for approval. Never log, leak to analytics, or print tokens on the receipt.                                                         |
| Customer email links              | Dated records say templates unset; provider state is not live-verified here                                             | Agree actual frontend entry routes with backend operations. Do not claim customer email delivery or add frontend SMTP/provider code.                                               |

Not new questions: COD and manual InstaPay only, tax outside scope, guest checkout and B2B submission, separate store accounts, inquiry-only B2B, no customer cancellation, delivered-ranking placement cohort, Unknown category for legacy data. Product min/max query instructions mean convert EGP UI values to integer piastres for the wire; no actual contradictory unit contract was found. Verify boundaries during implementation instead of treating that wording as an unresolved business decision.

## Historical wording that must not drive implementation

The package is chronological. Some early B2C flow paragraphs still say reports are pending or price filters absent; their later October 22 sections and current Products/Reports modules supersede those statements. API conventions still says eighteen modules in its early overview; the final manifest/reports follow-up has nineteen business modules plus internal email. `api/README.md:9` retains 142 business/144 total as an earlier count; final counts are 159/161. Architecture includes old proposed routes and `server/client` layout as history, not mounted endpoints or authority to move our Vite apps.

Do not edit backend-generated packaged copies to hide these inconsistencies. Use the current exact module plus final response/index and ask if two genuinely current definitions conflict. The old FE handoff and earlier Figma QA labels about awaiting implementation approval are likewise historical; the owner's latest instruction is design approved, implementation planning now, coding only after plan approval.

## Verification limits

No app/backend/runtime/dependency changes, live API/SMTP/Bunny/database calls, builds, browser integration tests, Apidog reimports, deployment, secrets changes or Figma edits occurred. Figma was read to verify current page/master IDs and the size-chart conflict, not to repeat a whole-project visual review. All static checks passed; the documented design/API and configuration decisions remain for the new planning session.
