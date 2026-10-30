# Narmer — size-chart design, frontend flow and backend alignment request

Prepared 23 October 2026. Scope: B2C size charts only.

## 1. Purpose, status and source authority

This document gives the backend developer the size-chart requirements visible in Narmer's CURRENT design, their frontend behavior, the existing API that must be reused, and a proposed contract extension to close the numeric-table mismatch. It is not a second size-chart module or a request to rebuild delivered functionality.

**The general implementation plan is still awaiting owner approval. No application code, backend, Figma, configuration, dependency or production change has been authorized or made by preparing this document.** This handoff may be sent for backend review and agreement. Proposed fields below must be confirmed in the returned backend contract before frontend integration treats them as available.

Three kinds of evidence are distinguished throughout:

- **Design/owner requirement:** a behavior shown in CURRENT Figma or explicitly stated by the owner.
- **Existing contract:** behavior already documented in `Backend Files/New Backend Files`.
- **Proposed API extension:** a minimal wire representation needed to support the numeric design; names, validation details and rollout need backend agreement. Figma does not define JSON property names or database schemas.

Important history: section 9.2 of the earlier `docs/NARMER_BACKEND_DEVELOPER_HANDOFF.md` explicitly requested image-based bilingual charts and deferred editable measurement rows. The NEW backend Size Charts contract delivered that image model. CURRENT D13 and K02 still show numeric tables. Therefore the present request is to align the existing module with that numeric design, not a claim that the backend failed to implement the previous image request. Do not automatically discard either existing data or the current design.

The implementation plan's image-based adaptation was a recommendation, not an approved design change. This standalone document describes the numeric design and the backend changes it would need; it does not silently approve a replacement design or authorize implementation.

## 2. Exact design references and provenance

Figma file: [Narmer UI Design — CURRENT](https://www.figma.com/design/sv4mjHZis8FDpvEMsrAJWM/Narmer-UI-Design).

| Reference                                | CURRENT nodes                                                                                | Evidence for this request                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D13 Size charts                          | EN desktop `191:18790`, EN mobile `191:18946`; AR desktop `191:19013`, AR mobile `191:19169` | Chart library; Add chart; English/Arabic name; measurement unit; Size/Chest/Length/Sleeve rows; Save chart; illustrative product count |
| D04 Retail product editor                | EN desktop `191:14886`; mobile `191:15075`; AR desktop `191:15178`; mobile `191:15367`       | Optional assigned size-chart selection in the Product editor                                                                           |
| K02 Product choices and size guide       | EN desktop `191:23445`, EN mobile `191:23512`; AR desktop `191:23577`, AR mobile `191:23644` | Optional customer size-guide dialog with numeric table; no assigned guide means no guide button; separate real size selection          |
| R02 Product detail                       | EN desktop `191:4681`                                                                        | Customer entry point; chart remains a guide, not the source of sellable variants                                                       |
| Latest mobile correction                 | `docs/design-work/approved-v2/parity-correction/MOBILE_AND_CART_CORRECTIONS.md:14`           | Mobile chart cards label Size, Chest, Length and Sleeve, including cm/سم for the sample                                                |
| Owner clarification in this conversation | 23 October 2026                                                                              | One chart may serve one product or several products; different products may each have their own chart                                  |

Live read-only design-context/screenshots checked for this handoff: D13 EN desktop, D13 AR mobile, D04 EN desktop and K02 EN desktop/AR mobile. Other node IDs above come from the CURRENT inventory/source lock. No BACKUP styling or historical source IDs are implementation references.

Supporting local sources, for traceability:

- [Current source lock](FIGMA_CURRENT_SOURCE_LOCK.json).
- [NEW Size Charts contract](../../Backend%20Files/New%20Backend%20Files/modules/SIZECHARTS_FRONTEND.md), especially scope, endpoints, DTO, Product assignment and error sections.
- [NEW Products contract](../../Backend%20Files/New%20Backend%20Files/modules/PRODUCTS_FRONTEND.md), final Optional reusable size charts section.
- [NEW API conventions](../../Backend%20Files/New%20Backend%20Files/api-conventions.md), envelopes, auth, localization and throttling.
- [Integrated mismatch evidence](BACKEND_ALIGNMENT_REVIEW.md).
- Historical design-content journals `docs/design-work/dashboard-content.js:14,27–28` and `state-content.js:10` corroborate the fields; do not rerun these Figma scripts.
- The older frontend handoff section 9.2 is evidence explaining the image contract, not the current API authority.

## 3. Product-to-chart relationships — explicit owner requirement

Use the existing Product `sizeChartId` relationship. Do not add a parallel Product measurement object or another assignment system.

1. A product can have **no size chart**. Its `sizeChartId` is null and the customer does not see a size-guide action.
2. A product can have **one assigned chart at a time**.
3. A chart can be assigned to **one product** as that product's individual guide.
4. The **same chart can be assigned to multiple products**.
5. Different products can each have **different charts**. Every product may therefore have its own chart when required.
6. The relationship already applies to B2C simple and variant products. It is Product-level, not per variant, color or category.

Illustrative relationship, not seeded catalog data:

| Product   | Assigned chart | Meaning                           |
| --------- | -------------- | --------------------------------- |
| Product A | Chart X        | Uses a shared guide               |
| Product B | Chart X        | Uses that same guide              |
| Product C | Chart Y        | Has a different, individual guide |
| Product D | null           | Has no guide                      |

Editing Chart X changes the current guide for both A and B. Reassigning only B to Chart Z leaves A on Chart X. If B needs different measurements, create/select a different chart and reassign B; do not edit the shared chart expecting the change to affect only B. Clearing B's assignment does not delete Chart X or change A.

Reuse the existing reference-protected deletion: a chart assigned to any extant Product, active or inactive, cannot be permanently deleted. Deactivation can hide its public guide while preserving assignments. No cascade, automatic copy, category assignment, bulk-assignment API or assignment-history feature is requested.

## 4. What the frontend needs to render

### 4.1 Staff chart library and editor

The D13 flow is:

1. Read the chart library, including the real number of assigned products if retaining the design's count.
2. Select a chart or choose Add chart.
3. Edit its English name, Arabic name, measurement unit and ordered measurement rows.
4. Save to the server. On success, replace local state with the canonical returned chart and current version.
5. Assign it through the existing Product editor, separately from editing the chart.

The numeric columns shown are exactly:

| Meaning            | English label    | Arabic label     | Proposed wire field |
| ------------------ | ---------------- | ---------------- | ------------------- |
| Size display label | Size             | المقاس           | `size`              |
| Chest measurement  | Chest            | الصدر            | `chest`             |
| Length measurement | Length           | الطول            | `length`            |
| Sleeve measurement | Sleeve           | الكم             | `sleeve`            |
| Unit for the table | cm in the sample | سم in the sample | `unit`              |

Sample rows in BOTH inspected D13 and K02 are S / 50 / 66 / 60, M / 53 / 69 / 62, L / 56 / 72 / 64. **They are design examples, not factory-approved measurements, defaults to seed, size limits or evidence of a measurement method.** In particular, the sources do not define whether Chest means flat garment width or circumference. Do not convert or reinterpret it.

Desktop shows a table. Mobile D13 uses labelled cards for each row; numbers cannot appear without their measurement labels. Row order comes from saved chart data, not alphabetic size sorting. English uses supplied Brice and Arabic uses Cairo; size codes and numeric values can remain deliberate LTR content inside RTL layout. The frontend localizes fixed headings and the unit display; numeric values do not need duplicate Arabic storage.

Cell editing is the functional realization of the numeric editor. The exact row add/remove/reorder controls are not fully specified by the static preview; do not treat a drag-and-drop editor or a generic column builder as a requirement. The API needs to preserve an explicitly submitted ordered list; any additional editor affordances remain normal frontend/design review work after approval.

### 4.2 Product assignment

The Product editor offers an optional selection populated from the existing chart list. Staff can retain the current chart, choose another or clear it. Keep the Product's version separate from the chart's version. Do not copy measurement rows into the Product request or repeat chart writes when assigning a chart.

An inactive assigned chart remains visible to authorized staff as an assignment, but does not produce a customer guide. The current contract already permits assigning an inactive chart. Keep this behavior unless explicitly changed and documented.

### 4.3 Customer guide

Open Product detail using its real ID. If its localized `sizeChart` is non-null and contains usable guide content, show the optional size-guide action and accessible dialog. Display the saved row order, measurements and unit; close returns focus to the opening action.

The guide does not choose a variant, create option combinations, reserve stock or add anything to Cart. Sizes available for purchase come exclusively from actual Product options/variants. A shared chart can contain a row for a size that a particular product does not sell; the guide must not make that size purchasable. No automatic filtering by variants or row-to-variant assignment is specified by the design.

Handle absent/inactive/unavailable guide content without breaking normal product selection. Chart changes affect subsequent Product reads; refresh/invalidate the applicable frontend Product data after staff chart edits rather than copying measurements into Cart/Orders.

## 5. Existing functionality to reuse and precise gap

| Area                        | Already documented                                                                                              | Required alignment for numeric design                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Resource identity and CRUD  | Existing B2C Size Charts module, IDs, versions, bilingual names and timestamps                                  | Extend the same resource, not a second table-guide module                                                              |
| Chart content               | EN/AR public images and alt text only                                                                           | Add structured unit and ordered Size/Chest/Length/Sleeve measurements                                                  |
| Product linkage             | Optional `sizeChartId`; one chart can already be referenced by multiple Products                                | Preserve and use it; no new assignment endpoint                                                                        |
| Public Product guide        | Nullable localized `{id,name,image,alt}`                                                                        | Supply structured numeric content through this same Product projection                                                 |
| Library product count       | No count/list exists                                                                                            | Add a derived admin-only count for the visible D13 count, or explicitly agree a design change; never fake “4 products” |
| Permissions and concurrency | Same-store staff roles, independent Product/chart versions, reference protection and audit/transaction behavior | Preserve these for numeric edits and Product/delete races                                                              |
| Uploads                     | Dedicated target/language-bound image route and existing cleanup                                                | Do not make image upload compulsory for a numeric chart or delete existing images silently                             |

No new public size-chart directory/detail route, duplicate product chart endpoint, measurement engine for arbitrary columns, automatic recommendations, fit calculator, inches conversion, chart import/export/PDF service or B2B chart feature is requested.

## 6. Proposed minimal data extension — not delivered yet

Propose adding these fields to the existing `AdminSizeChart`:

| Field                                | Proposed type and behavior                    | Source/status                                                                |
| ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------- |
| `measurements`                       | null or `{unit,rows}`                         | New wire representation for the numeric editor                               |
| `measurements.unit`                  | `"cm"` for the currently evidenced chart      | The design shows cm/سم; no other unit or conversion behavior has been agreed |
| `measurements.rows`                  | Ordered array of `{size,chest,length,sleeve}` | Fixed four-column design; array order is display order                       |
| `rows[].size`                        | Non-empty text display label                  | S/M/L are samples, not a closed enum or a Product option key                 |
| `rows[].chest`, `.length`, `.sleeve` | Finite JSON numbers in the table's unit       | Numeric cells, not money, pixels or strings with unit suffixes               |
| `assignedProductCount`               | Read-only nonnegative integer                 | Required data for D13's displayed product count; new response field          |

Retain existing `id`, `version`, `name:{en,ar}`, `isActive`, `images:{en,ar}`, `alt:{en,ar}`, `createdAt` and `updatedAt`. Do not add a redundant mode/type system or duplicate the rows per language. No individual row IDs are required by this design; a full ordered replacement is sufficient as a proposed write model.

Proposed count definition for backend confirmation: count extant B2C Product records whose `sizeChartId` equals this chart, including inactive products, once per Product, regardless of variant count or category visibility. This matches the existing reference-protected relationship. It is not a count of one frontend page or only public products. Derive it from assignments instead of creating another writable counter. Product reassignment may change the count without changing chart edit version. The count is informational; deletion must still perform the actual authoritative reference check.

### 6.1 Proposed validation and edit semantics

The design does not establish numeric maxima, decimal precision, maximum row count, duplicate-label rules or whether every garment must supply every shown measurement. The backend must confirm these before this schema becomes final; do not infer a three-row maximum, integer-only precision or an allowance for blank sleeve values from the sample.

Proposed baseline, subject to those confirmations:

- Non-null measurement content has a supported unit and at least one complete row; values are finite positive numbers. No NaN/Infinity, unit-bearing strings, arbitrary objects or HTML.
- Reject unknown measurement keys instead of saving a generic schema. Numeric range, precision, size-label length and row-count bounds must be documented by the backend before implementation/integration.
- PATCH omission of `measurements` preserves it. Supplying an object replaces the complete table, including its unit and ordered rows, atomically. Do not merge by array index or silently retain omitted old rows.
- Proposed `measurements:null` clears only numeric content. Existing images and Product assignments remain unless explicitly edited through their own fields. This clearing rule is new and needs agreement.
- Retain current numeric `version` requirements, success increment, atomic rollback and conflict handling. `assignedProductCount` is never writable.
- Extend the existing active-content rule so a numeric-only chart can be active without an image, while existing active image charts remain valid. Proposed condition: active requires at least one usable content source, valid measurements OR an attached image. Clearing the last usable content source while active must fail unless the same PATCH deactivates the chart.
- D13 shows Save, but no explicit activation toggle. The backend already has `isActive`; agree how the future editor exposes publication. Do not infer that every Save automatically publishes or introduce a new publish endpoint. Example requests below use inactive creation followed by explicit activation for clarity, not proof of an approved new UI control.

## 7. Transport, permissions and shared response rules

API origin is intentionally not configured. Paths below are contract paths only, not addresses to call. Preserve `/api/v1` exactly once. No credential, provider or environment change is requested.

| Setting       | Existing requirement                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | `Bearer <B2C accessToken>` for every admin chart/Product operation                                                                                    |
| Roles         | B2C superAdmin/admin list/read/create/edit/upload; superAdmin alone deletes. Moderator/customer cannot manage charts. Wrong-store bearer is rejected. |
| Language      | `X-Language: en` or `ar`; optional Accept-Language fallback. Admin name/alt stay bilingual; public name/alt localize.                                 |
| Content-Type  | JSON for create/PATCH; exact image MIME for the existing raw upload                                                                                   |
| Cache         | Chart management uses `Cache-Control:no-store`; preserve the existing route/header behavior                                                           |
| Identity      | IDs are server-issued normalized 24-hex ObjectIds. `chartId`, Product ID, image ID and Product variant IDs are different identities.                  |
| Cookies       | Charts are bearer-authenticated; no new chart cookie, guest token or refresh-token body field                                                         |
| Limits        | Existing JSON 100 KiB limit, shared API/account limits and route-specific image limits remain. Honor Retry-After; no refresh loop on 403/429.         |

Success envelope: `{success:true,code,message,data,requestId}`. Create/upload returns 201; normal read/PATCH/delete returns 200. Delete has `data:null`. Errors contain `{success:false,code,message,errors,requestId}` with no `data` key. Branch on codes, not localized messages.

## 8. Request/response matrix — reuse the existing routes

**No additional route is proposed.** Existing paths/verbs/statuses below are already documented. New fields/content rules are the proposed extension, not a claim that current requests accept them.

| Operation                                                      | Request                                                                      | Success data                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /api/v1/admin/b2c/size-charts`                            | Existing `page`, `limit`, optional `isActive`; no body                       | `{items:[AdminSizeChart],pagination}`; add measurements/count to each item                                         |
| `POST /api/v1/admin/b2c/size-charts`                           | Existing bilingual name/optional isActive; propose optional measurements     | Complete AdminSizeChart, version initially 0                                                                       |
| `GET /api/v1/admin/b2c/size-charts/:chartId`                   | Real chart ID; no body                                                       | Complete AdminSizeChart including measurements/count                                                               |
| `PATCH /api/v1/admin/b2c/size-charts/:chartId`                 | Current chart version, existing editable fields and/or proposed measurements | Complete canonical AdminSizeChart with incremented version                                                         |
| `DELETE /api/v1/admin/b2c/size-charts/:chartId`                | No body/version; superAdmin                                                  | `data:null`; reject assigned charts                                                                                |
| `POST /api/v1/admin/b2c/size-charts/:chartId/images/:language` | Existing raw image contract; existing chart, en/ar                           | Existing Image `{id,url,width,height}`; does not attach/publish                                                    |
| Existing admin Products POST                                   | Existing complete Product create body, optional `sizeChartId`                | Existing Product DTO; nullable `sizeChartId` already exists                                                        |
| Existing admin Products PATCH                                  | Product version plus `sizeChartId` to assign/reassign/clear                  | Existing Product DTO with new Product version; not chart version                                                   |
| Existing public Products list/detail                           | Existing reads, language and filters                                         | Existing Product DTO with extended nullable `sizeChart` projection                                                 |
| Existing Homepage Product projections                          | Existing Homepage read                                                       | Reuse the same updated public Product guide projection where already included; no separate Homepage chart settings |

List queries retain current bounds: page 1–100000, default 1; limit 1–100, default 20; isActive exact scalar true/false, omitted includes both. Order remains createdAt descending then chart ID descending. No search, assigned-product browser or custom sort is requested. Empty data is `{items:[],pagination:{page:1,limit:20,total:0,pages:0}}` for the default empty page.

## 9. Complete chart payload examples

All identifiers/timestamps/example chart data below are synthetic. Numeric rows repeat the CURRENT design examples solely to demonstrate field mapping; do not seed them as real measurements. Proposed measurement/count fields are not currently accepted/returned.

### 9.1 Create a numeric chart using the existing POST

`POST /api/v1/admin/b2c/size-charts`, proposed request:

```json
{
  "name": { "en": "Hoodie chart", "ar": "جدول الهودي" },
  "isActive": false,
  "measurements": {
    "unit": "cm",
    "rows": [
      { "size": "S", "chest": 50, "length": 66, "sleeve": 60 },
      { "size": "M", "chest": 53, "length": 69, "sleeve": 62 },
      { "size": "L", "chest": 56, "length": 72, "sleeve": 64 }
    ]
  }
}
```

Proposed complete 201 response; this object defines the extended AdminSizeChart example reused by the read/list/PATCH operations:

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "id": "66f000000000000000000010",
    "version": 0,
    "name": { "en": "Hoodie chart", "ar": "جدول الهودي" },
    "isActive": false,
    "images": { "en": null, "ar": null },
    "alt": { "en": "", "ar": "" },
    "measurements": {
      "unit": "cm",
      "rows": [
        { "size": "S", "chest": 50, "length": 66, "sleeve": 60 },
        { "size": "M", "chest": 53, "length": 69, "sleeve": 62 },
        { "size": "L", "chest": 56, "length": 72, "sleeve": 64 }
      ]
    },
    "assignedProductCount": 0,
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:00:00.000Z"
  },
  "requestId": "f138736c-2bce-4b41-b229-7b044998ceef"
}
```

Do not send response-only fields such as id, images, assignedProductCount or timestamps. Existing create without measurements must remain able to create the image-based inactive record unless the backend explicitly negotiates a breaking change. As before, a timed-out generic create is not safely replayable; preserve input and reconcile the library before creating again.

### 9.2 List and detail

`GET /api/v1/admin/b2c/size-charts?page=1&limit=20` returns the ordinary success envelope. Its data is `{items:[AdminSizeChart],pagination:{page,limit,total,pages}}`; each item has all fields from the complete example in 9.1, including the current derived count. `GET /api/v1/admin/b2c/size-charts/66f000000000000000000010` returns one complete AdminSizeChart directly in `data`, not `data.items`.

Neither GET creates charts, changes versions nor edits assignments. A zero assignedProductCount is valid. A failed request must not be rendered as an empty successful library.

### 9.3 Save measurements and activate, using existing PATCH

`PATCH /api/v1/admin/b2c/size-charts/66f000000000000000000010`, proposed request after reading version 0:

```json
{
  "version": 0,
  "measurements": {
    "unit": "cm",
    "rows": [
      { "size": "S", "chest": 50, "length": 66, "sleeve": 60 },
      { "size": "M", "chest": 53, "length": 69, "sleeve": 62 },
      { "size": "L", "chest": 56, "length": 72, "sleeve": 64 }
    ]
  },
  "isActive": true
}
```

200 response uses the same complete envelope/AdminSizeChart fields as 9.1, with version 1, isActive true, the normalized saved measurements, current assignedProductCount and updatedAt. Do not return only a success message or discard the current image/alt fields. Name and alt continue their existing partial-language merge behavior, while a supplied measurement table is a full replacement.

Examples of independent edits using the latest chart version:

```json
{
  "version": 1,
  "name": { "ar": "جدول مقاسات الهودي" }
}
```

This preserves name.en, measurements, image attachments and activation. A proposed table clear/deactivation request is:

```json
{
  "version": 2,
  "measurements": null,
  "isActive": false
}
```

It must not clear assignments or image attachments. The response still returns the full canonical chart. Versions in these examples are illustrative; always read/use the actual current version.

### 9.4 Delete

`DELETE /api/v1/admin/b2c/size-charts/:chartId`, no body. Existing success response:

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": null,
  "requestId": "f138736c-2bce-4b41-b229-7b044998ceef"
}
```

Reject with existing 409 SIZE_CHART_IN_USE while any Product references it. Never rely on a possibly stale displayed count to authorize deletion. Product assignment versus chart deletion must preserve the existing atomic reference guard. A repeated completed delete returns the existing not-found result; it does not recreate anything.

### 9.5 Existing image upload, retained without a duplicate flow

Keep `POST /api/v1/admin/b2c/size-charts/:chartId/images/en` or `/ar` for existing image support. One raw JPEG/PNG/WebP file, matching MIME, max 5 MiB and existing decoded-image safety rules. No JSON/base64/multipart/PDF/SVG. 201 success data remains:

```json
{
  "id": "66f000000000000000000020",
  "url": "https://example.com/synthetic-size-chart.webp",
  "width": 1200,
  "height": 1000
}
```

This is the complete upload **data object**, wrapped in the normal success envelope on the wire; the URL is explicitly synthetic, not a configured Narmer CDN. Attach it through existing chart PATCH with current version and `imageIds:{en:<uploadId>}` or ar. Upload alone does not publish, attach, increment version or create numeric rows. It is not required by the numeric D13 flow.

Preserve chart/language ownership, 24h unattached asset expiry, existing public-image processing, rate limits, transactional retirement and backend cleanup. Numeric edits cannot silently retire those assets or use public product/gallery/private proof routes for chart uploads. No image-to-measurements conversion or OCR is requested.

## 10. Existing Product requests — no duplicated chart content

### 10.1 Assign/reassign/clear on an existing Product

Read `GET /api/v1/admin/b2c/products/:productId` and retain its Product version and current nullable sizeChartId. Example assignment/reassignment request to existing `PATCH /api/v1/admin/b2c/products/:productId`:

```json
{
  "version": 7,
  "sizeChartId": "66f000000000000000000010"
}
```

Assigning the same ID to a second Product uses that second Product's own ID and current version in a separate existing Product PATCH. There is no new multi-assignment endpoint and no measurement-table duplication. To give it an individual guide, use a different chart ID.

Clear with:

```json
{
  "version": 8,
  "sizeChartId": null
}
```

Omission preserves assignment. Missing chart fails existing 404 SIZE_CHART_NOT_FOUND. Product stale version fails existing 409 PRODUCT_CONFLICT. Successful Product PATCH returns the complete existing dashboard Product DTO, including nullable sizeChartId and the incremented **Product** version. It does not return only a chart or change chart version. Unrelated Product fields follow the Products contract and must not be reset.

### 10.2 Assignment during Product creation

Existing Product POST already accepts optional sizeChartId alongside its own required create fields. This illustrative complete minimum simple-product body is only to show the caller integration; it is not catalog content or a request to change Product creation:

```json
{
  "type": "simple",
  "categoryId": "66f000000000000000000011",
  "slug": "synthetic-product",
  "name": { "en": "Example product", "ar": "منتج توضيحي" },
  "price": 25000,
  "sizeChartId": "66f000000000000000000010"
}
```

The category/chart IDs must come from preceding actual responses. 201 returns the complete dashboard Product DTO with its new ID, version 0 and sizeChartId. Create omission defaults sizeChartId null. The same optional assignment belongs in the existing variant-product create flow without altering its required options/variant fields. Do not add chart measurements, count, prices or stock to the chart request; the example Product price is existing integer piastres and has no chart meaning.

## 11. Public response required for the customer numeric guide

Keep the guide nested in the existing Product reads. Proposed complete **sizeChart field** for a numeric-only active chart, in an English localized Product response:

```json
{
  "id": "66f000000000000000000010",
  "name": "Hoodie chart",
  "image": null,
  "alt": "Hoodie chart",
  "measurements": {
    "unit": "cm",
    "rows": [
      { "size": "S", "chest": 50, "length": 66, "sleeve": 60 },
      { "size": "M", "chest": 53, "length": 69, "sleeve": 62 },
      { "size": "L", "chest": 56, "length": 72, "sleeve": 64 }
    ]
  }
}
```

This object is `Product.sizeChart`, not a new endpoint response/envelope. With `X-Language:ar`, name/alt use existing localization/fallback rules; unit and shared rows stay structurally identical. The frontend supplies translated fixed column headings and displays cm as سم in Arabic. Do not send both languages, admin version, count, assignments, provider internals or other products in the public guide.

Existing Product responses stay otherwise intact:

- Product detail: normal envelope, direct Product in data.
- Product list: normal envelope, items/pagination; each Product uses the same guide projection.
- Homepage curated Products: existing Product projection gets the same guide extension; no new Homepage field or request.
- Facets has no guide content to extend.
- Cart, Wishlist, Orders/receipts and B2B Wholesale retain their explicitly documented boundaries; do not add chart rows/snapshots to those DTOs. Open B2C Product detail when a current guide is needed.

No assignment, inactive chart, deleted/unresolvable chart or no usable content returns the existing `sizeChart:null`; hide only the guide action. Normal Product availability still follows its own rules.

**Compatibility decision:** image was previously guaranteed non-null within a non-null public chart. Numeric-only content requires image to become nullable (or another explicitly negotiated versioned representation). That is a contract change, not harmless extra metadata. Preserve existing image-only records and coordinate affected consumers/exports. Proposed renderer precedence is measurements when valid, otherwise the existing image. This makes the numeric design usable while retaining delivered image data, but precedence and nullable-image compatibility must be confirmed by the backend/owner before integration.

For legacy image-only charts, propose `measurements:null`, keep the existing localized image/alt, and preserve current visibility. Do not claim all legacy images can be rendered as numeric tables. Never invent measurements to fill that gap.

## 12. Errors, failed saves and conflicts

Reuse existing codes; a new numeric-specific error code is not required by the design. The backend should add accurate field paths for measurement validation to its existing VALIDATION_ERROR envelope.

Illustrative proposed numeric field error:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Please check the submitted fields.",
  "errors": [
    {
      "field": "measurements.rows[0].chest",
      "location": "body",
      "code": "INVALID_FIELD",
      "message": "Enter a valid chest measurement."
    }
  ],
  "requestId": "f138736c-2bce-4b41-b229-7b044998ceef"
}
```

The exact validation rule/message follows the finally agreed numeric policy. Errors may still have an empty errors array for business failures; the frontend preserves input and shows top-level feedback.

| Existing status/code                                                                 | Required handling                                                                                                     |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 401 UNAUTHORIZED                                                                     | Existing appropriate coordinated refresh/sign-in behavior; preserve editor input; no wrong-store fallback             |
| 403 FORBIDDEN                                                                        | Respect role restriction; refresh cannot grant access/delete permission                                               |
| 404 SIZE_CHART_NOT_FOUND                                                             | Refresh list/selection, do not invent a chart ID                                                                      |
| 409 SIZE_CHART_CONFLICT                                                              | Refetch complete chart, retain unsaved edits and reconcile; never replace version and overwrite automatically         |
| 409 SIZE_CHART_IN_USE                                                                | Preserve chart; remove intended assignments explicitly or deactivate; no cascade                                      |
| 409 PRODUCT_CONFLICT                                                                 | Reconcile Product assignment using current Product version, not chart version                                         |
| 409 MEDIA_CONFLICT                                                                   | Existing target/language/expiry attachment handling; independent of numeric table                                     |
| 422 VALIDATION_ERROR                                                                 | Show name/unit/row/measurement or activation errors; failed edit must leave all existing content/assignments intact   |
| 413 BODY_TOO_LARGE                                                                   | Existing JSON/raw-file limits; numeric row limit still needs explicit agreement                                       |
| 422 INVALID_IMAGE / INVALID_FIELD, 415 IMAGE_TYPE_UNSUPPORTED / UNSUPPORTED_ENCODING | Existing image upload/encoding rules only                                                                             |
| 429 TOO_MANY_REQUESTS                                                                | Keep edits/version/upload IDs, honor Retry-After; no save/poll/refresh loop                                           |
| 503 MEDIA_UNAVAILABLE / 502 MEDIA_STORAGE_FAILED                                     | Existing upload failure; numeric saves should not require an image upload just to pass activation                     |
| 503 TRANSACTIONS_REQUIRED / NOT_READY                                                | Report unavailable; no client retry can supply missing transaction support                                            |
| 500 INTERNAL_ERROR / network timeout                                                 | Preserve inputs. Re-read before deciding whether a create/PATCH committed; generic creates/uploads are not idempotent |

Numeric saves must not partially update rows, advance version on a failed transaction or lose existing attachments. The current catalog/reference protection must continue to handle simultaneous assignment/deletion safely. Counts are derived display data, not authorization.

## 13. Boundaries and migration: prevent duplication or missing callers

Backend work, if the extension is agreed:

1. Extend the existing Size Charts schema, validators, serialization, service and existing routes with measurements and the agreed derived admin count. Preserve IDs, versions and references.
2. Extend the existing Product public guide serializer/resolver, including list/detail and Homepage's reused projection. Ensure numeric-only active charts resolve without requiring an image. Preserve other Product fields and filtering/Cart rules.
3. Retain existing Product assignment, role policy, reference-protected deletion, transactions/audits and image upload/cleanup. Do not create alternative chart models or assignment APIs.
4. Handle legacy records without a measurements field as agreed, normally null. No destructive migration, image deletion, automatic measurement seed or Product duplication. Identify any real consumers affected by nullable public image before rollout.
5. Derive counts without frontend full-catalog scans or one query per row where avoidable; retain correct counting across Product create/reassignment/clear/delete. Reuse existing references rather than duplicating ownership state.
6. Update backend-maintained module originals, Products/public-projection notes and affected flow/examples. Regenerate the delivered copies and update relevant OpenAPI/Postman schemas/examples through the backend's existing documented process. Do not independently edit generated package copies to imply implementation.

Frontend work, after general implementation approval and contract agreement:

- D13 library, real count, names/unit/numeric editor, canonical save/version/error states.
- D04 optional Product assignment with one-to-one or shared use, independent Product version and explicit clear.
- R02/K02 numeric dialog, mobile labelled presentation, localization, accessible open/close and honest null/legacy behavior.
- Refetch/invalidate relevant current guide data after edits. Do not alter Product variants/Cart, record measurements in Orders, introduce B2B charts or hardcode the sample chart.

This handoff does not request backend architecture changes, account provisioning, a new provider, new credentials or a deployment. Database/runtime implementation is the backend developer's responsibility within the existing module boundaries.

## 14. Decisions the backend must return before the contract is final

These details are not settled by the design; explicitly answer them instead of silently inventing business behavior:

1. Confirm the proposed `measurements:{unit,rows}` field names and full-replacement/clear semantics, or return an equally small compatible representation with complete examples.
2. Confirm supported units. Only cm is evidenced. Do not add inches/conversion as an assumed requirement.
3. Confirm measurement meaning with the client/factory, especially flat width versus circumference. Do not relabel the sample as body measurements, double values or infer tolerance/instructions.
4. Confirm numeric range/precision, maximum rows and size-label limits/duplicate rules; state whether all three measurements must be present or any can be absent. Current samples do not answer those questions.
5. Confirm activation for numeric-only content and how Save/publication is represented in the future editor; preserve existing isActive behavior deliberately.
6. Confirm `assignedProductCount` definition and inclusion in admin list/detail/create/PATCH, with no public exposure or writable count. If not supplied, explicitly flag the D13 count as unsupported for owner decision.
7. Confirm legacy image preservation, public `image:null` compatibility and numeric-versus-image display precedence. Identify any existing consumer that needs coordinated adaptation.

Factory-approved chart names, actual rows/values and the actual Product assignments are content inputs, not data for the developer to invent. These open details do not justify omitting the rest of the documented design/flow.

## 15. Focused acceptance checklist

- Create/read/update a real numeric chart with bilingual names and ordered size/chest/length/sleeve content; reload proves persistence, not frontend-only state.
- Numeric-only chart can become public under the agreed activation rules without a compulsory image upload.
- Product A uses X; Product B also uses X; Product C uses Y; Product D has null. Reassign/clear B without changing A/C/D. Editing X changes the current guide for its remaining assigned products only.
- Simple and variant Products can select a chart; a Product never has multiple chart IDs. Real variant choices remain independent of guide rows.
- The chart library count is server-derived, correct for the agreed scope and not the count of a paginated frontend selection.
- Null/inactive/unavailable chart hides the guide action without hiding an otherwise public product. An inactive assigned chart remains manageable by staff.
- English/Arabic and desktop/mobile display labelled measurements/unit in saved order. Keyboard open/close restores focus; mobile numbers remain associated with labels.
- Validate malformed name/unit/rows/values, final agreed numeric/size limits, unknown keys, empty table and safe clear/activation. No rows or images are silently destroyed on rejection.
- Two concurrent chart saves yield one accepted version and a clear conflict. Product assignment version and chart edit version remain independent.
- Reference-protected deletion includes inactive assigned Products and competing assignment/deletion. Display count cannot bypass that protection.
- Existing image-only charts and upload/attachment/cleanup remain usable under the agreed compatibility rules. No fabricated OCR/measurements or destructive migration.
- Public Product list/detail and Homepage's reused Product projection agree. Cart/Wishlist/Orders/B2B DTOs do not accidentally gain measurement payloads or new behavior.
- Current same-store role restrictions and shared errors/envelopes remain intact; errors preserve input and 429 respects Retry-After.
- Backend returns updated exact module/field documentation and generated examples, including numeric-only, image-only, null, Arabic, empty list, conflict and in-use deletion cases. Report tests actually run and remaining live/provider/migration limits separately.

## 16. Requested backend reply

Return a size-chart-specific response confirming: reused routes/module, final request/response schemas and field bounds, decisions in section 14, exact affected Product projections, compatibility handling, tests/evidence and any remaining blocker. Identify deviations from this design explicitly. Do not simply state “size charts implemented” while returning only the existing image DTO.

Verification for this handoff is read-only source/design comparison plus document checks. No running backend/API origin, backend source tests, real database records, migration or live provider behavior was verified. General frontend implementation remains on hold pending owner approval.
