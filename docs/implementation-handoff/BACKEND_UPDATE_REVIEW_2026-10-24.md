# Backend update review and live connection checkpoint

24 October 2026. Phase 3 remains owner-accepted. Phase 4 has not started. This checkpoint reviews the delivered backend changes and prepares the supplied test API origin; it does not claim authenticated integration or enable account mutations.

## Latest package refresh — stable wholesale URLs

The second 24 October package contains **45 files: one added, 16 changed, 28 unchanged and none removed**, compared with the earlier 44-file account/Auth review below. The sole new operation is `GET /api/v1/b2b/wholesale/offers/resolve/:offerKey`: **164 business operations plus two health operations**, with no removals. Wholesale and Leads are the changed module documents; the other 17 business module documents, including Auth, Users and Forms, match the earlier reviewed hashes. The new self-contained response is [wholesale-stable-urls.md](../../Backend%20Files/New%20Backend%20Files/wholesale-stable-urls.md).

All 45 files were read by the structural checker. Manifest hashes, JSON/JSONL, 123 fenced JSON examples, 485 local links, 170 OpenAPI references, 166 matching OpenAPI/Postman/route operations, 564 saved responses and business-operation coverage passed. Changed prose and stable-URL examples were reviewed against the original frontend request. Hash-identical content reused the prior review; large generated exports were parsed and targeted schemas inspected rather than read line by line. Evidence: [backend-stable-url-audit-2026-10-24.json](backend-stable-url-audit-2026-10-24.json), `output/backend-stable-urls-2026-10-24/`.

The delivered contract matches the requested separation: saved offer-level `slug`, read-only `slugAliases`, permanent reservations, stable names across EN/AR, resolver lookup by slug/alias/ID, deliberate versioned PATCH for URL changes, and generic public not-found behavior. IDs remain in dashboard operations and Leads. Lead snapshots deliberately exclude the new URL fields. The response also documents a separately controlled preview/apply backfill for the backend's recorded no-published-links case; its migration/test claims are supplied backend evidence, not operations performed by the frontend agent. No migration, offer creation or URL mutation was run here.

### Two exported-schema corrections for the backend developer

| Location                                                                                                        | Observed mismatch                                                                                                                         | Required correction                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAPI `GET /api/v1/b2b/wholesale/offers/resolve/{offerKey}`, responses                                        | The prose explicitly requires `503 NOT_READY` when a legacy offer lacks a persisted slug, but the operation exports only 200/404/422/429. | Export the documented 503 error response/example, preserving the rule that GET never allocates or backfills a slug.                                                                                                   |
| The resolver's 200 `data.composition[].variantId` schema; the existing ID detail export has the same limitation | Generated schema allows only `null`. The canonical Wholesale contract supports real 24-hex variant IDs for mixed B2C-source offers.       | Represent both a valid variant-ID string and null in the generated response schema. Do not change simple-product null behavior. This is an observed current export limitation, not proof of a new runtime regression. |

These are documentation/export mismatches; no runtime failure for these cases was demonstrated. Targeted readback: `output/backend-stable-urls-2026-10-24/contract-readback.json`.

### Read-only live observations

From the B2B browser origin, public offers returned **200 OK with zero items**, and a deliberately missing resolver key returned **404 WHOLESALE_OFFER_NOT_FOUND**, readable by JavaScript. Public Forms also returned **200 OK with zero published definitions**. Request IDs are retained in `output/backend-stable-urls-2026-10-24/live-reads.json`. The empty catalog prevents verification of a real persisted slug, aliases, name-change stability or deliberate URL-edit history. No valid-offer resolver acceptance is claimed.

The frontend still uses its previous generated-name URL adapter. Switching to saved backend slugs/resolution, prerender canonical/hreflang/sitemap data, host-level 308 redirects and invalidation remains a separate integration step. A successful missing-key resolver response does not establish those behaviors or authorize creating test offers. The two export corrections and an authorized real-offer verification remain open. Phase 4 has not started.

## Earlier account/Auth package result

The package now contains **44 files: one added, 18 changed, 25 unchanged and none removed**, compared with the reviewed 23 October snapshot. The API inventory is **163 business operations plus two health operations**, with four additions and no removals. The two changed business-module contracts are Auth and Users; the other 17 module documents, including Products, Size Charts, Homepage, Forms, Leads and Wholesale, are byte-identical to the prior reviewed versions.

All delivered files were read by the package checker. JSON/JSONL, generated OpenAPI/Postman exports, examples, local references and manifest hashes were parsed/checked structurally. Changed account/Auth/Users content and the new dated sections in flows/conventions/readiness/security/architecture were reviewed; prior content review was reused for exact hash matches. Large generated exports were not treated as prose to read line by line. A bounded read-only account-contract review was checked against the current frontend and canonical schemas.

Machine comparison: [backend-update-audit-2026-10-24.json](backend-update-audit-2026-10-24.json). This preserves the previous snapshots rather than overwriting them. The existing package checker was reused for this run; its generated runner and live probe evidence are under `output/backend-update-2026-10-24/`.

## Contract additions

| Operation                               | Confirmed contract                                                                                                    | Frontend impact                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/admin/b2b/users`          | Current same-store super-admin only; required name, email, phone, password and role; 201 with the account DTO         | Replace the local-only creation helper with this exact request after adapting permission, password input and recovery.                  |
| `POST /api/v1/admin/b2c/users`          | Same creation contract, separate B2C identity                                                                         | Carry into the B2C dashboard phase; no B2C dashboard feature was built here.                                                            |
| `POST /api/v1/b2b/auth/change-password` | Any signed-in B2B account changes its own password using currentPassword/newPassword; 200 PASSWORD_CHANGED, data:null | Add the signed-in security action for B2B customer/staff interfaces; clear passwords/session/private state and require login afterward. |
| `POST /api/v1/b2c/auth/change-password` | Same behavior for B2C customers and staff                                                                             | Carry into the appropriate B2C account/dashboard work.                                                                                  |

Creation permits role values `admin`, `moderator` or `user`, never `superAdmin`. Supporting `user` in the API does not require expanding the requested staff-creation UI beyond Admin/Moderator. Admins can retain their documented existing-account management capabilities but cannot create accounts. The current demo creation UI allows Admin and Super admin, has no password and is disabled in live mode; those demo rules must be aligned before live creation is enabled.

Created accounts are active and login-eligible immediately, with emailVerified:true representing privileged approval rather than proven mailbox ownership. No invitation, OTP, SMTP dependency, returned password or new session cookie belongs to this creation flow. Public signup still uses OTP. Duplicate/reserved store email returns 409 ACCOUNT_EMAIL_EXISTS. After an uncertain creation response, reconcile the staff list before another deliberate submission; there is no idempotent successful replay or email-search endpoint.

Passwords use the existing 8–72-character and maximum 72 UTF-8-byte rules and are not trimmed. An initial password stays only in temporary form state for the manual handoff, then is cleared. Password change invalidates prior access/refresh sessions and clears the store refresh cookie. It must not reuse generic refresh-and-retry handling after success or blindly replay an ambiguous request. Runtime session clearing already clears private session state and broadcasts the same-store clear; any new security form must use that path.

Canonical sources: [account creation/password change](../../Backend%20Files/New%20Backend%20Files/account-creation-password-change.md), [Auth](../../Backend%20Files/New%20Backend%20Files/modules/AUTH_FRONTEND.md), [Users](../../Backend%20Files/New%20Backend%20Files/modules/USERS_FRONTEND.md). OpenAPI independently requires the exact five/two body fields and Bearer authentication on all four mounts.

## Static verification

| Check                             | Actual result                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| File hashes and manifest entries  | Passed; 44 current files, no removals                                                                                        |
| JSON/JSONL and fenced JSON        | Passed; 110 fenced JSON examples parsed                                                                                      |
| Local documentation links         | 480 checked, no missing/out-of-package targets                                                                               |
| OpenAPI local references          | 169 checked, all resolved                                                                                                    |
| Routes versus OpenAPI and Postman | 165 operations each, equal inventory                                                                                         |
| Saved Postman responses           | 539 parsed, no saved-JSON parsing failures                                                                                   |
| Contract coverage                 | Every business operation covered                                                                                             |
| New request schemas               | Both creation mounts require name/email/phone/password/role; both change-password mounts require currentPassword/newPassword |

Backend fixture/adapter tests and older Apidog readbacks in the package remain supplied evidence, not tests independently rerun against backend source here. The newer documents explicitly scope Vercel as a temporary integration test host, with production intended for a VPS. No scheduler, Redis service or Vercel production infrastructure is added to this frontend project. Actual queued email, periodic cleanup, final hosting and provider/runtime acceptance remain separate checks.

## API origin and initial live observations

**Later retest:** the owner-reported backend CORS fix is verified for all four agreed origins. All 28 public browser GET probes passed across Chromium and WebKit. The initial CORS failures in this section are historical; see [BROWSER_CONNECTION_RETEST_2026-10-24.md](BROWSER_CONNECTION_RETEST_2026-10-24.md). Authentication and cookie persistence are still pending a signed-in test.

Owner-supplied API origin: `https://narmer-ecommerce.vercel.app`. The existing API client appends `/api/v1/{store}` or `/api/v1/admin/{store}` exactly once. Both apps now have an explicit `.env.integration` profile with this origin and live data mode. It contains no credentials or secret keys. Vite's real environment loader plus readConfig passed for both profiles; the existing review profile still resolves to fixture mode.

The profile is selected explicitly, for example:

```powershell
npm.cmd --prefix B2B-Website run dev -- --mode integration --port 5294 --strictPort
# B2C, when its integration work is authorized:
npm.cmd --prefix B2C-Website run dev -- --mode integration --port 5295 --strictPort
```

The temporary Vercel host is not set as the production default. Existing review previews on ports 5284/5283 remain unchanged. No login credential was requested, saved or used. The owner confirmed test super-admin accounts exist in both stores.

Read-only live results:

| Request                                                    | Actual result                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /health/live`                                         | 200 LIVE                                                             |
| `GET /health/ready`                                        | 200 READY                                                            |
| `GET /api/v1/b2b/forms`, without browser Origin            | 200 OK; public DTO received                                          |
| `GET /api/v1/b2b/homepage`, without browser Origin         | 200 OK; Cache-Control:no-store                                       |
| `GET /api/v1/b2b/site-settings`, without browser Origin    | 200 OK; Cache-Control:no-store                                       |
| `GET /api/v1/admin/b2b/users`, unauthenticated             | 401 UNAUTHORIZED; Cache-Control:no-store                             |
| Local-origin forms read and login preflights               | 403 CORS_DENIED, without Access-Control-Allow-Origin                 |
| Isolated Chromium public read from `http://127.0.0.1:5284` | Browser rejected fetch; response inaccessible to frontend JavaScript |

The documented health routes now work; historical platform-404 deployment observations in the package do not describe the current live health result. Initial probes to `/health` and `/ready` were not the documented paths and are not treated as deployment failures.

## Original blocker and current next actions

During the initial pass, all tested local origins were rejected: `127.0.0.1:5283`, `127.0.0.1:5284`, `localhost:5283`, `localhost:5284`, and the prepared integration origins `127.0.0.1:5294`/`127.0.0.1:5295` (all HTTP). The backend subsequently fixed the allowlist, and the four agreed 127.0.0.1 origins now pass. The localhost alternatives were not retested.

The [browser connection handoff](BACKEND_BROWSER_CONNECTION_HANDOFF_2026-10-24.md) now records the successful retest and remaining cookie-arrangement question. Do not bypass Origin/session protection, forge browser headers or assume that successful public browser GETs prove browser authentication.

After the transport is accepted, the owner can enter each store's test credentials directly in the browser. Verify login, cookie restoration, authorized reads, cross-store denial and logout before any separately authorized real-data mutations. Existing live account creation remains disabled while the new UI/contract adaptation is pending. The signed-in password-change UI is also not yet implemented. These are explicit follow-up integration tasks, not completed capabilities or Phase 4 acceptance.

This pass changed only integration configuration and review/tracking artifacts. No frontend business UI, backend package, provider, deployment, account, password or database record was changed. No full application build/browser regression suite was repeated for these configuration/documentation additions; the focused configuration, package and read-only browser/network checks above were performed.
