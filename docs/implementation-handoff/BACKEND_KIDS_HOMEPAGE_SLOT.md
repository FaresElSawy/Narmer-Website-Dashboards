# B2C Kids homepage image slot

## Backend update received — 2 November 2026

The supplied `HOMEPAGE_FRONTEND.md` now includes `collection-kids` in the seven-slot B2C manifest, including completion of existing records on read, desktop/mobile uploads, partial updates and independent alternative text. The public API was checked on 2 November 2026 and returns the new slot with null image overrides. The frontend support was already deployed in commit `762caf6`; no additional runtime change is required. Refresh Homepage content to load the updated manifest.

A focused frontend fixture test passes for seven-slot serialization, separate Kids desktop/mobile uploads, save and clear, while preserving the other six slots. The live Chrome upload/save check remains unverified because Chrome reports that an extension UI blocks automation. The owner separately confirmed the root-category dropdown image now works. No live homepage images were changed during this verification.

## Original request (fulfilled by the updated contract)

The storefront now has a Kids card in “Find your everyday.” Its separate navigation dropdown image comes from the root category image. The Kids homepage card must be editable independently alongside Men and Women in Homepage content.

At the time of the original request, public `GET /api/v1/b2c/homepage` returned six slots, without `collection-kids`. The previous `HOMEPAGE_FRONTEND.md` defined a fixed manifest and rejected unknown upload/PATCH slot keys, so the frontend could not invent an unsupported upload.

Please add `collection-kids` to the B2C homepage manifest:

- Label: `{ "en": "Kids collection", "ar": "مجموعة الأطفال" }`.
- Support desktop and optional mobile images, matching `collection-men` and `collection-women`.
- Return the slot in admin `allowedSlots`, admin `slots`, and public `slots`, including for existing homepage records with null images and empty bilingual alt text.
- Accept uploads at the existing `/api/v1/admin/b2c/homepage/media/collection-kids/desktop` and `/mobile` route pattern with the same asset ownership checks.
- Accept partial PATCH updates for this key and increase the B2C maximum slot count to seven. Retain version checks, permissions, image validation and existing values.

The frontend already renders from the returned manifest, has the Kids label/default image, and reads the public `collection-kids` override. Once both admin and public responses expose it and upload/PATCH support is deployed, the control will appear automatically. No route or payload redesign is needed.

Verify upload, save, readback, public desktop display, optional mobile fallback and clear override. The bundled child-in-Yourself-hoodie image remains the default when no override is saved.
