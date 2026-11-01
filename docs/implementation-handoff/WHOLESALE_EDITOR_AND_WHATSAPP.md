# B2B wholesale editor discovery and requester WhatsApp shortcut

The owner reported that Add offer and Edit offer appeared unresponsive on small laptops because their editor was rendered below the entire offer list. The owner also requested a WhatsApp shortcut beside the requester's phone number, matching white panels throughout the offer editor, and an icon-only contact control.

## Result

- The existing `/dashboard/wholesale/new` and `/dashboard/wholesale/:offerId` URLs now show a dedicated editor view. The table, filters and pagination appear only on the list view.
- Add and Edit show distinct page headings, reset scrolling to the top and focus the heading for keyboard/screen-reader navigation. A Back to wholesale offers link returns to the list. Existing unsaved-edit guards remain active.
- Wholesale offer, Fixed pouch composition and Publication state now use matching white panels with the same outer width and padding. Composition inputs align with the offer inputs. Both Add and Edit share this layout.
- Request details include a green WhatsApp icon beside the saved phone number. It retains a 44 px click area, accessible customer-specific label, tooltip and keyboard focus. There is no pill background or visible button text.
- The link uses `https://wa.me/` with digits only. Egyptian local mobile numbers are converted to country code 20; explicit `+` or `00` international numbers are supported. Missing/malformed numbers retain their displayed value without an invalid shortcut. Saved contact data is unchanged.
- WhatsApp opens in a separate tab with `noopener noreferrer`. No message is prefilled/sent and no request is automatically marked Contacted.

## Verification

- Connected Chrome fixture checks passed for Add and Edit at a 1366 × 768 viewport. Both showed no list table and had their first source field inside the viewport; editor navigation started at scroll position zero.
- Cancelling the unsaved-change confirmation retained the new offer's title. A local fixture offer saved successfully, opened the dedicated edit view, and appeared on the refreshed list after returning.
- Existing B2C-source and native B2B offers opened the correct source and composition.
- Arabic Add/Edit views were checked at mobile viewport settings of 390 and 320 px without horizontal overflow.
- Geometry checks confirmed all three edit panels had equal widths, matching 24 px padding and white backgrounds. Offer and composition input edges aligned.
- The WhatsApp link matched the displayed fixture contact's international number. The icon has no visible text and retains its accessible name and 44 px target. English and Arabic layouts were inspected; narrow layouts wrap safely.
- All 145 shared Node tests passed, including local/international WhatsApp number normalization and invalid-input rejection. B2B/shared lint and formatting passed.
- The final B2B staging build passed content, metadata and asset checks for 28 English/Arabic public pages. The previous B2C validation update remains included in the same testing branch.
- The existing B2B responsive QA script now asserts dedicated Add/Edit views and visible first fields. It passed syntax validation; its full Chromium/WebKit matrix was not rerun. Targeted interactions ran in connected Chrome.

Screenshots and local evidence: `output/wholesale-request-review/`.

No live offers or requests were created, modified or marked contacted for these checks. Actual WhatsApp app/Web handoff, recipient account availability and physical-device/Safari behavior were not exercised. Both client-review websites use their existing Git-connected Vercel testing deployments.

## Owner-supplied icon refinement

The owner replaced the drawn icon with `D:/Downloads/whatsapp.png`. The exact PNG is bundled at `B2B-Website/src/assets/images/whatsapp.png`; its SHA-256 matches the supplied file. Chrome confirmed a 24 × 24 px image inside the existing 44 × 44 px link target, with the same requester-specific URL, accessible label and tooltip. The staging build passed all 28 public-page checks. No message or live request mutation was performed.

## Approved text-only refinement, 1 November 2026

The owner first approved green `WhatsApp` / `واتساب` text beside the phone, then requested a rounded light-green button. The final control uses the shared secondary button classes and radius, with a light-green background, subtle green border and dark-green text. It keeps no icon, a 44 px minimum height, 12 px horizontal gap, keyboard focus and requester-specific accessible label. Recipient normalization, separate-tab behavior and request status are unchanged.

The local fixture rendered the English/Arabic text with no image/SVG, the expected `wa.me` recipient, light-green `rgb(234, 246, 238)` background, shared 24 px radius and a 44 px target. Arabic at 390 px had no overflow; keyboard focus retained a visible outline. Both staging builds passed (38 B2C and 28 B2B public pages). No WhatsApp message was sent.

## Narmer brand refinement

The owner subsequently requested Narmer's colors instead of green. The final WhatsApp link now uses the existing `button--primary` style: navy background, white text, shared radius, hover and focus states. Green-specific styling was removed. Compact padding, the 44 px minimum target, spacing beside the phone, text-only content and requester URL are retained.
