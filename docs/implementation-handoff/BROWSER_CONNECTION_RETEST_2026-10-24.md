# Browser connection retest after the backend fix

24 October 2026. Temporary API: `https://narmer-ecommerce.vercel.app`.

## Result

The CORS issue is resolved for the four agreed local origins. Login preflights return 204 with the exact allowed origin, `Access-Control-Allow-Credentials: true`, the required authorization/content-type/x-language header allowances and documented exposed response headers. Public responses are readable by browser JavaScript with `credentials: include` and `X-Language: en`.

| Origin                  | Profile                                               | Chromium public GETs | WebKit public GETs |
| ----------------------- | ----------------------------------------------------- | -------------------- | ------------------ |
| `http://127.0.0.1:5284` | Existing B2B fixture review; explicit live API probes | 4 passed             | 4 passed           |
| `http://127.0.0.1:5283` | Existing B2C fixture review; explicit live API probes | 3 passed             | 3 passed           |
| `http://127.0.0.1:5294` | B2B live integration                                  | 4 passed             | 4 passed           |
| `http://127.0.0.1:5295` | B2C live integration                                  | 3 passed             | 3 passed           |

All **28 GET probes passed**, with HTTP 200, success:true, code:OK and a readable X-Request-Id. No page JavaScript errors occurred in the eight isolated browser contexts. B2B probes covered `/forms`, `/homepage`, `/site-settings` and `/wholesale/offers?limit=1`. B2C probes covered `/homepage`, `/site-settings` and `/products?limit=1`, under each store's `/api/v1/{store}` prefix.

The first attempts could not load the new integration previews locally. Restarting those development servers in the browser-test execution context resolved that local connectivity issue; the complete final run then passed. Existing review previews were preserved and remain in fixture mode.

## Live B2B form availability

A further application-load check confirmed homepage/settings/forms requests reach the API. The Forms list returns 200 with **zero published definitions**, and `GET /api/v1/b2b/forms/fabric` returns **404 FORM_NOT_FOUND**. The application displays its questionnaire-unavailable state. This is separate from CORS: the delivered Forms contract intentionally starts definitions unpublished and returns 404 for inactive or missing definitions. An authorized administrator must configure and publish the real questionnaires before their live acceptance test. No form was published or edited during this retest.

The unauthenticated startup refresh returned 401, which is expected in an isolated browser with no signed-in session. It does not verify a signed-in refresh flow.

## What remains unverified

The owner has not entered credentials. Login, refresh-cookie persistence after reload, authorized reads, cross-store denial and logout still need signed-in tests. Cross-site cookie behavior must be confirmed separately from CORS. WebKit is an engine check, not testing on an actual Safari device. Firefox, actual devices, mutations, uploads, email and final production hosting were not tested here. No password was requested, stored or used, and no business-data mutation, backend setting change or deployment was performed.

Live integration previews are available at [B2B](http://127.0.0.1:5294/en) and [B2C](http://127.0.0.1:5295/en). These are separate from fixture review ports 5284/5283. Phase 4 remains unstarted.

## Evidence

- [Preflight results](../../output/backend-connection-retest-2026-10-24/preflights.json).
- [Final browser results](../../output/backend-connection-retest-2026-10-24/browser-results.json).
- [Bounded public-read runner](../../output/backend-connection-retest-2026-10-24/browser-retest.mjs).
- [B2B application-load observation](../../output/backend-connection-retest-2026-10-24/b2b-app-load.json).
- [Form availability readback](../../output/backend-connection-retest-2026-10-24/form-availability.json).
- [B2B screenshot after loading, with reduced motion](../../output/backend-connection-retest-2026-10-24/b2b-live-home.png).
- [B2C initial screenshot](../../output/backend-connection-retest-2026-10-24/b2c-live-home.png).
