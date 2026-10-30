# Shared module contract review

Read-only comparison of the packaged backend contracts used by B2C and B2B screens. The new package is the authoritative implementation handoff per `Backend Files/New Backend Files/README.md` and `backend-response.md`; this review is not a live API verification.

## Package comparison and coverage

Read all seven requested NEW contracts in bounded chunks: `CATEGORIES_FRONTEND.md` (220 lines), `SIZECHARTS_FRONTEND.md` (189), `SITESETTINGS_FRONTEND.md` (264), `HOMEPAGE_FRONTEND.md` (372), `MEDIA_FRONTEND.md` (174), `SHIPPING_FRONTEND.md` (182), and `REPORTS_FRONTEND.md` (208). The four new module contracts—size charts, site settings, homepage, and reports—have no corresponding OLD files. Full unified diffs were inspected for the three shared filenames:

- `CATEGORIES_FRONTEND.md`: the only diff is a new Apidog setup note at the top (NEW lines 5–7); endpoint and DTO contract are otherwise unchanged.
- `MEDIA_FRONTEND.md`: additions document Apidog binary upload setup (NEW lines 5–11) and integrations for size charts and homepage uploads (NEW lines 168–174); existing media routes and DTO are unchanged.
- `SHIPPING_FRONTEND.md`: OLD and NEW SHA-256 are identical (`B1D14B6AB1D5F35B63367874104A9DF52697AD20E477229D67AD552FC0FF1320`), so the duplicate content was not re-read.

Old/new category and media files have different hashes because of those added sections. No backend calls were made. Source-check/test statements below are the contract authors' statements, not independently rerun evidence. Base URL remains unconfigured, as recorded in the handoff context.

## Screen contracts

### Categories and shared shipping

Categories are an existing B2C module, not a new cross-store capability. Public routes are `GET /api/v1/b2c/categories` and `GET /api/v1/b2c/categories/:categoryId`; dashboard routes are `GET /api/v1/admin/b2c/categories`, `/tree`, `/:categoryId`, plus POST/PATCH/DELETE at `/api/v1/admin/b2c/categories` and `/:categoryId` respectively. Staff list filters are `page`, `limit`, `parentId` (ID or literal `root`), and `isActive`; there is no search or custom sort (NEW `CATEGORIES_FRONTEND.md:19–43`). Dashboard list items are flat bilingual DTOs with `id`, `parentId`, `slug`, bilingual `name`/`description`, `position`, `isActive`, and nullable `image`; tree DTOs add recursive `children`. No category `version` exists. Create requires `name.ar`, `name.en`, and `slug`; category image attachment is a separate raw upload followed by PATCH (`:174–180`).

Category deletion is superAdmin-only and blocked by children, products, coupons, or sales; ordinary admin flows should emphasize move/deactivate. Reparenting must consider depth of all descendants and campaign overlap, not just the selected node (`:184–210`). Shipping's shared NEW/OLD contract is byte-for-byte identical; no changed shared shipping API requirement was found.

### Size charts

Admin-only B2C routes: list/create/detail/PATCH/delete under `/api/v1/admin/b2c/size-charts`, plus `POST /:chartId/images/:language`. Only `superAdmin`/`admin` can manage; only superAdmin can delete. List accepts `page`, `limit`, and `isActive`; no search, assignment list/count, or public chart route exists (NEW `SIZECHARTS_FRONTEND.md:9–36`).

The admin DTO is `{id,version,name:{en,ar},isActive,images:{en,ar},alt:{en,ar},createdAt,updatedAt}`. PATCH requires the current numeric `version`; translation/image fields merge per language. Each chart has at most one public image per language. Upload is raw JPEG/PNG/WebP bytes to the chart-and-language-specific endpoint, returns `{id,url,width,height}`, and does not attach or increment the chart version; a versioned PATCH attaches it. Ready unattached uploads expire after 24 hours. A product's optional `sizeChartId` is separate from both product variants and chart image IDs; an inactive assigned chart is allowed but not publicly shown (`:38–103`, `:126–158`).

**Design conflict requiring a product decision before implementing this screen:** current Figma dashboard content has a measurement-unit field and editable Size/Chest/Length/Sleeve table with sample numeric rows (`docs/design-work/dashboard-content.js:28`); the customer dialog also renders numeric measurements (`docs/design-work/state-content.js:10`, reinforced by `docs/design-work/approved-v2/parity-correction/MOBILE_AND_CART_CORRECTIONS.md:14`). The backend contract explicitly says there is no measurement-table editor and represents the guide as an image (`SIZECHARTS_FRONTEND.md:9, 83–103, 126–156`). Do not silently reinterpret the numeric editor as an image uploader or invent a measurements API. Product/design must choose whether to revise the Figma flow to image-based guides or request a backend contract extension; image-based is the currently implemented contract.

### Site settings

Public GETs: `/api/v1/b2c/site-settings` and `/api/v1/b2b/site-settings`; staff GET/PATCH use the same store segment under `/api/v1/admin/{store}/site-settings`. Public calls are guest-accessible; admin calls require same-store superAdmin/admin. This is one independent singleton per store. There are no per-page SEO, draft/publish, media, delete, or audit-read operations (NEW `SITESETTINGS_FRONTEND.md:9–37`).

Admin state contains `store`, `version`, `phone`, `email`, bilingual `address`, `mapUrl`, four social URLs, bilingual SEO `title`/`description`, shared `keywords`, and `updatedAt`; public output localizes address/title/description and omits version (NEW `:83–109`). PATCH reads/retains current `version`, accepts partial recognized nested fields, and publishes immediately. URL hosts are allowlisted per provider/map; do not render stored HTML. Defaults are valid empty settings, not 404, and do not invent contact values (`:39–81`, `:111–134`, `:210–232`).

### Homepage

Public GET is `/api/v1/{store}/homepage`; staff GET/PATCH is `/api/v1/admin/{store}/homepage`; raw uploads use `/api/v1/admin/{store}/homepage/media/:slotKey/:device`. Same-store superAdmin/admin can manage; there is no section creation, arbitrary page builder, draft/publish, or image URL input (NEW `HOMEPAGE_FRONTEND.md:9–24`). Admin state includes `version`, ordered `allowedSlots`, ordered `slots` with desktop/mobile images and bilingual alt, and B2C-only `newArrivals`/`sale` selections. B2B has no retail product lists (`:74–110`).

The immutable slot manifest has six B2C keys (`hero-left`, `hero-right`, `collection-men`, `collection-women`, `sale-feature`, `factory-story`) and seven B2B keys (`hero`, `service-spinning`, `service-weaving`, `service-fabric`, `service-school-uniforms`, `service-wholesale`, `wholesale-overview`) (`:26–46`). Every slot supports an optional mobile override. Public mobile fallback is mobile image, then desktop image, then frontend-approved fallback; API fields remain null when unset (`:48–54`).

B2C curation stores ordered arrays of 0–20 unique existing product IDs separately for new arrivals and sale. Admin receives both `productIds` and derived `visibleProductIds`; public lists return localized eligible product projections in saved order. Hidden/inactive products can remain selected but are filtered from public results; sale eligibility depends on a discounted sellable item/variant. These lists are not campaign definitions or price overrides (`:93–99`, `:112–132`, `:152–178`). PATCH requires current homepage version and replaces a supplied section's full `productIds` array; a timed-out save must be reconciled by GET before retry. Uploads are raw images and require a later versioned PATCH to publish (`:134–150`, `:326–330`).

### Reports

Three read-only B2C staff endpoints: `/api/v1/admin/b2c/reports/overview`, `/finance`, and `/sales-performance`; only same-store superAdmin/admin can call them. No B2B/public report route or export/write operation exists (NEW `REPORTS_FRONTEND.md:7–19`). All require `from` and `to` ISO timestamps with explicit offset; `to` is exclusive. `timezone` is only `Africa/Cairo` (default), `interval` is day/week/month (default day); range maximum is 366 elapsed 24-hour days. Performance additionally accepts `page`, `limit`, and `rankBy=units|merchandiseAmount`. Other filters, comparison periods, arbitrary timezone, CSV, profit, and user-configurable metrics are unsupported (`:21–42`).

Overview metrics count orders by creation time, including every current status; its top products are delivered-only and it includes up to five recent staff Order DTOs. Finance separates order-placement amounts from InstaPay/COD staff collection markers and refund markers; these are not settlement or net-cash figures. Performance ranks products from currently delivered orders placed in the selected period, and reports direct-category snapshots only (no ancestor rollup); older orders can have unknown category. All money is integer EGP piastres (divide by 100 only for display) (`:64–99`, `:101–123`, `:125–149`). UI must disclose the four stable limitations, preserve returned Cairo bucket boundaries/DST behavior, and not label these figures as collected revenue, profit, settled refunds, or bank balance (`:44–62`, `:56–60`). Backend aggregation is capped at 10 seconds; overflow totals return unavailable rather than approximations (`:189–204`).

### Media: public and private boundary

Ordinary catalog Media remains raw public image upload for an already-existing product/category target. B2C route is `POST /api/v1/admin/b2c/media/:kind/:targetId` with kind `product|category`; native B2B route is `/api/v1/admin/b2b/media/product/:targetId`. Body is raw JPEG/PNG/WebP, max 5 MiB and 20 megapixels, processed to public WebP; response is `{id,url,width,height}`. The ID is target/store/kind-bound and short-lived (24h) until attached. Attach through the owning Product/Category PATCH; no media library/list/delete/transfer exists (NEW `MEDIA_FRONTEND.md:15–54, 56–109, 149–157`).

Homepage and size-chart uploads use dedicated scoped endpoints and internal media kinds; do not construct target IDs or send these uploads through ordinary `/media/:kind/:targetId` (`MEDIA_FRONTEND.md:168–174`). These are public catalog assets. InstaPay proofs and B2B Lead images instead use separate private routes, authorization, storage namespace, and DTOs without public URLs; never send sensitive proofs or Lead files through catalog Media (`:141–147`).

## Source-only limitations

Contracts describe source-checked behavior and focused tests, but no live service was called and no API base URL is configured. Mocked/in-memory tests do not prove deployed database contention, Bunny/CDN behavior, browser rendering, SEO behavior, cache invalidation, or production load. Reports explicitly do not establish bank/refund settlement. The size-chart Figma/API mismatch remains open. No application, backend, or Figma files were changed by this review.
