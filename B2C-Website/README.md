# Narmer B2C frontend

This JavaScript React/Vite app contains the B2C storefront, customer flows and staff dashboard. Phase 7 is accepted; Phase 8 has remaining live/device/release gates. See [the execution tracker](../docs/implementation-handoff/IMPLEMENTATION_TRACKER.md), [test report](../docs/implementation-handoff/PHASE_8_TEST_REPORT.md), and [Vercel test deployment guide](../docs/VERCEL_DEPLOYMENT.md).

## Commands

Run commands from this app directory.

- `npm ci`: install the locked app dependencies using Node.js 24.
- `npm run dev:review`: start an explicit fixture preview.
- `npm run dev`: start with unconfigured/live configuration from your local environment.
- `npm run build:review`: build fixture pages and pre-render English/Arabic public HTML.
- `npm run build`: build with normal production configuration and the same public HTML proof.
- `npm run build:vercel`: build the non-indexable temporary-API test site and Vercel output from `.env.staging`.
- `npm run preview -- --host 127.0.0.1 --port 5283`: serve the current build locally.
- `npm run lint`: lint app and shared source.
- `npm run format`: format editable code in both websites and `shared/` using the shared Prettier configuration.
- `npm run format:check`: check that the same source files are formatted without changing them.
- `npm test`: run the shared Node foundation tests. Both apps use the same suite.

## Configuration

Copy `.env.example` to `.env.local` only when actual public configuration is available. `VITE_DATA_MODE` is `unconfigured`, `fixtures` or `live`. API/site origins must be HTTP(S) origins with no path, credentials or query. Do not add `/api/v1` yourself; transport owns that prefix. No example host is contacted as a fallback.

The API origin is unset. Live mode requires the real API, CORS/cookie setup and authorized test users. No provider/database/JWT/SMTP secret belongs in any Vite client variable. Fixture role controls cannot authenticate with the real API.

## Source boundaries

This app owns named route components in `src/pages`, configuration in `src/app`, localized copy in `src/content`, and business state/API helpers in `src/features`. App styles live in `src/assets/css` and the browser entry is `src/assets/js/main.jsx`. Shared fonts, images, styles and browser helpers live in `../shared/assets/{fonts,images,css,js}`; they are built into each site without duplicating their editable source. The sibling app retains its separate business flow and build. Import the root `shared/` source only for identical UI/foundation behavior; do not move store-specific business modules there.

Vite resolves shared React/router imports to this app's installed copies. Development file access is limited to this app and `shared/`. The owner authorized the root Git repository on 30 October 2026; the apps still install/build independently without a root npm workspace or another framework.

## Build and publication limits

`dist/index.html` and `dist/ar/index.html` contain real initial HTML. `.prerender/` is an ignored local build artifact; deployable frontend output stays in `dist/`. Review builds are noindex and have a crawling-disallow robots policy. Do not publish them as the finished public site.

Later phases must implement the remaining routes, actual catalog/content refresh, sitemap and final origin/indexing/hosting behavior. A 200 SPA fallback is not a verified real 404 strategy. Phase 1 is not launch acceptance.

## Named pages and hosting

The output follows the owner’s folder reference: English HTML files at the top of `dist/`, matching Arabic files inside `dist/ar/`, and `assets/fonts`, `assets/images`, `assets/css` and `assets/js`. Only home pages are named `index.html`. Do not edit `dist/` or `.prerender/`; update source and rebuild. See [the organization guide](../docs/implementation-handoff/PROJECT_STRUCTURE.md).

`dist/routes.json` maps existing localized URLs to these named HTML files. The Vite preview applies this map automatically. The hosting setup must apply the same internal rewrites and use `app.html` for private/dynamic client routes; it must not serve the pre-rendered home page as their fallback. This preserves existing route URLs and SEO metadata. Named HTML entry points also hydrate correctly. Host-specific deployment rules remain part of release setup once the hosting platform is confirmed.

## Formatting

Prettier 3.9.10 is a pinned development-only dependency in both independent apps. The root `.prettierrc.json` defines the common style, and `shared/scripts/format.mjs` applies it consistently to both apps and shared code. No global installation or editor extension is required for the commands. Generated output, dependencies, lockfiles and supplied reference folders are excluded by `.prettierignore`.

From the project root, run `npm.cmd --prefix B2B-Website run format` to format all editable code, or `npm.cmd --prefix B2B-Website run format:check` to verify it. The B2C command uses the same file scope and configuration. Edit source files; the optimized JavaScript/CSS in `dist/` deliberately remains compressed for delivery.
