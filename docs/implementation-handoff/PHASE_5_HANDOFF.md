# Phase 5 - Checkout, receipts and tracking

Updated 26 October 2026. **Accepted by the owner on 26 October 2026.** Phase 4 was accepted on 24 October; Phase 5 was explicitly authorized and resumed after the requested pause. The owner accepted Phase 5 and authorized Phase 6: “phase 5 is now completed you can start phase 6”.

## Delivered

- Delivery/contact details with all 27 Egyptian governorates, as confirmed by the owner. Configured shipping codes and fees take priority; the backend default covers other supported governorates.
- Explicit saved-address prefill for customers. Governorate confirmation and missing district details remain required rather than silently inventing shipping information.
- Server shipping/coupon previews and authoritative money values, including valid zero totals. Coupon eligibility uses the intended checkout phone and current Cart.
- Cash on delivery and manual InstaPay review. InstaPay requires an explicit private screenshot upload; an upload is not an order or confirmation of payment.
- Order acknowledgment, detailed printable receipt, private guest tracking and customer order history. Guest checkout requires no account; guest orders are not automatically attached by email or later sign-in.
- English/Arabic layouts, Poppins/Cairo, shared Narmer controls, responsive skeletons, keyboard focus, reduced motion, supplied gold favicon and accepted header/footer refinements.

## Routes and owner review

The current local review server is `http://127.0.0.1:5283`. It must be restarted after shutting down Windows.

| Page                   | English route         | Arabic route          |
| ---------------------- | --------------------- | --------------------- |
| Products               | `/en/products`        | `/ar/products`        |
| Cart                   | `/en/cart`            | `/ar/cart`            |
| Delivery details       | `/en/checkout`        | `/ar/checkout`        |
| Review/payment         | `/en/checkout/review` | `/ar/checkout/review` |
| Guest tracking entry   | `/en/track`           | `/ar/track`           |
| Customer order history | `/en/orders`          | `/ar/orders`          |

Acknowledgment, private tracking and receipt links are generated for the actual order ID. Account orders use `/orders/:orderId`; guest orders use `/track/:orderId`, with `/receipt` for either receipt route. Checkout acknowledgment uses `/checkout/received/:orderId`.

1. Open Products, select a size and add a product to Cart.
2. Continue to checkout as a guest. Enter contact/delivery details, select a governorate and review the shipping/total.
3. Try COD, place the demo order, open its receipt and use Print / Save PDF. Copy its private tracking link and try tracking.
4. Start another purchase and try InstaPay with a sample image. The local receiving account is explicitly marked **SAMPLE ONLY**. Do not send a real transfer.
5. Try the customer flow with the existing review account, `mariam@example.test` / `NarmerDemo123`. Confirm saved-address behavior and Your orders. This account is local demonstration data.
6. Review English/Arabic on desktop and mobile, including narrow 360px screens.

The review dataset is intentionally memory-only. A full refresh resets demo orders and private proof bytes. Test acknowledgment/tracking/history within the same running page session. Persistence and interrupted-response reload recovery were separately tested against intercepted API responses; this does not establish live backend acceptance.

## Safety and business rules

- Placement saves the exact checkout/proof pair before sending. An uncertain response locks unsafe edits and retries only that same placement, including after quote expiry. Uploads never retry automatically.
- COD omits `proofId`; InstaPay uses the original uploaded proof ID. A failed proof upload requires an explicit user action to retry.
- Checkout ownership stays fixed. Signing in/out or changing identity clears private state and discards late results from the old identity.
- Account order reads check identity before and after transport, including a possible session refresh. An independent review found a gap here; the adapter guard and a delayed identity-change regression now cover it.
- Guest tokens travel in `X-Order-Token`. Share links use a fragment that is consumed and removed before fetching. Tokens do not enter query strings or printed receipts. Known tracking credentials survive a replay returning a null token.
- Private proof images are fetched as protected binary data and temporary object URLs are revoked. Missing, forbidden and expired access show recoverable states.
- Final Order totals can differ from the earlier quote. Receipts use actual backend values and apply the returned coupon discount in the summary. No fabricated invoice number, tax field or short order reference was added.
- Canceled/returned status and refund markers are displayed accurately. A refund marker does not claim that money was transferred. Customer cancellation, proof replacement and refund execution were not invented.
- Private pages are excluded from public prerender/sitemaps and use noindex. Production host/head behavior remains a release check.

## Source authority and implementation

Backend authority: `Backend Files/New Backend Files/modules/ORDERS_FRONTEND.md`, `SHIPPING_FRONTEND.md`, `COUPONS_FRONTEND.md`, `CART_FRONTEND.md` and `USERS_FRONTEND.md`.

CURRENT Figma file: `sv4mjHZis8FDpvEMsrAJWM`. Inspected desktop sources: R05 `191:6119`, R06 `191:6809`, R06 COD `191:8507`, R07 `191:7291`, R07-R `312:3249`, R08 `191:7697` and R09 `191:8143`, plus relevant English/Arabic mobile variants. The owner's later approved navigation, controls, imagery and footer requirements remain in effect. Design context is retained in `output/phase5/`.

Feature ownership remains under `B2C-Website/src/features/orders/`: API adapter, local fixture, model, checkout state, provider and shared order components. Pages are named `Checkout.jsx`, `OrderReceived.jsx`, `OrderDetail.jsx` and `Orders.jsx`; styling lives in `src/assets/css/orders.css`. Cart and shared customer navigation connect the feature. No new dependency was added.

## Verification and evidence

| Check                                  | Actual result                                                                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared Node tests                      | 83 passed, including ownership, exact replay, token preservation, storage failures and all 27 governorates                                                                   |
| Phase 5 rendered flows                 | 48 passed in Chromium/WebKit, English/Arabic, at 1440/768/440/360/320px                                                                                                      |
| Intercepted API recovery/privacy cases | 36 passed, including lost COD/InstaPay responses, reload reconciliation, 429/409, invalid/oversize/lost proof, expiry, zero/repriced totals and authenticated guest tracking |
| Existing shopping/recovery regression  | 42 passed, including quantity saves, merge and stable Cart ordering                                                                                                          |
| Existing storefront regression         | 20 passed; initial hydration synchronization corrected to inspect settled content                                                                                            |
| Builds                                 | B2C 34 and B2B 28 public HTML pages passed review builds                                                                                                                     |
| Code checks                            | Both apps pass lint; shared project formatting passes                                                                                                                        |
| Print                                  | English/Arabic Chromium PDFs render as one page each; inspected visually; no tracking token text or link annotations                                                         |

Evidence: `output/playwright/phase5/results.json`, `output/playwright/phase5-contracts/results.json`, `output/playwright/phase4-journeys/results.json` and `output/playwright/storefront-review/results.json`. Phase 5 screenshots and receipt PDFs are in `output/playwright/phase5/`; rendered receipt proof images are in `output/phase5/`.

The browser checks use local fixtures or intercepted localhost API traffic. They do not place real orders, upload to the real provider or transfer money.

## Owner-requested receipt print design, 25 October 2026

The Print / Save PDF layout now includes the supplied Narmer logo, a branded masthead, gold dividers, order reference/status band, a navy item-table header, aligned quantity/prices, a cream totals panel and a localized thank-you footer. English and Arabic mirror correctly. This treatment applies to print; the customer receipt screen and all actual order/payment values remain unchanged. Colors remain legible with browser background graphics disabled. Browser-added date/URL headers and footers are controlled by the print dialog; turn off **Headers and footers** for a clean branded copy.

The English/Arabic A4 PDFs and versions with background graphics disabled are retained in `output/playwright/phase5/`. Printed pages exclude private tracking credentials and proof images. The latest browser checks also verify that the logo loads, print elements appear only in print and website navigation/actions remain hidden.

## Owner-requested customer account refinement, 26 October 2026

Overview, Profile, Saved addresses and Your orders now share `shared/features/account/AccountFrame.jsx`: a consistent heading, back link, selected gold tab and responsive two-column mobile navigation. The overview uses a navy welcome panel and direct profile/address/order actions. Profile uses a focused contact form and separate account options. Saved addresses appear beside a compact grouped form on desktop and above it on mobile. Order history uses the same account navigation with aligned status filtering, labelled order cards, centered pagination and a useful guest-tracking link.

Existing profile and address validation, store identity, account-only history and logout behavior are preserved. Success notices are compact and associated with their originating page, so Profile saved does not appear on Addresses. Shared B2B account pages retain their own store-specific links and receive the matching layout; login/staff screens are unchanged. No dependency or backend operation was added.

Verification: 20 B2C registration/OTP/profile/address edit/delete/logout and account-layout journeys at 1440/768/440/360/320px, plus eight B2B sibling journeys at 1440/360px, passed in Chromium/WebKit and English/Arabic. The 48 existing checkout/receipt/private-tracking/history regressions passed. Both builds, both lint checks and all 83 Node tests pass. Screenshots include empty and populated order history, desktop/mobile forms and selected navigation; evidence is in `output/playwright/phase4-accounts/`, `phase4-b2b-accounts/` and `phase5/`. Actual devices and live account/backend mutations remain unverified.

Final mobile polish: the order reference uses its full card width instead of wrapping its final characters into a narrow value column. Six additional Chromium 360px guest/account checkout and history smoke flows passed in English/Arabic, including a one-line order-reference assertion. These results and screenshots are separate in `output/playwright/phase5-smoke/`, preserving the full 48-case report.

## Owner review batch: shopping shortcuts, feedback and account-tab motion

Implemented on 26 October 2026, without starting Phase 6:

- Shared Feedback now stacks its action below the title/description with a 16px gap. The earlier fix was scoped to `.shop-page`, so moving Orders into the new account frame exposed the old default. The rule now lives in shared foundation styles, covering both apps and empty/error actions.
- Internal Overview/Profile/Saved addresses/Your orders navigation preserves scroll and uses a short 180ms content fade/translation. Account heading/navigation are no longer replayed as page reveals. Normal entry from another page still restores the page position, and reduced-motion preferences suppress the content animation.
- All shared product cards, including catalogue, New Arrivals and related products, have Add to cart and a labelled Buy now icon. The compact modal fetches fresh product detail, uses the existing circular color and size controls, requires available options, previews the chosen color and retains quantity/stock validation. No product-detail request is made for every card before opening it.
- Product detail has a Buy now button. The owner explicitly chose **selected product plus existing cart items**. A shared purchase helper increments only the selected product/variant line and preserves other selections. Buy now navigates to delivery details after the cart update; it never automatically places an order. Uncertain earlier placement blocks this shortcut until reconciled. Staff shopping remains blocked.
- Success feedback uses high-contrast navy/gold notifications, visible for seven seconds with a labelled dismiss button and polite announcement. The latest notification replaces the previous one rather than stacking repeated quantity messages. The owner's follow-up removes duplicate inline cart/wishlist success panels, leaving the floating notification for those actions. Profile/address notices are bound to their originating route so they do not reappear in another tab; wishlist and cart successes also notify.
- The header cart badge shows total quantity, not distinct lines. It waits for session restoration, ignores stale responses/other identities, refreshes after writes/merge and clears after order confirmation. It does not count a signed-in customer's separate guest cart.
- The owner approved the mobile floating cart on shopping pages only. It appears on the homepage, catalogue and product pages, mirrors in Arabic and stays clear of notifications. It is absent from Cart, checkout, account, tracking, order and dashboard pages. Notifications and the floating control are excluded from print.

Current validation: 88 shared Node tests (including four new increment/stock/identity tests and cart-count coverage), eight Chromium/WebKit EN/AR shopping journeys at 1440/360px, 20 account journeys including visible profile/address notifications, six checkout/receipt/history smoke flows with an empty cart-badge check after placement, and focused Chromium feedback/tab-motion checks on B2C plus B2B unavailable-page feedback. Builds produce 34 B2C and 28 B2B public pages; both lint checks and formatting pass. Independent bounded review found no concrete issue in the purchase/ownership/cart-count integration. Local browser evidence: `output/playwright/quick-shop/`, `phase4-accounts/` and `phase5-smoke/`; focused motion checks are in `shared/tests/account-motion-feedback-qa.mjs`. Browser checks use local fixtures, never real purchases or live provider uploads.

Owner follow-up on 26 October: mobile notifications use a maximum 320px width, 13px text and reduced padding, while retaining a 44px dismiss target and clearance above the floating cart. Product-card cart icons retain their navy color on the pale hover background. All eight Chromium/WebKit EN/AR desktop/mobile quick-shopping journeys pass again, now asserting a single cart/wishlist notification, no old inline panel, compact mobile dimensions, and the desktop cart-icon hover style. Both review builds and lint checks pass; mobile English/Arabic screenshots were inspected.

## Remaining acceptance boundaries

- Live authenticated cookies, real shipping/coupon configuration, real order placement/replay and provider-backed private proof access need authorized staging acceptance. Temporary public API browser connectivity was verified earlier, but that is not authenticated checkout acceptance.
- Firefox cannot launch on this Windows test host. Chromium and WebKit were tested; actual Safari and physical Android/iOS devices remain unverified.
- Production deployment must verify private-route fallback/noindex, final head metadata, indexing and provider/cache behavior. No deployment was performed.
- The previously recorded stable wholesale URL migration/redirect work and backend staff creation/own-password checkpoint remain carried forward. This phase does not claim to complete them.
- The owner accepted Phase 5 and authorized Phase 6 on 26 October 2026. Phase 6 delivery and remaining integration boundaries are recorded in [PHASE_6_HANDOFF.md](PHASE_6_HANDOFF.md).
