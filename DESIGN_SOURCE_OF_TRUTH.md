# Narmer design source of truth

Updated 23 October 2026.

## Implementation review decisions — 23 October 2026

The owner replaced the English Brice choice with **Poppins** for both websites and dashboards. Arabic remains **Cairo**. This supersedes earlier Brice requirements and preview-font notes in this historical design record.

CURRENT Figma remains the visual reference, with permission to correct awkward placement, spacing and control visuals while coding. Preserve the brand, user journey, accessibility and backend business contracts. Use relevant installed UI/UX and responsive-design skills and verify actual renders; pixel-for-pixel reproduction of a visual defect is not required. Keep shared foundations centralized and each app's routes/content/business features organized in its existing folder. Record material departures in the implementation handoff. Phase 1 remains at its review gate; this permission does not authorize later phases, Figma edits or deployment.

## Owner handoff decision — 23 October 2026

The owner has now accepted the design direction and requested a separate coding conversation for both websites and dashboards, while this conversation remains for design. That session must start with a phased implementation plan and wait for explicit approval before coding. This later instruction supersedes earlier approval-pending wording below, without claiming that the websites are implemented. See [the coding-session handoff](docs/implementation-handoff/START_HERE.md) and [working rules](docs/implementation-handoff/WORKING_RULES.md).

Use only CURRENT CW-01 MIX (`191:651`) for public styling and CURRENT CD-01 Apple (`191:12467`) for dashboard styling. BACKUP pages and old exports remain historical. The current API authority is `Backend Files/New Backend Files`, starting with README.md and backend-response.md, not the older frontend request document. The API origin remains unconfigured. A live-read D13 measurement-table design versus the new image-only Size Charts contract is an explicit planning decision; do not silently implement or redesign it.

## Correction to the earlier completion status

The consolidated final design-parity sign-off remains separate from the earlier adaptation-complete label. Corrective Figma edits have now been applied, including chart/link/toolbar parity and the later dashboard/mobile/cart findings. See [the current targeted correction report](docs/design-work/approved-v2/parity-correction/MOBILE_AND_CART_CORRECTIONS.md) for the verified scope, exact IDs and remaining limits.

The earlier connector-limit and fallback failures are historical. Figma access resumed and the later corrective writes were performed. The old 263-frame audit statistics below remain historical evidence, not a certification of the expanded current set. No application coding is authorized by this status change.

## Approved direction and current status

The approved CW-01 MIX direction is now applied throughout the public website designs. The approved CD-01 Apple direction is applied throughout both dashboards. All existing template families and key states have been adapted, including English, Arabic, desktop and mobile variants. An Arabic mobile settings-menu preview was added to complete the English preview.

The Figma set is ready for design review. This is not a claim that the React applications have been implemented or that the client has separately approved every adapted screen.

Figma file: `sv4mjHZis8FDpvEMsrAJWM`.

| Reference                      | Node        |
| ------------------------------ | ----------- |
| Start Here guide               | `200:2`     |
| Approved public website master | `191:651`   |
| Approved dashboard master      | `191:12467` |
| English mobile settings menu   | `191:23044` |
| Arabic mobile settings menu    | `222:4749`  |

## Use CURRENT, not BACKUP

The nine original pages remain prefixed BACKUP. Their designs and source assets were preserved. Use them for historical comparison or business-scope recovery, not implementation styling.

The CURRENT set now contains 275 top-level screen/state variants: the previously verified 271-screen set plus four dedicated B2C order-receipt variants added on 22 October 2026.

| Group                                                                    | Variants |
| ------------------------------------------------------------------------ | -------: |
| Website masters, navigation comparison board and mobile menu states      |       13 |
| B2B public templates                                                     |       40 |
| B2C public templates                                                     |       44 |
| Shared account, contact and information templates                        |       36 |
| Dashboard masters                                                        |        8 |
| Dashboard templates, mobile settings drawers and Coupons-selected states |       94 |
| Key-state boards                                                         |       40 |
| Total                                                                    |      275 |

These counts include language/device variants; they do not represent 275 unique page types. The original migration copied 262 frames. Later additions are the Arabic mobile settings drawer, four mobile website menu states, four Coupons-selected dashboard states, and four dedicated B2C order-receipt screens. The separate approved mobile-header reference preview is excluded from this main-screen count; including it gives 276 screens/reference frames.

### Dedicated B2C order receipt

The thank-you screen remains the acknowledgment within checkout step 3, Receipt. Its primary action now opens the detailed receipt instead of linking directly to tracking. New R07-R variants sit below the thank-you row in the CURRENT B2C templates: English desktop `312:3249`, English mobile `312:3399`, Arabic desktop `312:3574`, Arabic mobile `312:3724`. The receipt includes delivery information, payment-review state, labelled item quantities and prices, coupon/shipping/totals, and a tracking action. It does not claim bank settlement or constitute a tax invoice. Print / Save PDF is a design specification for future browser printing, not an implemented Figma download or a new backend API. See [receipt verification](docs/design-work/approved-v2/parity-correction/order-receipt-qa.json).

The independent CURRENT component page retains 70 copied component definitions and now includes one reusable cart quantity component, 280:116. Current instances reference current definitions rather than backup definitions. Existing shared brand variables were preserved; the quantity component adds only the missing 8 px field-radius variable.

## Visual system

Approved mobile retail header update: account, wishlist, cart and menu form one trailing group, mirrored in Arabic. All three gaps are 6 px, each touch target remains 44 × 44 px, and the group is 194 px wide. This applies to all current retail mobile header occurrences, not the distinct B2B or dashboard header patterns. Verification and exact affected IDs are in [the mobile-header rollout record](docs/design-work/approved-v2/parity-correction/mobile-header-six-px-rollout.json).

Public websites retain the approved fashion-led composition: navy `#073B50`, gold `#BF8D34`, pale brand surfaces, rounded image framing, refined product cards, full-image collection overlays, clear paired actions, and an image-led manufacturing story. B2B uses the same visual language with service/manufacturing imagery and inquiry-led content.

Dashboards use navy sidebars with centered white branding, white navigation text/icons, pale navy workspace surfaces, rounded shadowless white panels, and restrained gold accents. Language and logout stay at the bottom of the sidebar/drawer. Notifications and staff identity remain in the header. B2B and B2C keep different business options.

Arabic uses Cairo, mirrored public headers and dashboard navigation, right-aligned Arabic content, and deliberate English/LTR values such as product sizes, EGP amounts and URLs. English previews currently use Inter because Brice is unavailable through the connected Figma font inventory. This does not replace the supplied Brice requirement for the final English handoff.

## Labels

- `MASTER · APPROVED DIRECTION`: the approved visual reference.
- `CURRENT`: an adapted active screen or state, ready for design review.
- `BACKUP`: preserved earlier design; do not implement its appearance.

No current screen remains marked STYLE PASS, QA PENDING or ADAPTED REVIEW.

## Earlier structural verification baseline

All 263 current variants passed the final structural layout and font-availability audit. The scan found no horizontal overflow or clipped-text candidates under the documented rules. Intentional transparent-logo cropping, unclipped absolute overlays and vector glyph geometry are excluded from those checks.

The final inventory inspected 9,919 text nodes and 4,371 component instances. It found zero Arabic-font mismatches, zero missing-font flags and zero references from current screen instances to backup component definitions.

All 206 NODE destination references and 96 same-file cross-page prototype URL references resolve to CURRENT targets. These references cover 31 unique destinations. Cross-page links open the target Figma prototype in a new tab; they are review navigation, not application routing.

Representative visual reviews covered every unique B2B, B2C/shared, dashboard and key-state family, with English/Arabic and desktop/mobile samples. Main review also checked the rebuilt homepage variants, expanded menus, corrected cart and wholesale cards, finance-chart treatment, Arabic retail headers, and the added Arabic drawer. Full-resolution screenshots were not generated for every variant.

The notification-centering scan checked 97 named notification controls and found no offsets. It also checked 49 sidebar/drawer logo wrappers and found no horizontal centering offsets. The approved master and new drawer were visually inspected.

Evidence and exact root mappings are in:

- [Final design QA](docs/design-work/approved-v2/FINAL_DESIGN_QA.md).
- [Machine-readable manifest](docs/design-work/approved-v2/manifest.json).
- [Final structural audit](docs/design-work/approved-v2/final-audit.json).

## Scope preserved

B2C remains ecommerce, including guest checkout, variants, optional size charts, coupons, orders and payment-review states. B2B remains inquiry-based, with service-specific requests and fixed-pouch wholesale requests; public B2B prices, cart and payments were not added.

Both dashboards retain their channel-specific tools and admin/moderator/super-admin boundaries. The existing [backend developer handoff](docs/NARMER_BACKEND_DEVELOPER_HANDOFF.md) continues to govern business flows and proposed API gaps. This design pass did not change API contracts.

## Remaining handoff limits

1. Resolve the final English Brice font before final typography approval.
2. Confirm factual catalog/prices, contact/social details, policies, reporting definitions and other sample content where marked.
3. Keep representative AI manufacturing imagery distinct from verified photographs of Narmer's actual facilities.
4. Perform an interactive prototype walkthrough if required. Structural destination checks are not an interaction/usability certification.
5. Obtain the separate implementation go-ahead. Then implement the approved set using the existing React, Vite and Tailwind stack, followed by browser/device, responsive, accessibility, integration and end-to-end QA.

No React, Vite, Tailwind, backend or deployment changes were made during this design adaptation.
