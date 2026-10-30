# Phase 3 — B2B dashboard and staff operations

Status: Accepted by the owner on 24 October 2026: “now i can say thats phase 3 is done”. See [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md) for review links, evidence and remaining external checks. Phase 4 has not started; review the forthcoming backend updates first and wait for next-phase authorization. The entries below describe the implementation and review work preceding acceptance.

24 October owner refinements: scoped lighter-gold hover on navy surfaces; remaining public B2B selectors now reuse the Narmer dropdown; open question menus stay above later cards; reorder icons finalized at the owner-requested 18px after reviewing 24px; public file-button hover added; all current checkbox uses share branded native-input styling. Dropdowns inside dialogs now measure the dialog bounds to avoid extra role-menu scrolling. B2B footer credits use the owner's supplied wording and links; B2C footer work is recorded under Phase 4. The before/after details and follow-up evidence are in [DASHBOARD_AND_B2B_AUDIT.md](DASHBOARD_AND_B2B_AUDIT.md).

Refinement verification: 56 dashboard, 16 public-control and 16 contextual-button cases passed across English/Arabic, Chromium/WebKit and desktop/mobile widths. The staff role menu also stays inside its dialog without increasing scroll height in a 700px-high viewport. Both review builds, 30 public HTML proofs, both lints and source formatting pass. Phase 3 remains ready for owner review; Phase 4 has not started.

Owner-requested review before manual inspection: completed the implemented dashboard audit, followed by the B2B public website. Findings and evidence are in [DASHBOARD_AND_B2B_AUDIT.md](DASHBOARD_AND_B2B_AUDIT.md). Fixed unsaved Back/Forward navigation and intentional session-exit protection, small record-link targets and notification-badge contrast. The 72-screen inspection and 16 new navigation cases pass; the expanded intercepted staff suite passes 34 scenarios. A bounded independent review identified the session-exit gaps; the correction was re-reviewed with no further actionable finding in that scope. Phase 3 still requires owner acceptance.

## Ordered implementation checklist

1. [x] BD-01 Requests and D20 details: filters, pagination, immutable snapshots, protected images, explicit offline-contact confirmation.
2. [x] D18 Forms: bilingual configuration, protected fixed fields, stable keys, complete field replacement, version/publication controls.
3. [x] D03/D05 Products: native product editor, target-bound images, read-only B2C selector.
4. [x] D19 Wholesale: immutable source, fixed pouch composition, versions, publication and reference-safe deletion.
5. [x] D15/D16/D17 Accounts, notification acknowledgment and staff profile, including role boundaries.
6. [x] Independent B2B Homepage and D22 Site Settings using delivered fields only.
7. [x] Relevant logic, mocked contracts, role denial, recovery, responsive/RTL, keyboard, builds, lint and formatting checks.

## Scope and references

- CURRENT Figma file sv4mjHZis8FDpvEMsrAJWM; BD-01 191:13178, D03 191:14514, D05 191:15470, D14 191:19236, D15 191:19580, D16 191:20036, D17 191:20352, D18 191:20676, D19 191:21154, D20 191:21648, D22 191:22528.
- Latest contracts: Backend Files/New Backend Files. Frontend only, no external publication, account provisioning, destructive live operation or deployment.
- Preserve approved Poppins/Cairo, CURRENT hierarchy, named page files, separated assets, shared primitives, source formatting, reduced motion and fast dashboard feedback.
- Review fixtures must stay isolated from live mode. A successful mock does not establish backend/provider acceptance.

## Carried-forward external checks

API/site origins and staging credentials remain unconfigured. Actual Safari/iPhone/Android access is unavailable; Windows WebKit is an engine check only. Firefox cannot launch because of the recorded Windows runtime error. These remain open for integration/release and are not erased by Phase 2 owner acceptance.

## Execution log

- 24 October, after phase acceptance: replaced shared secondary loading spinners with responsive skeletons across both websites, preserving the Narmer logo intro and request/session behavior. Form, catalog, product, content and private-image placeholders use the existing brand palette, accessible localized status names and reduced-motion support. Both review builds/lint, changed-source formatting and 55 Node tests passed. All 56 controlled loading/lifecycle browser cases passed across Chromium/WebKit, EN/AR and desktop/mobile, with eight isolated image-placeholder mounts. Evidence: `output/playwright/skeletons/results.json`; details in the shared skeleton section of [PHASE_3_HANDOFF.md](PHASE_3_HANDOFF.md). No actual authentication or backend writes were performed.

- 24 October: accepted Phase 2 in the tracker, started Phase 3 and inspected the existing dashboard shell, runtime, role helpers, routing and current backend modules.
- Read CURRENT dashboard frames and implemented the ordered sections using existing runtime/components and exact delivered writable fields.
- Verified role restrictions, protected media, version conflicts, serial saves, lost-response recovery, personal notifications and session clearing. A bounded independent permissions/recovery review found no material actionable defects.
- Fixed raw image handling when Windows WebKit supplies an empty MIME type; a signature check preserves the original bytes. Re-ran the affected Phase 2 recovery suite: all 14 scenarios pass.
- Applied owner feedback: sample source now includes XXL and XXXL; the pouch button explains source variants and the backend's 100-row limit. Six-size add/remove/save checks pass in EN/AR Chromium/WebKit.
- Fixed dashboard drawer Escape focus restoration in WebKit and checked both websites. Final evidence: 54 Node tests, 154 dashboard layout/workflow checks, 28 intercepted staff-contract scenarios and 12 focused interaction checks, with no failures. Both builds/lint, formatting and 30 public HTML proofs pass.
- Stopped the temporary intercepted-API development server after testing. Existing B2B/B2C review previews remain available; Phase 3 is awaiting owner review.
- Owner review follow-up: clearer textarea borders, a shared Narmer dropdown/listbox, branded file controls with filename and help-text spacing, and five service buttons replacing the Forms type dropdown. CURRENT K01 default/hover states were read from Figma; selected service is gold and desktop hover is navy. Unsaved switching remains protected.
- Owner explicitly authorized the staff-creation UI ahead of backend support. Admin/moderator creation works with local review records only and creates no sign-in credentials or invitation. Live creation remains guarded and disabled. The pending fields, activation/security decisions and exact contract request are in [STAFF_ACCOUNT_CREATION_BACKEND_HANDOFF.md](STAFF_ACCOUNT_CREATION_BACKEND_HANDOFF.md).
- Follow-up verification: 55 Node tests, 154 dashboard layout/workflow checks, 30 intercepted contract cases and 12 keyboard/motion/variant cases pass. The focused control/spacing evidence is recorded in the handoff and `output/playwright/dashboard-controls/results.json`.
- Final owner-feedback verification: 48 additional control checks pass in EN/AR, desktop/mobile, Chromium/WebKit. Upload help is separated from its control by the shared field gap plus an extra 8px, with 16px after the upload section before the next action. Source formatting and both review builds pass. The temporary contract-test server was stopped; review previews remain running.
