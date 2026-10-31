# Automatic English slugs and cart presentation

31 October 2026. Owner-requested B2C changes.

## Behavior

- New products and categories generate their slug from `name.en` using the pinned `slugify` 1.6.9 dependency. Output is lowercase, hyphen-separated, stripped of unsupported punctuation and limited to the backend's 150-character maximum.
- Arabic-name edits do not change slugs, including on Arabic dashboard routes.
- Staff can override a generated slug. Later name edits preserve that custom value. Renaming an existing saved record preserves its URL unless staff deliberately edit the slug.
- Duplicate slugs remain subject to backend uniqueness validation. A clear message asks staff to edit the conflicting slug; no guessed suffix or unsupported availability endpoint is used.
- Guest selections already combine automatically after customer sign-in through the existing authenticated merge call. The normal cart no longer displays Account cart, Guest cart or Merge carts controls, explanatory merge copy or empty-merge notices.
- A failed combine preserves both selections and shows plain-language recovery only: Review saved items / Back to your cart and Try again. Quantity corrections remain possible before retrying. Staff restrictions, account isolation, backend stock validation, rate-limit handling and checkout protections are retained.
- B2B behavior and existing catalog URLs are unchanged.

## Verification

- All 139 shared Node tests passed, including English-only slug generation, punctuation/diacritics, length limits, clearing a title, custom overrides, saved-slug preservation, cart merge consumption, conflict preservation and account isolation.
- Chrome fixture checks passed for automatic product/category slugs, an Arabic category editor, Arabic-name independence, a manual override and a saved category rename.
- Chrome fixture checkout preparation confirmed guest items automatically appear after customer sign-in with no normal recovery panel. English and Arabic cart views were inspected; the Arabic mobile viewport had no horizontal overflow.
- A stock-conflict journey retained account quantity 8 and guest quantity 8. After changing the saved guest selection to 4 and retrying, the displayed account quantity was 12 and the recovery panel disappeared. No live cart/order writes were used for these checks.
- The existing storefront and conflict journey scripts were updated to expect the new UI. They were syntax-checked; their full multi-browser matrices were not rerun for this focused change.
- B2C formatting and lint passed. The Vercel build passed, including public-HTML and asset checks for 34 English/Arabic pages. Hosted verification follows the testing deployment.

Local screenshots and supporting evidence: `output/slug-cart-review/`.

## Compact cart cards — subsequent owner refinement

The owner requested smaller stacked item cards and then explicitly requested a trash icon at each card's upper-right corner. The B2C cart now uses 104 px desktop photos and 76 px mobile photos, grouped option/unit-price details, compact quantity controls and a clearly separated line total. Cards have a thin brand border and no added shadow. The order summary stays beside the cards on desktop and follows them on mobile.

The trash icon is 18 px inside a 44 × 44 px button, with its original accessible Remove item label and a tooltip. It mirrors to the upper-left in Arabic. Quantity buttons also retain 44 × 44 px touch targets. Names and stock/validation messages can wrap; no text is truncated or required controls hidden.

Chrome fixture verification:

- Two desktop cards measured 164 px each and both fit in the test viewport.
- English cards at the 390 px mobile viewport setting measured about 180 px each.
- Arabic checks passed at 320, 414 and 768 px viewport settings; document width equaled scroll width in each case.
- Invalid quantity zero showed its readable Arabic message with no horizontal overflow. Correcting it and increasing quantity updated the canonical cart.
- The second card's trash button removed only the second fixture item.
- Screenshots and geometry are saved under `output/slug-cart-review/compact-cart-*`.

Cart/order calculations, stock validation, mutation safeguards, automatic guest-item combining and checkout behavior are unchanged by this layout refinement. These UI checks used local fixture carts; no live customer cart was edited.
