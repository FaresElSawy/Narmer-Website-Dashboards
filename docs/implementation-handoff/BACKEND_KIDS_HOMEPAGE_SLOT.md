# B2C Kids homepage image slot

The storefront now has a Kids card in “Find your everyday.” Its separate navigation dropdown image comes from the root category image. The Kids homepage card must be editable independently alongside Men and Women in Homepage content.

The deployed public `GET /api/v1/b2c/homepage` currently returns six slots, without `collection-kids`. `HOMEPAGE_FRONTEND.md` defines a fixed manifest and rejects unknown upload/PATCH slot keys, so the frontend must not invent an unsupported upload.

Please add `collection-kids` to the B2C homepage manifest:

- Label: `{ "en": "Kids collection", "ar": "مجموعة الأطفال" }`.
- Support desktop and optional mobile images, matching `collection-men` and `collection-women`.
- Return the slot in admin `allowedSlots`, admin `slots`, and public `slots`, including for existing homepage records with null images and empty bilingual alt text.
- Accept uploads at the existing `/api/v1/admin/b2c/homepage/media/collection-kids/desktop` and `/mobile` route pattern with the same asset ownership checks.
- Accept partial PATCH updates for this key and increase the B2C maximum slot count to seven. Retain version checks, permissions, image validation and existing values.

The frontend already renders from the returned manifest, has the Kids label/default image, and reads the public `collection-kids` override. Once both admin and public responses expose it and upload/PATCH support is deployed, the control will appear automatically. No route or payload redesign is needed.

Verify upload, save, readback, public desktop display, optional mobile fallback and clear override. The bundled child-in-Yourself-hoodie image remains the default when no override is saved.
