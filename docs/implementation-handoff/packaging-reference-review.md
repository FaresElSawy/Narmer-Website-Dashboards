# Packaging and reference review

Read-only review of the remaining NEW reference material, with OLD/NEW unified-diff comparison. The NEW package is the backend handoff source for integration; this report does not make claims about live API availability.

## Coverage and package comparison

Read NEW `references/architecture.md` lines 86–785 (700 lines; lines 1–85 were already reviewed by the parent), all 174 lines of `api/README.md`, and all 327 lines of `integration-readiness.md` in bounded chunks. Compared each against its OLD counterpart using the full unified diff. The API README diff adds the token-cookie correction, Apidog binary/category image guidance, and dated Products, Size Charts, Site Settings, Homepage, and Reports packaging records. Integration readiness adds the new module routes and readiness records, updated package inventory, and expanded provider checks. Architecture differs only by a 45-line appended tail; existing early proposal/checkpoint wording remains intact. These comparisons do not repeat the parent’s JSON/JSONL, hash, link, schema, reference, or operation-equality checks.

## Current contracts and material handoff notes

### API package and cookie transport

The Apidog package is organized by B2C Storefront/Dashboard, B2B Website/Dashboard, and System/Health. Its credentials are tester state, not frontend API behavior. Login/refresh store the full 68-character refresh cookie (`24-hex session id`.`43-character secret`) in `REFRESH`, while the access token goes in `JWT`; using only the secret breaks refresh (NEW `api/README.md:28–46`). For Apidog refresh requests, the full cookie and exact configured `Origin` are sent explicitly; browser code cannot read the HttpOnly cookie and must use the normal credentialed Auth flow. The cookie manager must not add a duplicate cookie (`:48–54`).

The base URL is selected by the active Apidog environment; the packaged local artifact defaults to `http://127.0.0.1:3000`, and this does not prove that the user's selected environment points to a running backend (NEW `api/README.md:68–70`). No live API URL was established during this review. Apidog native image requests require Binary > Upload and a matching JPEG/PNG/WebP MIME; importing OpenAPI can normalize the body to text/plain, so saved native state needs its recorded checks after any reimport (`:58–66, 101`).

### Integration readiness and deployment boundary

The current endpoint index includes Homepage, Site Settings, Products facets, Size Charts, and Reports; the final listed source inventory is 159 business operations plus two health routes (NEW `integration-readiness.md:17–42, 257–267, 319–327`). Its sequence remains grounded in the user flows: store-specific Auth, public browsing, Cart/checkout, staff operations, B2B Forms/Leads, and dashboard notifications (`:61–74`).

The readiness document records a dated local configuration/provider observation, including Bunny adapter/CDN and private-boundary checks on 2026-10-21, but explicitly says application HTTP attachment/ownership flows, browser behavior, account-wide Pull Zone exposure, SMTP delivery, and deployed behavior remain separate acceptance checks (NEW `integration-readiness.md:7–9, 44–59, 76–92`). The package and Apidog documentation likewise distinguish synthetic fixtures/remote definition readback from real frontend, provider, and deployment acceptance (`api/README.md:89–101, 117–125, 135–174`; readiness `:277–327`). Do not infer that a live application endpoint is reachable from adapter verification or route inventory.

### Size chart and reporting decisions

The final architecture checkpoint confirms image-based bilingual Size Charts, versioned chart edits, Product assignment, and explicitly no measurement-table engine (`NEW references/architecture.md:750–754`). This matches `SIZECHARTS_FRONTEND.md`, but conflicts with the current Figma numeric chest/length/sleeve editor and guide captured in the other review: the Figma flow needs a product decision or API extension before direct implementation.

The latest architecture/report entries approve B2C admin/superAdmin-only Reports, delivered-product ranking by placement date, all-status overview placement metrics, separate payment/refund event markers, and historical direct-category snapshots with older uncaptured categories left unknown (`NEW references/architecture.md:777–785`; readiness `:319–327`). The metric definitions are therefore no longer pending decisions; the `REPORTS_FRONTEND.md` contract is canonical. Reports still do not establish bank settlement, refund completion, or profit.

### Backend package layout provenance

Architecture's `narmer-ecommerce/server/` plus future `client/` tree and the instruction to add the client when frontend work starts are backend architecture history (`NEW references/architecture.md:96–147`). They do not authorize moving or consolidating the existing workspace's B2C/B2B Vite apps. The package README also clearly distinguishes the standalone backend package from repository-local project naming (`api/README.md:3–5`).

## Stale or misleading wording to account for

The reference set is a chronological implementation log, so earlier status statements need the later dated checkpoints to resolve them:

- `references/architecture.md:487–497` is headed “Resolve these before the affected implementation” and says business-module work will proceed in later slices. Lines 499 onward already describe completed checkpoints, and lines 750–785 complete Size Charts, Site Settings, Homepage, and Reports. Treat unresolved bullet items only as remaining where they are still specifically open (for example questionnaire configuration, emergency recovery, production setup/provider checks), not as a statement that all the later modules remain unimplemented.
- The architecture's dated historical checkpoints at `:745–747`, `:764`, and `:774` say Size Charts/Site Settings/Homepage/Reports or reporting definitions remain pending. The subsequent dated sections `:750–785` supersede those inventory snapshots.
- `api/README.md:9` still calls 142 business operations/144 total the “current local export”, although the final Reports entry at `:166–174` and integration readiness at `:319–327` report 159 business/161 total. The 135-operation “Verification record” at `:117–125` is also the initial dated baseline. Use the final package counts, not these retained historical numbers. Other dated Apidog records explicitly explain the extra remote Users path as a preserved concrete test ID, not a missing backend endpoint (`:135–153, 157–174`).
- `integration-readiness.md:5, 7` and its earlier verification evidence (`:94–100`) preserve the 2026-10-14/2026-10-13 baseline. This is clear from their dates and later entries; do not read their 135-route counts as current. The top-level configuration table (`:44–59`) is itself dated local state, not a permanent deployment guarantee.

I found no contradiction in the final cookie instructions: Apidog explicitly supplies its test cookie/header while browser frontend code uses credentialed requests with HttpOnly cookies. The architecture notes that cross-site hosting needs a transport/cookie decision (`references/architecture.md:289–299`); exact deployed browser/CORS/TLS interoperability remains unverified (`:517, 523`; `integration-readiness.md:64, 80–89`). These are complementary facts: the API’s local transport is defined, and deployment compatibility still needs acceptance.

## Source-only limits

This review did not call API routes, test the configured Apidog environment, inspect or change secrets, run backend tests, perform provider operations, or modify Vite apps/backend/Figma. Claims about passing tests and external checks above are sourced from the packaged dated records and were not rerun. Parent-reported package/hash/route/schema checks remain separate evidence. No deployed frontend, bank/refund activity, live cookies/CORS/TLS, browser visuals, or production load is established here.
