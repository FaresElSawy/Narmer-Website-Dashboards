# Phase 8 — integration and release readiness

Started 28 October 2026. Status: In progress, authorized directly by the owner after Phase 7 acceptance. Seven of eight implementation phases are Accepted. Deployment remains a separate action requiring authorization.

## Latest checkpoint — 30 October 2026

The available local/controlled checks and bounded live run are finished, and test-data cleanup is verified. Phase 8 is not Accepted: the specific unverified live checks, environment/provider inputs and physical-device/release gates remain open in [PHASE_8_TEST_REPORT.md](PHASE_8_TEST_REPORT.md). Older checkpoints below describe their original observation times; this section and the report take precedence for current state.

- Actual B2C placement concurrency returned 201/200 for one order ID, with exact replay 200 and one stock decrement. All three test orders are canceled; final S/M stock was 2 before product deactivation.
- Actual B2B submission concurrency returned 201/200 for one inquiry ID, exact replay 200, and changed replay 409 `LEAD_REQUEST_CONFLICT`. There are three retained test inquiries and no B2B inventory movement.
- Final live Finance reconciles EGP 570 merchandise − EGP 12 coupon + EGP 150 shipping = EGP 708 placed value. All three orders are Canceled; refund markers total EGP 708 and collection markers remain zero. These markers do not transfer money.
- The owner completed both Customer resets. Actual new-password Chrome sign-ins and reload passed. Reset-specific old-session invalidation was not isolated before re-sign-in and is not counted as passed. Both accounts are now Blocked; staff reload retained that state and their old Customer sessions require sign-in.
- Test category, both B2C products, size guide and B2B native product are Inactive; sale/coupon Disabled; offer Unpublished; Wishlist empty. Public product/offer/form reads return the expected 404 and the original Men category remains available. Existing Wholesale form is restored to Unpublished with unchanged content. Historical orders/inquiries and attached referenced media were retained.
- Both Super admin sessions remain signed in on the local integration previews at 5295/5294. Restricted-environment listeners initially timed out in Chrome; restarting only these previews outside the restricted environment restored localhost 200 without security/network/backend setting changes.
- Evidence added: `live-order-replay.json`, `live-inquiry-replay.json`, `live-cleanup-public.json`, refreshed `live-role-checks.json`/`live-test-ledger.json`, and final Finance/cleanup screenshots under `output/phase8`.
- Regenerated both local integration previews after cleanup: client/SSR builds and existing static proofs passed for 12 B2C and 20 B2B EN/AR pages. Generated public HTML contains no remaining `PHASE8 TEST` catalog content. Only the verified generated preview directories and their local serving processes were refreshed; nothing was deployed.
- Email visual design is deferred to the backend developer at the owner's request. No frontend email templates were created.

Live InstaPay proof remains unavailable. Full forbidden raw-role API coverage, isolated reset invalidation, additional nonzero collection/delivered/returned report cohorts, actual customer tracking-email delivery, Firefox, physical devices/Safari and intended-host/provider acceptance are explicitly unverified. Local/controlled passes are not substituted for those checks.

## Scope and initial estimate

Verify the two websites together across customer, guest and staff workflows; store/session isolation; replay/concurrency; stock/coupon conflicts; uploads/private reads; versioned content/public refresh; reporting; OTP/tracking/email; content readiness; public HTML/SEO/deep links; browser/device/accessibility/RTL/print; production bundles and maintenance handoff. Preserve the accepted Narmer design and the owner's corrections.

The initial planning estimate is 3–5 hours for the local audit and fixes. Live service and physical-device acceptance require additional time after environment, accounts, authorized test records and device access are available. This is an estimate, not a measured completion time.

## Authorization and environment boundaries

- Existing fixture review: B2C `http://127.0.0.1:5283`, B2B `http://127.0.0.1:5284`.
- The owner confirmed `https://narmer-ecommerce.vercel.app` as the temporary API. Integration origins are 5295 (B2C) and 5294 (B2B). Both currently pass credentialed CORS preflight. The owner signed in directly to both Chrome tabs; no passwords or tokens were collected in chat or evidence.
- Never collect passwords, tokens or provider secrets in chat or evidence. Signed-in tests require disposable accounts and direct secure login. Do not create real orders, change real accounts/content, send real mail or operate providers without appropriate test-data authorization.
- Cross-site local HTTP to the API's HTTPS refresh-cookie arrangement remains a live acceptance question. CORS success alone does not prove session persistence.
- WebKit and virtual mobile profiles are engine/emulation checks. Physical iPhone, Android and actual Safari acceptance remain pending unless those devices or a remote device service are provided.

## Work underway

1. Reconcile each prior handoff's deferred work into a severity/owner/evidence matrix.
2. Establish current production-build, lint/format and shared-logic baselines without replacing the owner's running fixture previews with an unconfigured build.
3. Reuse current Phase 7 evidence where code matches, then run the cross-feature browser and recovery checks relevant to integration.
4. Check content/placeholders, metadata/structured data/sitemap/robots, named public HTML, deep links, bundles and the regeneration/maintenance procedure.
5. Record live/provider/device gaps explicitly and continue all independent local work.

## Local integration run mode

The current API-connected previews use the isolated `output/phase8/b2c-integration` and `b2b-integration` builds. Start them from their respective app directories with `--mode integration`; the mode enables the local proxy as well as loading the integration environment:

```powershell
# From B2C-Website
npm run preview -- --mode integration --host 127.0.0.1 --port 5295 --strictPort --outDir ../output/phase8/b2c-integration

# From B2B-Website
npm run preview -- --mode integration --host 127.0.0.1 --port 5294 --strictPort --outDir ../output/phase8/b2b-integration
```

For source development instead, use `npm run dev -- --mode integration --host 127.0.0.1 --port 5295 --strictPort` from B2C, or port 5294 from B2B. The `.env.integration` files retain the supplied temporary HTTPS API origin; only a loopback integration browser routes its requests through the local origin. Server rendering reads the configured HTTPS API directly. Review ports 5283/5284 remain fixture mode. Production must use its approved real API/site origins, not integration mode.

## Findings and implemented fixes

| Finding                                                                                      | Result                                                                                                                        | Verification and remaining boundary                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B2C home trailing slash removed the floating cart from the hydrated tree                     | Fixed by comparing the normalized route                                                                                       | Production browser checks cover slash and bare home URLs in EN/AR; no hydration errors                                                                                                                                                                                                                                                                                              |
| Generated public HTML contained hidden completed content plus a script-swapped loading shell | Fixed in shared static rendering with React's static prerender API and a complete-output assertion                            | Both review builds publish 62 complete EN/AR pages; isolated unconfigured production builds publish 32. Local measured CLS fell from roughly 0.25–0.28 to about 0.03 B2C / 0.00 B2B. These are local observations, not field performance certification                                                                                                                              |
| B2B staff creation and own-password UI still claimed backend support was pending             | Connected to delivered contracts, sharing the existing B2C workflow                                                           | Super admin creates; staff changes only their own password. Fourteen intercepted browser cases passed across stores, including wrong-store/incomplete-reply reconciliation. Independent review led to confirmation before accidentally discarding the initial password before handoff                                                                                               |
| Wholesale URLs were regenerated from current offer names                                     | Switched to saved slugs and the public resolver; build maps IDs and historical aliases directly to the latest canonical route | Twelve Chromium/WebKit EN/AR URL checks passed, including refresh, query/hash preservation, local HTTP 308, language switch and inquiry ID selection. Real host 308/invalidation acceptance remains open                                                                                                                                                                            |
| Wholesale route crashed when no prerendered page data was available                          | Fixed the optional-data comparison before reading the initial offer                                                           | The broad B2B browser run found and reproduced the crash. Its rerun passes 448 public layout, guest inquiry and account checks with no runtime errors                                                                                                                                                                                                                               |
| B2C placeholder policies and empty contact pages could become indexable                      | Kept placeholder privacy/terms and unpublished contact content non-indexable; B2B empty contact follows the same rule         | Isolated reserved-domain metadata builds pass 32 page checks and exclude these pages from sitemap entries                                                                                                                                                                                                                                                                           |
| Direct localhost-to-API authentication did not survive a page reload                         | Reproduced in both owner-signed-in Chrome tabs; fixed local transport with an integration-only same-site proxy                | Owner signed in again; both real Chrome sessions survived a full reload and protected data finished loading. Proxy preserves backend cookie flags/certificate validation and store route boundaries, and is absent from production/review modes. WebKit HTTP-loopback secure-cookie behavior remains unsupported in this test; production HTTPS/device acceptance is still required |

## Current evidence

- `tmp/phase8-logic-current.log`: 133 Node tests pass. Focused cases cover role gates, wrong-store rejection, no automatic write replay, saved URL identity/aliases and integration-only proxy isolation.
- `output/phase8/production-static-final.json`: four unconfigured production store/language browser checks pass with zero runtime/hydration errors; complete static HTML and guarded private routes were checked.
- Both review builds pass: 34 B2C plus 28 B2B public pages. Integration builds pass: 12 B2C plus 20 B2B pages against the currently empty public catalog. Review and integration remain non-indexable.
- `output/phase8/staff/results.json`: 14 intercepted account-creation/password permission, handoff, secret-clear and recovery cases pass, including a successful-envelope/wrong-store DTO; no external writes.
- `output/phase8/profile-sizing/results.json`: 48 EN/AR Chromium/WebKit views across both stores and 1920/1440/1024/768/360/320px pass. Buttons remain 48px high and aligned with inputs, with spacing on stacked layouts. No password changes were submitted.
- `output/phase8/offer-urls/results.json`: 12 saved URL browser checks pass.
- `output/phase8/phase6-recovery/results.json`: eight B2C intercepted recovery/private-proof cleanup cases pass.
- `output/phase8/phase3-contracts/results.json`: 34 B2B intercepted contract/recovery cases pass, including stale versions, lost responses, rate limits, explicit mutation retry, raw uploads, protected accounts, reference-blocked deletion and late private responses after logout.
- `output/phase8/customer-orders/results.json`: 48 fixture customer/guest checkout, receipt, private tracking/history and print flows pass in Chromium/WebKit and EN/AR. Synthetic receipt PDF checks include printing with and without backgrounds.
- `output/phase8/business-public/results.json`: 448 current B2B public/layout, whole-pouch guest submission and customer account cases pass across two languages, five widths and Chromium/WebKit, with no runtime errors. Test selectors were updated to operate the approved styled controls. Firefox remains separately unverified.
- `output/phase8/metadata-and-bundles.json`: 32 isolated reserved-domain page checks pass for canonicals, language alternates, complete HTML, JSON-LD parsing and sitemap/placeholder exclusion; JavaScript raw/gzip sizes are recorded. These test-domain builds are not deployment artifacts.
- `output/phase8/live-public-baseline.json` and `live-integration-public.json`: temporary API liveness/readiness return 200. Public reads pass in Chromium/WebKit from fixture and integration origins; an unknown resolver key returns generic 404 `WHOLESALE_OFFER_NOT_FOUND`. Public products, published forms and wholesale offers are empty. Both integration login preflights return 204 with the exact allowed origin and credentials.
- `output/phase8/integration-proxy-browser.json`: four public proxy reads pass; two Chrome secure loopback-cookie cases pass. The two WebKit cookie cases are explicitly recorded as unsupported, not passed.
- Owner-signed-in Chrome: B2C Overview, Finance, Performance, Orders, Products, Categories, Sales/Coupons, Size charts, Shipping and Accounts load. B2B Requests, Products, Wholesale, Forms, Homepage, Settings and Accounts load. Eleven additional section checks waited for loading to finish and found no error panel or page overflow. Current account lists contain one Super admin per store; no account details are copied into evidence.
- Firefox still fails before launch with `browserType.launch: spawn UNKNOWN`; no Firefox acceptance is claimed.
- Both lint checks, project formatting and the final 133 Node tests pass. Both isolated unconfigured production builds pass again after the final source fixes.

## Remaining gates

1. Keep the verified local Chrome refresh-cookie result separate from actual production HTTPS, cross-tab invalidation and device acceptance.
2. Stay within the bounded test-data and owner-controlled contact authorization granted on 29 October. See [PHASE_8_LIVE_TEST_PLAN.md](PHASE_8_LIVE_TEST_PLAN.md). This does not authorize changes to unrelated real records.
3. Verify live roles, customer/guest checkout and inquiries, replay/concurrency, stock/coupon conflicts, private uploads, actual password invalidation and report reconciliation against those test records.
4. Confirm final site origins, approved content/policies/contacts/catalog, actual host redirects/statuses/cache regeneration and provider/operator readiness. The temporary API is not a production website deployment.
5. Complete physical Android/iPhone, actual Safari and release acceptance. Local receipt print checks passed with the 48 checkout flows. The monthly handoff is [SEO_CONTENT_MAINTENANCE.md](SEO_CONTENT_MAINTENANCE.md).

Phase 8 remains In progress. Passing local/intercepted checks does not close the live, provider, device or owner-acceptance gates.

## Live checkpoint — 29 October 2026

The owner approved bounded test records and contact destinations. The detailed pass/fail/fix/retest report is [PHASE_8_TEST_REPORT.md](PHASE_8_TEST_REPORT.md), and the credential-free cleanup ledger is `output/phase8/live-test-ledger.json`.

- Both local integration previews were restarted on 5295/5294 after refusing connections. Existing owner Chrome sessions survived in fresh tabs. The owner enabled Chrome Incognito extension access for a separate guest session; subsequent order/inquiry tests use actual Chrome.
- Created the labelled category, simple product, two-size variant product, numeric size guide, native B2B product and fixed 30-piece offer. Raw image uploads and shared/per-size galleries are saved and verified publicly. The offer rename retained its saved slug.
- Created a scoped 10% sale and one-use coupon. The real mixed-cart quote excluded the sale line from the coupon: 21,000 − 1,200 + 5,000 = 24,800 piastres.
- Chrome guest COD order `999c77774187870906ed2ed8` placed once, receipt/staff/Finance reconciled, item thumbnails loaded, stock decremented correctly. The order is canceled, simple/S stock restored to 2, coupon remains used at 1/1, and guest tracking shows Canceled.
- Found and fixed a false Wholesale warning caused by the error component falling back from an explicit null page error to the unrelated default Fabric-form error. All callers were inspected. Chrome assertion, subsequent live inquiry, 133 logic tests, B2B lint, formatting and the regenerated 22-page integration build pass.
- Chrome guest inquiry `877148e40c892c3226a6f3e7` submitted two fixed pouches / 60 pieces and a private test image. Staff image read and guest tracking passed; contacted test marker is reflected after reload. No real follow-up call or payment is claimed.
- Wholesale form was restored to its original Unpublished state and public GET returned 404 `FORM_NOT_FOUND` after the guest test. The owner then created both disposable accounts directly and signed in as Admin, Moderator and Customer during the live role sequence. No credentials are in evidence files.

### Later role/customer and network checkpoint

- Admin reads and tested creation/deletion/handover UI restrictions passed. Moderator navigation was limited to Orders/Requests; permitted detail/private-image reads passed, Finance redirected to Orders and B2B product access was denied. Both role reductions invalidated the previous sessions in both stores.
- Customer histories excluded same-email guest records. Actual account-mode reads of those guest IDs were denied. B2C Wishlist and Cart merge passed: one account unit plus one guest unit became two and stayed two after reload. B2C logout/re-login left B2B's separate Customer session active.
- Customer inquiry `46c6eecc80ca11f26c2dd00f` submitted one fixed pouch; Customer history contains only this request, with no guest tracking-token control on its receipt. Wholesale was temporarily republished for it, then a second Unpublished save was submitted. Final readback of that second restoration remains pending.
- Consumed coupon rejection passed. Existing InstaPay returned unavailable; no receiving configuration changed. Sunday Finance grouping and the original order's refund marker reconciled.
- A two-unit Customer COD quote of 29,000 piastres correctly failed placement after only test size S stock was reduced to 1; customer history remained empty. Restoring S stock to 2 then hit an external network failure. The editor locked repeat Save and retained its recovery state. **Read current record must reconcile the uncertain save before any retry or cleanup.** Last verified S stock was 1; no second order was created.
- The API hostname stopped resolving from this computer (`No such host is known`) and a direct Chrome health navigation timed out. The owner was asked to confirm connectivity. Remaining account-order completion, password invalidation, live replay/concurrency, final cleanup and external release gates remain open. Preserve the normal Super admin tabs and Incognito Customer/checkout tabs.

Connectivity recheck after the owner asked to try again: configured DNS still timed out for both the API hostname and `example.com`. An explicit read-only query through 1.1.1.1 resolved the API hostname. A normal Windows TLS request to that resolved address could not reach its certificate-revocation service (`CRYPT_E_REVOCATION_OFFLINE`); validation was not disabled. No DNS/network settings were changed and no writes were retried. This points to a local DNS/network-resolution problem and does not establish a global API outage. Evidence: `output/phase8/connectivity-current.json`.

### Connectivity recovery and resumed checkout

After the developer reported healthy endpoints, unrestricted rechecks returned 200 for both health routes. Actual-origin CORS on 5295/5294 returned 204 with credential support. Chrome's remaining `NETWORK_ERROR` was traced to stopped localhost previews; both ports actively refused connections. Restarting the existing integration previews restored Chrome readback without backend, CORS, cookie or TLS changes.

The retained editor compared server S stock 1 with draft 2; the reviewed restoration saved. The Customer checkout then rejected an expired session without replaying the mutation. Reload restored authentication, and explicit placement created account order `10f83744224fe80f6d1e4ed1` once for 29,000 piastres. Only that order appears in Customer history; the receipt exposes no guest tracking control. Direct Customer dashboard routes show Staff sign in. The order is canceled and public S stock is again 2. The final Wholesale Unpublished restoration is publicly verified as 404. Remaining work no longer has a network blocker; the disposable Customer reset forms are prepared for owner-only code/password entry, with live reset invalidation, replay/concurrency and final cleanup still pending.

## Backend export discrepancies reconfirmed

The supplied `Backend Files/New Backend Files/api/narmer.openapi.json` still lists only 200/404/422/429 for `GET /api/v1/b2b/wholesale/offers/resolve/{offerKey}`, while `wholesale-stable-urls.md` requires 503 `NOT_READY` for an unmigrated offer. Its resolver 200 response also declares `data.composition[].variantId` as only `null`; the module contract supports variant IDs as strings for variant compositions. The frontend follows the delivered module behavior and retains IDs. Correcting these generated backend exports remains with the backend owner; the supplied package was not edited.
