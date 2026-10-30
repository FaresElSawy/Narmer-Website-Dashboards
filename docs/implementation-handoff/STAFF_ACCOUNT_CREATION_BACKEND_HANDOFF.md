# Staff account creation — backend contract received

24 October 2026 update: the backend has delivered [account-creation-password-change.md](../../Backend%20Files/New%20Backend%20Files/account-creation-password-change.md) and the updated Users/Auth modules. Account creation is now a delivered API capability. The review and remaining frontend changes are in [BACKEND_UPDATE_REVIEW_2026-10-24.md](BACKEND_UPDATE_REVIEW_2026-10-24.md): super-admin-only creation, required initial password, immediate login eligibility, exact response/error handling and own-password change. The current fixture UI and live disabled guard remain unchanged pending that adaptation.

The original request and pre-delivery frontend snapshot below are retained for traceability. They are historical questions, not a competing API contract or a request to implement another endpoint.

## Current frontend behavior

- The Accounts heading has Create staff account for the existing admin/super-admin account-management roles. Moderators cannot open Accounts or create staff.
- The modal contains Name, Email, Phone and Role (Moderator or Admin). It does not expose Super admin creation; the existing explicit ownership-handover flow remains separate.
- Local review mode validates and inserts a demonstration account into the in-memory account list. It cannot sign in, has no password and receives no invitation or email. Its `emailVerified` value is false. Reloading resets this demo data.
- Live mode shows the form and pending-backend explanation with creation disabled. A second guard prevents submission from reaching any API even if the form is submitted programmatically.
- No staff-create URL, HTTP method or response envelope has been invented or called. The implementation uses a fixture-only helper rather than a guessed POST endpoint.

## Fields already used by the interface

| Field | Frontend value and current validation                                                        | Source                                                                  |
| ----- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| name  | Required trimmed string, 1–100 characters                                                    | Existing Auth registration constraint and Users name                    |
| email | Required valid email, trimmed/lowercased, maximum 254 characters                             | Existing Auth registration constraint                                   |
| phone | Required string; remove spaces, parentheses and hyphens; 6–15 digits with optional leading + | Existing Auth registration constraint                                   |
| role  | Exactly moderator or admin                                                                   | Existing Users writable roles; owner requested creation for these roles |

Example form values, not a confirmed API request schema:

```json
{
  "name": "Example Staff",
  "email": "staff@example.test",
  "phone": "+201001234567",
  "role": "moderator"
}
```

Store context is B2B for this dashboard and must be enforced by the server. Do not trust an arbitrary store, role, status, owner ID or verification flag from client input.

## Backend handoff required before live connection

Please supply the exact protected endpoint, method, permissions, request schema, success DTO/envelope and errors. Confirm whether both admin and superAdmin may create staff; the frontend currently follows the delivered account-management permissions for review.

Decide and document account activation and credential delivery: an invitation/set-password flow or another explicitly supported approach, how email verification works, invitation expiry/resend behavior if applicable, and what happens for an already registered, blocked or deleted email. The frontend deliberately does not invent passwords, OTP rules, invitation delivery or automatic verification.

Return enough of the existing account DTO to update the list, including id, store, name, email, phone, role, emailVerified, status and createdAt. Confirm which fields are optional or omitted. Provide duplicate-email, invalid-role, permission, rate-limit and uncertain-response behavior so the frontend can retain edits and avoid accidental duplicate creation. The frontend must never auto-replay a creation request after an unknown result without a delivered reconciliation/idempotency approach.

Update `USERS_FRONTEND.md` and any relevant Auth/email-delivery contract when this capability is implemented. Those supplied reference files have not been edited by frontend work. After the updated contract arrives, replace the fixture-only creation helper with that exact API and run authorized staging checks. Existing registered-account role edits continue to use the already delivered PATCH contract.
