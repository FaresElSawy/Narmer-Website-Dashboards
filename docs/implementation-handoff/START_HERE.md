# Narmer: B2B and B2C implementation-session handoff

Prepared 23 October 2026 for the separate coding conversation. Workspace: `D:\Web Projects\Narmer E-Commerce Website`.

## Latest follow-up — read before historical planning questions below

Current execution: Phase 1 is accepted. The owner authorized Phase 2 and subsequently resumed work with permission to use credits if the allowance is exhausted. The Phase 2 frontend is implemented and presented in [PHASE_2_HANDOFF.md](PHASE_2_HANDOFF.md), with Firefox/runtime, real-device and live integration limits recorded. Follow [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) for current status. Phase 3 remains unstarted and requires the owner's next-phase authorization. Planning-only/starter descriptions below are historical and do not undo these approvals.

Phase 1 review feedback: English now uses Poppins, Arabic keeps Cairo, and public dropdowns use a simple standard chevron. The owner permits minor visual defect fixes, relevant installed UI/UX skills and orderly app/shared folders. Their latest correction requires sticking to CURRENT Figma; material design changes must be shown and approved first. These decisions supersede earlier Brice and strict visual-reproduction requirements. They do not alter business contracts or phase review gates.

The owner's next Phase 1 review update adds smooth chevron rotation, desktop hover menus, small-screen/touch tap menus, a brief animated-logo intro for each public website, and purposeful animation as later phases are built. Shared CSS motion rules and the header/loader components are described in [the Phase 1 handoff](PHASE_1_HANDOFF.md). Reduced-motion support, immediate keyboard operation and loading fallbacks remain required; no animation dependency is needed for these effects.

Execution organization: use [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) for all eight numbered phases and review gates. Phase 1 was accepted and Phase 2 authorized on 23 October 2026. Phase 2 is now ready for frontend review with the handoff's external checks still open. The detailed plan uses the same Phase 1–8 numbering.

The updated NEW backend package now contains 43 files and a size-chart-specific response. [The current review](BACKEND_UPDATE_REVIEW_2026-10-23.md) and [updated implementation plan](IMPLEMENTATION_PLAN.md) supersede the older image-only mismatch and unresolved questions in this original handoff. Numeric cm tables, shared/individual Product assignments and real counts are now documented in the existing module. Public sizeChart.image is nullable; numeric-first rendering and legacy image fallback are required. No API route was added. Static package and targeted schema checks passed; live frontend/backend/provider acceptance remains separate.

The owner accepted the Homepage and privacy recommendations, authorized replaceable dummy content for client review, directed that internal Figma build/GAP/preview notes stay out of real UI, and approved public-page pre-rendering while retaining both React/Vite apps. API/site origins and final client content remain pending. We implement frontend and integrate delivered backend contracts only. Refer to the updated plan for these confirmed decisions; do not reopen them from the historical questions below. Coding still waits for the explicit phase execution go-ahead.

## First instruction: plan, then wait

The owner says the design is done and wants a new session dedicated to implementation. This existing conversation remains the design conversation. **Your first task is an implementation plan divided into phases, not coding. Read this handoff and WORKING_RULES.md in full, inspect the actual project and CURRENT Figma, explain your plan and unresolved questions, and wait for the owner's explicit approval before changing application code, dependencies or configuration.**

If anything material is unclear, ask before taking the affected step. This includes design/API conflicts, missing business content, auth/private-token persistence, deployment/routing assumptions and unsupported controls. Do not silently resolve a conflict by redesigning Figma, fabricating an endpoint, changing backend behavior or substituting a framework. Do not reopen settled guest checkout, separate accounts, offline payments, inquiry-only B2B, delivered-ranking definitions or unknown-category policy.

The API base URL is **not configured yet**. Neither a localhost example in an export nor an Apidog variable establishes a usable server. Plan an explicit public environment configuration; do not hard-code a production host, call an assumed server, or show a fake successful integration. Do not put credentials into Vite variables.

## 1. Reading order and source authority

1. This file, [working rules](WORKING_RULES.md), [alignment review and decisions](BACKEND_ALIGNMENT_REVIEW.md), and [file-by-file review ledger](FILE_REVIEW_ORDER.md).
2. `Backend Files/New Backend Files/README.md` first, then `backend-response.md`, then `api-conventions.md`.
3. `b2c-flow.md` and `b2b-flow.md`, followed by the relevant `modules/*_FRONTEND.md` contracts and their linked caller modules. Before implementing a slice, read its full module—not merely this summary. The delivered files specify exact requests, responses, nullable/omitted fields, bounds, ownership, versions, errors and next-call handoffs.
4. `integration-readiness.md`, `handoff-audit.md`, `documentation-audit.md`, reference architecture/security and `api/README.md`. The read ledger inventories every delivered file. JSON/JSONL and generated OpenAPI/Postman exports were parsed and checked programmatically, not visually inspected as hundreds of thousands of lines.
5. `DESIGN_SOURCE_OF_TRUTH.md`, CURRENT Figma pages and component subtrees, latest targeted QA records, then the actual app files and available assets.

Authority is divided deliberately:

- Latest owner decisions govern product scope and approvals. This request authorizes implementation planning, not immediate coding.
- **CURRENT Figma governs appearance and responsive/RTL intent.** BACKUP pages and older PDF/PNG exports do not.
- **New Backend Files governs available API behavior.** Old Backend Files and `docs/NARMER_BACKEND_DEVELOPER_HANDOFF.md` are historical comparison/request documents. The old FE handoff proposed five extension gaps; the new backend response says all five are implemented. Do not recreate them or copy its proposed schemas as current truth.
- If the latest exact module and a design disagree, preserve both and ask. If a historical introduction says pending but its final October 22 module/checkpoint says implemented, use the current module and record the historical qualifier. If genuinely conflicting current sources remain, ask instead of guessing.
- Backend architecture mentions `server/` and a future `client/`; those are provenance from another repository, not instructions to relocate our two existing apps. Backend implementation source is not in these delivered packages. The frontend cannot independently certify the backend tests or database from documentation.

Focused companion reviews: [commerce](commerce-review.md), [B2B and identity](b2b-identity-review.md), [shared modules](shared-modules-review.md), [packaging/references](packaging-reference-review.md). Main review corrected speculative questions in agent reports; the alignment/decision document governs remaining questions.

## 2. Actual app state and technical constraints

There are two existing separate JavaScript React/Vite apps:

| App                              | Directory     | Inspected state                                                         |
| -------------------------------- | ------------- | ----------------------------------------------------------------------- |
| B2C storefront and its dashboard | `B2C-Website` | Vite starter `src/App.jsx`; no implemented Narmer routes or integration |
| B2B website and its dashboard    | `B2B-Website` | Vite starter `src/App.jsx`; no implemented Narmer routes or integration |

Both package files specify React/React DOM `^19.2.8`, Vite `^8.3.0`, React Vite plugin `^6.1.1`, and Oxlint. Both use `type: module`, `.jsx`/CSS and `dev`, `build`, `lint`, `preview` scripts. Their Vite configs currently contain only the React plugin. **Tailwind is required by the owner but not yet installed/configured.** A router, i18n, chart/date libraries and test tools are not currently app dependencies; propose only what the confirmed requirements actually need. Do not upgrade existing versions or migrate to TypeScript/Next.js without a reason and approval.

Retain app/module responsibilities. Sharing genuinely identical behavior is useful; do not merge B2C commerce and B2B inquiry rules or create a generic multi-tenant framework. The phase plan should propose how auth/API primitives, branding and controls are reused across separate builds without speculative packaging. No implementation architecture has been approved yet.

The workspace root has no Git repository at the time of review. Do not initialize one, assume diff availability, or destroy files as cleanup. Preserve provided documentation, assets, old design backups and backend packages. Normal implementation later may replace starter UI, but only after the plan is approved.

## 3. Approved Figma: new designs only

File key: `sv4mjHZis8FDpvEMsrAJWM`.

Website master: [CURRENT CW-01 MIX](https://www.figma.com/design/sv4mjHZis8FDpvEMsrAJWM/Narmer-UI-Design?node-id=191-651). Dashboard master: [CURRENT CD-01 Apple](https://www.figma.com/design/sv4mjHZis8FDpvEMsrAJWM/Narmer-UI-Design?node-id=191-12467).

These exact masters and page names were read live on 23 October. **Do not use old Apple-only experiments, earlier CW/CD source copies, BACKUP styling, or the first design.** The older versions are preserved only so scope/content is not forgotten. Local `Narmer UI Design/B2B` and `/B2C` exports predate the latest corrections and are not automatically current.

| Current page                            | Page ID   | Role                                                            |
| --------------------------------------- | --------- | --------------------------------------------------------------- |
| 10 - CURRENT · Start here               | `191:127` | Start guide (`200:2`)                                           |
| 11 - CURRENT · Website masters          | `191:128` | Approved public visual direction, home/navigation/menu examples |
| 12 - CURRENT · B2B templates            | `191:129` | B2B screens                                                     |
| 13 - CURRENT · B2C templates            | `191:130` | Retail screens and new receipts                                 |
| 14 - CURRENT · Shared website templates | `191:131` | Auth, profile, addresses, contact and information               |
| 15 - CURRENT · Dashboard masters        | `191:132` | CD-01 B2C overview and BD-01 B2B requests                       |
| 16 - CURRENT · Dashboard templates      | `191:133` | Operational/admin screens and selected states                   |
| 17 - CURRENT · Key states               | `191:134` | Feedback, errors, empty/confirmation/navigation states          |
| 18 - CURRENT · Components and tokens    | `192:127` | Reusable foundations; cart quantity component `280:116`         |

Every page whose name starts `BACKUP` is historical. Do not delete it or reference it for the implemented visual system. Do not rerun the historical `docs/design-work/*.figma.js` migration/repair scripts: they are operation journals, not code generators for this application.

Main current inventory is 275 screen/state variants including English/Arabic and desktop/mobile, plus one separate approved mobile-header reference (`293:517`) = 276 including that reference. They are not 275 separate application routes. English desktop alone has 32 public/shared screens, 25 dashboard screens/states and 10 key-state boards = 67. Reuse templates and states rather than building one route per Figma frame. The older manifest's detailed inventory retains a 263-frame baseline; latest additions and targeted records supplement it.

### Important exact references

- B2C home EN desktop/mobile: `191:651`, `191:806`; AR desktop/mobile: `191:958`, `191:1077`.
- B2B home EN desktop: `191:135`; other variants are named CURRENT BW-01 on Website masters.
- B2C dashboard overview EN desktop/mobile: `191:12467`, `191:12685`; AR: `191:12813`, `191:13050`.
- B2B requests dashboard EN desktop/mobile: `191:13178`, `191:13349`; AR: `191:13424`, `191:13595`.
- Settings mobile drawer EN/AR: `191:23044`, `222:4749`.
- Cart EN desktop/mobile: `191:5689`, `191:5780`; AR: `191:5904`, `191:5995`.
- Thank-you EN desktop/mobile: `191:7291`, `191:7376`; AR: `191:7494`, `191:7579`.
- **New R07-R receipt** EN desktop/mobile: `312:3249`, `312:3399`; AR: `312:3574`, `312:3724`. Do not omit this screen.
- Numeric size-chart screen needing a backend decision: D13 EN desktop/mobile `191:18790`, `191:18946`; AR `191:19013`, `191:19169`. This conflict was verified in CURRENT Figma on 23 October.

Read current frames/components with the Figma connector during planning and implementation. A reference screenshot or generated CSS is not a replacement for understanding layout, variants and interactions. Use current skill prerequisites and safe fallbacks. Report any access failure exactly; do not fall back silently to old designs.

## 4. Branding and visual rules

- Public sites: approved CW-01 MIX combines the original fashion/brand character with the refined Apple-inspired hierarchy and spacing. Navy `#073B50`, gold `#BF8D34`, white and pale brand-tinted surfaces. Read actual Figma tokens instead of introducing a palette from an older PDF. Supplied original brand material has earlier colors; the later approved CURRENT UI is authoritative for interface styling.
- Preserve large art-directed imagery, rounded image framing, clean product cards, full-image men's/women's collection panels with legible overlay titles/actions, and the approved image-backed factory story. The prior plain two-column story and discarded yellow collection-title treatment are not the approved direction.
- Dashboards: CD-01 Apple-inspired clean pale-navy workspace, restrained white panels, navy sidebar with white logo/text/icons and gold accent. B2B uses the same system but different options. No booking module, booking policy, arbitrary salon behavior, or copied Nailed It contact information.
- Assets: `Files/Logo-Navy.png`, `Logo-White.png`, `Logo-Gold.png`, `Logo-Black.png`; supplied product photos under `Files/Products Images`; representative B2B imagery under `Files/AI Generated/B2B`. Inspect aspect ratio, transparency and crop/focal point; do not stretch images or portray generated stock as verified photographs of the client's real factory.
- Fonts: supplied Brice `.woff2` families in `Files/Fonts` are the requested final English font; Cairo `.woff2` is Arabic. Connected Figma English previews use Inter because Brice was unavailable there, following the temporary preview history. This is not approval to replace Brice permanently. Include typography validation in the plan; ask if any final font/weight use is unclear, and check wrapping/alignment when replacing preview typography.
- `Files/Narmer Brand Guideline.pdf` is context; `Files/Logo Options (Ignore).ai` is explicitly not a logo source to adopt. Do not recreate logos with text.
- All paired cards/media and aligned actions preserve their intended ratios and shared edges; use auto/content layout, not brittle fixed heights or floating buttons. The approved design is a system, not independently restyled pages.

### Mobile, RTL and latest fixes that must survive coding

1. No full horizontal desktop navbar on mobile. EN logo stays far left, mobile menu far right; AR mirrors. Language lives inside the mobile menu, not as a floating header link.
2. B2C mobile utilities form one trailing group: EN account, wishlist, cart, menu; AR physically mirrored. **All three gaps are 6 px** and each touch target is 44 × 44 px. Reference group width is 194 px on the 390 px designs. Preserve touch targets; make small-width layouts fit without overflow. These four controls do not belong spread across the center.
3. B2B desktop request CTA and language are adjacent in the trailing group, mirrored in Arabic. B2B mobile uses logo/menu, not a copied B2C shopping utility bar.
4. New Arrivals EN title at leading left, collection action at trailing right; AR title far right/action far left. Title/action share vertical center. Approved Arabic title is `أحدث المنتجات`; product action `عرض المنتج`, collection action `تسوّق المجموعة`. Preserve the current plain underlined link treatment, not the discarded inconsistent mobile/Arabic pills.
5. Dashboard logo centered in the sidebar's actual available width, white on navy. Language and logout at the bottom of sidebar/drawer; not in the top bar. Bell centered in its circle; profile initial centered geometrically and optically, including Arabic `م`. Do not assume a CSS text bounding box guarantees visual glyph centering.
6. Centered EN buttons remain centered in Arabic. Mirror layout, not every text alignment. Form/body labels are directional; sizes, codes, URLs and EGP values need deliberate LTR islands. Preserve full subtree font/direction behavior.
7. Desktop tables become labelled mobile cards/rows. Every number/status needs its corresponding label; no bare quantity/size/stock/source values or empty oversized boxes. Wholesale composition shows variant, pieces, selection and source. Size chart behavior awaits the image-vs-measurement decision.
8. Mobile order timelines use equal cells, consistent centers/heights, and intentional number/status wrapping. Handle canceled/returned states as well as the normal four-step progress; no squashed or floating statuses.
9. Follow-up panels hug content; View submitted must be fully visible. Do not clip buttons inside fixed-height cards.
10. Dashboard creation actions are compact and trailing in desktop toolbars (EN right, AR left), aligned with filter/search controls. Sales/Coupons has two tabs and one context-appropriate creation action, not four competing buttons. Editor type and selected list must agree.
11. Cart Continue shopping and Continue to checkout share a desktop row/alignment; mobile groups actions sensibly. Compact quantity input has increase/decrease arrows and space for a normal two-digit preview. **That is not a 99-item business limit**: Cart allows up to 10,000 subject to stock; support valid values without clipping or silently truncating.
12. Build keyboard/focus/disabled/loading/error/empty states and mobile menus as functioning UI. Figma fixes are designs, not implemented application behavior.

Evidence: `docs/design-work/approved-v2/parity-correction/MOBILE_AND_CART_CORRECTIONS.md`, `mobile-header-six-px-rollout.json`, `order-receipt-qa.json`. Earlier blocked-connector reports and 263-frame audits are historical, not proof of current implementation or full-browser acceptance.

## 5. B2C complete customer flow

### Browse, select and save

Load public Site Settings/Homepage/Categories and Products with `X-Language`. Homepage has six fixed image overrides and ordered New Arrivals/Sale product selections. Use actual returned order; hide an empty curated section and its Sale feature if part of that section, but do not clear saved configuration. Mobile image fallback is mobile override, desktop override, approved local fallback. Null API images are not invented URLs. Men/Women navigation must map to real configured category IDs; client-review menu placeholders are not seeded categories.

Products supports documented category/type, integer-piastre min/max price, stable `size`/`color` key, Sale-only filters and supported sorts; `/products/facets` supplies filter choices/counts. Do not invent full-text search or arbitrary query keys. A filtered variant must meet all conditions on one real variant. List-only `matchingPrice` and `matchingVariantId` are browse hints—not a chosen Cart variant or trusted price. Keep page/filter/language state, reset pagination when filters change and discard stale responses.

Open product by actual ID, not an assumed slug endpoint. A simple product has its price/stock; a variant product requires a returned matching variant ID from the actual selected option/value keys. Do not generate nonexistent combinations. Handle unavailable products, empty galleries, sold-out options and valid zero prices. Size guides are optional display content, not sellable variants; image-only backend versus numeric Figma is unresolved.

Wishlist is B2C active confirmed customer-only, product-level, up to 100 entries. Guests can shop but cannot persist server Wishlist. A guest heart should follow the approved sign-in interaction rather than invent guest Wishlist APIs. Adding a saved variant product to Cart still requires variant selection. Unavailable saved entries remain removable. Login does not retroactively attach guest orders by matching email.

### Accounts and cart

Signup is optional: register -> verify email OTP -> login. Register/verify return `data:null`, so retain the input email; verification does not log in. Recovery is forgot-password -> reset with OTP -> login again. OTP is a six-character digit string, not a number. Preserve zeroes. No social/SMS login exists.

Guests use the HttpOnly Cart cookie with credentialed requests and no Authorization header. Confirmed B2C `user` accounts use their B2C bearer; staff cannot shop with staff credentials. `GET /b2c/cart` creates a missing Cart and returns a complete empty DTO, not null. Quantity PUT sends absolute `(productId, optional variantId, quantity)`; 0 removes that line. Replace displayed Cart from response; itemCount counts pieces. No reservation occurs. An unavailable line may make subtotal null; null is not zero. Guest retention is 30 days, renewed by successful item writes, not existing unexpired GETs.

After successful customer login, explicitly merge guest into account Cart with bearer, cookie/credentials and allowed Origin. Login alone does not merge. Combined quantities and stock are checked atomically; failure preserves both carts. Do not discard guest state on conflict or merge after staff login. Logout does not erase the account Cart.

### Checkout, payment and order placement

1. Collect explicit customer name/email/phone and address governorateCode, governorate label, district, building and street. Floor/apartment/details are optional as documented. Saved addresses prefill editable fields; do not submit addressId instead of the required snapshot. The Shipping override list is not a full governorate directory. Ask for approved destination code/label mapping rather than guessing it from free text.
2. Optional coupon preview uses the current Cart identity and intended checkout phone. Send code/phone to its exact endpoint. It does not save the code, consume usage, reserve stock or include shipping in merchandise discount eligibility. Active Sale lines are excluded; a saved product discount without an active Sale can remain eligible.
3. POST `/api/v1/b2c/cart/checkout` with documented contact/address/payment method and optional couponCode only. Retain checkoutId/expiresAt and quote. It expires after 24 hours for first placement/upload; no stock reservation or price lock. Money is calculated by the backend.
4. COD skips transfer/proof entirely. InstaPay uses the quote's receivingAccount and total, then uploads one raw JPEG/PNG/WebP proof to `/cart/checkout/:checkoutId/proof`. Retain proofId; no public URL. An image upload is not bank payment verification. Receiving-account null disables new InstaPay previews.
5. POST `/api/v1/b2c/cart/checkout/orders` with checkoutId, plus proofId only for InstaPay. Preserve the original owner and exact input on uncertain response. Same owner/checkout/proof replays the committed order; a changed proof conflicts. Do not create another checkout on timeout before reconciliation. Upload/preview itself is not generically idempotent.
6. Placement revalidates selection, prices, shipping/coupon and stock; atomically deducts stock, consumes coupon use, attaches proof, creates pending Order and removes Cart data. Acceptance does not deduct stock again. Actual placed amounts are authoritative snapshots; offline transfer discrepancies require staff handling.
7. Display the acknowledgment and receipt immediately, independent of email arrival. Read Cart again for fresh empty state. For guests retain the first non-null orderId/token/expiry privately; a successful replay may return null token after server secret rotation. Do not overwrite a valid retained token with null.

### Receipt, tracking and order history

Checkout progress is **Details -> Review -> Receipt**. R07 is the thank-you acknowledgment within step 3; its View order receipt action opens **R07-R**. This is not a fourth checkout step. The dedicated receipt includes date/reference, contact/delivery, item selections/quantities/unit prices/line totals, discount/shipping/grand total, payment-review status, Print/Save PDF, tracking and shopping actions. Include both COD/InstaPay text states even though the current new visual example is InstaPay.

Receipt data comes from `placement.data.order` or authorized detail/tracking; later detail's Order is directly `data`, not `data.order`. `#2054` is an illustrative design reference; the API supplies `id`, not an established `orderNumber` field. Never invent that response property. Browser print/save PDF is the proposed native implementation path; no receipt-PDF/invoice backend endpoint exists. Do not print private tracking credentials or claim this is a tax invoice or settled payment receipt.

Guest order tracking uses ID plus `X-Order-Token` for the original 90 days. A frontend link can carry the token in a fragment, then consume it into a header; never leak it into API query strings, analytics or public HTML/exports. Signed-in buyers use own-order list/detail; old guest orders do not attach by email or login. Private proof GET returns WebP bytes: fetch with authorization, create a temporary Blob URL, revoke it, never place it in a public image cache.

No customer order cancel, proof replacement, order editing/deletion, automated refund, bank verification, or lost-link recovery route exists. Preserve history/snapshots even if products/categories later change.

## 6. B2B complete visitor and staff flow

B2B is inquiry/Lead collection followed up offline, **not ecommerce checkout**. No B2B price/stock/SKU/Sale/coupon/shipping/payment/order system is added. Services are stable form types `spinning`, `weaving`, `fabric`, `school-uniforms`, `wholesale`. They share service/detail/request templates, but each renders its own published definition and questions.

1. Browse the branded home/services and Wholesale collection. Four collection images retain consistent dimensions/aspect ratios; representative imagery reflects business services, not unrelated retail hero styling or verified factory claims. The manufacturing introduction includes meaningful content and a reachable form, not an empty spacer.
2. Read published Forms list/detail. All five definitions start unpublished and questionnaires are not client content. Render the server's localized fixed fields and supported configurable question types/constraints in order; keep exact type/version/field/choice keys. Fixed contact: required name/phone/governorate/district, optional email. Do not force B2C shipping address fields or make email mandatory. Configurable types are text, textarea, number, select, multiselect and boolean; 0/false are valid values, not missing answers.
3. Wholesale additionally reads published offers. Offer sources are either native simple B2B-only products or deliberate read-only references to visible B2C products/variants. An offer has a staff-defined fixed composition and piecesPerPouch. Visitors choose whole pouch quantities, not custom size/color mixes; 1–10 distinct offers, each 1–10,000 pouches. No retail stock reservation/deduction or payable total. Native B2B products never become retail products automatically.
4. Create a private draft for formType. Retain draftId/draftToken/expiresAt (24 hours). Draft stores upload state, not a server-saved contact/answers form; retain entered input separately. Keep guest/account ownership fixed. Send `X-Lead-Draft-Token` for draft read/upload/submission. A guest omits bearer; an optional bearer must be an active confirmed B2B customer, not a staff or B2C token.
5. Optional private images: up to five successful/in-flight files, one raw JPEG/PNG/WebP per request, max 5 MiB each. Keep local previews; no customer public image URL. A lost upload response requires draft GET reconciliation instead of blind reupload. Omit unwanted ready image IDs when submitting; no per-image draft DELETE endpoint exists.
6. Review then submit exact formVersion/contact/answers/imageIds, with offer ID/version/quantity for wholesale only, plus draftId/secret and same owner. First creation is 201; identical normalized replay is 200. Retain exact payload and credential until receipt is safe. On pre-commit version/offer conflict refresh and ask visitor to review changes, preserving compatible input. Do not create another Lead after uncertain success.
7. Show receipt immediately. Guest has a separate 90-day `X-Lead-Token`; registered B2B user uses own-lead reads. Never substitute draftToken for trackingToken or transfer guest submissions by matching email. Customer/tracking DTO exposes imageCount only; private image IDs/bytes remain staff-only. Status is submitted -> contacted; no customer cancel/edit/delete or online quotation workflow.
8. Staff same-store superAdmin/admin/moderator reads historical Lead snapshots, authorized private WebP images and marks contacted only after offline follow-up. Contact acknowledgment is separate from notification read state. No assignment, notes, accepted/rejected fulfillment, quote engine or Lead deletion route exists.

Staff Forms editing is superAdmin/admin-only, retains bilingual labels and stable keys, replaces configurable fields as documented and requires latest version. Actual bilingual questionnaires, own-material requirements and published launch services need client configuration/confirmation; do not promote synthetic examples into production.

Wholesale staff chooses immutable sourceStore/productId on offer creation and a fixed composition. Native/simple has one null-variant composition line; reused variants have explicit variant IDs/piece counts. Offers default unpublished. B2B staff cannot mutate B2C products/media using their B2B token. Saved offers/history can protect product/variant/offer deletion; use deactivation where appropriate.

## 7. Dashboards, permissions and reporting

Use the same approved dashboard system for both channels, not the same unauthorized feature list. Stored roles are `superAdmin`, `admin`, `moderator`, `user`; guest is not a stored role. Login is the corresponding store's public Auth endpoint for staff and customers—no invented `/admin/auth/login`.

| Role       | B2C                                                                                                                  | B2B                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| superAdmin | Full implemented admin capabilities; eligible deletion and controlled handover                                       | Full implemented business-admin capabilities; eligible deletion/handover                              |
| admin      | Manage catalog, settings, Sales/Coupons, reports and Orders; normally no deletion, except Shipping override deletion | Manage forms/native catalog/offers/settings and Leads; no deletion                                    |
| moderator  | Orders/proofs/allowed status updates and own notification state; **no reports/catalog/accounts/settings**            | Read Leads/private images, mark contacted, own notification state; no forms/catalog/accounts/settings |
| user       | Own customer profile/addresses/cart/wishlist/orders                                                                  | Own profile/addresses/leads, with separate B2B identity                                               |

One active assigned superAdmin per store after operator provisioning. Do not run provisioning or handover as routine frontend setup. Existing accounts can be promoted/blocked through authorized Users edits; there is no dashboard account-create endpoint. Staff edits can invalidate the target's sessions, including self-edits through staff routes. Deleted accounts have no restore API; treat destructive actions accordingly.

B2C operational scope includes overview, revenue/finance, sales performance, Orders/detail, Products/simple/variant editor, Categories, Sales/Coupons tabs/editors, size guides after decision, Homepage, Shipping/payment settings, Accounts, Notifications, staff profile, Site Settings. B2B includes Requests/detail/contact, Forms configuration, native Products/offer editors, read-only B2C selector, Wholesale composition, Accounts/Notifications/profile and independent Homepage/Site Settings. Reusable Figma templates do not imply that every role sees every menu item.

Order state graph: pending -> accepted -> shipped -> delivered; staff cancel from pending/accepted; staff return only from delivered. Six statuses include canceled/returned. Send current expectedStatus with writes; refresh on conflict. InstaPay acceptance records manual verification; COD delivery records collection. Cancel/return restores stock once and creates an offline refund marker, not a real money transfer. Coupon use stays consumed.

### Analytics definitions are settled, not sample Figma numbers

Three B2C-only superAdmin/admin GET endpoints: reports/overview, /finance and /sales-performance. Moderators default to an authorized operational landing page, not the report overview. B2B has no Reports endpoint; its request totals must use supported Lead reads/filters/pagination counts if included, not invented commerce analytics or the count of one loaded page.

- Required `from` inclusive / `to` exclusive offset timestamps, maximum 366 elapsed days; timezone Africa/Cairo only; day/week/month intervals. Do not hard-code UTC+2 or add 24 hours across Cairo DST. Use returned bucketStart/bucketEnd, including zero/partial buckets and Monday weeks.
- Overview tiles are placed Orders/units/value across statuses, not generic collected revenue. Top products and performance count **currently delivered orders by placement date**. Returns remove historical delivered rankings when refreshed.
- Finance separates placement snapshot amounts, InstaPay verification/COD collection markers by event time, and offline refund markers by refund.at. No profit, net cash, settled refunds, expenses or bank balance is supplied; do not calculate a misleading substitute.
- Product rankings aggregate variants; category attribution is the captured direct category only, without ancestor rollup. Legacy `category:null` remains a localized Unknown category; never reconstruct it from today's catalog. Current product slug/image decoration can be null.
- Preserve filters on error, clear stale responses, share cached screen state and respect the additional 30 requests/minute per-account report budget. No CSV/export/comparison-period/report-write endpoint. Backend overflow/busy states require unavailable/retry UI, not approximate money.

Reporting labels/help in the design may require owner-reviewed wording to match these exact definitions, but the definitions themselves are already confirmed in backend-response.md.

## 8. Shared transport and editing essentials

Prefixes are `/api/v1/b2c`, `/api/v1/b2b`, `/api/v1/admin/b2c`, `/api/v1/admin/b2b`. Include `/api/v1` exactly once. API origin is still an open deployment value. Use normal JSON except documented raw binary uploads; never replace them with multipart/base64. Private reads return bytes, with JSON errors on failures.

Success envelope always has success/code/message/data/requestId; errors have success:false/code/message/errors/requestId and no data. Map nested field error paths; branch on stable codes, not translated messages. `data:null`, arrays, `items/pagination`, placement `{order,...}` and public/staff projections differ by endpoint. Public labels are localized strings; editors require bilingual objects. IDs are real `id` ObjectIds; slugs, variant keys and media IDs have different purposes. Unknown/omitted/null fields follow each module, not one generic clearing policy.

All money is safe integer EGP piastres; convert EGP input to piastres, display by dividing by 100. Preserve null versus valid zero; do not trust client totals. Use exact server values and proportionate arithmetic tests. Products min/max filters use piastres on the wire; do not ask again merely because the UI displays EGP.

Auth access JWT expires in 15 minutes; refresh/session has a fixed maximum 7 days and rotates once. Keep tokens separate by store. Browser refresh cookies are HttpOnly/SameSite=Lax/Secure in production; `credentials:include` and exact allowed Origin/CORS are necessary but do not overcome cross-site cookie restrictions. Serialize refresh per store and shared-cookie tabs, retry a protected read once where appropriate, then clear session on failure. A 403 or 429 is not a reason for a refresh loop. No frontend can manually read the refresh cookie from Apidog's tester variables.

API IP 240/min and authenticated account 120/min apply alongside module-specific budgets. Respect Retry-After; pause background polls on hidden/logout/error/429, preserve input/upload IDs/draft or checkout credentials, and use endpoint-specific recovery. Do not blindly retry single-use OTP/refresh, generic creates, uploads or optimistic PATCH. Product/Form/Offer/SizeChart/Homepage/SiteSettings versions are distinct; Categories/Shipping/Sales do not acquire invented versions. Do not overwrite versioned edits after refetch without human reconciliation.

Public media uploads return target-bound `{id,url,width,height}`; upload is separate from attachment. Product/category, size-chart language and homepage slot/device uploads have different routes/ownership. Ready assets generally expire after 24 hours. Do not reuse a public Media ID for private proof/Lead images. Fetch private bytes with authorized requests and revoke Blob URLs. Do not expose private data in shared caches or logs.

Notifications have one shared store arrival feed and private per-staff read state; reading does not transition the Order or contact a Lead. There is no Web Push, mark-all/delete, customer feed or email-delivery API. A visible poll around 30 seconds is a suggestion, not required constant traffic. Customer event emails are backend-owned and depend on configured SMTP and frontend tracking URL templates; recorded templates were blank at the package checkpoint. Those observations may change—do not claim current delivery without checking with operations. Auth OTP email is separate.

## 9. Site content and settings limits

Separate B2C/B2B Site Settings edit public phone/email, bilingual address/default SEO title/description, map, Instagram/WhatsApp/TikTok/**Facebook**, shared keywords and current version. Use verified Narmer values only; screenshot sample salon URLs were field references, not Narmer facts. No booking policy. Public null contacts/empty fields should not produce broken actions. Admin PATCH merges recognized translations and publishes immediately; URL host/clearing rules are in the module. This is not arbitrary per-page CMS, User profile editing, payment account settings or homepage media.

Homepage editor is fixed by `allowedSlots`, not a section/page builder. B2C keys: hero-left, hero-right, collection-men, collection-women, sale-feature, factory-story. B2B keys: hero, service-spinning, service-weaving, service-fabric, service-school-uniforms, service-wholesale, wholesale-overview. Each has dedicated desktop/mobile image attachment and bilingual alt. B2C New Arrivals/Sale arrays are full ordered selections of up to 20 Product IDs. Do not edit arbitrary copy/navigation/section visibility/layout through nonexistent APIs. Source image selection and catalog cards are separate. Identify any broader Figma editor controls for owner clarification before coding them.

## 10. Phased plan to present for approval

This is a suggested order, not an approved implementation architecture. The owner previously prioritized B2B. Present scope/dependencies, estimated relative effort, deliverables and checks for each phase, plus questions, before proceeding:

0. **Discovery and approval gate:** current app/assets/Figma and endpoint matrix, route/screen-role inventory, conflicts, configuration, token/privacy strategy, missing content and phase plan. Ask unresolved questions and wait. No code.
1. **Foundation:** approved Tailwind/config setup in existing apps, brand/fonts/tokens, bilingual routing/localization, reusable controls, responsive public/dashboard shells, safe environment/API/auth/error primitives. Choose only needed dependencies with reasons. Validate representative EN/AR desktop/mobile screens against current masters.
2. **B2B priority slice:** public home/services/Wholesale, dynamic forms/draft images/review/receipt/tracking and account paths. Then staff Requests/detail/contact/notifications, Forms and native/reused product/offer management, settings/homepage. Use documented states when forms/offers are unpublished or private storage unavailable.
3. **B2C public and accounts:** home/curation, category/filter/facet collection, product/variant/guide, auth/profile/addresses, Wishlist and Cart/merge. Preserve layout and RTL parity, real availability, quantity and unavailable-line behavior.
4. **B2C checkout and history:** coupon preview, destination/shipping, COD/InstaPay quote/proof, exact placement retry, thank-you/receipt/browser print, guest/account tracking/history and privacy. Requires real origin/cookie/API acceptance for integrated claims.
5. **B2C dashboard:** Orders/proofs/status/refund-marker explanations; catalog/category/variant/media, Sales/Coupons, size guides after approved decision, content/settings/Shipping/InstaPay, accounts/notifications/profile; then report screens with canonical metrics and Cairo intervals. Enforce role-based landing/navigation and server errors.
6. **Integration and release-readiness:** approved real backend environment, cross-store/auth/cookies/OTP/Cart merge/stock & coupon conflicts, upload/private image flows, guest expiry/replay, settings versions/public refresh, analytics boundaries, EN/AR responsive/browser/keyboard/accessibility/performance checks, build/lint/tests and documented gaps. Deployment is a separate authorization, not an automatic phase action.

Each phase needs acceptance criteria and evidence, not only a checklist of components. The plan should distinguish what can be developed with clearly labelled fixtures from what is blocked on API origin/provider/client data. Do not invent runtime success because a screen renders. The owner decides whether approval covers the whole plan or phase-by-phase execution.

## 11. Immediate questions to carry into planning

Ask before the affected work; do not flood the owner with settled or speculative choices:

1. **Size chart conflict:** keep the approved numeric editor by requesting a backend extension, or approve an image-upload guide/editor adapted in the same visual system? Backend currently supports images only and returns no assignment count. Do not decide silently.
2. **API/deployment setup:** actual development/staging origin, allowed frontend origins/site arrangement, tracking route templates and test accounts/provider readiness. The API base URL is intentionally still unconfigured.
3. **Client content/configuration:** approved bilingual B2B questionnaires/own-material rules, active launch forms/offers, actual catalog/category/destination mappings, contact/social/policies and available fallback images. Do not replace missing facts with plausible data.
4. **Frontend architecture/privacy details not yet approved:** channel route/deployment arrangement, where the dashboards mount, and secure behavior for guest draft/tracking persistence on refresh/shared devices. Propose the minimum compatible approach with tradeoffs and ask approval rather than writing it first.
5. **Design-only controls:** identify any homepage CMS, reporting label, size-guide or count/control that exceeds the current API. Show precise evidence and request a choice. Do not implement a mock as if it were supported.

Use WORKING_RULES.md for the complete subagent/model/skill/Windows/frontend-quality rules. The main model remains responsible for integration and verification. Do not have agents code before this plan gate or create unrelated chats.
