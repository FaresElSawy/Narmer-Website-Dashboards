# Narmer account permissions

Checked against the supplied backend contracts and refreshed during Phase 8. This is a permissions reference, not a certification of every live backend role boundary. Accounts and roles are separate for B2C and B2B: a role in one store grants no access to the other store.

## Staff roles

| Operation                                                                                     | Super admin                                | Admin                         | Moderator |
| --------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------- | --------- |
| B2C: list/read orders, view private payment proofs, and perform documented status transitions | Yes                                        | Yes                           | Yes       |
| B2C: manage products, variants, stock, prices, categories, size charts and catalog images     | Yes                                        | Yes                           | No        |
| B2C: manage Sales and Coupons                                                                 | Yes                                        | Yes                           | No        |
| B2C: read Overview, Revenue & finance and Sales performance reports                           | Yes                                        | Yes                           | No        |
| B2C: manage default shipping fees and governorate overrides                                   | Yes                                        | Yes                           | No        |
| B2C: delete a governorate override                                                            | Yes                                        | Yes - explicit exception      | No        |
| B2C: edit InstaPay receiving instructions                                                     | Yes                                        | Yes                           | No        |
| B2B: list/read requests, view private request images and mark requests contacted              | Yes                                        | Yes                           | Yes       |
| B2B: manage published form definitions, native products and wholesale offers                  | Yes                                        | Yes                           | No        |
| B2B: view the permitted B2C source-product selector                                           | Yes, read-only                             | Yes, read-only                | No        |
| Own store: edit Homepage and Site Settings                                                    | Yes                                        | Yes                           | No        |
| Own store: list/read accounts and edit eligible names, phone numbers, roles and status        | Yes                                        | Yes                           | No        |
| Own store: create an account as Admin, Moderator or Customer                                  | Yes                                        | No                            | No        |
| Own store: delete eligible accounts and supported catalog/promotion records                   | Yes, subject to safeguards                 | No, except shipping overrides | No        |
| Own store: transfer super-admin ownership                                                     | Yes, through the dedicated handover action | No                            | No        |
| Own store: read notifications and mark personal notifications read                            | Yes                                        | Yes                           | Yes       |
| Own profile: change own name/phone and password                                               | Yes                                        | Yes                           | Yes       |

The reporting screens were completed and accepted in Phase 7. Their reads remain restricted to Super admin and Admin; Moderator lands on Orders.

## Important boundaries

- Account editors may assign Admin, Moderator or Customer; they cannot assign Super admin. Super-admin ownership changes only through the explicit handover workflow.
- The existing Super admin account is protected from ordinary edits and deletion. Handover requires another active, verified account in the same store, demotes the previous owner to Admin and invalidates both accounts' sessions.
- Account deletion is soft deletion, not removal of historical records. Deleted accounts cannot be restored through the supplied account API.
- Reference protection still blocks catalog deletion where applicable. Having the Super admin role does not bypass product/order/cart references, category children, assigned size charts or other documented safeguards.
- There is no order-deletion or B2B-request-deletion operation. Staff cannot rewrite submitted request answers or historical order snapshots.
- Marking a notification read does not accept an order or mark a request contacted. Payment/refund markers do not transfer money.
- Staff roles cannot shop through B2C Cart, Wishlist or customer checkout while signed in as staff. Customer addresses are available only to Customer accounts. All active authenticated roles may manage their own supported profile fields and change their own password.

## Customer and guest access

| Role              | Permitted customer activity                                                                                                                                                                                     | Excluded activity                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Customer (`user`) | Browse public content; manage own profile, password and saved addresses; in B2C use own Cart, Wishlist, checkout and account order history; in B2B submit inquiries and view own account-linked request history | No staff dashboard, account administration, other customers' private records or store configuration |
| Guest             | Browse public content; use guest B2C Cart and checkout; submit B2B inquiries without an account; track the specific order/request using its private tracking credential                                         | No Wishlist, saved addresses, account history or staff dashboard                                    |

Guest orders/requests are not automatically linked to a later account by email or sign-in. Private tracking credentials remain necessary for guest records.

## Sources and current verification limits

Authority is the supplied package in `Backend Files/New Backend Files/modules/`: `AUTH_FRONTEND.md`, `USERS_FRONTEND.md`, `ORDERS_FRONTEND.md`, `LEADS_FRONTEND.md`, `PRODUCTS_FRONTEND.md`, `CATEGORIES_FRONTEND.md`, `SIZECHARTS_FRONTEND.md`, `MEDIA_FRONTEND.md`, `SALES_FRONTEND.md`, `COUPONS_FRONTEND.md`, `SHIPPING_FRONTEND.md`, `FORMS_FRONTEND.md`, `WHOLESALE_FRONTEND.md`, `HOMEPAGE_FRONTEND.md`, `SITESETTINGS_FRONTEND.md`, `NOTIFICATIONS_FRONTEND.md`, `REPORTS_FRONTEND.md`, `CART_FRONTEND.md` and `WISHLIST_FRONTEND.md`.

B2C staff creation already exists and appears for Super admin. The screenshot that prompted the question was using Admin; that requested addition was canceled after the owner found the existing action. No role permissions were changed.

Phase 8 connects B2B account creation and own-password change to the delivered Users/Auth contracts, reusing the B2C forms. Creation is restricted to Super admin in both stores. All three staff roles can change their own password. Shared password validation preserves whitespace and the 72-byte UTF-8 limit. Intercepted browser checks cover both stores, role visibility, transport prefixes, manual handoff and uncertain-response recovery.

On 29–30 October, actual Chrome tests covered both stores' owner-created Admin, Moderator and Customer accounts. Expected landings/navigation, selected permitted reads, hidden creation/deletion/ownership controls, Moderator report/catalog route exclusion, Customer ownership/history separation and live role-edit session invalidation passed. The two test accounts were reduced through those roles, not granted Super admin. The owner completed both Customer password resets; new-password sign-ins and reload passed. Cleanup blocked both accounts, and their previous Customer sessions then required sign-in. Reset-specific pre-reset session invalidation was not independently isolated before re-sign-in. Frontend controls and route guards do not independently prove every forbidden raw API operation returns 403. Those precise live boundary gaps and physical-device acceptance remain outstanding. See `PHASE_8_TEST_REPORT.md` and `output/phase8/live-role-checks.json`.
