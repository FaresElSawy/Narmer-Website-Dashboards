# Phase 8 bounded live test plan

Environment: the owner-approved temporary API `https://narmer-ecommerce.vercel.app`, reached through B2C localhost 5295 and B2B localhost 5294 integration previews. On 29 October 2026, the owner approved the bounded live tests and supplied an owner-controlled email/phone for test customer contact and confirmation messages. Contact details remain in the conversation and transient forms, not the test ledger. No production deployment, migration, owner-role transfer or real payment is included.

## Already authorized and checked

The owner signed in directly to both store dashboards as Super admin. Protected section reads, account-form visibility and existing empty states were inspected without submitting edits. Passwords, refresh cookies and access tokens must stay out of chat, logs, URLs and artifacts. Direct cross-site refresh failed on reload; after the integration-only local proxy fix, the owner signed in again and both real Chrome sessions survived reload.

## Proposed disposable data and actions

Every created record must be clearly named `PHASE8 TEST`, with created IDs recorded in a private local test ledger containing no credentials or customer contact details. Only records created for this named test may be changed or cleaned up. Do not overwrite existing content, payment details, fees, contacts, account roles or publication states.

| Area                    | Bounded proposed scope                                                                                                                                                         | Acceptance evidence                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts and roles      | One Admin, one Moderator and one Customer per store, using owner-approved test email addresses. Keep current Super admin ownership unchanged                                   | Correct login/landing; forbidden sections; store/session isolation; account updates and invalidation; no creation by Admin/Moderator                 |
| Credential changes      | User performs entry and submission of a disposable account's password change; do not change the current owner's password                                                       | Old sessions fail, new password signs in, correct store is preserved; no password in evidence                                                        |
| B2C catalog             | One test category, one simple product and one product with two variants; one size chart; a supplied non-private test image                                                     | Create/edit/version conflicts; shared and per-size images; guide visibility; stock and price consistency                                             |
| Promotions and checkout | One sale and one coupon scoped only to the test products; up to four clearly labelled test orders, with synthetic contact details and an owner-controlled test email/phone     | Exact totals, stock/coupon conflict, guest/customer ownership, lost-response replay, tracking, cancellation and one-time stock restoration           |
| Payment proof           | One test image in a test order only, if manual InstaPay is already configured; no payment or receiving-detail change                                                           | Raw upload, access control, private read, MIME validation and cleanup behavior. A marker is not proof that funds moved                               |
| B2B catalog and inquiry | One native test product and one test offer. Use existing published forms; if none exist, the owner must approve a specific form publication/configuration before it is changed | Saved canonical URL and resolver, fixed pouch quantity, guest/customer submission and replay, private images, contacted status and history isolation |
| Reports                 | Read reports around test order placement/status/marker dates                                                                                                                   | Exact reconciliation against test order snapshots, Cairo dates and Sunday weeks                                                                      |
| Cleanup                 | Cancel test orders as appropriate; deactivate test promotions/products/offers, remove only unreferenced supported test records, and block test accounts                        | Existing reference protection is respected. No historical order/request purge; record any retained test audit/history entries                        |

Email/OTP/tracking delivery must use an explicitly approved owner-controlled mailbox and phone. Do not send mail to invented addresses, real customers or unrelated staff. Registration/OTP and provider operations remain unexecuted until these destinations and actions are approved. Account creation through Super admin does not send email under the supplied contract.

## External evidence still required

- Final website origins, HTTPS and same-site cookie behavior on the intended VPS, actual HTTP 404/308 rules, cache invalidation and public content regeneration.
- Backend-owner proof for SMTP/OTP delivery, media storage/private access, scheduled cleanup, backups and runtime/security configuration. Temporary Vercel behavior alone does not certify VPS timers or operator readiness.
- Physical iPhone/Android and actual Safari checks. Local WebKit is an engine check and currently does not send the test Secure cookie over HTTP loopback.
- Owner approval of final content, catalog, contacts, legal/policy copy, shipping/payment rules and release readiness.
