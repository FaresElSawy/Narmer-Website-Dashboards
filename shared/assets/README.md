# Foundation assets

The foundation `images/` files come from the approved CURRENT Figma file `sv4mjHZis8FDpvEMsrAJWM`, read on 23 October 2026, with the owner-requested account image addition below. No BACKUP image, flattened screen or temporary URL is used at runtime.

- `logo-navy` and `logo-white`: original transparent logos used by CURRENT headers/footers. The runtime WebP files are transparent, lossless, size-appropriate derivatives.
- `campaign-men` and `campaign-women`: CW-01 `191:651`, white graphic hoodie and green sport hoodie. WebP derivatives preserve the source framing; CSS crops them for the approved hero slots.
- `account-manufacturing.webp`: generated on 31 October 2026 at the owner's request for both customer sign-in pages. An illustrative garment-making still life with fabric, hands, thread and a sewing machine; not a photograph of a verified Narmer facility. One shared 1200 × 1026 WebP, approximately 147 KB, replaces the login campaign images. The generation original remains in the owner's local generated-image folder.
- `spinning` and `fabric`: BW-01 `191:135`. These are representative AI illustrations, not photographs of verified Narmer facilities.
- `weaving`, `uniforms`, and `wholesale`: matching CURRENT B2B service/overview slots read through BW-01 and B01. Original PNGs are preserved; the 1200 × 800 WebP derivatives are used for the public UI. They remain illustrative review imagery.
- `offer-quarter` and `offer-logo`: CURRENT B03/B02 garment images. Original PNGs are preserved; optimized WebP files are used in the replaceable review catalog, alongside the matching supplied campaign hoodie images. Live offers use their delivered public image DTOs.
- Account, Wishlist, Cart and Menu SVGs: CURRENT icon components read through CW-01 desktop/mobile context. Root SVG dimensions remain intact. Runtime dropdowns use a small standard CSS chevron following owner review feedback.
- Dashboard SVGs: CD-01 `191:12467`; each is used at its corresponding sidebar/header callsite. Notification bell is the 24px header asset; language/logout are the 20px bottom-sidebar assets.

The owner's original Brice/Cairo files remain in `Files/Fonts`. Following the 23 October review, English uses self-hosted Poppins from `shared/assets/fonts/poppins/` and Arabic uses byte-identical runtime copies of the supplied Cairo Regular/SemiBold/Bold WOFF2 files in `fonts/cairo/`. All declarations are centralized in `shared/assets/css/fonts.css`. No supplied original file was replaced.

The original PNG downloads and reference chevron are preserved locally in `Files/Source Assets/2026-10-30/`, outside the runtime code and Git upload. The two unused starter hero images are archived there too. Runtime WebP/SVG files remain here; no active image import was removed.

Folder responsibilities: `images/` contains runtime images/icons; `fonts/` contains runtime fonts and their licenses; `css/` contains shared styles; `js/` contains shared browser motion/entry helpers. Both apps import the same source assets. Store-specific pages, state and API behavior stay in their owning app.
