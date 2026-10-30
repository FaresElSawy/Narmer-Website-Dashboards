# Phase 6 - B2C dashboard operations and configuration

Updated 27 October 2026. Status: **Accepted by the owner**. The owner accepted Phase 5 and authorized Phase 6 on 26 October, then accepted Phase 6 on 27 October after the review corrections and final dashboard-logo change. Phase 7 and production deployment require separate authorization.

## Delivered scope

The B2C dashboard now uses the approved Narmer workspace, with English/Arabic routes, Poppins/Cairo typography, custom dropdowns, styled upload controls, accessible labels and responsive data cards. Its default entry opens Orders. Overview, Finance and Analytics/Performance belong to Phase 7 and are not presented as completed reports.

| Area                                | Implemented behavior                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orders                              | Paginated/status-filtered list, order/customer/payment/delivery details, item and total snapshots, history and documented status transitions. Updates send `expectedStatus`; stale or uncertain results are re-read before another change.                                                  |
| Payment proof                       | Explicit private binary read, abortable fetch and temporary object URL cleanup. Payment review remains a staff decision. No bank transfer, automatic refund or order deletion is invented.                                                                                                  |
| Products                            | Simple/variant create and edit, immutable saved type, bilingual content, category/chart assignment, publication state, stock, SKU, base/discount prices and ordered media. Existing variant IDs survive full replacement writes.                                                            |
| Variant editing                     | Compact expandable rows, editable option/value definitions, add/remove actions and validation of unique keys/combinations. Limits match the backend: 5 options, 50 values per option and 100 sellable variants. There is no four-size limit.                                                |
| Categories                          | Bilingual create/edit, hierarchy, named parent selector excluding the current subtree, position, availability, media and protected deletion. Product/category tables display category names.                                                                                                |
| Size charts                         | Library, bilingual editor, explicit availability, independent chart versions, assignment count and shared-edit warning. Numeric tables use cm, 1-50 rows, unique size labels and values from 0.01 to 1000 with at most two decimals. Optional EN/AR images remain separate from table data. |
| Sales and coupons                   | Two tabs with one contextual create action, named product/category targeting, editable scope, percentages/fixed discounts, dates, coupon restrictions and read-only usage count. Writes preserve canonical eligibility rules and surface backend conflicts.                                 |
| Shipping and receiving instructions | Separate default fee, governorate overrides and Orders receiving-account editor. Money stays integer EGP piastres; a zero fee is valid. Admins may delete shipping overrides as the documented exception. Receiving instructions do not rewrite old orders.                                 |
| Homepage                            | Six fixed image slots with desktop/mobile uploads, clear overrides, Alt text and supplied fallback imagery. Ordered New Arrivals/Sale product selections; no independent price override or general layout builder.                                                                          |
| Site settings                       | Versioned bilingual/store contact, social and policy settings supported by the supplied contract.                                                                                                                                                                                           |
| Accounts                            | Account list/edit with protected/deleted-account behavior. Super-admin-only staff creation, initial-password handoff, deletion and ownership transfer. Secrets clear after handoff or an uncertain creation response.                                                                       |
| Staff profile                       | Own name/phone updates and password change, separate from customer sign-in. Password changes and ownership transfer invalidate the local identity when appropriate and return to staff login.                                                                                               |
| Notifications                       | Staff order-event feed, per-user read state/count, resource links and bounded visibility-aware polling. Acknowledging an event does not change order status.                                                                                                                                |

## Data and safety behavior

- The B2C dashboard has its own provider, API adapter and fixtures. It does not import B2B business-domain modules.
- Role checks occur at the API boundary as well as navigation. Moderators retain Orders, notifications and their own profile; administrator and super-administrator privileges follow the supplied module contracts.
- Reads are aborted/discarded when navigation or identity changes. Mutations are not automatically repeated after network loss, server failure or malformed success JSON.
- A version conflict retains the user's draft and supports comparing the current server record. If the follow-up read also fails, saving stays locked until a fresh record is obtained.
- Known media/validation/reference failures remain visible. Uploads use validated raw image bytes, and the parent editor cannot save or change fields while an upload is attaching to its captured draft.
- Monetary values are edited in EGP but submitted as integer piastres. Incomplete decimal input remains visible for correction rather than throwing while typing.
- Native browser history/leave protection is retained for unsaved changes. Secret fields, proof URLs and stale identity data are not retained through a completed handover.
- The canonical Sales write contract keeps percentage discounts at 1-100. A legacy descriptive note does not broaden that write validation.

## Sources and implementation

- Scope: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), Phase 6.
- Backend authority: supplied `Backend Files/New Backend Files/modules/` contracts for Orders, Products, Categories, Size Charts, Media, Sales, Coupons, Shipping, Homepage, Site Settings, Users, Auth and Notifications.
- CURRENT Figma file `sv4mjHZis8FDpvEMsrAJWM`: reviewed design context/screenshots for D04 `191:14886`, D07 `191:16232`, D08 `191:16576`, D09 `191:17060`, D12 `191:18388`, D13 `191:18790`, D14 `191:19236` and D21 `191:21954`. The newer numeric-chart and fixed-homepage contracts supersede historical GAP notes. No Figma designs were changed in this phase.
- Source: `B2C-Website/src/features/dashboard/`, named `B2C-Website/src/pages/Dashboard*.jsx` modules and `B2C-Website/src/assets/css/dashboard.css`.
- The B2C browser entry now uses React Router's data router so dashboard unsaved-change blocking works. Shopping and checkout regressions were rerun after this change.

## Verification evidence

All checks below use local review data or intercepted responses. They do not certify the deployed backend, real payment data or provider storage.

| Check                      | Actual result                                             | Evidence                                                                                                                   |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Shared logic tests         | 101 passed                                                | `npm test` from B2C; includes catalog/money/chart/media/reference, role/status, staff and existing shopping/checkout tests |
| Dashboard layout matrix    | 224 passed                                                | `output/playwright/phase6-layout/results.json`; 16 routes, EN/AR, Chromium at 1440/768/440/360/320 and WebKit at 1440/360  |
| Operational journeys       | 4 passed                                                  | `output/playwright/phase6-workflows/results.json`; Chromium/WebKit, EN/AR                                                  |
| Recovery/privacy scenarios | 8 passed                                                  | `output/playwright/phase6-recovery/results.json`; intercepted integration-mode responses                                   |
| Shopping regression        | 8 passed                                                  | `output/playwright/quick-shop/results.json`; Quick add, Buy now, badge, floating cart and notifications                    |
| Checkout regression        | 6 passed                                                  | Phase 5 smoke run; guest/account checkout, receipt and private tracking                                                    |
| Review builds              | Both passed                                               | B2C: 34 public EN/AR pages; B2B: 28 public EN/AR pages, with content/metadata/asset proof                                  |
| Lint and formatting        | Both lint checks and project-wide formatting check passed | Existing project commands; no new dependency installed                                                                     |

Operational journeys create/edit local products, upload and attach a local sample image, create a numeric chart/category/sale/coupon, save zero default shipping, create/delete an override, update receiving instructions/homepage/settings, acknowledge a notification, create a fixture staff account and check moderator navigation. Their screenshots include desktop and mobile states.

Recovery cases cover a committed status change whose response was lost, malformed successful status/profile/account/password/handover responses, a 409 followed by a failed reconciliation read, exact updated-version recovery, correct admin versus self-service Auth paths, and private-proof object URL cleanup. A bounded independent review identified the uncertain-response and conflict-lock issues; those fixes were incorporated before the passing recovery run.

Rendered desktop/mobile screens were inspected. Final refinements include expandable variant editors, smaller two-column mobile media previews, readable category names, separated payment-method text and breathing room between promotion tabs.

## Review links

- B2C dashboard: <http://127.0.0.1:5283/en/dashboard/orders>
- Arabic B2C dashboard: <http://127.0.0.1:5283/ar/dashboard/orders>
- B2C staff login: <http://127.0.0.1:5283/en/dashboard/login>
- B2C website: <http://127.0.0.1:5283/en>
- B2B website: <http://127.0.0.1:5284/en>
- B2B dashboard: <http://127.0.0.1:5284/en/dashboard>

These are review builds with explicit fixture data. Changes remain local and reset on a full reload. The review-role selector can demonstrate permission differences without creating or modifying a real account. Servers need restarting after shutdown.

## Owner review batch - 27 October 2026

The owner approved a compact editor with three tabs and then refined its image assignment, creation guidance, tab motion and order-item presentation. The later messages added to the same active checklist. Phase 6 remains Ready for owner review, not Accepted.

### Delivered corrections

- Product details, Variants & stock and Images share one retained draft and Save action. Tabs animate only their content for 180ms, respect reduced motion and keep the same route. Hidden invalid fields open their tab and collapsed variant before receiving focus.
- Collapsed variant rows are compact and show the localized option combination, price, stock and image count. One variant opens at a time. Remove variant has a separate action row with 16px separation from its fields. Desktop saving stays in the sidebar; mobile has a save bar with reserved content clearance.
- One compact image library replaces the repeated variant galleries. Each uploaded image can be assigned to selected sizes, with separate groups for color/other options. Shared photos remain when adding a size-specific image. Existing IDs, memberships and independent gallery order are preserved on load; no duplicate upload is needed to share one image within the same product. Main-gallery changes now participate in variant-product save payloads as required by Products.
- Edit visibility supports explicit Apply/Cancel. Pending visibility changes block saving and retain unsaved-change protection. Uploading blocks edits to its captured draft. Gallery limits and the backend's main-image fallback cannot be bypassed by an apparent frontend exclusion.
- View gallery can show all images, the main gallery or a specific variant. Choose a gallery to reorder its photos and change its cover. Removing a library image is explicitly labelled Remove everywhere, avoiding an ambiguous single-size removal. The full image can be inspected from its thumbnail.
- New products show their editable type before the tabs. Simple-to-Variant and Variant-to-Simple both work until first save, retaining the respective unsaved type-specific values and shared content. Saved product type remains immutable.
- Products and size charts show the image step from the first view, including disabled upload controls and a clear explanation. Save and continue to images creates the record, then opens/focuses its image area. This follows the existing backend requirement for a saved target ID. Size-chart alt text belongs to step 2 because the create contract rejects it; it is visible but disabled before first save rather than accepting text that would be discarded.
- Shared popup siblings and direct actions have breathing room. Mobile table-action styling now excludes nested dialogs, preserving their normal padding and text alignment. All deletion entry points, ownership transfer, order status, request-contact confirmation and staff/promotion/shipping form dialogs were checked. Size-chart image Remove controls no longer stretch to the image height.
- Items ordered has a 52x60px thumbnail beside each saved product name. The owner chose current catalog images rather than a backend thumbnail extension. The exact current variant image is preferred, then the current main product image. The label says Current product image; failed/missing images have a neutral placeholder. Reads use public Products, deduplicate product IDs per order, do not grant moderators protected catalog access, and never replace saved order names, option values, quantities or prices.
- The account-creation addition was canceled after the owner found the existing Super admin action. No permissions were changed. The requested role reference is [ROLE_PERMISSIONS.md](ROLE_PERMISSIONS.md); it retains the separate B2B adaptation checkpoint.

### Verification for this batch

| Check                      | Result and evidence                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared logic tests         | 106 passed, including image reference/membership/order/fallback, immutable type and exact-variant thumbnail selection                                                                                                                                                                                                                             |
| Editor behavior and layout | Four Chromium/WebKit EN/AR workflows passed, with 72 tab views at 1440/1024/768/440/360/320px; includes visibility Apply/save locking, per-size image order, draft retention, native hidden-field validation, reduced motion, both type directions and product/chart save-to-upload flows. `output/playwright/product-editor-review/results.json` |
| Popup audit                | 152 passed across both stores, both languages, both engines and 1440/360px. Every current deletion entry point plus confirmation/form dialogs is represented. No deletion or ownership transfer was submitted. `output/playwright/dashboard-dialog-spacing/results.json`                                                                          |
| Order thumbnails           | Four workflows passed at 1440/768/440/360/320px, including decoded images and broken-image fallback. `output/playwright/order-thumbnails/results.json`                                                                                                                                                                                            |
| Operational regression     | Four existing Phase 6 workflows passed. `output/playwright/phase6-workflows/results.json`                                                                                                                                                                                                                                                         |
| Shopping regression        | Eight existing quick-shopping journeys passed after the shared popup/tab changes. `output/playwright/quick-shop/results.json`                                                                                                                                                                                                                     |
| Builds and source checks   | Both review builds passed, with 34 B2C and 28 B2B public pages; both lint checks and project-wide formatting passed. No dependencies were added.                                                                                                                                                                                                  |

Representative desktop/mobile English/Arabic screenshots were inspected, including the corrected shipping deletion popup, image assignments, numeric-chart image step and order thumbnails. The browser harnesses block external HTTPS traffic and use local review fixtures. These are frontend results, not live API/provider acceptance or owner approval. The original 224-layout-case and eight-recovery-case reports above describe the prior implementation baseline, not a new full rerun for this batch.

## Sales/Coupons and chart-library controls - 27 October 2026

Owner review identified a browser-native calendar, text-only promotion state and oversized/missing deletion actions. The follow-up delivers:

- `shared/ui/DateTimeField.jsx`: Narmer-styled calendar, month/year selectors, hour/minute controls, selected-day state, keyboard day navigation, Escape/light dismissal, Clear and Apply. It uses a styled top-layer popover rather than the browser date/time picker, stays within the viewport and preserves existing device-local input to explicit ISO conversion. Invalid calendar dates and normalized nonexistent local times are rejected. Sales dates remain required; Coupon boundaries remain optional. The existing exclusive end-date and campaign-overlap rules are unchanged.
- `shared/ui/Switch.jsx` and `PromotionSwitch.jsx`: direct enabled/disabled controls in Sales and Coupon rows, plus the corresponding editor control. Usage counts remain read-only. The switch sends only `isEnabled`, blocks duplicate submissions, updates returned row data without a table reload and does not claim that an enabled schedule is currently active. Lost/malformed responses and conflicts are reconciled with a read, never an automatic write replay. A failed reconciliation locks the switch until Read current state succeeds. Rate-limit handling stays in the existing API boundary.
- `DeleteRecord` supports compact trash-icon actions with accessible names and tooltips. Sales/Coupons retain their Super-admin restriction and confirmation, and coupon deletion retains its selected tab. The Size charts library exposes deletion beside Edit, matching the editor's existing permission. Assigned charts remain protected by the backend/fixture and show the existing recoverable error. Confirmation identifies the selected record and retains the shared button spacing.

Verification: 112 shared logic tests passed, including new leap-day/date-round-trip/invalid-date and promotion-write reconciliation checks. Four new Chromium/WebKit EN/AR workflows passed across 1440/768/440/360/320px; they cover calendar selection, required-date validation, Escape, unclipped calendar actions, switches in both directions, role-specific icon visibility and assigned-chart deletion rejection. Four existing operational workflows passed after replacing their native-calendar interactions. Both review builds (34 B2C / 28 B2B public pages), both lint checks and formatting passed. No dependency was added.

New visual/behavior evidence: `output/playwright/promotions-controls/results.json` and EN/AR desktop/mobile screenshots. Existing workflow results: `output/playwright/phase6-workflows/results.json`. Source harnesses are `shared/tests/promotions-controls-qa.mjs` and the updated operational/dialog harnesses; shared calendar interactions are in `shared/tests/calendar-helpers.mjs`. Screenshots were inspected and a first-frame popover-position issue and clipped calendar footer were corrected before the final passing run.

All browser writes used disposable local fixtures, with external HTTPS traffic blocked. Live campaign overlap/provider behavior and real account authorization remain outstanding. Phase 6 is still Ready for owner review; Phase 7 remains unauthorized and not started.

## Calendar and delete-icon refinement - 27 October 2026

The owner identified a tiny trash glyph, wrapped year values and time menus increasing the calendar's scrollable area. Trash actions now use a 24px symbol inside the existing 44px target. The calendar's four styled selects use fixed-position overlay menus with enough width for a complete year and checkmark. Active-option scrolling affects only the option list; it cannot scroll the calendar or surrounding form. Scrolling a containing surface closes the overlay so it cannot detach from its trigger. Existing selects retain their normal placement.

The expanded `shared/tests/promotions-controls-qa.mjs` passed all four Chromium/WebKit EN/AR workflows. It checks the rendered icon size, unwrapped option text, viewport bounds, unchanged calendar geometry/scroll area and Escape behavior with year/hour/minute menus open, for Sales and Coupons at 1440/768/440/360/320px widths. Desktop/mobile open-menu screenshots were inspected and are in `output/playwright/promotions-controls/`. Both review builds, both lint checks and formatting passed. No dependency or authorization rule changed. Live and physical-device acceptance remain outstanding.

## Owner table-reference correction - 27 October 2026

The owner rejected the 24px trash glyph and mismatched outlined Edit/Delete buttons. Sales/Coupons now use 20px pencil/trash symbols with matching borderless 44px click targets, a subtle Narmer pale background behind Edit and a quiet destructive icon. Accessible names/tooltips identify each record. The table follows the supplied reference's restrained treatment: one white container, quieter uppercase English headers, fine row separators and consistent spacing. Existing schedule, usage, switch behavior, role checks and deletion confirmation remain intact. Mobile keeps labelled cards with reduced padding; the action column accommodates both icons on one line. Shared icon-only DeleteRecord callers, including Size charts, receive the revised 20px trash treatment.

All four Sales/Coupons Chromium/WebKit EN/AR workflows passed at five widths. The harness checks both symbols' actual dimensions, 44px click targets, side-by-side alignment, permissions and existing calendar/switch flows. Desktop/mobile table screenshots were inspected and are saved as `*-table.png` in `output/playwright/promotions-controls/`. Both review builds, lint checks and formatting passed for this correction. Browser writes used disposable local fixtures only.

## Superseded dashboard icon expansion - 27 October 2026

The following implementation was broader than the owner's intended table-action scope and has been reverted as described in the next correction. Its passing technical checks did not establish owner acceptance of that scope.

The owner requested the same approved pencil/trash treatment everywhere an edit or deletion action already exists. `shared/ui/StaffAction.jsx` now owns the button/link presentation, accessible label and tooltip, with shared styling in `shared/assets/css/dashboard-controls.css`: 20px symbols and 44px targets. The B2C-only action CSS and optional icon-only deletion mode were removed. Each store retains its own DeleteRecord request, role checks and confirmation handling.

Scope includes B2C products, categories, charts, accounts, promotions and shipping; B2B products, wholesale offers and accounts; both stores' photo removals and homepage image overrides; B2C homepage curation, product-image visibility, variant/option/value removals and chart measurement rows; and B2B form questions/choices and wholesale composition rows. Edit links still navigate, buttons retain their handlers and disabled states, and draft removals retain their existing save behavior. Read-only View only / View source links remain explicit. Confirmation buttons retain readable action text and identify the selected record. Super-admin-only record deletion and the B2C Admin shipping-override exception are preserved. No new deletion permission or API operation was introduced.

Verification passed: **228 icon views** across both dashboards in Chromium/WebKit, EN/AR and 1440/768/360px widths. `shared/tests/dashboard-actions-qa.mjs` checks icon dimensions, targets, labels/tooltips, unrotated photo actions, responsive overflow, read-only links, role visibility and deletion confirmations. Its inspected screenshots/results are in `output/playwright/dashboard-actions/`. Four existing product-editor workflows covering 72 responsive tab views and four operational workflows also passed against disposable local fixtures, including the shipping Admin deletion exception. The product-editor harness now uses the image-specific accessible label for Edit visibility. Both review builds, lint checks and formatting passed. Live authorization/provider behavior and physical-device acceptance remain outstanding.

## Owner correction: table actions only; restore B2B - 27 October 2026

The owner clarified that the icon request concerned table-row actions, not primary buttons or controls inside editors, images, variants or forms. The previous expansion was incorrect. B2B's prior text edit links, delete buttons, image-removal buttons, homepage Clear override controls, form question/choice controls and wholesale composition-row controls are restored. Its DeleteRecord and StaffLink retain their separate original implementations, without StaffAction imports or icon styling.

B2C keeps the approved pencil/trash icons only in tables. All non-table primary/editor actions, including Delete account beside ownership transfer, product/category/chart deletion, photo removal/visibility, homepage curation and overrides, variants/options/values and measurement rows, are restored to their previous text labels. DeleteRecord defaults to a text button; Sales/Coupons, Size charts and Shipping table rows explicitly use iconOnly. Existing authorization, confirmations, handlers, disabled states, unsaved-change behavior and earlier popup-spacing fixes remain intact. No new data operation was introduced.

Verification passed: 228 dashboard action views in Chromium/WebKit, EN/AR and 1440/768/360px widths. The updated `shared/tests/dashboard-actions-qa.mjs` asserts that B2C icons stay inside tables, B2B has no new icon actions, primary/editor controls have text, read-only links remain clear and deletion permissions/confirmations persist. Eight additional desktop/mobile account views explicitly confirmed and captured the restored Delete account text button in both stores/languages; screenshots were inspected. Evidence remains under `output/playwright/dashboard-actions/`, including `*-restored-main-delete-*.png`. Four product-editor workflows/72 responsive tab views also passed, using the original Edit visibility text label. Both review builds, lint checks and formatting passed. All browser actions used local fixtures; live authorization/provider and physical-device acceptance remain outstanding.

## B2C Save/Delete spacing correction - 27 October 2026

The restored text buttons in Category, Product and Size chart sidebars touched because their parent had no gap. A B2C-only adjacent-action rule now adds 16px between Save and Delete, handling both a direct Save button and the product editor's save wrapper without altering card spacing, button presentation or the mobile fixed save bar. Other existing action groups retain their current flex/grid gaps. No behavior, authorization, table-icon or B2B change was made.

Verification: `shared/tests/editor-action-spacing-qa.mjs` passed all 72 Chromium/WebKit EN/AR views across 1920/1440/1024/768/360/320px. It measures the gap, confirms text labels and no horizontal overflow, and checks the product's mobile Save/Delete targets do not overlap. Desktop/mobile screenshots were inspected in `output/playwright/editor-action-spacing/`; results are in `results.json`. The B2C review build, lint and formatting passed. The owner's table-only icon boundary and required spacing review are recorded in WORKING_RULES.md.

## B2C Change password button sizing - 27 October 2026

The password submit button was stretching to the full height of its grid row, including the neighboring field label and input. A class on this B2C password form and one scoped align-self rule now preserve the normal 48px text-button height and full input-column width, aligned to the field bottom on desktop. Mobile retains a separate full-width row with the existing 16px gap. Other buttons, B2B, password validation and request/session behavior are untouched.

Verification: `shared/tests/profile-password-sizing-qa.mjs` passed 24 Chromium/WebKit EN/AR views at 1920/1440/1024/768/360/320px, checking standard button height, matching column width, bottom alignment, mobile spacing and overflow. Disabled, matching-password enabled and mismatched confirmation states were checked using disposable input strings; no password request was submitted. Screenshots were inspected in `output/playwright/profile-password-sizing/`. The B2C review build, lint and formatting passed.

## Owner acceptance and final dashboard-logo correction - 27 October 2026

The owner approved the reviewed phase with “we can call this phase done,” conditional on the final logo correction. Both dashboard logos now navigate within their own dashboard to the first permitted main navigation page: B2C Orders and B2B Requests in the accepted Phase 6 interface. The shared sidebar markup covers desktop and the mobile drawer, which closes after navigation. Public website logo links and the explicit View website link are unaffected. Staff-role state and existing unsaved-change protection are preserved.

Verification: `shared/tests/dashboard-logo-qa.mjs` passed 48 Chromium/WebKit checks across both stores, EN/AR, Admin/Super admin/Moderator and desktop/mobile. The checks verify destinations, retained review roles, closed mobile drawers and Cancel/Leave behavior for unsaved profile changes. Results are in `output/playwright/dashboard-logo/results.json`. Both review builds, both lint checks and formatting passed. The acceptance record is Phase 6 complete/Accepted on 27 October 2026, with 6 of 8 phases accepted. Phase 7 is not started and awaits explicit authorization.

## Remaining boundaries

- Owner review and Phase 6 acceptance are recorded. Phase 7 awaits a separate go-ahead; live/provider/device release verification remains open below.
- Live authenticated cookies, real role enforcement, deployment origins, provider upload/expiry/cleanup, real proof ownership, production reference/overlap checks and public refresh after saved configuration require authorized live acceptance. Local fixtures cover frontend behavior; they do not reproduce every backend rule or persist changes across separately implemented public/dashboard fixtures.
- Physical Android/iPhone/Safari and Firefox remain release verification tasks. Chromium and WebKit viewport checks do not replace actual device testing.
- The homepage product picker and product editor's chart picker currently load the first 100 records. The supplied catalog has 11 products. Their code records the requirement to paginate these pickers before the respective libraries exceed 100 records; the main library tables and promotion product targets are already paginated.
- The earlier B2B staff-creation/own-password adaptation checkpoint and stable wholesale URL migration/host redirects remain carried forward. Phase 6 implements B2C operations and does not claim to close unrelated B2B integration work.
- Reporting and the separate Figma dark-mode preview are outside this implementation. No deployment, real staff account, order, upload, transfer or database mutation was performed.
