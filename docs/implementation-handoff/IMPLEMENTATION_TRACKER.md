# Narmer — implementation execution tracker

Updated 30 October 2026. Companion to [the detailed implementation plan](IMPLEMENTATION_PLAN.md).

## Current position

- Phase 8 checkpoint, 30 October: the available local/controlled and bounded temporary-API run is finished; cleanup is verified. Live order/inquiry exact concurrent replay, role/session/customer workflows, reset/new sign-in, stock/coupon protection and three-order Finance reconciliation passed within their recorded limits. Three canceled orders and three inquiry snapshots remain as test history; catalog/promotions are inactive and disposable accounts blocked. Phase 8 remains **In progress**, with the exact live/provider/device/release gaps listed in [PHASE_8_TEST_REPORT.md](PHASE_8_TEST_REPORT.md). Email visual design is deferred to backend; deployment is not authorized by this checkpoint.

- Owner acceptance and next-phase authorization, 28 October: the owner accepted Phase 7 after reviewing the chart corrections and explicitly requested Phase 8. **7 of 8 phases are Accepted; Phase 8 is In progress.** Integration/release verification is authorized; production deployment remains separate. See [PHASE_8_PROGRESS.md](PHASE_8_PROGRESS.md).

- Owner chart-readability correction, 28 October: Finance uses four separate bar charts on a shared scale; Overview follows CURRENT Figma's navy curve and gold endpoint. SVG labels retain a consistent screen size at wide widths. All 128 shared logic checks and 31 focused Chromium/WebKit EN/AR chart checks pass, along with B2C build/lint and formatting. Phase 7 remains Ready for owner review. See [PHASE_7_HANDOFF.md](PHASE_7_HANDOFF.md).

- Phase 7 was explicitly authorized on 27 October and is now Ready for owner review. Overview, Finance and Performance are available locally for B2C Admin/Super admin. The owner corrected the display week to Sunday; weekly Overview/Finance charts aggregate validated daily buckets rather than relabelling the API's Monday weeks. See [PHASE_7_HANDOFF.md](PHASE_7_HANDOFF.md) for scope, permissions and verification boundaries. B2C Admin/Super admin now land on Overview; Moderators remain on Orders, and B2B remains on Requests.

- Owner acceptance, 27 October: the final logo correction is complete. Both dashboard logos return to their current main dashboard page (B2C Orders, B2B Requests), including the mobile drawer. All 48 Chromium/WebKit EN/AR role/desktop/mobile checks passed, including unsaved-edit protection. The owner said “we can call this phase done.” Phase 6 is Accepted; Phase 7 awaits a separate go-ahead.
- B2C profile button sizing, 27 October: Change password now uses the normal 48px button height, matches its input column width and aligns with the confirm-password field instead of stretching across the label/input row. All 24 Chromium/WebKit EN/AR views passed at six widths, including disabled/enabled/mismatch states without submitting a password change. B2C build, lint and formatting passed.
- B2C editor spacing correction, 27 October: Category, Product and Size chart Save/Delete pairs now have a consistent 16px gap through one B2C sidebar CSS rule. Button labels, behavior, table icons and B2B are unchanged. All 72 Chromium/WebKit EN/AR views passed across six widths, including mobile save-bar separation; the B2C review build, lint and formatting passed. See [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md).
- Owner scope correction, 27 October: icons apply only to B2C table-row edit/delete actions. B2B was restored to its pre-expansion text buttons/links. All primary, editor, photo, variant, chart-row and form controls retain their original text labels in both stores. Earlier whole-dashboard icon expansion is superseded. `DeleteRecord` defaults to a text button; B2C table callers explicitly opt into icons. See [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md) for the correction and verification.
- Sales/Coupons table visual correction, 27 October: the owner's table reference supersedes the earlier 24px glyph treatment. Both actions now use consistent 20px pencil/trash symbols, borderless 44px targets and a subtle Edit background. The table uses one white container, quieter headers and row separators, with compact mobile cards. Existing state, schedule, usage and role protections remain intact.
- Calendar/icon refinement, 27 October: trash glyphs now render at 24px; calendar year options stay on one line; month/year/hour/minute menus overlay the picker without changing its position, size or scroll area. The expanded Sales/Coupons harness checks open menus in both engines/languages at five widths. See the calendar refinement note in [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md).
- Sales/Coupons and Size charts review follow-up, 27 October: browser date/time controls were replaced with a shared Narmer calendar/time picker; promotion rows and editors use enabled/disabled switches; Sales/Coupons deletion uses a labelled trash icon; the Size charts library now includes the same Super-admin-only delete action. Assignment/reference protection and uncertain-write reconciliation remain enforced. This follow-up passed 112 logic tests, four new Chromium/WebKit EN/AR workflows at five widths, four existing operational workflows, both builds/lint and formatting. See the latest section in [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md).
- Owner review batch, 27 October: the B2C product editor now uses smooth Product details / Variants & stock / Images tabs, compact variant rows, spaced Remove actions and one image library with color/size assignments. New products can switch between Simple and Variant before saving while retaining the respective draft values. Products and size charts expose their image step upfront and continue to uploads after the first save. Shared popup spacing and mobile dialog padding are corrected in both stores. Order lines display small, explicitly labelled current-catalog thumbnails with an unavailable-image fallback. Role permissions were documented without changing authorization. See the latest batch in [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md) and [ROLE_PERMISSIONS.md](ROLE_PERMISSIONS.md).
- Review-batch verification: **106 logic tests, four editor workflows covering 72 responsive tab views plus product/chart creation, 152 confirmation/form-dialog checks, four thumbnail workflows at five widths, four existing operational workflows and eight shopping regressions passed.** Both review builds, both lint checks and project formatting passed. All mutations used disposable local fixtures; the live/provider/device boundaries remain open.
- Chat continuation, 27 October: the owner's decision/correction record is [CHAT_CONTINUATION_2026-10-27.md](CHAT_CONTINUATION_2026-10-27.md). The same-project continuation chat is `Narmer - Phase 6 review and continuation`, ID `01a17d64-270d-7592-8a21-5a8824159a34`. This move does not accept Phase 6 or authorize Phase 7.
- Planning, CURRENT design/source alignment and updated backend-package review: completed as preparation.
- Implementation phases accepted by the owner: **7 of 8**.
- Latest accepted phase: **Phase 7 - B2C reporting**, accepted on 28 October 2026.
- Current position: **Phase 7 is Accepted; Phase 8 is In progress.** The owner explicitly authorized Phase 8. Dark mode remains a separate Figma-only preview. See [PHASE_7_HANDOFF.md](PHASE_7_HANDOFF.md) and [PHASE_8_PROGRESS.md](PHASE_8_PROGRESS.md).
- Phase 6 implementation baseline: **101 logic tests, 224 dashboard layout cases, four operational journeys, eight intercepted recovery/privacy scenarios, eight shopping regressions and six checkout smoke flows passed.** These earlier reports remain recorded separately from the 27 October review-batch checks above. Phase 6 owner acceptance is recorded; live API/provider acceptance and physical devices remain open for release verification.
- Latest review batch, 26 October: shared empty-state buttons now sit below the text; account tabs preserve scroll and transition only their content; product cards (including homepage New Arrivals) offer Quick add and a Buy now icon; product detail offers Buy now; prominent dismissible success notifications, a quantity-based header cart badge and the approved mobile floating cart are implemented. Buy now explicitly includes the selected item and existing cart, without clearing selections or automatically placing an order. See the latest review-batch section in [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md).
- Owner follow-up, 26 October: removed duplicate inline Add to cart / wishlist confirmations in favor of the floating notification, reduced mobile notification size while preserving its dismiss target, and kept product-card cart icons navy on hover.
- Latest owner-review refinement, 26 October: Overview, Profile, Saved addresses and Your orders now share the same account frame and active navigation. The address form uses grouped columns, profile/address actions use Narmer icons, order history has aligned filters/cards/pagination and save notices are compact and scoped to the relevant page. Shared B2B account pages receive the matching layout with their own store-specific navigation. Twenty B2C account journeys and eight B2B sibling journeys pass across Chromium/WebKit and English/Arabic; 48 checkout/receipt/history regressions also pass. See [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md).
- Latest owner-requested refinement: the printed/PDF receipt now uses the Narmer logo, navy/gold hierarchy, aligned item columns and a localized thank-you footer. English/Arabic PDF samples, including background graphics disabled, are recorded in [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md).
- Previous Phase 5 patch verification: **88 logic tests, eight quick-shopping journeys, 20 account journeys, six checkout/receipt/history smoke flows and focused cross-site feedback/tab-motion checks passed**, plus both builds/lint and project formatting. Earlier Phase 5 evidence includes 48 responsive checkout flows, 36 recovery/privacy scenarios, 42 shopping regressions and 20 storefront regressions. English/Arabic receipt PDFs were inspected. See [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md) for evidence and remaining live checks.
- Local review links restarted on 27 October 2026: [B2C website](http://127.0.0.1:5283/en/products), [B2C dashboard](http://127.0.0.1:5283/en/dashboard/orders), [B2B website](http://127.0.0.1:5284/en), and [B2B dashboard](http://127.0.0.1:5284/en/dashboard). These local preview servers must be restarted after shutdown.
- Owner-requested dashboard and B2B public-site audit: findings, fixes, browser evidence and remaining external checks are in [DASHBOARD_AND_B2B_AUDIT.md](DASHBOARD_AND_B2B_AUDIT.md). No phase acceptance or next-phase authorization is inferred from the audit.
- Phase 1 accepted and Phase 2 authorized by the owner on 23 October 2026: “alright great, start phase 2”.
- Owner accepted Phase 2 and authorized Phase 3 on 24 October 2026: “well done, now we can say thats phase 2 is done, start phase 3”.
- Owner accepted Phase 3 on 24 October 2026: “now i can say thats phase 3 is done”.
- Latest staff-access presentation: owner-supplied centered-card reference, navy background/gold action, language icon, password-eye toggle and exact English tab title `Staff Login | Narmer`. Customer auth design stays unchanged. Both builds/lint, formatting, 32 staff scenarios and 32 built navbar language-switch cases passed. The owner selected the supplied gold favicon for every public, dashboard and staff page in both apps. Route-specific icon switching was removed. See the latest note in [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md).
- Staff-access refinement: anonymous dashboards now use their own EN/AR sign-in and recovery URLs; logout returns to staff sign-in. `/dashboard` aliases the English entry. The public account sign-in follows CURRENT A01 without profile tabs, and unpublished Forms use a single neutral state. Both builds/lint, 55 Node tests, 32 new intercepted staff/customer scenarios, 34 existing dashboard contract/recovery cases, 56 skeleton cases and four fixture-only review login/logout checks passed. See [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md).
- Post-acceptance refinement: all existing secondary text/spinner loaders now use shared responsive skeletons across both websites; the Narmer logo intro is preserved. Form, catalog, product, content and image layouts retain localized accessibility and reduced-motion support. Both builds/lint, changed-source formatting, 55 Node tests and 56 controlled EN/AR desktop/mobile Chromium/WebKit loading cases passed. See [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md) and `output/playwright/skeletons/results.json`.
- Backend update review completed on 24 October: 44 files checked, four added Auth/Users operations, no removed operations. See [BACKEND_UPDATE_REVIEW_2026-10-24.md](BACKEND_UPDATE_REVIEW_2026-10-24.md).
- Phases 4, 5 and 6 are accepted. See [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md). Phase 8 connects the earlier B2B staff-creation/own-password checkpoint and verifies real Chrome session restoration through a local same-site proxy. Live role/mutation acceptance, Firefox and actual Safari/devices remain open.
- Latest Phase 2 refinement: owner-approved subtle motion across both home pages and the built public routes, preserving CURRENT Figma. Shared section entrances, hero-image motion and interaction feedback are recorded with 46 focused browser cases in [PHASE_2_PROGRESS.md](PHASE_2_PROGRESS.md).
- Folder organization: both websites now use named page source files, matching named English/Arabic public HTML and fonts/images/css/js asset folders. React/Vite/Tailwind remain in place. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md); 30 unchanged public page bodies, 78 structure checks, 128 journey/layout checks and 38 Node tests are recorded in the Phase 2 progress file.
- Phase 8 switches wholesale links to backend-saved slugs and the resolver; IDs remain internal. Generated hosting rules map historical aliases and IDs directly to current canonical URLs, with local HTTP 308 verified. Valid-offer live verification, exported-schema corrections and actual website-host redirect/invalidation acceptance remain open. See [PHASE_8_PROGRESS.md](PHASE_8_PROGRESS.md), [BACKEND_UPDATE_REVIEW_2026-10-24.md](BACKEND_UPDATE_REVIEW_2026-10-24.md) and the original [URL request](WHOLESALE_STABLE_URLS_BACKEND_HANDOFF.md).
- Formatting: shared Prettier configuration and `format` / `format:check` commands now cover both websites and shared source. Formatting checks, lint, both review builds, 40 Node tests and 30 public-page content/structure comparisons pass. See the Phase 2 progress file for scope.
- Motion timing feedback: section reveals now start farther inside the viewport, use a more visible 720ms pace and separate large content groups. Eight scroll-timing, 46 page-motion and 14 logo/menu checks pass, plus builds/lint/formatting and 40 Node tests. See the latest Phase 2 handoff section.
- Supplied temporary API origin: `https://narmer-ecommerce.vercel.app`, configured in both explicit `.env.integration` profiles. Review mode remains fixtures. After the backend fix, all four agreed origins pass preflight and all 28 public browser GET probes pass across Chromium/WebKit. See [BROWSER_CONNECTION_RETEST_2026-10-24.md](BROWSER_CONNECTION_RETEST_2026-10-24.md). Authenticated integration is not accepted. The owner confirmed test super-admin accounts exist in both stores; no credential has been received or used. The live public Forms list is empty; real questionnaires must be configured and published before live request-form acceptance.
- Work resumed on 23 October 2026 after the owner explicitly said to continue and authorized credit usage if the allowance is exhausted. The earlier pause checkpoint is historical; Phases 1–3 are now accepted.

This tracker records execution progress. The detailed plan contains full scope, screen-to-contract mapping, business rules and acceptance criteria. Neither document replaces the CURRENT Figma source lock or the exact latest backend contracts.

## Working sequence and review gate

1. Start only the next authorized phase. Announce its number, scope, task checklist and any phase-specific input needed.
2. Mark it In progress and update its tasks as work is completed. Keep a short current-task update in chat during substantial work.
3. Implement and check the phase, including affected shared components/callers, responsive/RTL behavior and relevant errors/states. Do not start later-phase features merely because they are nearby.
4. Record actual checks/evidence and any remaining integration/content limitation. A rendered fixture is not a successful live API flow.
5. When that phase's agreed scope and required checks are complete, say: **“Phase N is done — ready for your review.”** Mark it Ready for review, not Accepted.
6. Let the owner review the result. Apply requested corrections within that phase and recheck what changed. The owner accepting the phase and authorizing the next one permits progression; a missing reply is not acceptance.
7. Record acceptance and the owner's next-phase go-ahead, then begin the next numbered phase. Never skip a number or silently mark future work complete.

Allowed statuses: Not started, In progress, Ready for review, Accepted, Blocked. A task checkbox means its scoped work/check passed, not that every external dependency is verified. If required work cannot be completed, report partial progress or Blocked; do not announce the whole phase done.

Every phase handoff includes: completed tasks, representative screens/artifact paths, actual test/build/browser results, fixture-versus-live status, remaining issues/decisions, and the next phase. Keep a persistent record below. If a later shared change regresses an accepted phase, log the regression, fix it at the responsible layer and repeat the affected checks; do not lose it between phases.

## Phase overview

| Phase | Scope                                         | Status      | Owner acceptance |
| ----- | --------------------------------------------- | ----------- | ---------------- |
| 1     | Foundation for both apps                      | Accepted    | 23 October 2026  |
| 2     | B2B public website and customer inquiry flow  | Accepted    | 24 October 2026  |
| 3     | B2B dashboard and staff operations            | Accepted    | 24 October 2026  |
| 4     | B2C browsing, accounts, Wishlist and Cart     | Accepted    | 24 October 2026  |
| 5     | B2C checkout, receipts and tracking           | Accepted    | 26 October 2026  |
| 6     | B2C dashboard operations and configuration    | Accepted    | 27 October 2026  |
| 7     | B2C reporting                                 | Accepted    | 28 October 2026  |
| 8     | Integrated verification and release readiness | In progress | Pending          |

Previous plan label mapping: 1→1, 2A→2, 2B→3, 3→4, 4→5, 5A→6, 5B→7, 6→8. Only numbering changed. Planning remains Phase 0 in the detailed plan and is not an additional app-building phase.

## Inputs and readiness

### Ready for Phase 1

- Approved CURRENT website/dashboard directions and exact Figma references.
- Both existing JavaScript React/Vite apps; Tailwind setup is included in authorized Phase 1 work.
- Supplied logo/image sources and Cairo Arabic; the owner approved Poppins English during Phase 1 review.
- Updated backend package and numeric Size Charts response reviewed; the previous numeric/image contract blocker is resolved.
- Separate app boundaries, shared primitives, routing/privacy recommendations and public pre-rendering approach accepted.
- Replaceable dummy bilingual content/contract-shaped fixtures authorized for review.
- Internal Figma direction/GAP/sample notes excluded from real UI; genuine user help remains.
- Relevant skill usage and find-skills for a demonstrated gap authorized.

### Phase 1 authorization

- Owner authorized Phase 1 on 23 October 2026. The foundation is now presented for review. Acceptance and next-phase authorization remain pending.

### Needed later for real integration or launch

| Input                                                                 | Needed for                                                                                 | Current treatment                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual API origin and allowed frontend origins/cookie arrangement     | Live Auth, Cart, uploads and all API acceptance                                            | Origin supplied, isolated integration profiles configured and four agreed origins verified after the backend fix on 24 October; authenticated cookie acceptance remains open. See the browser connection handoff. |
| Actual public site origins/hosting rules                              | Final canonical/hreflang/social URLs, redirects, pre-render serving and tracking templates | Keep configuration explicit; test sample/pre-render output locally                                                                                                                                                |
| Approved staging users/roles and disposable test data                 | Authorized customer/staff integration tests                                                | Do not provision accounts or change real records as routine frontend setup                                                                                                                                        |
| OTP/SMTP, public/private media and InstaPay readiness                 | Real email/upload/payment-review journeys                                                  | Backend/operator responsibility; fixture behavior is labelled                                                                                                                                                     |
| Client questionnaires/material rules/catalog/offers/contacts/policies | Production content and publication                                                         | Review fixtures first; track replacement before launch                                                                                                                                                            |
| Real governorate/category destination mapping                         | Final navigation/shipping data acceptance                                                  | Demo mappings allowed; do not persist synthetic IDs to a live backend                                                                                                                                             |
| Factory chart values/measurement explanation                          | Real customer guides                                                                       | Numeric contract is ready; use demonstration values until supplied                                                                                                                                                |

Missing later inputs do not block approved foundation/fixture development. If they prevent a required phase acceptance check, record it explicitly and agree the review scope; keep the live check open. Phase 8 cannot certify full release readiness while required live checks remain blocked.

## Phase 1 — Foundation for both apps

Status: Accepted. Execution approval: owner authorized Phase 1 on 23 October 2026. Owner accepted the reviewed corrections and authorized Phase 2 on 23 October 2026.

- [x] Confirm starting app/assets/dependency state and preserve supplied/user files.
- [x] Verify usable Node/package-manager/browser tooling; record the existing build/lint baseline.
- [x] Configure minimal Tailwind and declarative routing in both existing apps; retain JavaScript/React/Vite.
- [x] Establish the small shared source boundary; keep each app's business features separate.
- [x] Load owner-approved Poppins for English and supplied Cairo for Arabic, plus CURRENT colors, typography, spacing and component tokens. Poppins replaces Brice following Phase 1 review feedback.
- [x] Build public shells and distinct B2B/B2C navigation, including mobile/RTL behavior and 6px retail utility gaps.
- [x] Apply owner-requested motion: thin rotating chevrons, desktop hover/small-screen tap menus, shared control/dialog/drawer/hero motion, and bounded animated-logo intros for both public websites, with reduced-motion and no-JavaScript fallbacks.
- [x] Build dashboard shell/sidebar/drawer, role-aware navigation, language/logout and basic reusable controls/feedback.
- [x] Establish locale, API envelope/errors, safe binary handling and store-separated session/refresh primitives with fixture checks.
- [x] Keep review fixtures/content isolated and replaceable; remove internal Figma build annotations from actual UI.
- [x] Establish public metadata/indexing structure and prove meaningful pre-rendered HTML/head tags on one EN/AR public route.
- [x] Check representative desktop/tablet/mobile layouts, keyboard/focus, overflow and initial loading/bundle behavior; run both builds/lint and meaningful foundation tests.
- [x] Present the foundation for owner review, including typography and rendered public/dashboard examples.

Completion record: [PHASE_1_HANDOFF.md](PHASE_1_HANDOFF.md). Both builds/lint passed, 13 shared logic tests passed, and 40 built-browser cases passed across both stores/languages and five widths. Following owner review, Poppins replaces Brice, thin chevrons follow the supplied arrow reference, and shared motion plus hover/tap behavior and logo intros are implemented. The latest builds/lint, all 40 browser cases, 14 focused motion cases and four public HTML/hydration checks passed. The motion review caught and corrected mobile submenu link clipping. Native same-origin Web Locks were verified separately; session logic was unchanged by these presentation corrections. The handoff records evidence, Poppins/Cairo review, dependencies, performance baseline, corrected findings and exact fixture/live limits. No live API/cookie/provider acceptance is claimed. The owner subsequently accepted Phase 1 and authorized Phase 2; see its record below.

## Phase 2 — B2B public website and inquiry flow

Status: Accepted by the owner on 24 October 2026. Phase 1 accepted; Phase 2 authorized on 23 October 2026. The handoff explicitly keeps Firefox, actual Safari/devices, live integration and production-content acceptance open.

- [x] Build BW-01 home, service/detail and shared contact/information templates with review content.
- [x] Build B2B account registration/OTP/login/recovery/profile/address behavior using the existing store-specific contracts.
- [x] Render all five Forms types and all six supported field types, preserving stable keys/version, required rules, optional email and valid zero/false.
- [x] Build Wholesale collection/offer detail, fixed compositions and whole-pouch selection without retail pricing/checkout.
- [x] Implement private draft preparation/retention, optional raw images and uncertain-upload reconciliation.
- [x] Build manufacturing/wholesale review, exact submission replay, immediate receipt and changed-definition/offer recovery.
- [x] Build guest tracking and customer request history with correct private tokens/account ownership.
- [x] Verify empty/unpublished/unavailable/validation/conflict/expiry/429 states and EN/AR responsive/accessibility behavior.
- [x] Verify public SEO/content links/pre-render output and loading behavior for actual B2B templates, with final origins/content regeneration and hosting acceptance left for the configured environment.
- [x] Run relevant builds/lint/behavior checks and record fixture-versus-live and browser coverage accurately.
- [x] Obtain owner review/acceptance of the inquiry journey before authorizing Phase 3.
- [ ] Complete Firefox testing after its Windows runtime can launch; keep actual Safari/physical-device coverage open until access is available.

Implementation review record: [PHASE_2_HANDOFF.md](PHASE_2_HANDOFF.md). Both review builds/lint pass; 35 Node checks, the initial 448 Chromium/WebKit checks, 14 contract/recovery scenarios, 40 shared-shell regression cases, 14 motion cases and four initial-HTML/hydration checks pass. Subsequent owner-feedback verification passed 142 navigation/form/service cases and 180 wholesale gallery/guide cases; 18 focused gallery-motion cases pass after the final video-reference refinement. The latest contract harness intercepted every API request; no live backend/provider call occurred. The full route matrix covers two languages and five widths. Firefox's patched stable and supported Beta runtimes both failed Windows side-by-side activation before loading the site. WebKit on Windows does not count as actual Safari. These limits remain open in the handoff; this record does not claim complete real-device or live acceptance. Phase 3 was subsequently authorized on 24 October 2026.

## Phase 3 — B2B dashboard and staff operations

Status: Accepted by the owner on 24 October 2026 after the dashboard/public audit and requested control refinements. Frontend/fixture checks are complete; live and real-device acceptance remain open. Review the forthcoming backend updates before starting Phase 4.

- [x] Build BD-01 Requests list/filter/pagination and D20 detail/private images/contacted flow.
- [x] Build D18 bilingual Forms configuration/versioned saves/publication, preserving fixed fields and stable question keys.
- [x] Build native Product list/D05 editor, target-bound media upload and read-only B2C source selector.
- [x] Build D19 fixed-pouch composition and offer management with explicit source/version/publication rules.
- [x] Build B2B account management, notification feed/read states and staff profile.
- [x] Build independent B2B Homepage and D22 Site Settings using supported fields only.
- [x] Verify moderator/admin/superAdmin boundaries, reference-protected deletion, version conflicts and uncertain-save recovery.
- [x] Verify mobile labelled records, Arabic alignment, keyboard controls, private-state clearing and notification polling/backoff.
- [x] Run relevant builds/lint/tests and review staff operation of the Phase 2 submissions; keep real external publication separate.

Execution record: [PHASE_3_PROGRESS.md](PHASE_3_PROGRESS.md). Review handoff: [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md). Passed 55 Node tests, 154 dashboard layout/workflow checks, 30 intercepted contract scenarios, 12 focused keyboard/motion/variant checks, 48 owner-feedback control checks and 14 affected Phase 2 recovery scenarios. Both builds/lint, formatting and public HTML proofs pass. No live backend/provider was reached during that implementation verification. Four was the original sample's variant count, not a cap; XXL/XXXL are now available in the sample and the delivered 100-variant/100-line contract limit is explained. Owner-requested staff creation is implemented for local review; its backend contract arrived on 24 October and the frontend permission/password/recovery adaptation is pending. The shared controls and five service buttons are recorded in the handoff.

Subsequent B2B mobile review during Phase 4: homepage hero/steps, dashboard summary alignment, source/service controls, overlapping product/account filters and notification action rows were corrected. The Phase 3 handoff records 24 Chromium/WebKit EN/AR scenarios at 320/360/390/440/768/1440px across seven public/staff pages, plus 20 shared-control B2C regression scenarios. Both builds/lint and formatting pass; physical-device acceptance remains open.

### Backend integration checkpoint before Phase 4

- [x] Review the second 24 October backend refresh: all 45 files, hashes/examples/links and 166 matching operation definitions; inspect the delivered stable-URL response and perform public read-only resolver/catalog checks.
- [ ] Backend corrects the resolver's missing 503 NOT_READY export and nullable/string variantId schema. Verify a real saved slug/alias after authorized test data is available, then integrate the frontend adapter and actual website-host redirects.

- [x] Compare all 44 files with the previous reviewed package; validate schemas, examples, links, hashes and operation inventory.
- [x] Configure the supplied temporary API in separate integration profiles without changing review or production defaults.
- [x] Perform read-only live health/public/protected-unauthenticated checks and reproduce browser CORS failure.
- [x] Verify the backend permits all four agreed frontend origins: 204 preflights and 28 successful public browser GET probes across Chromium/WebKit. See [BROWSER_CONNECTION_RETEST_2026-10-24.md](BROWSER_CONNECTION_RETEST_2026-10-24.md).
- [x] Confirm local Chrome cookie transport and session persistence: owner signed in to both stores; reload restored both sessions through the integration-only loopback proxy. Actual production HTTPS/device acceptance remains open.
- [x] Adapt B2B creation to the delivered super-admin-only request, initial-password handling and uncertain-result reconciliation in Phase 8. Intercepted browser cases pass; real account-creation writes require explicit test-data authorization.
- [x] Implement signed-in B2B own-password change using the delivered contract and existing private-session clearing in Phase 8, reusing B2C forms. Real credential changes/session invalidation remain unverified.
- [ ] Owner enters each store's test credentials in the browser; verify login, refresh, authorized reads, store isolation and logout. Live mutations require separate explicit authorization.

## Phase 4 — B2C browsing, accounts, Wishlist and Cart

Status: Accepted by the owner on 24 October 2026: “everything looks good for now”. The owner then explicitly authorized Phase 5. Preserve all accepted refinements.

- [x] Build CW-01 home/curated sections/image fallback and actual category navigation mapping behavior.
- [x] Apply the owner-approved centered footer credits already used on B2B: linked D-Tech (`https://dtech-agency.com/`) and Glitci Solutions (`https://glitci.com/`), followed by “All rights reserved © 2026 Narmer Clothing Factory.” Preserve this English wording in both language views.
- [x] Build R01 supported filters/sorts/facets/pagination with URL/language state and stale-response protection.
- [x] Build R02 simple/variant detail, galleries, actual combination selection and numeric-first/legacy-image size guide.
- [x] Reuse shared account/profile/address UI with separate B2C identity and existing auth contracts.
- [x] Apply the owner's supplied hero/menu image choices, tighter menu zoom and generated four-model B2C customer login campaign; retain separate staff access.
- [x] Load the eleven supplied B2C products and all 42 photos into local review, with owner-approved demo values, category trees and model cover photos. Preserve real-details/live-upload work as a separate checkpoint. Latest evidence: 69 Node tests, 34 public B2C HTML pages, eight full catalogue scenarios and eight card/menu checks; see `output/catalogue/README.md`.
- [x] Build account-only R03 Wishlist, guest sign-in interaction and removable unavailable entries.
- [x] Build R04 canonical Cart DTO handling, absolute quantities/removal, null-versus-zero totals and unavailable/stock states.
- [x] Implement explicit customer login merge and conflict recovery without discarding guest/account selections.
- [x] Verify SEO/head/pre-render/structured-content mapping for retail public templates; preserve private-route indexing boundaries.
- [x] Check responsive/RTL layouts, large quantities, keyboard states, empty/error cases and loading performance.
- [x] Run relevant builds/lint/behavior checks; present browsing-to-Cart for review and record actual cookie/merge integration status.

Completion record: [PHASE_4_HANDOFF.md](PHASE_4_HANDOFF.md). Latest checks: both review builds (34 B2C / 28 B2B public pages), both lint checks, project formatting and 70 Node tests passed. The expanded 42 intercepted shopping/recovery cases cover immediate quantity saves, keyboard validation, merge feedback and stable multi-item Cart ordering. Twenty further Chromium/WebKit EN/AR storefront cases cover the shared card appearance, borderless View product actions, 16px/14px directional arrows, preset price ranges, aligned borderless Sale checkbox, persistent pagination controls, mobile spacing/overlay, centered navigation with the language switch at the outer end and removal of duplicate footer About. Four motion cases verify direction-aware hover and reduced motion. Earlier evidence includes 96 original responsive cases, eight account journeys, 18 B2B gallery cases, eight favicon cases, 16 refinement cases and 16 both-store button checks. The handoff retains source-image/catalogue evidence and the Phase 6 Homepage editor boundary: curated products/order are supported by the backend; a separate homepage price override is not. Firefox launch still fails on this Windows host. Real customer cookies, authorized live Cart/Wishlist/merge and production-content/host acceptance remain open. Phases 4 and 5 were subsequently accepted by the owner, as recorded below.

## Phase 5 — B2C checkout, receipts and tracking

Status: Accepted by the owner on 26 October 2026. Phase 4 accepted by the owner on 24 October 2026 ("everything looks good for now"). Phase 5 explicitly authorized after the owner corrected "phase 4" to "phase 5", paused at the owner's request, and resumed with "you may continue phase 5". See [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md).

- [x] Build R05 explicit customer/address snapshot with saved-address prefill and governorate confirmation/mapping; owner confirmed all 27 Egyptian governorates.
- [x] Build Shipping and Coupon preview using current Cart ownership and intended checkout phone.
- [x] Build COD review and InstaPay receiving-account/quote/proof steps with separate raw private upload.
- [x] Retain checkout/proof IDs and original ownership for exact placement replay after uncertain responses.
- [x] Build R07 acknowledgment and R07-R detailed receipt within checkout step 3, using actual Order DTOs.
- [x] Implement EN/AR browser print/Save PDF behavior without private tokens or fabricated invoice/order-number fields.
- [x] Build R08 guest/account tracking and R09 account history with authorized proof reads and expiry/unavailable states.
- [x] Verify quote/stock/coupon changes, invalid/oversize uploads, replay, null-token preservation and a fresh Cart after success.
- [x] Check mobile/RTL/keyboard behavior and preserve noindex/privacy for checkout, receipt and tracking routes.
- [x] Run relevant checks and present the entire flow with fixture/live boundaries; keep required live acceptance outstanding until verified.

Completion record: [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md). All 83 shared Node tests, 48 responsive checkout/receipt/tracking flows, 36 intercepted recovery/privacy scenarios, 42 shopping/recovery regressions and 20 storefront regressions pass. Both review builds and lint checks pass. English/Arabic printed receipts were rendered and inspected. A bounded independent review identified an account-read identity race; the adapter guard and regression test now cover it. Live authenticated cookies, provider storage, real orders/payments and physical devices remain unverified. The owner accepted Phase 5 and authorized Phase 6 on 26 October 2026.

## Phase 6 — B2C dashboard operations and configuration

Status: Accepted by the owner on 27 October 2026 after the review corrections and final dashboard-logo change. The owner accepted Phase 5 and authorized Phase 6 on 26 October 2026, then confirmed continuation. This acceptance does not authorize Phase 7 or production deployment.

- [x] Build D07/D08 Orders/proof/status handling, expectedStatus conflicts and accurate offline payment/refund wording.
- [x] Build D03/D04 Products/simple/variant editor, retained variant IDs and Product media attachment.
- [x] Build D06 Categories/tree behavior and existing image/reference rules.
- [x] Build D09–D11 Sales/Coupons tabs/editors with one contextual create action, canonical eligibility fields and visible backend overlap errors.
- [x] Build D12 shipping overrides/default and separate InstaPay account settings.
- [x] Build D13 numeric chart library/editor, exact row/cell limits, returned assignment count, optional images and independent Product assignments.
- [x] Review the compact publication/availability control for D13; preserve isActive deliberately and warn on shared-chart edits.
- [x] Build D14 fixed Homepage slots/curation, D21 Site Settings, accounts, notifications and staff profile.
- [x] Verify local/intercepted roles, deletion exceptions, version/reference/media conflicts, clear/attachment and store separation. Live provider expiry and production enforcement remain Phase 8 checks.
- [x] Check responsive/RTL behavior, custom controls, builds/lint and relevant tests; present operational workflows for review.

Completion record: [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md). All 101 logic tests, 224 EN/AR responsive dashboard cases, four Chromium/WebKit operational workflows and eight intercepted recovery/privacy checks passed at the implementation baseline. Eight shopping regressions, six checkout smoke flows, both review builds, both lint checks and project formatting passed. Later owner-review corrections and their focused checks are recorded in the handoff, including 48 final dashboard-logo checks. The handoff preserves live/provider/device boundaries and the current 100-record curation/chart picker limit. Phase 6 is Accepted; Phase 7 has not started.

## Phase 7 — B2C reporting

Status: Accepted by the owner on 28 October 2026 after the chart-readability corrections. The owner explicitly authorized Phase 8. Production deployment remains a separate authorization.

- [x] Build admin/superAdmin CD-01 overview, D01 finance and D02 performance with exact canonical captions/definitions.
- [x] Implement explicit Cairo date boundaries, interval/rank/pagination state and bounded request/cache behavior.
- [x] Render returned data and rankings, null averages, zero/partial buckets and Unknown historical categories. The owner's Sunday-week correction uses exact grouped daily data.
- [x] Preserve placement versus collection/refund-marker cohorts and currently delivered ranking behavior.
- [x] Verify Cairo DST/week/month boundaries, safe amounts, stale responses and return-driven historical ranking changes.
- [x] Verify moderator exclusion, 30/min report-budget handling and busy/unavailable/retry states.
- [x] Check responsive charts, accessible equivalent data, keyboard/touch interaction and localized number/date labels.
- [x] Run relevant builds/lint/tests, record live reconciliation status and present reports for review.

Completion record: [PHASE_7_HANDOFF.md](PHASE_7_HANDOFF.md). Owner acceptance is recorded. Real backend reconciliation, physical devices and release approval remain Phase 8 responsibilities.

## Phase 8 — Integration and release readiness

Status: In progress, explicitly authorized by the owner on 28 October 2026 after accepting Phase 7. Live checks depend on the approved environment, test accounts/data and device access; these do not prevent the local audit from starting.

- [ ] Reconcile every earlier deferred integration check; do not hide pending work behind phase completion counts.
- [ ] Verify actual origins/CORS/cookies/TLS/deep links and cross-store/multi-tab authentication/session invalidation.
- [ ] Verify guest/account B2B and B2C workflows, exact replay, Cart merge, stock/coupon conflicts and staff permissions against authorized test data.
- [ ] Verify raw public/private uploads, authorized image reads, versioned content/public refresh and provider-readiness evidence with the backend owner.
- [ ] Verify actual OTP/customer tracking links/email behavior; distinguish frontend failures from backend/operator readiness.
- [ ] Reconcile reporting against authorized data and confirm public guides and all explicit role boundaries.
- [ ] Replace/review client placeholders, policy/material rules, contacts/catalog/mappings and actual chart content before launch approval.
- [ ] Validate delivered public HTML, canonical/hreflang, structured data, sitemap/robots, real status/redirect behavior and content regeneration process.
- [ ] Complete representative browser/device/keyboard/accessibility/RTL/print checks and fix material defects.
- [ ] Check production bundles/loading/interaction/layout stability and run the required builds/lint/tests.
- [x] Produce the current full pass/fail/fix/retest report, verified cleanup evidence, remaining-issue list and monthly SEO/content maintenance handoff. Refresh the report when the outstanding live/release gates are tested; this does not mark Phase 8 Accepted.
- [ ] Obtain owner acceptance of release readiness. Deployment remains a separately authorized action.

Progress record: [PHASE_8_PROGRESS.md](PHASE_8_PROGRESS.md). Do not mark Accepted while a required final check remains unverified.

The owner requested a full pass/fail/fix/retest report. It is maintained in [PHASE_8_TEST_REPORT.md](PHASE_8_TEST_REPORT.md), with live test IDs and verified cleanup states separately recorded in `output/phase8/live-test-ledger.json`. Both stores' role/customer sign-ins, selected restrictions and ownership checks, role/block invalidation, owner-completed password reset/new sign-in, Cart merge, stock/coupon protection and actual order/inquiry concurrency/replay passed. Three live canceled orders reconcile to EGP 708. Reset-specific old-session invalidation was not isolated; the full raw backend role matrix, unavailable live InstaPay, additional report event cohorts, tracking-email delivery and external release gates remain unverified. No acceptance or deployment is inferred.

## Phase completion record template

For each phase, replace its placeholder record with:

- Implementation completion date and status.
- Completed checklist items and actual scope deviations, if any.
- Files/screens/artifacts to review.
- Checks run and actual results, including important visual/browser evidence.
- Data mode: fixtures, live integration, or a named combination.
- Remaining issues, deferred checks and the exact later phase/input that owns them.
- Owner feedback/corrections and acceptance date/message.
- Next authorized phase; otherwise waiting for review.

Record material decisions once and link to them from affected phases. Do not rewrite the backend's delivered package, global instructions or assistant memory as part of tracker maintenance.
