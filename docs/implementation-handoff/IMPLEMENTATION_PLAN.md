# Narmer implementation plan: B2B, B2C and both dashboards

23 October 2026. Updated with the owner's follow-up decisions. Phase 1 is accepted and Phase 2 was authorized. The Phase 2 frontend is presented in [PHASE_2_HANDOFF.md](PHASE_2_HANDOFF.md), including external browser/device and live checks still open. These recorded approvals supersede historical planning-only wording below. The owner accepted Phase 2 and authorized Phase 3 on 24 October 2026. Use the execution tracker and PHASE_3_PROGRESS.md for current status; later phases remain unauthorized.

## 1. Outcome and boundaries

Build the approved bilingual public websites and their channel-specific dashboards inside the existing `B2B-Website` and `B2C-Website` JavaScript React/Vite apps. Prioritize a complete B2B inquiry journey and its operational dashboard, then retail browsing, checkout, operations and reporting. Preserve separate builds, accounts, business modules and settings.

This planning turn permits documentation only. Application source, dependencies, configuration, environment files, backend, Figma, databases, providers and deployment remain unchanged. Git initialization, commits, pushes and deployment require separate authorization. Approval must identify the phases authorized; unresolved decisions remain gates for their affected slices.

B2B collects guest/account Leads through five configurable questionnaires and fixed-pouch wholesale offers, followed up offline. It has no payment, retail prices, stock reservation, checkout or finance. B2C supports guest/account commerce, optional account Wishlist, COD/manual InstaPay, receipts, private tracking and authorized staff operations. No extra business capabilities are implied by shared visual templates.

### Confirmed owner decisions — 23 October follow-up

These decisions supersede the original unresolved recommendations in this plan:

- Our implementation scope is frontend only: both public websites, both dashboards and integration of the backend's delivered contracts that support the agreed flow. The backend developer works alongside us. Do not implement backend services or invent endpoints to bridge a pending delivery.
- The updated backend response to [the size-chart handoff](NARMER_SIZE_CHART_BACKEND_HANDOFF.md) has now been reviewed: numeric tables, individual/shared Product assignments and real counts are delivered within the existing module. Use the exact new contract, retain legacy image fallback and handle nullable public images. See [the update review](BACKEND_UPDATE_REVIEW_2026-10-23.md); the former image-only contract blocker is resolved at documentation level.
- Homepage follows the recommended fixed slot/device image controls and ordered B2C curation. Product gallery changes go through the Product editor. Reporting labels follow the settled backend definitions.
- All Figma build directions, GAP-pending notes, design-preview notices, illustrative-data captions and similar internal guidance are for the team, not content to reproduce in the real website/dashboard. Preserve actual customer help, field validation, payment-review explanations and genuine business limitations. Identify review-only notices by meaning, not a blanket deletion of every note/panel.
- The proposed minimal shared components/source, separate app responsibilities, logical language/dashboard routing and private-persistence approach are accepted. Actual domains, hosting, cookie/origin arrangements and link-template values still await real configuration; approval is not evidence that they are configured.
- Dummy bilingual content, example questionnaires, policies, catalog/offer data and destination/category mappings may be prepared for client demonstrations, then replaced when client information arrives. This is permission for review fixtures, not final business policy, live backend publication, real payment instructions or a production factual claim. Sample API-shaped data must obey the delivered contract. In live mode show backend results/errors rather than falling back to samples.
- Performance, a maintainable component structure and basic SEO/GEO/AEO are original implementation requirements for both public websites. Support future monthly SEO work without rebuilding the frontend or introducing an unsupported SEO/CMS backend.
- Public-page pre-rendering within the existing React/Vite apps is approved. Select the minimum compatible tool during the authorized foundation phase and verify actual delivered HTML; final content regeneration/hosting settings depend on the real environment. This is not permission to introduce a new runtime server or switch framework.
- Use relevant installed skills while building. The owner also authorizes finding/acquiring an additional skill through find-skills when a concrete gap warrants it. Prefer the existing catalog, inspect source/instructions and overlap before installation, and report any addition and its scope. This does not authorize unrelated dependencies, system tools, automatic external reviews or changes to selected model settings.

The latest instruction file was located at `C:\Users\Fares ElSawy\.codex\AGENTS.md`. Its Ponytail full, clear communication, efficient delegation, frontend quality and approval boundaries apply. No workspace AGENT.md/AGENTS.md was returned by the targeted workspace filename search at this checkpoint.

## 2. Evidence and source authority

Read the implementation handoff, working rules, backend alignment review, ordered review ledger and source lock. Began the NEW package with README, backend-response, shared conventions, then both flows. Reused the four focused contract/reference reviews and saved package audit; inspected exact contract sections for the decisions and request boundaries below. Before implementing each slice, read its complete module and linked caller contracts, including field bounds and recovery tables.

Current direct observations:

- Both package files contain React/React DOM `^19.2.8`, Vite `^8.3.0`, React plugin `^6.1.1` and Oxlint. Both `src/App.jsx` files are starter screens. Neither package/Vite config contains Tailwind or an application router.
- The workspace root listing has no `.git`. No Git setup was performed.
- Supplied Brice and Cairo WOFF2 families exist under `Files/Fonts`; supplied logo and product/service asset locations are recorded in START_HERE. Fonts, image crops and licensing/content suitability need implementation-time checks.
- Read live CURRENT website, B2B, B2C, shared and dashboard page inventories. Retrieved design context and screenshots for website master `191:651`, dashboard master `191:12467`, D14 `191:19236` and D13 mobile `191:18946`.
- Live metadata confirms R07-R receipt frames, navigation states, dashboard templates and Coupons-selected states. The latest receipt and 6px-header QA records supplement the older manifest. This was targeted design inspection, not a fresh audit/render of every variant.

Authoritative references:

| Source                                                             | Authority                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Latest owner instructions                                          | Scope, approval and unresolved product decisions                      |
| CURRENT CW-01 MIX, file `sv4mjHZis8FDpvEMsrAJWM`, master `191:651` | Public visual system                                                  |
| CURRENT CD-01 Apple, master `191:12467`                            | Dashboard visual system; B2B requests master `191:13178`              |
| CURRENT pages `191:127` through `191:134`, components `192:127`    | Active screens, component subtrees and states                         |
| `FIGMA_CURRENT_SOURCE_LOCK.json`                                   | Exact active references and backup exclusions                         |
| `Backend Files/New Backend Files`                                  | Available API behavior; exact modules govern payloads and permissions |
| `BACKEND_ALIGNMENT_REVIEW.md` and focused reviews                  | Integrated findings and prior evidence, with stated limitations       |

BACKUP pages, earlier experiments, old local exports and Old Backend Files remain historical. Existing design repair scripts must not be rerun as application generators. Earlier prose that says filters/reports/homepage are pending is superseded by the final exact modules and backend-response. All five requested extension families are documented delivered.

The previous static audit reports 42 NEW/37 OLD files, 159 business plus two health operations, 24 additions and no removals, with package/hash/link/schema/route checks passing. Those are reused dated package results, not checks rerun here or evidence of a working server. Backend source is absent and the API origin is explicitly unconfigured.

Latest package update review: 43 NEW files, one added size-chart response, 20 changed and 22 byte-identical to that earlier 42-file snapshot. Static package checks were rerun successfully; route inventory is byte-identical and remains 159 business plus two health operations. Four embedded complete contracts match their canonical content after hyperlink/presentation normalization. Numeric schemas/counts and public nullable-image handling were separately checked. See BACKEND_UPDATE_REVIEW_2026-10-23.md and backend-update-audit-2026-10-23.json. Backend test claims remain supplied evidence, not tests rerun by the frontend review.

## 3. Accepted minimal architecture approach — implementation still gated

Keep each app's existing root, scripts and JavaScript. Each owns its public route tree, customer area, dashboard routes, business API functions and feature state. Within each app, use ordinary `src/app`, `src/components`, `src/features` and `src/styles` responsibilities as needed, rather than generating empty scaffolding.

Use one small root `shared/` source directory for behavior that is actually identical: design tokens, supplied brand/font assets, basic controls, locale helpers, money parsing/display, response/error handling and coordinated auth transport. Import ordinary source files into the two Vite builds. Keep package installation and builds in each existing app; no workspace manager, published library or third application. Validate both builds and development file access before relying on sibling imports. Any necessary Vite access setting is confined to the approved shared directory.

Keep B2C Cart/Orders/Coupons/Reports and B2B Forms/Wholesale/Leads in their respective apps. Shared controls receive content and state; they do not acquire a generic tenant/business engine. Auth implementation may be shared, but each store has separate state, cookie namespace and caches. Clear private state on identity/store changes, including a change between customer and staff within the same store.

### Dependencies and native features

| Choice                | Proposal and reason                                                                                                                                                                                                                                                          | Timing                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Tailwind              | Add `tailwindcss` and its Vite integration; use CSS theme tokens and small component styles. Preserve React plugin and existing scripts. No unrelated upgrades.                                                                                                              | Phase 1, after approval |
| React Router          | Use declarative browser routing within both existing apps for nested layouts, IDs, query state and deep links. Do not adopt its framework scaffold.                                                                                                                          | Phase 1                 |
| Localization          | Two explicit English/Arabic message dictionaries, React context, `lang`/`dir`, native `Intl` formatting and directional CSS. No translation dependency initially.                                                                                                            | Phase 1                 |
| API/state             | Native `fetch`, `AbortController`, React context/reducers where shared state warrants them. Explicit JSON and private-binary paths; small feature API functions. No Axios, global Redux store or generated API framework.                                                    | Phase 1 onward          |
| Forms                 | Native controls plus React state and exact server field validation/errors. Dynamic B2B widgets cover only the six supported types. No generic form-builder package.                                                                                                          | Phases 1–2              |
| Reports dates         | Propose `@date-fns/tz` when implementing Cairo calendar-boundary conversion. Use native Intl for display and returned buckets for charts. Add date-fns itself only if the selected operations need it; no hand-written fixed-offset/DST engine.                              | Phase 7                 |
| Charts                | Responsive SVG for the specified simple trends, backed by real returned values, accessible summaries/tables and keyboard/touch interaction where needed. Do not draw illustrative curves through invented data. Reassess only if an inspected chart requires more than this. | Phase 7                 |
| Icons/motion/printing | Approved Figma assets/supplied assets, coherent SVG icons, CSS transitions with reduced-motion support, browser print CSS and `window.print()`. No animation suite or receipt-PDF service.                                                                                   | Respective UI slices    |
| Verification          | Existing Oxlint/build scripts, Node's test runner for pure logic, and a small Playwright end-to-end suite once browser behavior is introduced. Verify availability before proposing installation; browser tool availability does not mean an app test dependency exists.     | Each phase              |

Exact package versions and compatibility will be checked and recorded at the approved installation step. Official references checked for this proposal: [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite), [React Router declarative installation](https://reactrouter.com/start/declarative/installation), and [date-fns timezone utilities](https://github.com/date-fns/tz). None was installed.

### Routing and hosting proposal

Keep a separate build per channel, with the dashboard mounted at `/dashboard` within that channel's language-prefixed app routes. Use `/en/...` and `/ar/...` public/customer routes and matching dashboard routes. Browser history routes require appropriate hosting fallback, except where approved public prerendered HTML or actual error responses should be served. Dashboard route chunks should load on demand. Logical routing and the pre-rendering approach are accepted; actual frontend origins/base paths remain unconfigured, and Phase 1 verifies the compatible tooling before broader rollout.

Representative route names: `/:lang/services/:formType`, `/:lang/wholesale/offers/:offerId`, `/:lang/requests/:leadId`, `/:lang/products/:productId`, `/:lang/orders/:orderId`, and their dashboard counterparts. Query strings can contain non-secret filters/pagination; credentials cannot. Final names must be agreed before configuring backend email link templates. Category navigation uses confirmed category IDs; friendly text never replaces backend IDs.

Keep the API origin in a public per-app environment setting, with `/api/v1` added exactly once. An unset origin means disconnected/unconfigured, with no localhost fallback. Do not contact any example origin. Confirm the two frontend origins, API origin, TLS, base paths, allowed CORS origins and compatible same-site cookie arrangement before live integration. `credentials:include` cannot repair a cross-site SameSite=Lax mismatch.

### Privacy and persistence proposal

The owner accepted this recommended policy; implementation and actual transport verification remain part of the authorized coding phase:

- Access JWTs stay in memory, separately per store. Restore authentication through the HttpOnly refresh cookie. Serialize refresh within a store and coordinate same-origin tabs using native Web Locks/BroadcastChannel, subject to browser support validation. Do not assume these APIs coordinate different origins. Retry an appropriate protected read once, never blindly replay mutations/OTP/refresh.
- Use tab-scoped `sessionStorage` for the minimum B2B draft input/ID/secret/deadline and B2C checkout/replay state needed to survive a reload. Keep original ownership fixed; do not silently switch a guest draft/checkout to an account halfway through submission. Preserve exact replay data until an uncertain commit is reconciled.
- Session storage remains readable by scripts running on the origin and may survive browser session restoration; it is not a secure vault or guaranteed deletion on tab close. Check expiry when loading, provide an explicit forget/clear action, and clear obsolete state after completion. If this tradeoff is unacceptable, memory-only storage loses reload recovery.
- Guest tracking links carry the token in a fragment. Consume it into private state and remove the fragment from the visible URL with history replacement. Offer an explicit copy/save tracking-link action; no automatic permanent localStorage archive. Tab storage can retain the issued credential up to its server deadline, with a clear shared-device warning and forget action.
- Keep raw file bytes and Blob URLs out of storage. Recovered B2B draft metadata may show ready image counts without thumbnails, because customers cannot re-download private images. Reconcile uncertain uploads through draft GET rather than uploading twice.
- No private tokens/contact payloads in logs, analytics, query strings, receipt printouts or shared caches. Revoke private Blob URLs. Trackers/scripts must not run before fragment handling. The receipt must not print the tracking URL merely because the browser includes headers/footers; verify print preview and document any browser-controlled limitation.

### Review data and internal design instructions

Keep demonstration data in a clearly named fixture/content source with the same DTOs as the real backend, not scattered literals inside components. Separate page copy from layout so client revisions do not require rewriting components. Record which values are placeholders and the client decision each one represents; preserve English/Arabic coverage and realistic long/empty/error examples. Preview-only identification may live in a review toolbar or review documentation; it must not ship as Figma's internal direction text inside product pages.

Use non-deliverable example contacts/links and explicitly simulated payment/submission flows in demo mode. Do not send messages/payments, publish Forms, seed the backend or convert tentative policies/material requirements into binding live rules. New client data replaces fixtures through the approved content/API path. Production readiness includes a placeholder inventory review. Review/staging copies use noindex and appropriate access controls; robots directives are not a privacy boundary. Client review permission is not production publication approval.

### Performance and component structure

- Public entry bundles exclude dashboards, staff editors and reporting/date code. Load substantial route groups on demand; avoid splitting trivial controls into many small network requests.
- Reuse headers/footers, controls, feedback, language behavior, dashboard shells, pagination and label/value presentation when purpose and behavior match. Keep retail and inquiry feature components separate when their business rules differ; avoid large universal components and duplicate pages per device/language.
- Optimize supplied images for displayed sizes, preserve intrinsic dimensions/aspect ratio and deliberate crops, and use responsive sources when available. Load the principal above-the-fold image promptly; lazy-load below-the-fold images. Do not lazy-load everything indiscriminately.
- Load only needed Poppins/Cairo WOFF2 weights, use sensible fallback/loading behavior and check layout shifts after final typography. Poppins replaces Brice following the owner's Phase 1 review. Use CSS motion and avoid heavy effects/dependencies without a demonstrated need.
- Prevent duplicate requests and request waterfalls; parallelize independent reads, paginate supported lists, cancel/discard stale reads and pause hidden/error polling. Private/account caches remain separated; performance never overrides no-store or authorization rules.
- Record production-build entry/route sizes and representative mobile loading/interaction behavior as a baseline. Use the Core Web Vitals good thresholds as targets: LCP <=2.5 seconds, INP <=200 milliseconds, CLS <=0.1 at the 75th percentile, assessed separately on mobile/desktop. Pre-launch lab tests are diagnostic evidence, not a claim that post-launch field data passes. See [Web Vitals](https://web.dev/articles/vitals).

### SEO, GEO and AEO from the foundation phase

Here GEO means generative-engine optimization and AEO means answer-engine optimization. The deliverable is a solid technical/content foundation that future monthly work can extend, not a ranking/indexing/AI-citation guarantee. Google states that its AI search features use existing SEO best practices, with no special required AI markup/files; do not add speculative AI tooling or llms.txt as a substitute for crawlability and useful content. See [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

1. **Public HTML delivery — approved approach:** prerender indexable B2B/B2C public routes while retaining both React/Vite apps and client interactions. Do not call SEO complete when the initial HTML only contains an empty root plus JavaScript. During the authorized Phase 1, choose the minimum compatible tooling and prove one EN/AR public route includes meaningful content/head tags in delivered HTML before broad rollout. Do not introduce an SSR server, migrate framework or invent a backend rendering endpoint as a silent implementation choice. Google recommends server/pre-rendering because it can help users/crawlers and not all bots execute JavaScript: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
2. **Dynamic catalog freshness:** once actual hosting/API information arrives, agree how public Product/category/service HTML, metadata and sitemap routes refresh after catalog/content changes. A build-only snapshot without a regeneration process cannot satisfy frequently changing content. Revalidate actual prices/availability through existing APIs for shopping; keep rendered text and structured data consistent. Do not freeze dummy products into an indexable production build. If runtime HTML delivery becomes necessary, present that frontend/deployment tradeoff rather than silently changing architecture.
3. **Metadata and route ownership:** provide unique localized titles/descriptions, self-consistent canonical links, Open Graph/social preview data, lang/dir and reciprocal EN/AR hreflang links for actual equivalents. Use Site Settings for delivered default SEO fields and frontend-owned per-route metadata; no new per-page SEO editor/API is assumed. Domain-aware canonical/hreflang/social URLs need the real public site origins, which are separate from the API origin. Define a root/language selection and x-default strategy only where applicable. See [localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions).
4. **Crawlable structure:** use real links, clear headings, semantic landmarks, accessible text, breadcrumbs and consistent navigation from collections/services to details. Keep IDs as backend lookup identities; frontend-friendly URL text does not imply a slug API. Agree canonical/filter/pagination rules to avoid endless faceted duplicates without hiding intended collection pages. See [ecommerce URL guidance](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites).
5. **Indexing policy:** home, approved services/collections/products/contact/information pages may be indexable in production. Auth, dashboards, profiles/addresses, Wishlist, Cart, checkout, receipts, private tracking and request/order history are excluded from sitemap/indexing; authentication and tokens still enforce privacy. Review parameterized variants, form steps and missing resources deliberately. Real 404/redirect behavior requires hosting alignment; a 200 SPA fallback for every missing Product is not complete error handling.
6. **Discovery files:** generate sitemap.xml from actual canonical public routes and language equivalents, plus intentional robots.txt rules. Exclude private/preview/dummy URLs. Do not block a URL in robots.txt and then assume a crawler will see a page-level noindex; use appropriate environment/hosting controls. Final domain values and changing catalog discovery wait for configuration and delivered data.
7. **Structured data:** use JSON-LD only where supported by visible, verified content: organization/site identity, breadcrumbs, retail Product/Offer data and appropriate service descriptions as applicable. Do not turn price-free B2B inquiries into payable retail Offers, invent ratings/reviews, or assert unconfirmed contacts/policies/prices in live markup. Preserve piastre-to-EGP conversion and current availability. Fixture markup may be reviewed on non-indexable previews, but no fabricated details are launched. See [structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
8. **Content for questions and answers:** provide clear service/product descriptions, descriptive headings, understandable specifications, contextual internal links and client-reviewed explanations where the design calls for them. Keep important text in HTML rather than images alone. Draft content may be used for review; do not introduce new FAQ sections, unsupported CMS tools or fabricated business claims merely for SEO. Arabic quality and actual language alternatives are verified independently.
9. **Monthly maintenance handoff:** document route/content/metadata sources, structured-data mappings, canonical/hreflang/sitemap generation, rendering refresh process and placeholder inventory. Identify how to add approved future content using existing templates; this does not authorize a blog/CMS feature not in scope. Provide the hooks/configuration locations for later Search Console/Bing verification and approved analytics, without creating accounts, embedding unknown tracking IDs or granting external access. Actual verification and ongoing reporting begin when domains/access are supplied.

SEO acceptance is progressive: Phase 1 establishes metadata/indexing/rendering foundations; Phases 2 and 4 validate actual public templates and content mappings; Phase 8 checks delivered HTML, links, canonical/hreflang, schema, sitemap/robots, redirects/statuses and representative performance using final configured origins. Rankings, index coverage and field Core Web Vitals require post-launch observation and remain distinct from frontend readiness.

## 4. Phases and acceptance

Execution is tracked in [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md). Work through one phase at a time, finish its checks, report it ready for review, and wait for the owner's acceptance before starting the next phase. Update the tracker when scope/status/check results or deferred items change; chat updates do not replace the persistent record.

There are eight implementation phases. The original labels 1, 2A, 2B, 3, 4, 5A, 5B and 6 are now numbered 1 through 8 respectively. This is numbering cleanup only; no scope was removed or added. Phase 0 records completed planning/contract review and is not counted as an application implementation phase.

Relative effort is a comparison, not a calendar estimate. Deployment configuration and client content affect elapsed time. Each phase produces a reviewable increment and records fixture, browser and live-integration evidence separately.

### Phase 0 — source alignment and decisions (this proposal)

Deliver the source lock, complete screen/module mapping below, architecture proposal, supported-control boundaries and decision register. Resolve only genuine open questions. Reuse the verified export audit rather than repeating it. No application writes.

Acceptance: the owner has settled the recommendations recorded above; an explicit execution go-ahead still identifies the coding phase to start. Missing client information is approved for demonstration fixtures. The size-chart backend response is reviewed and the numeric contract mismatch resolved; unset real environment values remain visible integration gates. Pre-rendering is approved, with tooling/proof performed during foundation work.

### Phase 1 — shared foundation and representative UI (medium effort)

Dependencies: explicit go-ahead to execute this phase. The architecture/routing/privacy recommendations and demonstration fixtures are accepted; API availability is not required for fixture-based development.

Work:

1. Minimally configure required Tailwind and routing in both existing apps. Preserve supplied documents/assets and existing dependency versions.
2. Implement navy `#073B50`, gold `#BF8D34`, pale surfaces, spacing/type/radius tokens from CURRENT components. Load owner-approved Poppins English and supplied Cairo Arabic in Regular/SemiBold/Bold. The owner replaced Brice during Phase 1 review; preserve its supplied files as references.
3. Implement public headers/footers, mobile navigation, channel-specific dashboard shell/drawer, basic buttons/fields/dialogs/tabs/alerts/labelled mobile rows and pending/empty/error states. Preserve the 6px B2C utility gaps and 44px targets. B2B keeps its distinct logo/menu/request CTA pattern.
4. Implement store-separated transport, language/error mapping, private-binary handling, auth/session primitives and role guards. Feature modules own endpoint-specific payload/retry rules. Fixture mode is explicit and visibly labelled; normal mode never falls back to fake success.
5. Add a narrow test base for money parsing, null/zero, error mapping, stale reads and auth coordination. Verify representative public and dashboard layouts rather than rendering the whole app as placeholders.
6. Establish the public SEO metadata/content sources, indexing policy and performance baseline. Present and verify the minimum compatible public HTML-rendering method on one EN/AR route before broad rollout; no silent framework/deployment switch. Keep all Figma build notes out of real UI.

Acceptance: both apps build/lint; representative EN/AR home/header and dashboard shell work at 1440, 1024, 768, 390 and 320px. No page overflow or clipped actions; keyboard menus/dialogs restore focus; Arabic centered buttons/avatar remain centered. Compare real renders to CURRENT and record expected Brice reflow differences. Auth tests with fixtures must not be described as real cookie acceptance.

### Phase 2 — B2B public inquiry journey (large effort)

Dependencies: Phase 1; use owner-authorized demo questionnaires/material-policy examples and offer fixtures until client content arrives, without publishing them to the backend. Final content acceptance needs the client values. Private uploads additionally need configured storage for live acceptance.

Build BW-01, B01–B08 including B04-W/B05-M, plus B2B instances of A01–A07/I01/I02. Render all five published Forms with exact keys/version, six supported input types and server constraints. Preserve optional email, valid zero and false, and missing optional answers. Manufacturing service content remains distinct from wholesale selection.

Wholesale uses price-free offers and fixed compositions: choose 1–10 distinct offers and 1–10,000 whole pouches per offer, never a custom mix or retail Cart. Build draft preparation, optional raw images, review, exact submission replay, receipt, guest tracking and customer request history. A draft lasts 24h; guest tracking 90 days. Guest submissions do not attach by matching email. Configure contact/SEO display without inventing facts or blocking requests when settings fail.

Acceptance: test five form types, unpublished/retired/changed forms, valid false/zero, optional email, empty offers, unavailable source, changed offer version, mixed composition and quantity boundaries. Simulate uncertain upload/submission, reconcile/replay once without duplication, preserve input on 429, and distinguish draft/tracking secrets. Verify receipt/tracking/history and full EN/AR responsive flow. Live submission claims wait for an authorized real environment.

### Phase 3 — B2B staff operations and launch configuration UI (large effort)

Dependencies: Phase 1 and relevant Phase 2 contracts/components, with Phase 2 accepted before this phase starts. Build this before moving to the B2C public phases so the prioritized business has a complete operational path.

Build BD-01, D20 request details, D18 Forms, D05 native product editor and B2B D03 list adaptation, D19 Wholesale, D15/D16/D17/D22 and an independent Homepage editor using the approved D14 visual system. B2B product list/editor uses Wholesale native products and the read-only B2C selector, never B2C catalog writes. No B2B Categories or Reports menu.

Staff review submitted snapshots/private bytes and mark contacted only after offline follow-up. Notification acknowledgment is separate. Forms retains stable keys and replaces complete configurable field lists with current versions. Products/offers/media observe target ownership, immutable source and reference-protected deletion. Accounts edits affect existing registered accounts; there is no create-account endpoint. Handover is an explicit superAdmin action, not bootstrap automation.

Acceptance: admin/superAdmin/moderator navigation and server-denial states agree; moderator can follow up but cannot edit Forms/settings/accounts/catalog. Test two staff notification read states, binary image denial, version conflicts, immediate publication, native/reused product boundaries and blocked deletion. All mobile values are labelled. Client content publication and external data writes remain separately authorized.

### Phase 4 — B2C browsing, accounts, Wishlist and Cart (large effort)

Dependencies: Phase 1; uses shared account UI matured in Phase 2. Actual category/destination/content mappings are needed for final navigation/content acceptance. Size guides use the delivered numeric-first contract, with retained image fallback and null-safe rendering; no numeric-versus-image decision remains.

Build CW-01, R01–R04 and channel-specific A01–A07/I01/I02. Integrate Categories, Homepage/Site Settings, Product list/facets/detail and real variants. Filters use stable keys and integer piastres; matchingPrice/matchingVariantId remain browse hints. Keep URL filters/page/language, reset pages when filters change and discard stale responses. Never send unsupported full-text search.

Render saved order of curated products, hide empty curated sections without clearing configuration, and use device image fallback. Wishlist is account-only, product-level, max 100, with sign-in interaction for guests. Cart replaces its complete DTO after absolute quantity writes, supports quantities through 10,000 subject to stock, removes with zero and distinguishes subtotal null from zero. Login explicitly merges only B2C customers; failure preserves both carts.

Acceptance: simple/variant/unavailable/zero-stock and zero-price fixtures; same-real-variant filtering, missing combinations, empty/null media, product-level Wishlist/unavailable removal, expired guest Cart, merge stock conflict and repeat merge. Verify category navigation against actual IDs when supplied. Test RTL/mobile Cart action alignment and large quantities without clipping. Real guest cookie/merge acceptance requires the approved origin arrangement.

### Phase 5 — B2C checkout, receipt and tracking (large effort; higher integration risk)

Dependencies: Phase 4; approved governorate code/label mapping, route/privacy policy, configured API/CORS/cookies and authorized test data for live acceptance. COD can be built/tested before live private storage; InstaPay acceptance additionally needs receiving-account and private-storage readiness.

Build R05 details, R06 InstaPay/R06-COD review, R07 acknowledgment, R07-R receipt, R08 tracking and R09 history. Progress remains Details → Review → Receipt; R07-R is within step 3, not a fourth step.

Use explicit buyer/address snapshots, collect a missing district and confirm unmapped saved governorates. Coupon preview uses the actual checkout phone and current Cart owner. Quote/placement totals are server-owned. Retain quote/checkout/proof IDs, raw private proof bytes transport, exact placement payload and original identity for uncertain-response replay. Successful placement, not proof upload, produces the Order.

Receipt uses `placement.data.order` or authorized detail; later detail returns direct `data`. Display the supplied ID as the reference unless an approved display convention is provided; no fabricated orderNumber. Include line selections/quantities/prices, coupon/shipping/totals, COD/InstaPay review wording, print CSS, tracking and shopping actions. Never label it a tax invoice, bank settlement or completed refund.

Acceptance: guest/account COD and InstaPay, disabled InstaPay, invalid/oversize proof, quote expiry, changed amounts/stock/coupon, exact replay after lost response and expiry, token preservation when replay returns null, private proof access and receipt print preview in both languages. Verify a fresh empty Cart after placement. Guest access expiry has an honest unavailable/support state; no invented lost-link recovery.

### Phase 6 — B2C operations and configuration (large effort)

Dependencies: Phases 1/4/5 contracts and components, with preceding phases accepted. The returned backend handoff now documents the numeric and individual/shared-assignment flow. Actual live integration still needs a configured API environment.

Build D07/D08 Orders/proofs/status, D03/D04 Products/variants, D06 Categories, D09–D11 Sales/Coupons, D12 Shipping/InstaPay settings, D13 approved size-guide solution, D14 Homepage, D15–D17 accounts/notifications/profile and D21 Site Settings. Keep customer versus staff Users operations distinct. Preserve the two-tab/one-create-action Sales/Coupons toolbar.

Order progression is pending → accepted → shipped → delivered. Staff cancellation only from pending/accepted; return only from delivered. Send expectedStatus; review conflicts. Stock restoration and offline refund markers are backend-owned and happen once; coupon usage remains consumed. No customer cancellation, partial return, refund provider or order delete.

Product variants use actual retained IDs and full replacements where required; do not generate Cartesian combinations or lose omitted retained variants. Products, charts and singleton settings have independent versions; Categories/Shipping/Sales do not gain invented versions. Create catalog targets before raw upload, then attach returned target-bound media IDs. Homepage is fixed slots/alt/curation only and publishes immediately.

Size Charts uses measurements:null|{unit:"cm",rows:[{size,chest,length,sleeve}]}, with 1–50 ordered rows, unique trimmed size labels of 1–30 Unicode code points and all three numeric measurements required in 0.01–1000 inclusive with at most two decimals. Keep assignedProductCount read-only; assign via existing Product.sizeChartId with the Product's own version. Render numeric guides first and image fallback otherwise. isActive defaults false and Save does not implicitly activate; propose a compact publication/availability control consistent with the existing editors for owner review in this slice. Preserve state on conflicts and the independent image/table clearing rules. Actual factory values/method remain client content inputs, not backend measurement interpretation.

Acceptance: every role boundary and deletion exception, including admin Shipping override deletion; reference-protected deletes; version/status conflicts and uncertain saves; inactive category ancestry; variant retention; campaign overlap and coupon eligibility; image expiry/attachment; independent B2C/B2B settings. No unrelated cleanup, seeding or provisioning.

### Phase 7 — B2C reporting (medium effort with focused financial/date checks)

Dependencies: Phase 6 navigation/security and canonical Reports contract; date-helper decision and reporting captions reviewed before acceptance.

Build CD-01 overview, D01 finance and D02 performance for B2C admin/superAdmin only. Moderator lands on Orders; B2B lands on Requests. Overview shows all-status placement volumes/value; rankings use currently delivered Orders by placement date. Finance separately shows placement snapshots and payment/refund event markers. Old category snapshots remain Unknown; no current-category reconstruction or ancestor rollup.

Use explicit inclusive/exclusive timestamps, Africa/Cairo calendar boundaries, max 366 elapsed days and returned day/week/month buckets. Charts handle zero/partial buckets and null averages, preserve filters on error and discard stale responses. Respect shared 30/min report budget and REPORT_BUSY/TOTAL_UNAVAILABLE. No CSV, comparison period, bank balance, profit or invented net cash.

Acceptance: test Cairo 23/25-hour days, Monday weeks, month edges, inclusive/exclusive boundaries, zero/null, large safe amounts, legacy unknown category, return changing a historical ranking and markers outside placement cohort. Ensure accurate chart axes, labels, legends, keyboard/touch access and equivalent data text. Fixture tests establish frontend interpretation; live report reconciliation requires authorized test records.

### Phase 8 — integration and release readiness (medium-to-large, environment-dependent)

Run live acceptance incrementally as soon as an authorized environment is supplied; do not defer all integration until the end. This phase closes the cross-feature matrix and configuration/provider gaps.

Verify exact browser origins/cookies/preflight, store isolation, multi-tab refresh, session invalidation, OTP and route entry, Cart merge, concurrency/replay, stock/coupon conflicts, raw uploads, private ownership and provider exposure, versioned settings/public refresh, report dates/roles and both tracking URL templates. Staff feeds are independent of SMTP. Operations owns SMTP/Bunny/database/backup/cleanup/email-worker setup; dated package provider checks do not certify current deployment.

For each implemented route family, inspect EN/AR desktop/mobile and representative intermediate widths. Check geometry/overflow, long real content, keyboard/focus, reduced motion, labels/contrast, image/font loading, form feedback, menu/dialog behavior, printed receipt, deep-link refresh and not-found/forbidden states. Exercise Chrome; include Firefox and Safari/mobile Safari when available, otherwise state the gap. Review bundle/lazy loading and page performance with representative assets.

Acceptance: both builds/lint and targeted automated checks pass; critical guest/account/staff flows pass against the authorized environment; documented visual discrepancies are fixed and re-rendered; outstanding issues have severity/owner/evidence. Provide configuration requirements and a release checklist. Deployment is a separate authorization, not an automatic step.

## 5. Exact screen-to-module mapping

IDs below are CURRENT English desktop roots unless specified. EN/AR and mobile are variants of the same route/state, not separate application features. All API roots include `/api/v1`. Full payload details remain in the linked NEW module contracts.

### Public B2B

| Screen / root                           | Contract and responsibility                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| BW-01 `191:135`                         | B2B Homepage + Site Settings + Forms; fixed service content/navigation         |
| B01 service `191:1647`                  | Forms public list/detail; selected fixed service type                          |
| B02 wholesale collection `191:1875`     | Wholesale public `/b2b/wholesale/offers`                                       |
| B03 offer `191:2165`                    | Wholesale `/offers/:resourceId`; fixed composition/version                     |
| B04 manufacturing `191:2429`            | Forms + Leads draft/read/raw images; selected type/version/keys                |
| B04-W wholesale details `191:3577`      | Forms + Wholesale + Leads; offerId/version/whole pouch quantities              |
| B05 review `191:2811`; B05-M `191:3941` | Retained form/offer/input state; Leads `POST /b2b/leads` with draft header     |
| B06 received `191:3047`                 | Leads submission receipt; retain issued tracking credential                    |
| B07 status `191:3189`                   | Leads `/b2b/leads/tracking/:leadId` with X-Lead-Token, or own `/leads/:leadId` |
| B08 history `191:3385`                  | Leads account-only `GET /b2b/leads`                                            |

### Public B2C

| Screen / root                                      | Contract and responsibility                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| CW-01 `191:651`                                    | Homepage + Categories + Products + Site Settings                                              |
| R01 collection `191:4139`                          | Products list/facets + Categories; supported filters/sorts only                               |
| R02 detail `191:4681`                              | Products `/:productId`, real variants; optional Size Charts projection; Wishlist/Cart actions |
| R03 Wishlist `191:5237`                            | Wishlist `/b2c/wishlist` and item routes; Cart needs actual variant selection                 |
| R04 Cart `191:5689`                                | Cart GET/absolute PUT/clear/merge; Coupon preview where shown                                 |
| R05 checkout `191:6119`                            | Users addresses as prefill + Shipping quote + Coupons + Orders checkout preview               |
| R06 transfer/review `191:6809`; R06-COD `191:8507` | Orders raw proof for InstaPay, then `/b2c/cart/checkout/orders`; COD omits proof              |
| R07 received `191:7291`                            | Orders placement snapshot and action to receipt                                               |
| R07-R receipt `312:3249`                           | Same authorized Order snapshot; browser printing, tracking/shopping actions                   |
| R08 status `191:7697`                              | Orders guest tracking/header or customer own detail; optional authorized proof bytes          |
| R09 history `191:8143`                             | Orders customer-only list/detail                                                              |

Receipt variants: EN mobile `312:3399`, AR desktop `312:3574`, AR mobile `312:3724`. Quantity component `280:116`. Grouped mobile header reference `293:517`.

### Shared public templates, instantiated in each channel

| Screen / root                                   | Contract and responsibility                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A01 sign in `191:8953`                          | Auth login/refresh/logout; public store auth route for customers and staff                           |
| A02 register `191:9329`                         | Auth register; retain typed email because data is null                                               |
| A03 verify `191:9725`                           | Auth verify-email/resend-otp; six-character string; login remains separate                           |
| A04 recovery `191:10077`; A05 reset `191:10429` | Auth forgot/reset; sign in again after reset                                                         |
| A06 profile `191:10797`                         | Users `/users/me` GET/PATCH; editable name/phone, immutable email                                    |
| A07 addresses `191:11209`                       | Users customer address collection/detail operations; no staff address access                         |
| I01 contact `191:11739`                         | Public Site Settings contact links + B2B inquiry destination; no fabricated contact submission API   |
| I02 information `191:12101`                     | Approved static bilingual policy/information content + Site Settings defaults; no arbitrary page CMS |

### Dashboards

| Screen / root                     | App / contracts                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CD-01 overview `191:12467`        | B2C Reports overview; recent staff Orders; admin/superAdmin only                                                                                   |
| BD-01 requests `191:13178`        | B2B Leads list/filter/pagination totals; no report API                                                                                             |
| D01 finance `191:13670`           | B2C Reports finance                                                                                                                                |
| D02 performance `191:14112`       | B2C Reports sales-performance; protected Order/Product navigation where supported                                                                  |
| D03 Products `191:14514`          | B2C Products list; reuse visual list for B2B Wholesale native products/selector with distinct fields and calls                                     |
| D04 retail editor `191:14886`     | B2C Products + Categories + Media + optional chart assignment                                                                                      |
| D05 B2B editor `191:15470`        | B2B Wholesale native products + B2B Media; reused B2C sources stay read-only                                                                       |
| D06 Categories `191:15834`        | B2C Categories list/tree/edit + category Media                                                                                                     |
| D07 Orders `191:16232`            | B2C staff Orders list; all three staff roles                                                                                                       |
| D08 order detail `191:16576`      | Orders detail/private proof/status with expectedStatus                                                                                             |
| D09 Sales/Coupons `191:17060`     | B2C Sales/Coupons lists, selected tab; Coupons-selected `240:11368` is a state                                                                     |
| D10 Sale editor `191:17404`       | Sales + staff Products/Categories selector                                                                                                         |
| D11 Coupon editor `191:17854`     | Coupons + staff Products/Categories selector                                                                                                       |
| D12 shipping/payment `191:18388`  | Shipping override/default routes + Orders `/admin/b2c/orders/settings`; distinct persistence                                                       |
| D13 size charts `191:18790`       | Existing Size Charts numeric table/count/versioned CRUD + Product assignments; retained optional image upload/fallback; explicit publication state |
| D14 Homepage `191:19236`          | Independent Homepage routes per channel, Media lifecycle, B2C Products curation; ambiguous image action requires decision                          |
| D15 accounts `191:19580`          | Users staff list/detail/update; permitted deletion; Auth explicit superAdmin handover                                                              |
| D16 notifications `191:20036`     | Notifications feed/unread-count/read under each admin store root; fetch resource separately                                                        |
| D17 staff profile `191:20352`     | Same-store Users `/users/me`; not staff account-edit endpoint                                                                                      |
| D18 request forms `191:20676`     | B2B Forms list/detail/versioned PATCH                                                                                                              |
| D19 Wholesale `191:21154`         | B2B Wholesale native/reused sources and offer composition/versioned CRUD                                                                           |
| D20 request detail `191:21648`    | B2B Leads staff detail/private images/contacted                                                                                                    |
| D21 store settings `191:21954`    | B2C Site Settings public/admin singleton                                                                                                           |
| D22 business settings `191:22528` | B2B Site Settings independent singleton                                                                                                            |

D21 drawer references `191:23044` and `222:4749` are shell states. Key-state boards on `191:134` apply to the relevant screen contracts: loading, empty, validation, forbidden, conflict, confirmation, expiry and unavailable responses. They do not create extra endpoints/routes. Customer email delivery is internal infrastructure with no frontend delivery-state API; its only frontend responsibility is agreed tracking-route entry and accurate feedback.

## 6. Role acceptance matrix

| Role                  | B2C                                                                                                                                       | B2B                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Guest                 | Browse, Cart, checkout, own token-scoped tracking; sign in to save Wishlist                                                               | Published Forms/offers, draft/submit, own token-scoped tracking                      |
| Confirmed active user | Own profile/addresses/Wishlist/Cart/Orders                                                                                                | Own profile/addresses/Leads; independent identity                                    |
| Moderator             | Orders/proofs/allowed status actions, own Notifications, own profile; landing Orders                                                      | Leads/private images/contacted, own Notifications/profile; landing Requests          |
| Admin                 | Documented catalog/content/accounts/settings/Orders/Reports operations; deletion normally forbidden, Shipping override deletion exception | Documented Forms/native products/offers/content/accounts/settings/Leads; no deletion |
| SuperAdmin            | Above plus eligible deletion and explicit controlled handover                                                                             | Above plus eligible deletion and explicit controlled handover                        |

UI guards aid usability; server authorization decides access. No routine bootstrap/provisioning operation, cross-store identity or Reports access for moderators. On 24 October the owner explicitly requested a staff-creation form while backend support is pending. It is a local review flow only; live creation is disabled until the exact new contract arrives. See [STAFF_ACCOUNT_CREATION_BACKEND_HANDOFF.md](STAFF_ACCOUNT_CREATION_BACKEND_HANDOFF.md). This later decision supersedes the earlier no-create-UI planning restriction without authorizing a guessed endpoint or real account provisioning.

## 7. Confirmed decisions and remaining integration gates

| Decision                     | Evidence, recommendation and consequence                                                                                                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size guides                  | Backend response received/reviewed; numeric tables, shared/individual assignments, counts, null/image compatibility and bounds are documented. Contract blocker resolved. Final D13 publication-control presentation remains a small frontend review detail; real integration awaits configured API. |
| D14 image action             | Recommended named slot/device uploads plus ordered curation accepted. Product gallery changes link to Product editor. No arbitrary copy/nav/layout CMS controls.                                                                                                                                     |
| Reporting and internal notes | Accurate canonical report captions accepted. All Figma development directions, GAP-pending notices and design-preview/sample annotations stay out of real UI across both sites/dashboards; genuine customer help/errors remain.                                                                      |
| App/routes/shared source     | Minimal shared source, separate builds/business rules and logical language/dashboard routing accepted. Final origins, deployment values, cookie compatibility and tracking links await configuration.                                                                                                |
| Private persistence          | Recommended memory JWT, tab-scoped reload recovery, fragment tracking and explicit save/forget behavior accepted; implement and verify during the authorized coding phase.                                                                                                                           |
| Client launch inputs         | Dummy bilingual data/content/mappings authorized for client review, maintained in replaceable fixtures. Real client content remains a launch review, not a reason to block demonstrations or invent live facts.                                                                                      |
| Environment/backend scope    | Use delivered files and the backend developer's follow-ups; API base URL remains intentionally unconfigured. We implement frontend integration only. Pending values block real integration acceptance, not approved fixture work. No guessed server or backend write/setup.                          |
| Public HTML and SEO          | Owner approved pre-rendered public HTML within both Vite apps. Select compatible tooling and verify initial HTML during authorized Phase 1; settle the real-data refresh process against hosting/API information before production acceptance. No unapproved framework/runtime-server change.        |
| Skills                       | Relevant installed skills and find-skills for a demonstrated gap are authorized. Inspect before adding; avoid redundant global skills, speculative packages, external review routing or model changes.                                                                                               |

Any additional unsupported field/control found during full component inspection is recorded with a CURRENT node and exact contract evidence, then paused locally for owner choice. Do not silently remove it, redesign it, implement a client-only fake save or expand backend scope.

## 8. Completion evidence and handoff policy

At each phase: identify completed screens/behaviors and actual checks, attach representative browser evidence, record unresolved decisions and fixture/live status, and stop at the authorized boundary. Before broadening tests, assess changed risk. Reuse unchanged reliable results; do not rerun the large export audit by default.

Pure logic checks cover money/null/zero, dynamic answer shape, actual variant selection, role routing, replay retention, stale-response rejection and Cairo boundaries. Browser checks cover interaction, geometry, forms/navigation, role denial, print and end-to-end flows. Authorized live tests cover server/cookie/storage/concurrency behavior that fixtures cannot establish. Destructive account operations, provisioning, provider/database changes and deployments are not authorized by a frontend test plan.

Current verification: Phase 1 foundation is implemented and Ready for owner review. Both apps build/lint, 13 shared logic tests pass, and the recorded built-browser matrix covers 40 store/language/width/layout cases. Meaningful EN/AR public HTML, hydration and native same-origin refresh locks are verified. See PHASE_1_HANDOFF.md for evidence and exact limits. No live API/provider/database operations or Figma edits were performed. Remaining gates are owner acceptance/next-phase authorization, final client content, actual API/site configuration, live cookie/integration checks, broader public-route content regeneration and final release verification. The size-chart contract mismatch is resolved; pre-rendering, Homepage and privacy approaches are settled.
