# Narmer — updated backend package review

23 October 2026. Review only; no frontend/backend application changes.

## Result

The numeric size-chart contract now supports the CURRENT design and the individual/shared Product assignments requested in our handoff. The previous image-only mismatch is resolved at the delivered-contract level. No new endpoint or duplicate chart module was added. The frontend must now handle numeric guides, nullable images, real assigned-Product counts and explicit publication.

The folder has **43 files: 1 added, 20 changed, 22 byte-identical to the previously reviewed package, and none removed**. The operation inventory itself is byte-identical: **159 business + 2 health = 161 total**. Changes are concentrated on Size Charts and the Product/Homepage guide projections, associated documentation, examples and evidence. The other 17 module contracts are unchanged by hash; B2B and retail checkout/Orders/Reports business rules are not expanded.

The owner also approved the previously recommended public-page **pre-rendering approach**, retaining both React/Vite apps. Tool selection, proof of delivered HTML and the content-refresh process belong in the authorized foundation work; final hosting/API values still require configuration. This approval is recorded in IMPLEMENTATION_PLAN.md and is not a framework migration or permission to start an unapproved coding phase.

## Review coverage and method

- Read the updated README and general backend response first, then the new size-chart response/decision map and exact current chart contract, affected Product/Homepage fields, flow/convention and reference/audit/readiness additions.
- Compared every delivered file's SHA256 with the original reviewed snapshot in backend-package-audit.json.current. Reused prior content review for the 22 exact matches instead of pretending unchanged prose was new work.
- Read/parsed all 43 delivered files through the existing read-only package checker. Generated multi-megabyte JSON exports were parsed and structurally checked, rather than pasted line by line as prose.
- The new response embeds four complete contracts. Independently compared each embedded contract with its current canonical delivered file after removing only hyperlink/provenance/blank-separator differences: all four match. The embedded Product/Homepage/shared contracts are intentional self-contained reference duplication, not new application scope.
- Checked the numeric POST/PATCH schemas and all four admin chart response schema occurrences plus all four public Product/Homepage guide schema occurrences. OpenAPI 3.1 type unions correctly permit image:null; measurements and the required admin count are present.
- Existing static checker and focused schema assertions passed. No app source, dependencies, configuration, backend package, real API, Apidog, database/provider or Figma was modified.

Machine evidence: [backend-update-audit-2026-10-23.json](backend-update-audit-2026-10-23.json). The earlier package audit is preserved as the baseline; it was not overwritten.

## What the backend now specifies

| Area               | Delivered behavior                                                                                                   | Frontend implication                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Resource/routes    | Existing six B2C Size Charts routes, same IDs, roles and independent chart version                                   | Extend the planned feature; do not add another resource/API                                      |
| Numeric content    | measurements is null or {unit,rows}; cm only                                                                         | Native numeric editor and customer table using translated headings                               |
| Rows               | 1–50 ordered rows; exactly size/chest/length/sleeve                                                                  | Preserve order and send a complete table on numeric edit                                         |
| Size label         | Trimmed 1–30 Unicode code points; unique ignoring case                                                               | Display labels, not a fixed S/M/L enum or Product option key                                     |
| Measurements       | All three required finite JSON numbers, 0.01–1000 cm inclusive, at most 2 decimal places                             | Do not send strings, null cells, zero or arbitrary precision; use canonical normalized response  |
| Omission/clear     | Create omission/null means no table; PATCH omission preserves, object fully replaces, null clears only table         | Keep image fields, assignments and other table rows intact unless explicitly edited              |
| Activation         | isActive defaults false; numeric-only chart can explicitly activate without an image; saving rows does not toggle it | Show and preserve publication state; explicit user choice for activation                         |
| Content protection | Active chart must retain a valid table OR an image                                                                   | Clearing its final content requires isActive:false in the same PATCH                             |
| Count              | assignedProductCount on admin list/detail/create/PATCH                                                               | Use server count; never infer it from one page or treat it as delete authorization               |
| Count meaning      | Extant assigned B2C Products, including inactive/hidden, once per Product regardless of variants                     | A count can change without chart.version changing                                                |
| Public guide       | sizeChart includes measurements; image can be null                                                                   | Render numeric content first, otherwise the retained image; avoid unconditional image.url access |
| Legacy records     | Existing image guides, IDs and assignments retained; absent measurements returns null                                | Support image-only/numeric-only/mixed guides; no OCR, seeded values or destructive migration     |
| Affected consumers | Product list/detail and Homepage's reused Product projection                                                         | Apply identical null/table handling in shared guide display/data functions                       |
| Unaffected domains | No guide fields added to Cart, Wishlist, Orders/receipts or B2B Wholesale                                            | Do not duplicate chart snapshots or create new commerce behavior                                 |

Exact source: [Size Charts](../../Backend%20Files/New%20Backend%20Files/modules/SIZECHARTS_FRONTEND.md), [Products](../../Backend%20Files/New%20Backend%20Files/modules/PRODUCTS_FRONTEND.md), [Homepage](../../Backend%20Files/New%20Backend%20Files/modules/HOMEPAGE_FRONTEND.md), and [backend's complete response](../../Backend%20Files/New%20Backend%20Files/size-chart-backend-response.md).

## Individual and shared assignments — satisfied

The backend response explicitly covers A/B using chart X, C using chart Y and D having no chart. One Product has zero or one chart at a time; a chart can serve one or many Products. Editing X updates the current guide of A/B. Reassigning or clearing only B does not change A or C. To give a Product different measurements, choose/create a different chart rather than changing a shared chart expecting an individual effect.

Assignments continue through existing Product create/PATCH with sizeChartId, and Product PATCH uses that Product's current version. Chart edits use chart.version. Counts are read-only; reference-protected deletion still checks the actual assignments transactionally. No extra assignment or bulk endpoint is necessary.

## Response to all seven requested decisions

| Question from our handoff       | Backend answer                                                                                                          | Status                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Representation/replacement      | measurements:{unit,rows}, complete replacement; omission/clear explicitly defined                                       | Answered                                         |
| Unit                            | cm only; frontend localizes cm/سم; no conversion                                                                        | Answered                                         |
| Measurement meaning             | No assumed flat width, circumference or body-measurement meaning; factory supplies values/explanation                   | Honest content boundary; not an API blocker      |
| Bounds/precision/required cells | 1–50 rows, 1–30 codepoint unique labels, required 0.01–1000 values with up to 2 decimals                                | Answered; use these technical limits             |
| Publication                     | Default inactive, explicit activation, numeric OR image content, save preserves publication unless deliberately changed | API answered; frontend presentation detail below |
| Assignment count                | Derived, batched, always admin-only; includes inactive/hidden once per Product                                          | Answered                                         |
| Compatibility/precedence        | Preserve images/IDs/assignments, numeric-first, nullable image, legacy measurements:null                                | Answered; mandatory frontend adaptation          |

## Remaining frontend detail and content inputs

**Publication control:** CURRENT D13 shows Save chart but no explicit active/inactive control. The new exact contract intentionally does not equate Save with Publish. A small, clearly labelled publication/availability control consistent with the existing editor system is recommended for owner review during the size-chart UI slice. Do not create an automatic publish rule or a new publish endpoint. This is a frontend presentation decision, not another missing backend capability.

The actual factory measurements, chart names, assignments and explanation of Chest/Length/Sleeve remain client inputs. The owner's authorization for dummy review data remains valid: use labelled demonstration fixtures until supplied, and never present them as verified factory standards. Required Sleeve is a current contract rule; do not silently submit null/zero for a missing value or invent alternative garment measurement columns.

The API origin and actual frontend origins/transport/provider readiness remain unconfigured/unverified as previously recorded. The new response introduces no API host, provider dependency, environment variable or migration. It does not authorize contacting a sample localhost server.

## What did not change

The following 22 delivered files are byte-identical to the previous reviewed package:

`api/examples-verification.json`, `api/import-log.jsonl`, `api/local-example-checks.json`, `api/native-case-import.json`, `api/routes.json`, `modules/AUTH_FRONTEND.md`, `modules/CART_FRONTEND.md`, `modules/CATEGORIES_FRONTEND.md`, `modules/COUPONS_FRONTEND.md`, `modules/EMAIL_DELIVERY_FRONTEND.md`, `modules/FORMS_FRONTEND.md`, `modules/LEADS_FRONTEND.md`, `modules/MEDIA_FRONTEND.md`, `modules/NOTIFICATIONS_FRONTEND.md`, `modules/ORDERS_FRONTEND.md`, `modules/REPORTS_FRONTEND.md`, `modules/SALES_FRONTEND.md`, `modules/SHIPPING_FRONTEND.md`, `modules/SITESETTINGS_FRONTEND.md`, `modules/USERS_FRONTEND.md`, `modules/WHOLESALE_FRONTEND.md`, `modules/WISHLIST_FRONTEND.md`.

The API route file is unchanged. Auth/refresh cookies, Cart merge/checkout replay, COD/manual InstaPay, B2B Leads/Wholesale, shared notification behavior, settled Reports definitions and historical Unknown categories therefore retain their existing exact contracts. Field-level references elsewhere do not add endpoints or permissions.

## Changed/new file inventory

| File, relative to New Backend Files | Versus previous reviewed package |
| ----------------------------------- | -------------------------------- |
| README.md                           | changed                          |
| api-conventions.md                  | changed                          |
| api/README.md                       | changed                          |
| api/example-manifest.json           | changed                          |
| api/narmer.openapi.json             | changed                          |
| api/narmer.postman.json             | changed                          |
| api/verification.json               | changed                          |
| b2b-flow.md                         | changed                          |
| b2c-flow.md                         | changed                          |
| backend-response.md                 | changed                          |
| contract-coverage.json              | changed                          |
| documentation-audit.md              | changed                          |
| handoff-audit.md                    | changed                          |
| handoff-manifest.json               | changed                          |
| integration-readiness.md            | changed                          |
| modules/HOMEPAGE_FRONTEND.md        | changed                          |
| modules/PRODUCTS_FRONTEND.md        | changed                          |
| modules/SIZECHARTS_FRONTEND.md      | changed                          |
| references/architecture.md          | changed                          |
| references/security.md              | changed                          |
| size-chart-backend-response.md      | added                            |

## Static verification results and limits

| Check performed here                           | Actual result                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| File inventory/hash comparison                 | 43 current; 20 changed, 1 new, 22 identical; 0 removed                             |
| Manifest-listed hashes                         | All matched                                                                        |
| JSON/JSONL parsing                             | Passed                                                                             |
| Local Markdown targets checked                 | 463; no missing/out-of-package target                                              |
| Fenced JSON examples parsed                    | 106; no parse failure                                                              |
| OpenAPI local references checked               | 157; all resolved                                                                  |
| Routes/OpenAPI operation equality              | Passed; 161 total, 114 canonical paths                                             |
| Postman request count / saved responses parsed | 161 requests / 509 saved response records; saved JSON parsing passed               |
| Contract coverage route checks                 | Passed                                                                             |
| Embedded versus canonical contract content     | All four match after presentation/link normalization                               |
| Focused numeric/schema checks                  | 2 request schemas, 4 admin response occurrences, 4 public guide occurrences passed |

The backend reports 182 regression tests passed, zero failures and five opt-in MongoDB skips, plus a separate guarded real-MongoDB size-chart test. Its reply/API verification describes actual storage/count/concurrency/legacy checks and remote schema/example readback. These are supplied dated backend evidence, not tests or Apidog operations independently rerun here. No frontend/browser/provider/production acceptance follows from them.

Some older chronological paragraphs still say reports or image-only guides are pending. The explicit 23 October numeric extension and current exact modules supersede those historic statements. Existing package prose reports 464 local links; this checker's matching rule counted 463. No broken local link was found; a counting-method difference is not treated as a functional defect.

## Plan impact

- Remove the previous numeric-versus-image contract blocker from the implementation plan. Use the updated numeric contract and retain legacy image fallback.
- Add exact numeric constraints, server counts, explicit publication state and null-safe Product/Homepage guide handling to acceptance checks.
- Keep unrelated phase ordering and business boundaries intact; B2B remains first.
- Record pre-rendered public HTML as an owner-approved approach, with normal Phase 1 tooling/proof and later real-data refresh/hosting validation.
- Keep coding, deployment and external writes within their existing approval boundaries. No backend-package edits or app implementation were performed by this review.
