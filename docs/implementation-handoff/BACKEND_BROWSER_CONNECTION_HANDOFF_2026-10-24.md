# Browser connection handoff — local frontend to temporary API

24 October 2026. API: `https://narmer-ecommerce.vercel.app`. This is the owner-supplied temporary integration host; production remains planned for the VPS described in the delivered backend documents.

## Retest after the backend fix — resolved CORS

The owner reported the backend fix on 24 October 2026. Retesting confirms successful 204 login preflights for all four exact origins below, with credential support and the required headers. All 28 public GET probes passed across Chromium and WebKit from those origins. Both live integration previews loaded without JavaScript errors. See [the retest record](BROWSER_CONNECTION_RETEST_2026-10-24.md).

The original CORS failure below is historical. Authentication, refresh-cookie persistence, authorized reads and logout remain unverified until the owner signs in. The live public Forms list currently contains zero published forms; `/forms/fabric` returns 404 FORM_NOT_FOUND, as documented for an unavailable definition. This is separate from the resolved browser connection.

## Original confirmed issue — before the fix

The API returns 200 LIVE/READY from `/health/live` and `/health/ready`. B2B Forms, Homepage and Site Settings respond to public reads without Origin. However, a browser request from the current B2B frontend at `http://127.0.0.1:5284` is rejected with 403 CORS_DENIED. The login OPTIONS preflight is also rejected and lacks Access-Control-Allow-Origin. An isolated Chromium check confirms frontend fetch fails before its code can consume a response.

No test credential or private record was used. This is an allowed-origin configuration issue, not a demonstrated invalid-password failure.

## Origins to permit for this workspace

Configure `CORS_ORIGINS` using the backend's supported format and apply the updated deployment configuration. Permit the exact agreed origins, including scheme and port:

- `http://127.0.0.1:5294` — isolated B2B integration profile.
- `http://127.0.0.1:5295` — isolated B2C integration profile, for its authorized integration work.
- `http://127.0.0.1:5284` — current B2B review address, if used for live testing.
- `http://127.0.0.1:5283` — current B2C review address, if used for live testing.

The project uses 127.0.0.1 explicitly. `localhost` is a different origin and is not an interchangeable allowlist entry. It was rejected during the original diagnostic pass and was not included in the successful retest. No wildcard credentialed origin is requested.

The existing frontend sends credentials:include and X-Language, JSON Content-Type for JSON requests, and Bearer Authorization for authenticated operations. Preserve the documented methods/headers and expose the documented request ID/retry headers. No frontend credentials, provider keys or JWT secrets belong in these Vite files.

## Acceptance after the configuration change

1. OPTIONS to `/api/v1/b2b/auth/login` from the selected frontend Origin should return the documented successful preflight, with that exact Access-Control-Allow-Origin and Access-Control-Allow-Credentials:true, plus the required method/header allowances.
2. The public Forms read from the browser should become readable, not merely succeed without an Origin in a terminal.
3. Verify the actual cookie arrangement before calling authentication accepted. The delivered contract specifies HttpOnly, production Secure, SameSite=Lax refresh cookies. Local HTTP frontend to the Vercel HTTPS site is a different site; adding CORS alone does not establish that login/refresh cookies will persist and be sent. Confirm an explicitly supported test arrangement, preserving Origin and session protections, rather than introducing an undocumented cookie env variable or weakening the checks.
4. The owner can then sign in separately to B2B/B2C using their existing test accounts. Check login, reload/refresh rotation, authorized reads and logout. No creation, password change, ownership transfer or other real-data write is requested by this handoff.

Vercel background email/cleanup and final VPS/runtime acceptance remain outside this local browser-connection check. No deployment or backend environment was changed by the frontend agent.
