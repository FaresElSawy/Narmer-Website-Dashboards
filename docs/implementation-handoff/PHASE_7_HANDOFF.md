# Phase 7 — B2C reporting

Updated 28 October 2026. Status: **Accepted by the owner** after the chart-readability correction. The owner requested “start phase 8 and mark this one complete” on 28 October and explicitly authorized Phase 8. No production deployment was performed.

## Owner chart-readability correction — 28 October

The owner reported oversized Finance axis labels and overlapping trend lines, and requested the Figma chart treatment for Overview. The root cause of the oversized text was the SVG coordinate width being capped at 720 and then stretched across a wider panel. The coordinate width now follows its actual container; the chart frame stays 212 CSS pixels tall and axis text remains about 11 CSS pixels at desktop and mobile widths.

Overview now follows CURRENT CD-01's navy curve, pale horizontal grid and solid gold latest-point accent. Its curve passes through the actual returned points and stays between each adjacent pair of values. Flat data remains flat. Finance now displays four separate bar charts in a two-column desktop layout and a single mobile column. All four share a common scale, retain their own event-date captions, and provide exact hover/tap readouts and keyboard-accessible data disclosures. No endpoint, totals, date-range, Sunday-week or permission behavior changed; B2B is unaffected.

Verification for this correction: all 128 shared logic checks pass, including two new display-scale/curve checks. B2C build, lint and project formatting pass. `shared/tests/report-chart-readability-qa.mjs` passes 31 Chromium/WebKit EN/AR layout/interaction checks, including 1920px wide-screen text scaling, 320px mobile, keyboard inspection, hover/tap readouts, dense daily bars, a one-day empty period and Sunday weeks. Representative chart panels were visually compared with CURRENT Figma and inspected. Evidence is in `output/playwright/report-chart-readability/results.json` and its sibling screenshots. The earlier operational/recovery results below remain baseline evidence; live backend and physical-device reconciliation were not repeated for this visual correction.

## Delivered scope

- Admin and Super admin now have Store overview, Revenue & finance, and Sales performance. The B2C main dashboard destination is Overview for those roles and Orders for Moderators. B2B remains on Requests with its existing dashboard controls.
- Overview shows placed order value, orders placed, units placed, pending orders from the placement cohort, nullable average value, the actual trend, up to five currently delivered product rankings, and up to five recent orders with customer, date, payment, value, current status and a detail link.
- Finance keeps placement amounts, recorded collection markers, and refund markers separate. It includes the order amount breakdown, method breakdown, all six current statuses, and the four returned trend series. No net cash, profit, bank balance, refund settlement or export was invented.
- Performance uses currently delivered orders by placement date. Rank, page and limit are URL state; changing period, rank or limit resets the page. All direct historical category totals remain visible independently of the product page. Missing historical categories have an explicit localized label. Product names are historical; optional thumbnails are clearly labelled current catalog decoration.
- English uses Poppins and Arabic uses Cairo. Main actions retain text labels. No new table edit/delete action is needed on these read-only reports. Existing editor, deletion, modal and B2B button styling is preserved.

## Dates and the owner's Sunday correction

The owner clarified that Narmer's week starts on Sunday. The interface calendar and Week label use Sunday. The supplied Reports contract fixes its server weekly interval to Monday, so Overview and Finance request validated **daily** buckets when Week is selected and combine only those returned values into Cairo Sunday–Saturday display buckets. This does not relabel the server's Monday buckets. Raw metadata and source validation remain unchanged. The original selected range and the distinct event-date cohorts are preserved, including partial first/last weeks. Performance has no trend buckets; its common interval metadata does not alter its ranking cohort.

`@date-fns/tz@1.5.0` is pinned in B2C only. Date selection is independent of the device timezone. An inclusive Through date becomes the start of the next Cairo calendar date. Tests cover spring skipped midnight, 23/25-hour dates, calendar months, raw API Monday weeks, displayed Sunday weeks, safe sums, invalid dates, UTC year bounds and the maximum 366 elapsed days. The original backend reference files were retained as supplied.

## Request and data protections

Only the active endpoint is read. There is no report polling, automatic error retry loop, or download of all order pages. A bounded cache keeps at most one range per report and language for 15 seconds in the mounted staff provider. It is not persisted. User/role changes remount that provider. A status-change attempt clears report caches and invalidates in-flight report snapshots, including when the write response is uncertain.

The client limits report request starts to 30 per rolling minute and honors Retry-After across reports. The server remains the authority for the account-wide limit across tabs, sessions and IP addresses. Busy, unavailable-total, malformed/unsafe response, network, expired-session and lost-permission states preserve filters and avoid displaying uncertain financial totals. A 403 refreshes identity without retrying that report. Stale range responses and aborted reads cannot replace the current result.

Returned amounts and counts are checked as nonnegative safe integers. Financial arithmetic and trend totals reconcile before display. Exact sums and whole/fraction currency formatting use BigInt to preserve the final piastre even at the largest safe amount. The charts use responsive SVG, modest Narmer colours, actual bucket values, an explicit currency axis and keyboard/touch-accessible data disclosures with labelled tables. Zero values remain zero; null averages display a dash.

## Visual direction and verification

CURRENT CD-01, D01 and D02 desktop/mobile references were inspected, including Arabic direction. The supplied metric placeholders and definition-pending notices were adapted to the finalized API contract. Existing approved Narmer tokens, shell and typography remain the visual authority. Taste's app-screen guidance and Hallmark's audit guidance were applied alongside frontend-design, responsive-design, Emil's interaction guidance, the web interface guidelines and React/Vite engineering. They informed hierarchy, honest data, restrained charts, spacing, accessible states and responsive inspection; no random theme or replacement design system was introduced.

Local verification evidence:

- `shared/tests/reports.test.mjs`: 14 report logic checks, part of 126 passing shared logic checks.
- `shared/tests/phase7-layout-qa.mjs`: 38 Chromium/WebKit EN/AR layout and role checks. Chromium widths: 1440, 900, 390 and 320; WebKit: 1440 and 390. Calendar/year menus, chart data disclosure, overflow, errors and moderator exclusion were checked. Representative desktop/mobile screenshots were inspected and corrected.
- `shared/tests/phase7-recovery-qa.mjs`: 12 intercepted API scenarios for Sunday-week sourcing, busy/unsafe/unavailable/inconsistent/network responses, rate limit/manual retry, one-time auth refresh, identity changes, moderator denial, stale responses and return-driven ranking invalidation.
- Both review builds and lint checks pass. Shared formatting passes.
- An independent read-only financial/date/authorization review found no concrete remaining issue after the arithmetic safeguard was added; a follow-up inspected Sunday-week grouping and partial/DST boundaries. That review was static inspection, separate from the runtime tests above.

Results and representative screenshots are under `output/playwright/phase7/`, including `layout-results.json` and `recovery-results.json`.

## Permissions for owner review

The current **B2C** role boundaries are:

| Role              | Allowed scope                                                                                                                                                                   | Restrictions                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Super admin       | All B2C operational sections and read-only reports; create accounts; edit eligible account roles/status; delete eligible records; transfer store ownership.                     | Protected references and the current super-admin account retain backend protections. Ownership uses the dedicated transfer flow.                                                 |
| Admin             | All B2C operational sections and read-only reports; create/update catalog, campaigns, content and configuration; read/update eligible existing accounts and their roles/status. | Cannot create or delete accounts, transfer ownership, or delete catalog/campaign/chart records. The existing shipping-fee override deletion permission is an explicit exception. |
| Moderator         | Orders, order detail/proof, permitted order status transitions, notifications, own profile and own password.                                                                    | No reports, catalog, campaigns, account administration, content or configuration.                                                                                                |
| Customer (`user`) | Customer storefront/account features, own addresses, wishlist and own order history.                                                                                            | No staff dashboard or report access.                                                                                                                                             |
| Guest             | Public storefront, guest checkout and token-protected guest order flows.                                                                                                        | No staff dashboard, reports or customer-owned account data.                                                                                                                      |

B2B permissions were not changed by this phase. Its operational scope remains Requests for Moderators and the existing request/catalog/form/wholesale/content/account/settings sections for Admin and Super admin; it has no Reports API. This phase does not claim a new live B2B permissions audit or completion of its previously documented account-creation backend integration.

## Review links and remaining boundaries

- Overview: `http://127.0.0.1:5283/en/dashboard/overview`
- Finance: `http://127.0.0.1:5283/en/dashboard/finance`
- Performance: `http://127.0.0.1:5283/en/dashboard/performance`
- Arabic equivalents use `/ar/`. B2B local review remains `http://127.0.0.1:5284/en/dashboard/requests`.

The local review uses disposable fixture orders; integration tests intercept all backend traffic. Real account permissions, actual database reconciliation, provider/storage behaviour and physical devices remain unverified for release. These results do not establish live financial correctness or owner acceptance. No deployment, real order write or real payment/refund action was performed.
