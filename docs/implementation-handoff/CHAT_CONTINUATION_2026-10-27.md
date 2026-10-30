# Narmer - continuation record for the next chat

Prepared 27 October 2026 at the owner's explicit request to continue in a new chat in the same project. This is a decision and correction record, not a new implementation plan or authorization for another phase.

## Read first and preserve continuity

1. Read this entire record, `IMPLEMENTATION_TRACKER.md`, `PHASE_6_HANDOFF.md` and `WORKING_RULES.md`.
2. Read Phase 4 and Phase 5 handoffs for accepted shopping/account/checkout behavior, then Phase 2/3 handoffs and latest progress notes for B2B/shared details when working there.
3. Use `IMPLEMENTATION_PLAN.md` for phase scope. Read the exact current backend module and affected code before each implementation change. Use the CURRENT Figma source lock for appearance.
4. Some `START_HERE.md` and early working-rule paragraphs describe initial planning, starter apps, missing Tailwind or a need to approve the first plan. Those are historical. The apps now exist, Tailwind/router/shared components are installed, phases 1-5 are accepted and phase 6 is implemented. Do not restart planning or reinstall the project because an old document says it has not been built.
5. This record supplements current project instructions. The latest direct owner instruction and higher-priority instructions always govern. Resolve genuinely new business ambiguities; do not ask the owner to repeat settled decisions below.

Exact conversation provenance: original Codex chat ID `01a16580-4703-7391-af11-425ddc8d8794`, last titled `Narmer - Phase 6 dashboard implementation`, host `local`. When exact wording, an old screenshot reference or a question/answer is needed, use the app's `read_thread` tool with that ID, bounded outputs and pagination cursors. Do not reload the full history on every change. The decision index below captures the actionable history; it is not a verbatim transcript of every message.

## Current state and authorization

- Workspace: `D:\Web Projects\Narmer E-Commerce Website`. Project: `Narmer Websites`, local project ID `e976b698-bd00-44c8-af6a-51847385d052`.
- Two separate JavaScript React/Vite/Tailwind applications: `B2C-Website` and `B2B-Website`; genuinely common UI/account/session utilities under `shared/`. Preserve these boundaries. The workspace is not a Git repository. Do not initialize Git or invent a branch/commit status.
- Phases 1-5 are accepted. Phase 6 was completed and locally reviewed on 27 October and is **Ready for owner review**, not Accepted. The owner has not authorized Phase 7.
- Phase 6: operational B2C dashboard, Orders/private proof/status, Products/variants/media, Categories, numeric Size Charts, Sales/Coupons, Shipping/default/receiving instructions, Homepage curation/images, Settings, Accounts, Staff Profile and Notifications.
- Phase 7: Overview, Analytics/Performance and Finance. The owner explicitly asked and was told these three belong to Phase 7. Their absence from the current operations navigation is intentional.
- Phase 8: integrated live verification/release readiness, remaining provider/device/hosting acceptance. Deployment needs separate authorization.
- Immediate next activity: receive the owner's Phase 6 manual review corrections, preserve accepted behavior and update the tracker after each completed batch. Do not start Phase 7 merely because a fresh chat was created.
- The owner sends edits while reviewing so they do not forget. Treat subsequent messages as additions to the active batch, unless explicitly canceled/replaced. Maintain a checklist, handle related fixes at the responsible shared layer, finish and verify each, and report remaining items. Do not drop earlier edits when another message arrives.
- An explicit pause means stop implementation/tools for that work. Resume only after explicit continuation. A question about status/time/network does not cancel the task or mean pause.
- Give bounded ETAs when asked; explain remaining work plainly. Do not imply automatic tests are owner acceptance. Update the tracker before declaring a phase ready.

## Local servers and review versus live integration

Last action on 27 October: restarted both preview servers and confirmed HTTP 200 for all four routes:

| Area          | URL                                       |
| ------------- | ----------------------------------------- |
| B2C website   | http://127.0.0.1:5283/en                  |
| B2C dashboard | http://127.0.0.1:5283/en/dashboard/orders |
| B2B website   | http://127.0.0.1:5284/en                  |
| B2B dashboard | http://127.0.0.1:5284/en/dashboard        |

Arabic uses `/ar/`. B2C staff login: `/en/dashboard/login`. These are local review builds with fixture data, not publicly deployed sites. A request to make the sites live again in this conversation meant restart these local previews. Do not turn it into deployment authorization.

Latest server sessions in the old chat: B2C `64920`, B2B `35495`; sessions may not be controllable in another chat. Check reachability before starting another process. Commands from each app: `npm.cmd run preview -- --host 127.0.0.1 --port 5283 --strictPort` and B2B port 5284. If files change, rebuild the review output before presenting the preview as current. Temporary dev servers 5295/5296 were stopped after QA. Local sockets/browser launches may require the environment's escalation; request the actual required permission only once and explain any real rejection.

Supplied integration base URL: `https://narmer-ecommerce.vercel.app`. Explicit `.env.integration` profiles use the real API; review mode uses fixtures. Read the latest `Backend Files/New Backend Files/` contracts before integration work. The backend developer supplied super-admin accounts for **both stores**. No real credentials were received or used here; the owner can enter credentials directly in the browser. Do not ask them to paste a password into chat or invent accounts.

Earlier public browser connection/CORS retest passed after a backend fix (see dated retest document). It does not certify current authenticated cookies or provider/storage behavior. Empty live B2B questionnaires require backend-configured/published forms; do not manufacture public answers or hide an unavailable service behind demo data in integration mode.

## Owner working instructions

- Prefix every chat title with `Narmer - `.
- Use the catalog's Ponytail skill in full mode for coding, debugging, architecture, refactoring and reviews; choose the smallest complete implementation, reuse project code and preserve validation, security, accessibility and data-loss protection. Discover current paths; do not hard-code plugin versions in future instructions.
- Use clear English and Caveman lite only when it improves clarity. Full sentences, familiar wording and sufficient explanations matter more than brevity. Persistent documents use normal clear prose.
- Do not delegate by default. Main model owns decisions/integration/review. Use a bounded subagent only when worthwhile; prefer available Luna for ordinary bounded work and Sol for complex work. Do not use Astra without the owner's explicit bounded approval after the required evidence of capability limits. Do not silently change the selected main model/settings.
- Preserve the user's existing changes and architectural separation. No speculative APIs, generic CMS/tenant frameworks, dependencies, package upgrades, production mutations or deployments.
- For substantial UI work, inspect CURRENT Figma, render the actual interface and inspect screenshots at desktop/intermediate/mobile sizes and EN/AR. Compile success alone is insufficient.
- The owner is particularly sensitive to repeated alignment/mobile mistakes. Look at sibling screens and reusable components when one defect suggests a shared cause. Keep tests proportionate and reuse passing evidence when unchanged.
- Communicate before tools and keep meaningful progress updates approximately once a minute during substantial work. Do not narrate unchanged polling. Answer steering questions briefly and continue authorized work.
- If a permission request truly blocks work, explain what action needs it and why. Do not ask again for decisions already authorized. User said they did not see a previous permission request; there is currently no outstanding file-change approval.

## Visual language and common corrections to preserve

The owner approved Narmer's CURRENT Figma light design. English is **Poppins**, Arabic **Cairo**, with navy/gold and supplied imagery. Do not replace it with a generic dashboard/design-system template or a new font. Small visual defect fixes are expected; material redesign outside explicit requests needs a decision.

| Topic                         | Final owner decision / mistake to avoid                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gold buttons on navy surfaces | A navy hover makes them disappear. Use a small gold-tone change or another approved high-contrast state only in that navy context. Do not globally change all gold buttons. Preserve icon contrast too.                                                                        |
| General button states         | Use Narmer defaults/hover/focus/pressed/disabled. Consult Figma key states. Dashboard service tabs: selected gold, hover navy, unselected outline/base treatment.                                                                                                              |
| Empty/error actions           | Buttons sit **below** their text with breathing room (16px), not glued alongside it. Apply at the shared Feedback layer so Wishlist, Cart, Orders and moved account layouts remain correct. This was corrected repeatedly; avoid page-scoped fixes that miss sibling contexts. |
| Forms and filters             | Align field labels, inputs and actions. Textareas need visible borders. Custom Narmer dropdowns throughout both public sites and dashboards; a styled closed select alone is insufficient if its opened menu stays browser-default.                                            |
| Dropdown overlay              | Long menus must render above the next card and stay within usable viewport space. Do not clip behind the next question or introduce a tiny needless scroll in the staff-create modal.                                                                                          |
| Uploads                       | Use styled Choose image/file controls and real hover/focus feedback, including the B2B public form. Leave breathing room between control and helper text.                                                                                                                      |
| Checkbox/radio                | Branded custom controls, consistent with all siblings. Sale-only checkbox aligned to its filter row; remove the unnecessary enclosing outline box while retaining accessible focus.                                                                                            |
| Icons                         | One consistent SVG icon style, not text glyph arrows/browser triangles. Directional arrows 16px desktop and approximately 14px mobile, slight direction-aware hover translation and RTL reversal. Dashboard question reorder arrows specifically 18px after owner correction.  |
| Reorder controls              | Styled up/down SVG actions, correct disabled boundaries and enough touch target; no tiny text arrow or oversized replacement.                                                                                                                                                  |
| Gallery arrows                | Image gallery arrows loop in both directions at first/last image. Catalog pagination arrows do **not** loop: always visible and disabled when no next/previous page. These are separate behaviors.                                                                             |
| Image switching               | Smooth transition matching the supplied Dandara video reference; color clicks should change the preview immediately rather than waiting for size selection.                                                                                                                    |
| Motion                        | Subtle purposeful animation across pages/home. Section entrance must start when the person reaches the section, not finish before it enters view; the existing system was adjusted to a more visible 720ms pace. Respect reduced motion and do not delay basic interaction.    |
| Loading                       | Keep the Narmer logo intro. Secondary content loading uses responsive skeletons, not another Loading/spinner screen.                                                                                                                                                           |
| Text                          | Replace em dashes in website UI with `-` when needed. Use real supplied content; do not invent testimonials, business facts or contact details.                                                                                                                                |
| Cards                         | The product card must be the same shared design on home and catalog/men/women/new-arrivals/sale, rounded on all four outer corners, text/price/actions padded and aligned on mobile and desktop.                                                                               |
| Product links                 | Borderless View product text action with small SVG arrow and subtle directional hover movement. No default underline/glyph arrow and no outlined full-width pill around this action.                                                                                           |
| Footer credit                 | Center the bottom credit: `Developed by D-Tech & Glitci Solutions` with separate links to `https://dtech-agency.com/` and `https://glitci.com/`; next line `All rights reserved © 2026 Narmer Clothing Factory.` Both sites retain this.                                       |
| Footer About                  | Keep About Narmer under Information. Remove duplicate About under Shop; the header About remains.                                                                                                                                                                              |
| Language switch               | Keep icon plus destination-language label in both languages. Desktop public navbar language switch is at the far outer right in EN / outer left in AR while main navigation stays centered. Maintain alignment with account/wishlist/cart icons.                               |
| Favicon                       | Owner compared gold and blue and selected the supplied **gold favicon everywhere**, public/staff/dashboard/both stores. No route-specific blue switch remains.                                                                                                                 |

## B2B decisions and answered questions

- The home Services cards have no arrow beside Explore service. Keep all five services.
- Request-tracking lookup button aligns with the Request reference and Private access key fields. Labels/inputs/buttons must not land on mismatched baselines.
- B2B requests do not require customer account creation. Preserve actual private tracking credential/token contract; email alone is not proof of ownership. Account sign-in is optional; earlier guest requests are not automatically linked to an account. Draft retention is tab/deadline-bound, with a Forget draft action useful on shared devices.
- The home post-form three steps needed deliberate mobile layout and aligned number/text/connector geometry. Check 360px Samsung and 440px iPhone sizes; do not let breakpoints produce accidental inconsistent layouts or overlapping labels.
- Narrow hero buttons must have a consistent designed layout and size; do not let Discuss manufacturing wrap awkwardly while its sibling appears differently sized.
- Dashboard fixed pouch variants had an artificial four-row limit. Remove that UI cap; allow available product variants such as XXL/XXXL. Avoid duplicate/nonexistent combinations and preserve documented backend constraints. Unlimited UI wording does not authorize bypassing real backend validation.
- Request forms use **five visible service option buttons**, not a dropdown. Clicking one opens its form and highlights selected gold; hover navy. Mobile arrangement must be aligned at both 360 and 440 widths.
- Accounts include Create staff account for appropriate role; it originally demonstrated local creation pending backend support. New backend Auth/Users additions were subsequently delivered. B2C Phase 6 implementation exists; the earlier B2B creation/own-password adaptation checkpoint remains carried forward unless separately verified/fixed.
- Homepage editor labels say **Alt text**, not Alternative text. Alt text describes images for accessibility/fallback; owner said actual content can be filled later. Do not turn this into a new copywriting blocker.
- Staff authentication is separate from customer login: `/en/dashboard/login` and `/ar/dashboard/login`, centered white Narmer card on navy using the supplied admin-login reference. Keep language switch with language icon, password eye toggle and exact EN browser title **Staff Login | Narmer**. Dashboard logout returns to staff login, not the storefront. Preserve customer auth's separate layout.
- Readable wholesale URLs use product names while internal API IDs remain unchanged. The owner asked if long IDs were numeric backend IDs and chose to keep them internally and expose readable public names. Do not shorten internal identifiers or remove them from API requests.
- Backend response `wholesale-stable-urls.md` was supplied after our detailed request. Persistent stable slugs/name-change aliases/old redirects must follow its contract. The package review records remaining schema/valid-offer/frontend migration/host-308 work; do not claim it complete merely because the document exists.

## B2C decisions and answered questions

- Home Sale feature is a banner/CTA section. Remove the two product cards accidentally added beneath it; do not repopulate it merely because a backend Sale list exists.
- Men/Women mega menus follow CURRENT B2C navigation, page 11, with categories, editorial copy and product image. Replace default glyph arrows with Narmer SVGs.
- Hero woman's green hoodie image was replaced with the model wearing the brown Sporty quarter-zip, source `6.1.jpg` in the supplied product folder. Women's menu uses the pink hoodie front/back mannequin image `4.jpg`; men's menu uses black Maison front/back mannequin image `9.jpg`. Zoom menu crops slightly so clothing is visible with less empty space.
- Customer login imagery should show multiple supplied-clothing models rather than one unrelated oversized product model. Check existing generated/supplied account art and prior handoff; do not regenerate on every change or overwrite approved art without need.
- All **11 supplied products** and multiple photos were organized from `D:\Web Projects\Narmer E-Commerce Website\Files\Products Images`. Owner explicitly authorized **existing demo prices, sizes and stock for local review**. They are not real launch values. Main cover for every product must show the model wearing it, not a mannequin or back-only image. Existing catalog has 42 photos; preserve associations/order.
- Product color controls are small circles with labels, not large square gold tiles. Available sizes/colors are visible immediately. Color click changes image without forcing a size-first sequence. Out-of-stock colors can still be previewed; unavailable combinations cannot be added to Cart. Disable unavailable sizes clearly and prevent surprise late availability changes.
- Product thumbnails are compact. Reduce excessive mobile title/body/button/control sizing while preserving readability and touch targets. Do not blindly shrink the entire page.
- Remove the `From` label from product-card prices. Product-detail price updates with selected variant. Homepage selection chooses products/order; prices come from product/variant and campaigns. **No separate Homepage price override exists in the backend.**
- Category display names are **Men's Section** and **Women's Section**, replacing The Men's/Women's edit across home/menu where applicable.
- Catalog filter panel is compact/collapsible, not a giant permanent block. Use preset price ranges rather than free-form min/max fields. Owner gave examples 0-100 and 100-500; use implemented current presets rather than inventing a new scheme. Correct Sale-only alignment and preserve automatic/apply behavior in existing implementation.
- Add header **About** link while preserving centered navigation and far-edge language switch. Do not duplicate About in the footer Shop group.
- Mobile home story overlay must fill the full image/section, including the bottom edge. New Arrivals heading and Shop collection action align deliberately; product text/actions remain inside cards.
- Cart quantity changes save automatically on +/- without Update quantity button. Handle keyboard/invalid input and request ordering, protect against stale responses, and **retain every item's display position**. The old implementation reordered edited lines to the top/bottom and confused the owner; stable `cartLineKey`/response reconciliation tests protect this.
- Guest/account Cart merge must produce real local/API behavior and feedback; preserve both carts on failure and consume guest quantities once on success. Mobile Account cart/Guest cart/Merge controls need a deliberate compact row or 2+1 arrangement, not accidental three-long-button stacking.
- Wishlist/empty Cart/empty Orders actions sit below their message with breathing room. Owner called this regression out again after account layout changes: fix shared foundations, not only `.shop-page` CSS.
- Approved redesigned account Overview/Profile/Saved addresses/Your orders; use a persistent shared frame/tab navigation. Switching feels like tabs within one page: preserve scroll, animate content, avoid replaying the logo intro/full page transition. Keep URLs/deep links and accessibility.
- Saved addresses use grouped fields/custom governorate choices and labelled actions. Account order history has correct filter/cards/pagination/private guest-tracking explanation.
- Receipt Print/Save PDF was redesigned with Narmer logo/navy/gold, readable item columns/summary/footer and EN/AR rendering, including background graphics off. Do not revert to bare text or claim a tax/bank payment invoice; it's an order acknowledgment.
- Checkout offers **all 27 Egyptian governorates**, explicitly confirmed by the owner. Use configured shipping overrides/default fees and integer piastres; do not invent backend fee logic.
- Quick Add to cart and quick Buy icon appear in catalog cards and Home New Arrivals (and shared card uses). Product detail has Buy now. Variant products use a clear size/color selection flow before adding.
- Owner explicitly chose **Buy now = selected product plus existing cart**. Add the chosen item and navigate to checkout; do not clear existing cart, isolate only that item, or automatically place/pay an order.
- Prominent, dismissible success notifications cover Cart/Wishlist/profile/address saves and related actions. Remove duplicate old inline success blocks when a toast is shown. Mobile toast is smaller and stays clear of floating Cart; keep an accessible dismissal target.
- Header Cart badge shows **total quantity**, not distinct product count. Approved mobile floating Cart is small, with count, on shopping pages only; hidden on checkout/account pages. Owner was asked before this addition and explicitly said Yes.
- Add-to-cart SVG icon must stay visible on hover; old shared icon rule turned it white against a pale background. Preserve contrast with text/currentColor rules.

## Folder organization, naming and formatting decisions

- Owner rejected a directory per page with everything called index. Both builds now have named public English HTML at root, matching Arabic names under `ar/`, and `assets/fonts`, `assets/images`, `assets/css`, `assets/js`. Only homepage uses index. Source pages have clear names under `src/pages` and features retain meaningful responsibilities. Dynamic/private routes use app fallback; do not expose private data in prerendered HTML.
- This organization keeps React/Vite/Tailwind intact; it is not a switch to independent hand-coded static apps.
- Owner asked about `AccountRoutes-BLn0pfDJ.css` and long wholesale filenames. Explained Vite content hashes for cache updates; owner explicitly said **fix wholesale names and keep CSS/JS hashes as they are**. Do not strip hashes or manually rename generated bundles.
- Shared Prettier config/format scripts cover both apps and shared JS/JSX/CSS/JSON plus relevant config/HTML. Do not ask the owner to format file by file; don't manually edit generated dist bundles.

## Responsive mistakes to avoid repeating

Check at least 320/360/440 mobile, intermediate widths and desktop where relevant. The owner compared Samsung Galaxy S22 Ultra 360x772 and iPhone16 Pro Max 440x956, with emulator screenshots at different display zooms. Different viewport widths legitimately wrap differently, but overlaps, accidental spacing and hierarchy changes are bugs.

- B2B dashboard Requests metrics: number/label/supporting text must align within cards at both widths. Do not report emulator screenshot scale as a verified browser font bug.
- Product source tabs and service buttons must have designed mobile arrangement. Availability filter labels must not overlap Search controls.
- Accounts Status/Role filters must not overlap on iPhone. Notifications Open request/Mark read actions need intentional narrow-screen layout.
- Mobile dashboard tables become labelled cards; retain each desktop-derived field label beside its value. A previous Figma audit corrected many missing-label cards. Never remove labels merely to save space.
- Dropdown stacking/positioning must work in cards and dialogs; content should not sit behind sibling cards or force a tiny avoidable modal scrollbar.
- Respect Arabic RTL independently: mirrored positions/icons, Cairo text, labels and real long content; don't assume English success proves Arabic.
- Browser geometry assertions wait for network idle/fonts ready; otherwise text may shift after an apparent spacing failure. Automated WebKit is not physical Safari/iPhone proof. Firefox launch has previously failed on this host; retain that gap honestly.

## Phase 6 checks, code and known limits

Use `PHASE_6_HANDOFF.md` for full current scope and evidence. Latest results: 101 shared logic tests; 224 dashboard layout cases; four operational journeys (Chromium/WebKit x EN/AR); eight intercepted recovery/privacy cases; eight quick-shopping regressions; six Phase5 checkout smoke flows; both review builds (34 B2C / 28 B2B public pages), both lint checks and formatting passed.

Files: `B2C-Website/src/features/dashboard/`, `B2C-Website/src/pages/Dashboard*.jsx`, `B2C-Website/src/assets/css/dashboard.css`. Shared data-router change in B2C browser entry is required by unsaved-change `useBlocker`. Don't revert to BrowserRouter without replacing that protection. Source comments document first-100 picker limits for homepage curation and product-chart choices; list libraries/promotion targets paginate. Fix those pickers before the respective library exceeds 100; do not describe the main catalog as capped at 100.

Important corrections during Phase6 that must remain:

- Staff adapter role enforcement, store-relative prefixes and identity checks before/after reads/writes.
- Mutation with missing response, 5xx or malformed 200/201 JSON is uncertain; no automatic replay. `unknownWrite` includes INVALID_RESPONSE.
- A 409 followed by failed fresh GET keeps save locked; draft survives. Reconciled saves must call onSaved and clear unsaved guards.
- Staff-create uncertain response blocks repeated creation and clears password. Handoff/password-change uncertain response clears local session and returns to staff login. Admin ownership transfer uses admin Auth prefix; self password uses public self-service prefix.
- Upload runs block captured draft edits/save. Media binding is target/kind/language aware; private proof Blob URLs are revoked after navigation and aborts.
- Product type is immutable only once saved; create includes type; full variant replacement retains IDs. Never deep-mutate option objects shared with editor baseline. Reject blank/invalid money and duplicate/missing option combinations.
- Numeric charts normalize returned values without mutating drafts. Activation is explicit; product and chart versions are independent.
- Canonical Sales percentage limit remains 1-100. A proposed broadening based on a legacy descriptive note was rejected by automatic review; the canonical contract was checked and the safer original validation retained. No pending permission remains from that event.
- Fixture handlers return undefined for unhandled domains so composition reaches Orders. Homepage fixture stages edits before validation to avoid partial mutation; per-user notification/profile state stays isolated.
- Operational fixtures are frontend demonstrations, not a backend implementation. Separately implemented public/dashboard fixture datasets don't imply persistent cross-page/live content synchronization. Production reference/overlap/expiry/provider behavior requires authorized live tests.

Review evidence is under `output/playwright/phase6-layout`, `phase6-workflows`, `phase6-recovery`, `quick-shop` and `phase5-smoke`. Test sources are `shared/tests/phase6-*.mjs` and existing affected regressions. Browser runtime already installed; discover/reuse it, do not download browsers/packages casually. Last environment used `PLAYWRIGHT_BROWSERS_PATH=C:\Users\Fares ElSawy\AppData\Local\ms-playwright` and Playwright package at `C:/Users/Fares ElSawy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.

## Separate dark-mode design request

Owner asked conceptually whether dark mode requires rebuilding. Explained it can reuse components with suitable colors; no implementation was authorized. Owner then explicitly authorized messaging the existing design chat **Narmer - Figma dashboard and cart corrections**, thread `01a10e78-dfad-7572-9ef8-92c90e9f9fd7`, host local.

That chat was asked to create **one new Figma page `CURRENT - Dark Mode`** containing four examples: B2C home, B2B home, one B2C dashboard screen and one B2B dashboard screen. Recommended direction: deep charcoal/navy, lighter surfaces, warm-white text, restrained gold and unchanged product-image backgrounds; preserve original light designs. No dark-mode code or backend work here. Status has not been rechecked in this transition; use bounded `read_thread`/`wait_threads` if the owner asks. The original human authorization covers this exact design request, not arbitrary new messaging.

## First response and next work

After reading the records, briefly acknowledge that continuity is loaded: phases 1-5 accepted, Phase6 ready for their corrections, Phase7 not started. Tell them they can send the next screenshot/edit directly without repeating setup. Do not dump this entire file back at them, launch new test suites, make code changes, ask old questions or begin Phase7 merely to show activity. Check/start review links only when useful/requested. Preserve all later owner steering in a small active checklist.

This transition was authorized to create a new chat and hand off context. It does not authorize new production operations, memory-file changes or automatic acceptance of unfinished review.
