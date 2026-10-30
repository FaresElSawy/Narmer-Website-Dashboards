# Website organization

23 October 2026. The owner requested the supplied website's folder organization for both Narmer websites. This refactor keeps React, Vite, Tailwind, current layouts, language behavior, APIs and reusable components in place.

## Built website files

Each app's `dist/` is the generated website folder. English pages are at its top level; the matching Arabic filenames are inside `ar/`. Only the two home files use `index.html`.

```text
B2B-Website/dist/
  index.html
  about-narmer.html
  contact.html
  spinning.html
  weaving.html
  fabric-manufacturing.html
  school-uniforms.html
  wholesale.html
  wholesale-<product-name>.html
  privacy.html
  terms.html
  ar/
    index.html
    about-narmer.html
    contact.html
    spinning.html
    ...the same public filenames in Arabic
  assets/
    fonts/
    images/
    css/
    js/
  app.html
  routes.json
  robots.txt
  licenses/
```

Wholesale detail filenames use the English offer name, such as `wholesale-logo-hoodie.html` and `wholesale-quarter-zip-sweatshirt.html`, with matching filenames in `ar/`. The owner subsequently approved readable browser URLs too: `/en/wholesale/offers/logo-hoodie` and `/ar/wholesale/offers/logo-hoodie`. API requests and request submissions still use internal offer IDs. Duplicate names receive a small numerical suffix; a missing usable English name uses `offer` with a numerical suffix where needed. Build and runtime use the same naming helper.

The Phase 4 review now generates 14 public HTML files per B2B language and 19 per B2C language. B2C includes `products.html`, readable `product-<saved-slug>.html` detail files and information pages, with matching names under `ar/`. Private Cart, Wishlist, account and dashboard routes use `app.html`. The counts depend on published/review catalog content; no unbuilt checkout/order route is claimed here.

Vite also generates a hidden `.vite/manifest.json` for bundle references. A configured live build can generate `sitemap.xml`. The build-only `.prerender/` folder contains the server-rendering compiler output; it is not another editable or deployed website.

`app.html` is the empty React entry for private or dynamic pages, including request/account/dashboard routes. Those pages must not publish private data as static HTML. Their named React source files remain visible under `src/pages/` or the appropriate shared account module.

## Editable source files

```text
Each website/
  src/
    pages/              Named React route components
    assets/
      css/              App styles
      js/main.jsx       Browser startup and hydration
      images/           App-only source images
    app/                Store configuration/navigation
    content/            English/Arabic copy and service data
    features/           Business state, validation and API helpers
    App.jsx             Route wiring
    entry-server.jsx    Public HTML renderer
  public/assets/images/ Files copied directly into the build
  index.html            Vite's source HTML template
  vite.config.js        Build and local preview configuration
  package.json          Commands and existing dependencies

shared/
  assets/
    fonts/              Poppins and Cairo runtime files
    images/             Logos, icons and supplied image derivatives
    css/                Shared typography, UI, account, guide and motion styles
    js/                 Shared page motion and HTML-entry helpers
  ui/                   Reusable React UI components
  features/account/     Shared account flow and API adapter
  lib/                  Shared transport, session and validation foundations
  scripts/              Build, page naming, preview routing and lint helpers
  tests/                Logic and browser verification
```

B2B named pages include Home, ServicePage, ContactPage, InformationPage, Wholesale, RequestStart, RequestReview, RequestReceipt, RequestTracking, RequestHistory and Dashboard. The shared wholesale template intentionally serves collection/detail data, and the service/information templates intentionally serve their related routes without copying the same layout into several implementations.

Phase 3 adds named dashboard pages alongside these public pages: DashboardRequests, DashboardRequestDetail, DashboardForms, DashboardProducts, DashboardProductEditor, DashboardWholesale, DashboardAccounts, DashboardNotifications, DashboardProfile, DashboardHomepage and DashboardSettings. `Dashboard.jsx` owns dashboard route wiring. Their API adapter, fixtures, validation, record-save recovery, image picker and reusable staff controls live in `B2B-Website/src/features/dashboard/`; dashboard styles live in `src/assets/css/dashboard.css`. The dashboard bundle loads only when its route is opened. The B2C dashboard remains separate for Phase 6.

The Narmer dropdown and file-picker components are maintained once in `shared/ui/SelectField.jsx` and `shared/ui/FileField.jsx`, with shared dashboard-control styles in `shared/assets/css/dashboard-controls.css`. This includes dashboard textarea borders/focus and upload-help spacing. The B2B MediaPicker retains its own API/validation/retry logic and composes the shared file control. Staff creation has its own named feature component and local-only demo helper; the pending real contract is documented separately.

English and Arabic use the same React page components with localized content. Their generated HTML files are separate. Duplicating the editable page logic by language would recreate the maintenance problem the shared components avoid.

Shared runtime assets are maintained once, then bundled into each independent site's four asset folders. Original client/design/backend references remain intact in their existing reference directories. Do not edit `node_modules`, `.prerender` or `dist` as source.

## Generated CSS and JavaScript names

Vite adds a content hash to generated CSS/JavaScript names, such as `AccountRoutes-BLn0pfDJ.css`. The hash changes when the generated file changes, so browsers can cache unchanged assets and request the new version after an update. The owner explicitly requested keeping these names. Editable source uses readable names, such as `shared/assets/css/account.css`; do not manually rename generated files or remove their hashes.

## URLs and hosting

The `/en/...` and `/ar/...` language structure remains. Wholesale offer browser URLs now use readable names. `dist/routes.json` records named-file rewrites and 308 redirects from the old ID URLs to the corresponding readable URLs. Generated public HTML, card links, canonical/hreflang metadata and sitemap candidates use readable routes. Vite preview applies the map automatically. Named-file entry points hydrate at their localized readable URL while retaining query strings and fragments.

The build embeds the public ID-to-slug mapping for immediate rendering. On an unseeded route or a newly encountered offer, the frontend resolves names using the already delivered paginated public English Wholesale listing, then reads localized detail by ID. No new API endpoint or backend `slug` field is assumed. Before publishing a mutable catalog, the backend must deliver persistent slugs and rename redirects so product renames and duplicate-name changes do not break published links. That extension remains pending; current review names come from supplied English offer names.

At deployment, the chosen host must apply the routing map's redirects and internal rewrites and use `app.html` for client-rendered private/dynamic routes. It must also retain the release requirements for missing-page status codes and redirects. Host-specific configuration is still part of release setup; no hosting provider has been invented or deployed by this refactor. Opening files with `file://` is not the supported way to run a React website.

## Verification

All 30 current public page bodies match the saved pre-refactor versions after normalizing moved asset prefixes and the approved readable offer links. Both apps pass lint and review builds. Structure checks exercise named files, existing clean URLs, trailing slashes, legacy index-file URLs, assets, React hydration, Arabic direction/fonts and public content without JavaScript in Chromium/WebKit. The existing guest-request and account journey checks also run against the reorganized build. Results are recorded in the Phase 2 progress file; actual Safari/Firefox/physical-device and live-backend acceptance remain separately tracked.

## Formatting editable code

Both app packages have the same pinned development-only Prettier dependency. Root `.prettierrc.json` and `.prettierignore` govern the source, with one runner at `shared/scripts/format.mjs`. From either app, `npm run format` formats both websites and shared code together; `npm run format:check` checks without edits. From the project root, use `npm.cmd --prefix B2B-Website run format`. No editor extension is necessary. Generated builds, dependencies, lockfiles and supplied reference folders are excluded. The generated JS/CSS remains minified for performance.
