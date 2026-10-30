# Phase 5 - Checkout, receipts and tracking

Updated 25 October 2026. Status: Ready for owner review. Phase 4 accepted; Phase 5 explicitly authorized and resumed after a brief owner-requested pause. No later phase is authorized.

## Confirmed scope

Implement R05 delivery/contact details and saved-address prefill, server Shipping/Coupon previews, R06 COD or manual InstaPay review/private proof, R07 acknowledgement, R07-R printable receipt within step 3, R08 private guest/account order tracking and R09 customer order history. Preserve separate stores, Narmer controls, Poppins/Cairo, approved header/footer, reduced motion, skeletons and recent mobile corrections.

Use the active `Backend Files/New Backend Files` Orders, Shipping, Coupons, Cart and Users contracts. No invented invoice/order-number fields, refund execution, customer cancellation, proof replacement, guest-to-account attachment or email-only tracking. Guest access requires its private tracking token; account history contains account orders only. Public render/sitemap must exclude checkout, receipt and private order routes.

## Implementation and verification plan

1. Read CURRENT Figma R05/R06/R06-COD/R07/R07-R/R08/R09 and relevant mobile/Arabic variants; reuse current shared primitives and styling.
2. Add feature-scoped Orders API/fixture, checkout/replay state with fixed ownership and tab storage, and the public customer flows.
3. Keep server totals authoritative. Persist exact checkout/proof IDs before placement, block unsafe new checkout after an uncertain placement, and preserve the first non-null tracking token on replay. Proof upload is not idempotent and must never automatically replay.
4. Verify guest/account COD/InstaPay, saved-address confirmation, quote/coupon/stock failures, zero values, expiry, exact replay/lost responses, identity changes, proof type/size/privacy, history and printing.
5. Inspect rendered desktop/tablet/phone layouts in English/Arabic, including 360px and 440px. Run appropriate builds/lint/format and existing affected regressions. Obtain an independent bounded review of financial/ownership/replay logic before handoff.

Current Figma session: `c22c934c-bcc9-41e4-9933-409f61033d19`. File: `sv4mjHZis8FDpvEMsrAJWM`. Desktop source IDs: R05 `191:6119`, R06 `191:6809`, R06-COD `191:8507`, R07 `191:7291`, R07-R `312:3249`, R08 `191:7697`, R09 `191:8143`. Downloaded design context text is retained under `output/phase5/`; generated Figma code is reference material, not application code.

The local review continues to use the owner's eleven supplied products and approved demo prices/stock. Tests may use intercepted API responses. No real orders, uploads, payment transfers or backend data mutations are authorized by the local review work. Live cookie/provider/account acceptance remains a separately recorded release check.

## Current state

Implementation and local review are complete. The owner confirmed all 27 Egyptian governorates. The feature includes delivery details, COD/manual InstaPay, explicit private proof upload, exact placement reconciliation, acknowledgment, printable receipt, private tracking and customer history. Independent review and responsive English/Arabic browser checks are complete. See [PHASE_5_HANDOFF.md](PHASE_5_HANDOFF.md) for evidence, review steps and remaining live acceptance boundaries. Phase 5 awaits the owner's manual review; Phase 6 has not started.
