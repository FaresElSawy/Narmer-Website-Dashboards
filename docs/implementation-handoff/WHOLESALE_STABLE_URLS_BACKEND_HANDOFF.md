# Narmer B2B — stable wholesale-offer URLs and redirects

24 October 2026. Prepared for the backend developer at the owner's request.

**Update, 24 October: backend response received.** The new package now documents the saved fields, resolver and versioned URL edits requested here. Read [the backend response](../../Backend%20Files/New%20Backend%20Files/wholesale-stable-urls.md) and [the frontend review](BACKEND_UPDATE_REVIEW_2026-10-24.md), including two generated-schema corrections. A missing-key live resolver check returned the documented 404, but the catalog is empty, so real saved-slug/alias behavior remains unverified. Frontend adapter and website-host 308 integration remain pending. The detailed request and examples below are retained as the original requirement; they are not captured live responses.

This document covers only B2B wholesale-offer URLs. It does not request a new product module, duplicate detail pages, a B2B cart, changes to pouch composition, or changes to B2C Product URLs.

## 1. Required result

An offer's public URL must stay stable when its displayed name, source-product name, description, photos, composition or publication state changes.

Example:

1. Staff creates an offer named **Logo hoodie**.
2. Its URL becomes `/en/wholesale/offers/logo-hoodie`.
3. Staff later changes the displayed name to **Classic Logo Hoodie**.
4. The URL remains `/en/wholesale/offers/logo-hoodie`.
5. If an authorized operator deliberately changes the URL name to `classic-logo-hoodie`, the old address must still identify the same offer and redirect to the current address.

MongoDB IDs remain the authoritative identity for existing API calls, dashboard editing/deletion and inquiry submissions. A readable URL name is an additional field, not a replacement for the ID.

**The URL belongs to the wholesale offer, not its source product.** Several offers can reference the same product with different pouch compositions. Each offer needs its own unique URL. The reused B2C Product's slug must not be substituted for the offer's slug.

## 2. Existing behavior and source of this request

### Backend behavior already delivered

- `GET /api/v1/b2b/wholesale/offers` returns available localized offers with pagination.
- `GET /api/v1/b2b/wholesale/offers/:resourceId` accepts an offer's 24-hex ID, not a slug.
- Dashboard list/create/detail/PATCH/DELETE operate on `/api/v1/admin/b2b/wholesale/offers`, with ID paths where applicable.
- `name` is editable and bilingual in dashboard responses; public responses localize it.
- Offer DTOs have no saved offer slug or URL-history fields.
- The source-product projection deliberately excludes retail Product slugs.
- Existing safe integer versions, role restrictions, availability checks, transactional writes and immutable source references already apply.

Authority: [Wholesale contract](../../Backend%20Files/New%20Backend%20Files/modules/WHOLESALE_FRONTEND.md), especially “Offer request bodies,” “Offer fields,” “Public browse and Lead inquiry workflow” and the error/recovery table. [API conventions](../../Backend%20Files/New%20Backend%20Files/api-conventions.md) control envelopes, language, authentication and throttling. [Leads](../../Backend%20Files/New%20Backend%20Files/modules/LEADS_FRONTEND.md) controls inquiry identities and snapshots.

### Current frontend workaround

`shared/lib/offer-slugs.js` generates names from the current English offer name, sorts by ID and adds small numerical suffixes for duplicates. `B2B-Website/src/features/inquiry/api.js` can read every public offer page to construct an ID-to-name map. `Wholesale.jsx`, pre-rendering and named HTML output use that map. Legacy ID URLs are redirected by the local generated routing rules and/or client navigation.

That works for the current review, but a display-name edit or catalog membership change can change the generated mapping. A direct link also should not need to download the whole English catalog to discover one offer's ID. The authoritative saved slug and lookup requested here remove those limitations.

## 3. Proposed minimal contract

Use the existing Wholesale resource and existing write endpoints. Add:

1. A saved `slug` on each offer.
2. A saved, read-only `slugAliases` list containing that offer's former public slugs.
3. These two fields on existing offer DTOs.
4. One public resolver that returns a complete, currently available offer by canonical slug, historical alias or legacy offer ID.
5. An optional `slug` field on the existing versioned offer PATCH, used only for a deliberate URL change. Ordinary name editing does not send it.

No separate alias-management API, per-language slug system, URL-history dashboard, generic redirect service, new public product endpoint or duplicate offer page is requested. The current dashboard is not being given an automatic “change URL when name changes” behavior or a new URL-editing interface by this handoff.

| Method/path                                             | Status                        | Required contract                                                                                                                                   |
| ------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/b2b/wholesale/offers`                      | Existing, extend DTO          | Add `slug` and `slugAliases` to every returned offer. Retain all existing queries/pagination.                                                       |
| `GET /api/v1/b2b/wholesale/offers/:resourceId`          | Existing, keep ID-only        | Same existing ID validation/statuses; add the two fields to the returned offer.                                                                     |
| `GET /api/v1/b2b/wholesale/offers/resolve/:offerKey`    | **Proposed new public route** | Accept canonical slug, alias or legacy 24-hex ID; return the same complete public offer DTO with its current slug.                                  |
| `GET /api/v1/admin/b2b/wholesale/offers`                | Existing, extend DTO          | Add the two fields to each management offer, including unavailable/unpublished records staff can already see.                                       |
| `POST /api/v1/admin/b2b/wholesale/offers`               | Existing, extend result       | Generate/persist the slug once; return it and `slugAliases:[]`. Existing create fields remain unchanged.                                            |
| `GET /api/v1/admin/b2b/wholesale/offers/:resourceId`    | Existing, extend DTO          | Add the two fields; ID-based staff access stays unchanged.                                                                                          |
| `PATCH /api/v1/admin/b2b/wholesale/offers/:resourceId`  | Existing, extend input/result | Add optional deliberate `slug` edit; require the existing current offer `version`.                                                                  |
| `DELETE /api/v1/admin/b2b/wholesale/offers/:resourceId` | Existing, preserve behavior   | Keep permission/reference guards and `200` with `data:null`. Retain an internal reservation of URL keys so another offer cannot acquire them later. |

If the backend prefers an equivalent resolver route name, confirm it in the returned contract before frontend implementation. Do not silently change the existing ID route to ambiguously accept unrelated identifiers.

## 4. Saved fields, language and allocation

### Required returned fields

| Field         | Proposed exact type                                | Ownership and meaning                                                                                                                 |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`        | Required nonempty string                           | Server-persisted current canonical URL name, shared by English and Arabic.                                                            |
| `slugAliases` | Required array of distinct strings; `[]` initially | Read-only former URL names owned by this offer. Does not include the current slug, IDs, domains, language prefixes or complete paths. |

Return them on the **offer**, never inside `product`. An unavailable dashboard offer still retains these fields even when its existing `product` is null. Public reads must not expose an unavailable offer's aliases or other metadata.

The same saved slug appears in both language routes:

```text
/en/wholesale/offers/logo-hoodie
/ar/wholesale/offers/logo-hoodie
```

`X-Language` continues to localize public offer/product text and messages; it does not change slug allocation or lookup. Dashboard text remains bilingual. No language value is added to the stored offer identity.

### Proposed validation and generation rules

These are technical rules proposed for this extension, not constraints claimed to exist in today's Wholesale API:

- Stored slug length: **1–150 ASCII characters**, matching the existing B2C Product slug length as a proposed reusable technical convention. This does not make a Product slug an offer slug. Keep the current frontend's 96-character initial base when backfilling its generated names; numerical collision suffixes can make those legacy names longer than 96 characters.
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- A string matching `^[a-f0-9]{24}$` is reserved for legacy ID lookup and must not become a slug/alias.
- No spaces, slash, backslash, dot path segments, query, fragment, percent-encoded path component, domain or protocol is stored in a slug.
- Generate the initial base from the **offer's initial `name.en`**, using the current frontend normalization as the migration reference: Unicode NFKD normalization, lowercase, non-ASCII-alphanumeric runs to `-`, trim edge hyphens. The backend may use its equivalent existing helper if it meets the documented output rules.
- If the normalized result is empty, use `offer` as the base. If it would look exactly like a legacy 24-hex ID, add a readable `-offer` suffix while retaining the length limit.
- Allocate collisions with small numerical suffixes: `logo-hoodie`, `logo-hoodie-2`, `logo-hoodie-3`. Trim the base as necessary to fit the entire suffixed value within 150 characters, then remove any edge hyphen.
- Allocate once and persist. Never recalculate all slugs from list order, filtered availability, the current source-product name or subsequent name edits.
- The canonical and historical keys share **one uniqueness namespace for B2B offers**, including unpublished/unavailable offers and retained reservations after deletion. A canonical key must not collide with another offer's historical key.
- Once a string becomes historical, keep it reserved. Do not reuse it as a new canonical key, including for the same offer; this avoids reversing previously permanent redirects. A deliberate move uses a fresh, never-reserved key.
- A supplied PATCH slug is validated as lowercase text after trimming outer whitespace. Reject invalid/null/empty/non-string values rather than silently generating a different requested URL.
- Do not silently remove aliases on rename, unpublish, source hiding or a retention timer. If the implementation needs a documented storage bound, surface that decision before adopting a limit that would break promised old links.

Database details remain the backend developer's choice. Enforce collision protection atomically at persistence level across the **union** of canonical and historical/reserved keys. Separate uniqueness checks on `slug` and `slugAliases` alone are insufficient if they allow a key to be canonical on one record and historical on another.

## 5. Request transport and response envelopes

Use the existing public API origin configuration and `/api/v1` prefixes. The supplied temporary API origin is `https://narmer-ecommerce.vercel.app`; it is not the public B2B website origin and must not be used as the destination of website redirects.

| Item                         | Behavior                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public reads/resolver        | No login required; preserve current public Wholesale authentication/visibility behavior. No new cookie or public link token.                             |
| Dashboard reads/create/PATCH | Same active confirmed B2B superAdmin/admin Bearer permissions as current Wholesale.                                                                      |
| Dashboard DELETE             | Same B2B superAdmin-only permission.                                                                                                                     |
| Wrong-store credentials      | Preserve existing B2B authentication rejection; a B2C account does not gain Wholesale management access.                                                 |
| JSON writes                  | `Content-Type: application/json`; send documented fields only.                                                                                           |
| Language                     | Existing `X-Language: en` or `ar`, with existing fallback behavior.                                                                                      |
| CORS                         | Existing configured origin policy and headers. This feature does not bypass the separate browser-connection handoff.                                     |
| Versions                     | Use the existing offer `version` for writes. No slug-specific version, timestamp or ETag is requested.                                                   |
| Read side effects            | Resolver/list/detail GET must not generate missing slugs, migrate data, add aliases or increment a version. Backfill is a separate controlled operation. |
| Limits/recovery              | Preserve existing effective-IP/account rate limits, `429`, exposed `Retry-After` and request ID behavior.                                                |

Success uses the existing envelope: `success:true`, `code:"OK"`, localized `message`, `data` and `requestId`. A list has `data.items` and the existing `data.pagination`. A detail/mutation has the complete offer directly in `data`. Errors use `success:false`, stable `code`, localized `message`, `errors` and `requestId`, with **no `data` field**.

The new resolver deliberately returns JSON **200**, including when the input is an alias or an ID. Its `data.slug` tells the frontend the canonical URL name. It does not return HTML, an API-level 301/308, a redirect destination supplied by the caller, a second partial DTO, or a duplicate `canonicalSlug`/`redirectRequired` field. The frontend already knows the requested key and can compare it with `data.slug`.

## 6. Complete create request and management response

This example uses synthetic documentation IDs and an already-existing, valid native simple product. No real record is requested or created by this document.

```http
POST /api/v1/admin/b2b/wholesale/offers
Authorization: Bearer <B2B-staff-access-token>
Content-Type: application/json
X-Language: en
```

```json
{
  "name": { "en": "Logo hoodie", "ar": "هودي بشعار" },
  "description": { "en": "Fixed wholesale pouch.", "ar": "عبوة جملة بتكوين ثابت." },
  "sourceStore": "b2b",
  "productId": "111111111111111111111111",
  "composition": [{ "variantId": null, "quantity": 30 }],
  "isActive": true
}
```

Do not send a slug on create: the server allocates it. Proposed behavior for a supplied `slug` or `slugAliases` on create is `422 VALIDATION_ERROR` identifying the unsupported field, so clients are not misled into believing a requested URL was stored.

**Proposed 201 response**, extending the current complete management DTO by exactly `slug` and `slugAliases`:

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "id": "222222222222222222222222",
    "slug": "logo-hoodie",
    "slugAliases": [],
    "name": { "en": "Logo hoodie", "ar": "هودي بشعار" },
    "description": { "en": "Fixed wholesale pouch.", "ar": "عبوة جملة بتكوين ثابت." },
    "sourceStore": "b2b",
    "productId": "111111111111111111111111",
    "composition": [{ "variantId": null, "quantity": 30 }],
    "piecesPerPouch": 30,
    "isActive": true,
    "isAvailable": true,
    "product": {
      "id": "111111111111111111111111",
      "type": "simple",
      "name": { "en": "Logo hoodie", "ar": "هودي بشعار" },
      "description": { "en": "", "ar": "" },
      "images": [],
      "options": [],
      "variants": []
    },
    "version": 0
  },
  "requestId": "11111111-1111-4111-8111-111111111111"
}
```

New unpublished offers still receive their slug at creation. Existing publication defaults, source eligibility checks and unknown-result reconciliation remain unchanged. In particular, a timed-out create must not be blindly repeated: Wholesale already permits multiple offers for one product, and a second create could allocate another slug and create a second offer.

## 7. Ordinary display-name edit — URL stays the same

```http
PATCH /api/v1/admin/b2b/wholesale/offers/222222222222222222222222
Authorization: Bearer <B2B-staff-access-token>
Content-Type: application/json
X-Language: en
```

```json
{
  "version": 0,
  "name": { "en": "Classic Logo Hoodie", "ar": "هودي كلاسيكي بشعار" }
}
```

**Proposed complete 200 response:**

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "id": "222222222222222222222222",
    "slug": "logo-hoodie",
    "slugAliases": [],
    "name": { "en": "Classic Logo Hoodie", "ar": "هودي كلاسيكي بشعار" },
    "description": { "en": "Fixed wholesale pouch.", "ar": "عبوة جملة بتكوين ثابت." },
    "sourceStore": "b2b",
    "productId": "111111111111111111111111",
    "composition": [{ "variantId": null, "quantity": 30 }],
    "piecesPerPouch": 30,
    "isActive": true,
    "isAvailable": true,
    "product": {
      "id": "111111111111111111111111",
      "type": "simple",
      "name": { "en": "Logo hoodie", "ar": "هودي بشعار" },
      "description": { "en": "", "ar": "" },
      "images": [],
      "options": [],
      "variants": []
    },
    "version": 1
  },
  "requestId": "22222222-2222-4222-8222-222222222222"
}
```

The offer's displayed name changed; the source product's independently authored name did not. Neither changing the offer name nor later changing the source name regenerates the saved slug. `slugAliases` stays empty because no URL changed.

## 8. Deliberate URL change through the existing PATCH

An intentional URL change is represented by explicitly supplying `slug`. This capability is separate from normal name editing; no new default dashboard interaction is requested.

```http
PATCH /api/v1/admin/b2b/wholesale/offers/222222222222222222222222
Authorization: Bearer <B2B-staff-access-token>
Content-Type: application/json
X-Language: en
```

```json
{
  "version": 1,
  "slug": "classic-logo-hoodie"
}
```

**Proposed complete 200 response:**

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "id": "222222222222222222222222",
    "slug": "classic-logo-hoodie",
    "slugAliases": ["logo-hoodie"],
    "name": { "en": "Classic Logo Hoodie", "ar": "هودي كلاسيكي بشعار" },
    "description": { "en": "Fixed wholesale pouch.", "ar": "عبوة جملة بتكوين ثابت." },
    "sourceStore": "b2b",
    "productId": "111111111111111111111111",
    "composition": [{ "variantId": null, "quantity": 30 }],
    "piecesPerPouch": 30,
    "isActive": true,
    "isAvailable": true,
    "product": {
      "id": "111111111111111111111111",
      "type": "simple",
      "name": { "en": "Logo hoodie", "ar": "هودي بشعار" },
      "description": { "en": "", "ar": "" },
      "images": [],
      "options": [],
      "variants": []
    },
    "version": 2
  },
  "requestId": "33333333-3333-4333-8333-333333333333"
}
```

Required write rules:

- Omitting `slug` preserves it and all aliases. Sending `name` alone never implies a slug update.
- `slugAliases` is read-only; reject attempts to supply/clear it with `422 VALIDATION_ERROR`. Do not replace aliases with a client-provided array.
- A changed slug atomically reserves the fresh key, retains the previous canonical key, changes the current slug, increments the existing offer version and commits the existing audit behavior. A failure rolls the whole change back.
- Existing valid PATCH fields may accompany `slug`; they commit together or not at all.
- An identical current slug is not a URL change and must not append an alias. Under this proposed contract, an accepted PATCH increments the existing offer version once, including when the current slug is explicitly repeated, consistently with the existing accepted-write policy. A version-only PATCH remains invalid. Do not add a separate slug version or count the alias as another write.
- A conflicting current/historical/reserved key returns proposed `409 WHOLESALE_SLUG_EXISTS`; do not silently suffix an explicitly requested PATCH slug.
- A stale version continues to return `409 WHOLESALE_CONFLICT`. Read the current record and reconcile; never overwrite another operator's alias history.
- SourceStore/productId remain immutable. A URL edit must not bypass source/composition/publication rules or change availability.
- Existing source hiding can make an offer unavailable. Staff may still perform otherwise permitted name/URL maintenance on that record, but no public resolver response is granted merely because the slug exists.
- Multiple URL changes keep every former key and resolve directly to the latest canonical key. Do not store a chain of aliases pointing to aliases.
- Because the existing offer version is used, a slug-only change can make an older selected offer version stale during Lead submission. Preserve the existing stale-selection recovery; no exception or alternate version system is requested.

## 9. Public resolver: canonical, old slug and legacy ID

### Request shape

```http
GET /api/v1/b2b/wholesale/offers/resolve/classic-logo-hoodie
X-Language: en
```

No body, Bearer credential, version, language query, frontend host or redirect URL is required. The path segment is decoded once by the HTTP framework and validated before lookup. Canonical/alias keys use the saved slug namespace; exactly 24 hexadecimal characters use the existing legacy offer-ID interpretation. Uppercase input can be normalized for lookup; the returned slug always uses its persisted lowercase form.

Perform indexed lookup and then the existing full public-availability check. Do not scan public list pages or reveal inactive/hidden records through a “slug exists” response. Reads must not allocate or modify anything.

### Complete English response

After the deliberate change in section 8, each request below returns the same canonical, localized offer with JSON 200:

```text
GET /api/v1/b2b/wholesale/offers/resolve/classic-logo-hoodie
GET /api/v1/b2b/wholesale/offers/resolve/logo-hoodie
GET /api/v1/b2b/wholesale/offers/resolve/222222222222222222222222
```

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "id": "222222222222222222222222",
    "slug": "classic-logo-hoodie",
    "slugAliases": ["logo-hoodie"],
    "name": "Classic Logo Hoodie",
    "description": "Fixed wholesale pouch.",
    "sourceStore": "b2b",
    "productId": "111111111111111111111111",
    "composition": [{ "variantId": null, "quantity": 30 }],
    "piecesPerPouch": 30,
    "isActive": true,
    "isAvailable": true,
    "product": {
      "id": "111111111111111111111111",
      "type": "simple",
      "name": "Logo hoodie",
      "description": "",
      "images": [],
      "options": [],
      "variants": []
    },
    "version": 2
  },
  "requestId": "44444444-4444-4444-8444-444444444444"
}
```

The actual server generates a fresh request ID per request; reuse in illustrative examples does not mean cached/replayed identity. With `X-Language: ar`, names/descriptions and the envelope message use the existing Arabic localization contract; IDs, slug, aliases, version and composition identities remain identical. The complete public DTO structure is unchanged apart from the two added offer fields.

### Existing ID detail route stays valid

```http
GET /api/v1/b2b/wholesale/offers/222222222222222222222222
X-Language: en
```

It returns the same complete public DTO above, including the new fields. It remains ID-only and does not begin accepting slugs silently. Existing dashboard ID detail routes similarly keep their paths and return the complete bilingual management DTO. No client should send a slug in a path documented as `:resourceId`.

### Public list response

```http
GET /api/v1/b2b/wholesale/offers?page=1&limit=20
X-Language: en
```

Return the existing success envelope with:

- `data.items`: complete public DTOs exactly as specified above, each including saved `slug` and `slugAliases`.
- `data.pagination.page`, `limit`, `total`, `pages`: existing integer fields and behavior, unchanged.
- An empty result remains `items:[]`, with the existing pagination object and HTTP 200.

**Complete proposed 200 list response with one available offer:**

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed successfully.",
  "data": {
    "items": [
      {
        "id": "222222222222222222222222",
        "slug": "classic-logo-hoodie",
        "slugAliases": ["logo-hoodie"],
        "name": "Classic Logo Hoodie",
        "description": "Fixed wholesale pouch.",
        "sourceStore": "b2b",
        "productId": "111111111111111111111111",
        "composition": [{ "variantId": null, "quantity": 30 }],
        "piecesPerPouch": 30,
        "isActive": true,
        "isAvailable": true,
        "product": {
          "id": "111111111111111111111111",
          "type": "simple",
          "name": "Logo hoodie",
          "description": "",
          "images": [],
          "options": [],
          "variants": []
        },
        "version": 2
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
  },
  "requestId": "88888888-8888-4888-8888-888888888888"
}
```

This is a field extension, not a new list format or separate routing catalog. Public aliases are former public URL strings, not private audit/actor data. Including them with available offers lets the pre-render/build process generate all current website redirects through the existing paginated list without a new bulk-export endpoint. Dashboard list entries use complete bilingual management DTOs and retain their existing availability/publication filtering.

## 10. Website redirects and API lookup have separate responsibilities

**The API's JSON response does not itself redirect a website visitor.** The website host/reverse proxy/static routing configuration is responsible for the actual HTTP redirect. Our current local preview already reads generated `dist/routes.json` redirect rules and returns 308; the final production host must implement the equivalent behavior.

| Incoming website URL                                      | Required website behavior                                            |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `/en/wholesale/offers/classic-logo-hoodie`                | 200 current English page, self-canonical.                            |
| `/ar/wholesale/offers/classic-logo-hoodie`                | 200 current Arabic page, self-canonical for that language.           |
| `/en/wholesale/offers/logo-hoodie`                        | 308 to `/en/wholesale/offers/classic-logo-hoodie`.                   |
| `/ar/wholesale/offers/logo-hoodie`                        | 308 to `/ar/wholesale/offers/classic-logo-hoodie`.                   |
| `/en/wholesale/offers/222222222222222222222222`           | 308 to `/en/wholesale/offers/classic-logo-hoodie`.                   |
| An old uppercase spelling that resolves                   | 308 to the persisted lowercase slug in the same language.            |
| Unknown, deleted, unpublished or source-unavailable offer | Actual public 404 handling, not a redirect to Home or another offer. |

For a dynamic request handler, call the resolver, compare the requested key with `data.slug`, and construct a relative destination under the known same-language offer path. Never accept an arbitrary host or `returnUrl` as a redirect destination. For a static deployment, generate equivalent mappings from current public list items, IDs and `slugAliases`; do not assume an SPA history replacement produces a real HTTP 308.

Preserve the original query string when redirecting the website URL, using normal URL serialization. Canonical metadata/sitemap URLs exclude tracking queries. A fragment is not sent to the API/server; preserve it during client-side navigation where available, and test direct browser fragment behavior separately. Do not place access tokens, passwords or private inquiry secrets in these public offer URLs.

Canonical links, language alternates, internal cards, shared links and sitemap entries use the **current saved slug**, never a newly generated slug from the current name and never an alias/ID as a second canonical page. English/Arabic alternates use their own language prefixes. Changing a display name may update headings/metadata text, but does not change the canonical path.

Freshly generated redirect rules should point each historical key directly to the latest canonical path. Remove obsolete generated HTML/rewrites when a slug changes; an old pre-rendered file must not continue serving a duplicate 200 page. Publishing/unpublishing, source visibility and deletion also require refreshing or otherwise invalidating public static content/routing through the agreed hosting process. A backend DTO change alone cannot refresh an already deployed static file or erase redirects cached in browsers.

Google documents permanent server-side 301/308 redirects as the preferred mechanism for a permanent URL move; canonical annotations and consistent sitemap/internal-link targets complement that behavior. These are signals, not an indexing/ranking guarantee. Sources: [Google Search Central: redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) and [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## 11. Failure responses and recovery

All pre-existing errors below retain their existing meanings. **WHOLESALE_SLUG_EXISTS is proposed by this handoff** and needs backend confirmation/documentation.

| HTTP/code                                         | Trigger                                                                                                                         | Frontend behavior                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `200 OK`                                          | Canonical slug, alias or valid ID resolves to a currently available offer                                                       | Use complete DTO. On an old website key, canonicalize the website URL as section 10 specifies.                                         |
| `404 WHOLESALE_OFFER_NOT_FOUND`                   | Well-formed but unknown key, deleted offer, inactive offer, hidden/missing/ineligible source, or invalid current composition    | Same public unavailable/404 result; do not expose hidden offer identity or redirect to a similar product.                              |
| `422 VALIDATION_ERROR`                            | Malformed resolver key; invalid slug type/format/length on PATCH; read-only slugAliases supplied; slug supplied on create       | Show field error where applicable. Resolver path errors identify `offerKey` in `params`; body errors identify the supplied body field. |
| `409 WHOLESALE_SLUG_EXISTS`                       | Explicit PATCH target is another current key, historical key or retained deleted-key reservation, including own historical keys | Keep draft and current URL; ask for an unused URL name. No automatic suffix for this explicit edit.                                    |
| `409 WHOLESALE_CONFLICT`                          | Stale offer version or existing conditional-write conflict                                                                      | Read current management detail, preserve draft and reconcile deliberately.                                                             |
| `409 WHOLESALE_SOURCE_IMMUTABLE`                  | Attempt to change sourceStore/productId                                                                                         | Existing response; not bypassed by a simultaneous slug change.                                                                         |
| `409 WHOLESALE_SOURCE_UNAVAILABLE`                | Existing create/publish/composition source-eligibility failure                                                                  | Existing recovery; adding a slug must not make an ineligible source publishable.                                                       |
| `409 WHOLESALE_REFERENCED`                        | Existing protected deletion                                                                                                     | Keep existing protection. Alias storage does not authorize deletion of a referenced offer.                                             |
| `401 UNAUTHORIZED`                                | Existing staff credential/session/store failure                                                                                 | Existing B2B auth recovery; never substitute another store's token.                                                                    |
| `403 FORBIDDEN`                                   | Existing role restrictions                                                                                                      | Do not show a successful URL change or retry with a different actor implicitly.                                                        |
| `429 TOO_MANY_REQUESTS`                           | Existing IP/account allowances                                                                                                  | Honor Retry-After; no automatic retry storm or token refresh for 429.                                                                  |
| `503 TRANSACTIONS_REQUIRED`, `500 INTERNAL_ERROR` | Existing transaction/storage/audit failure                                                                                      | Keep draft, requestId and old route; read/reconcile an uncertain write before deliberate retry.                                        |
| `403 CORS_DENIED` or browser fetch rejection      | Existing deployment/origin issue                                                                                                | Use the separate connection handoff; never weaken auth/Origin protection for slug lookup.                                              |

Malformed JSON/body-size/encoding errors remain those in API conventions. No second error-envelope format is introduced.

**Complete proposed slug-conflict response:**

```json
{
  "success": false,
  "code": "WHOLESALE_SLUG_EXISTS",
  "message": "This offer URL name is already used or reserved.",
  "errors": [],
  "requestId": "55555555-5555-4555-8555-555555555555"
}
```

**Complete proposed invalid-slug response:**

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Please check the submitted fields.",
  "errors": [
    {
      "field": "slug",
      "location": "body",
      "code": "INVALID_FIELD",
      "message": "Use 1–150 lowercase letters, numbers and single hyphens."
    }
  ],
  "requestId": "66666666-6666-4666-8666-666666666666"
}
```

**Complete unavailable/unknown public response:**

```json
{
  "success": false,
  "code": "WHOLESALE_OFFER_NOT_FOUND",
  "message": "Wholesale offer not found.",
  "errors": [],
  "requestId": "77777777-7777-4777-8777-777777777777"
}
```

Messages are illustrative English wording; use the backend's translated messages. Stable codes, status, error fields and absence of error `data` are what the frontend relies on.

## 12. Existing data, collisions and safe rollout

1. Inspect existing real offers first. Produce a read-only proposed mapping of offer ID to canonical slug and any known previously published keys. Do not copy the frontend's dummy fixture IDs into the database.
2. Backfill each real offer once. Keep valid already-persisted values if this extension is re-run. Use a deterministic allocation order such as offer ID ascending when several existing offers share a base name.
3. If real readable links have already been published/shared, reconcile the actual old frontend ID-to-slug export with the real records. Preserve legitimate old keys as canonical or historical keys without assigning one key to two offers. Do not guess old URLs from a newly renamed current title.
4. If an old slug was already ambiguous because two different offers used it at different times, flag it for an explicit ownership decision. Do not silently redirect someone to an unrelated offer.
5. Reserve canonical and historical keys across all records, including inactive offers. A permanent delete can retain an internal key reservation/tombstone while preserving the existing deletion response; public requests remain the same generic 404.
6. Persist/backfill and establish uniqueness before declaring required slug DTOs ready. Normal public GETs must not mutate data as a fallback. Do not return success with slug:null or silently generate a different slug on every read.
7. Preserve all existing offer/product IDs, compositions, availability, references, Lead snapshots and unrelated versions. A controlled rollout should document whether routing-only backfill leaves existing offer versions unchanged; the recommended backfill does so. Later API PATCH operations use the normal offer version.
8. Coordinate frontend deployment after the backend contract is available. Update adapters, fixtures and pre-rendering, generate current redirects, then check direct HTTP requests and SPA navigation. Old ID-based API clients continue to work while ignoring the two new response fields.

This is a migration requirement for the backend owner to plan and run safely. This document does not authorize the frontend agent to migrate live records, redeploy services or change production data.

## 13. Frontend implementation responsibilities after delivery

- Consume the backend's saved `slug` for offer-card links and canonical paths in both languages.
- Replace the live name-derived catalog scan in `api.offerSlugs()` with direct resolver reads for incoming readable/legacy URLs. One detail URL should not require downloading every English catalog page.
- Keep the existing ID-based dashboard mutation and Lead-selection requests.
- Preserve the current gallery, pouch selection, size-guide behavior and single shared detail-page design. No duplicate page component is needed.
- Update `shared/lib/offer-slugs.js` callers, `Wholesale.jsx`, public bootstrap data, `shared/scripts/prerender.mjs` and `shared/scripts/site-layout.mjs` to use saved canonical slugs and aliases. Current named English/Arabic HTML organization remains in place.
- Generate `dist/routes.json` ID/alias redirects and current canonical rewrites; configure the final website host to apply them or use an equivalent runtime resolver handler. Keep canonical route serving, HTTP 404 and content-refresh responsibilities explicit.
- Adapt fixtures and the existing URL/structure tests to the confirmed contract. Review fixtures may use documented sample slugs; they are never imported as real catalog records.
- Continue sending Lead entries as the existing `{offerId,version,quantity}` only. Do not send slug/aliases as an inquiry identity, add them to historical inquiry snapshots in this slice, or rewrite prior submissions after a rename.

Source-product/retail slugs, public B2C routing, category URLs, auth/account creation, provider setup and CORS are separate contracts. This handoff adds no work to them.

## 14. Required acceptance evidence

### Backend

- [ ] New offer gets one saved slug, including when initially unpublished; every required offer DTO returns slug and slugAliases.
- [ ] Repeated GET/list/resolver reads keep the same values without a write/version change.
- [ ] English/Arabic reads have identical slug identities and correctly localized existing fields.
- [ ] Offer name edit, source-product name edit, image edit and composition edit do not regenerate the slug.
- [ ] Several offers for one source product and several offers with the same display name get distinct stable keys.
- [ ] Concurrent automatic allocations cannot create duplicate canonical keys.
- [ ] Explicit URL PATCH retains the previous key and commits version/audit/reservation changes atomically.
- [ ] Current-versus-history cross-record collisions, own-history reuse and deleted-key reuse are rejected without changing the original mapping.
- [ ] A → B → C changes resolve A and B directly to the offer currently identified by C; alias arrays contain neither C nor duplicates.
- [ ] Failed persistence/audit and stale/concurrent writes do not lose the old canonical or aliases.
- [ ] Malformed/oversized keys, 24-hex slug ambiguity, null/empty/write-to-read-only fields and wrong-store/role requests follow the documented failures.
- [ ] Resolver returns one complete current public DTO for slug/alias/ID, without catalog scanning or an HTML/API redirect.
- [ ] Unpublish, source hiding, invalid composition and deletion give the same public 404 for every key while preserving authorized management behavior and reservations.
- [ ] Backfill is repeatable, preserves existing real identities and does not import dummy data or overwrite another offer's known links.
- [ ] Lead requests/snapshots, source immutability, deletion references, publication and all existing non-URL fields behave as before.

### Frontend and website host

- [ ] Same canonical path survives an ordinary dashboard name edit.
- [ ] Direct English/Arabic slug URLs load the correct shared detail page without a full-catalog lookup.
- [ ] Legacy ID and historical-slug website requests receive actual HTTP 308 to the current same-language URL; SPA navigation also canonicalizes without a history loop.
- [ ] Current canonical pages return 200; unknown/unavailable pages use real 404 behavior, including after static-content refresh.
- [ ] Relevant query strings and client fragments are handled as section 10 describes; no arbitrary/open redirect is possible.
- [ ] Internal links, language alternates, canonical metadata, sitemap entries, named HTML and generated redirects agree on the backend's current slug.
- [ ] Old generated files/routes do not keep a stale duplicate 200 page alive after a deliberate URL change.
- [ ] Offer image/gallery/composition display and adding the correct ID/version/quantity to an inquiry still work.

Backend service/HTTP/database tests, frontend fixture tests and deployed browser/HTTP checks are different evidence. Please label which were actually run and provide concrete results; an OpenAPI example alone is not runtime acceptance.

## 15. Backend return package requested

Please return:

1. Confirmation of this proposed contract, or an explicit field/path/status correction before the frontend integrates it.
2. Updated canonical `WHOLESALE_FRONTEND.md` defining fields, writes, resolver, visibility, conflicts, history and deletion/migration rules.
3. Updated affected general flow/readiness/reference documentation where necessary, with old chronological evidence clearly retained as historical.
4. Regenerated OpenAPI, Postman examples, route inventory, contract coverage and handoff hashes. Preserve existing ID routes and schemas; do not create a competing Wholesale module.
5. Complete create/name-edit/intentional-URL-edit/current-slug/alias/legacy-ID/list/error examples that match actual handlers.
6. A clear backfill/deployment status and test evidence, including collision races, rollback, visibility and existing Lead compatibility.

Please keep this response in the existing **New Backend Files** package so it remains the single backend contract authority. CORS/cookie connection work and the recently delivered account-creation/password-change contract remain separate; this request does not duplicate them.
