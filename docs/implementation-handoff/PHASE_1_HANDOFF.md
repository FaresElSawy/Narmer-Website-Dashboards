# Phase 1 — Foundation review

23 October 2026. Status: **Accepted by the owner**. The owner accepted the reviewed foundation and authorized Phase 2 with “alright great, start phase 2”. This handoff records Phase 1 scope; no deployment, backend modification, account provisioning or production write was performed.

## Review the result

The two built review previews remain running locally:

| App | English public shell              | Arabic public shell               | Dashboard shell                                                                              |
| --- | --------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| B2C | [Open](http://127.0.0.1:5283/en/) | [Open](http://127.0.0.1:5283/ar/) | [English](http://127.0.0.1:5283/en/dashboard) / [Arabic](http://127.0.0.1:5283/ar/dashboard) |
| B2B | [Open](http://127.0.0.1:5284/en/) | [Open](http://127.0.0.1:5284/ar/) | [English](http://127.0.0.1:5284/en/dashboard) / [Arabic](http://127.0.0.1:5284/ar/dashboard) |

These are foundation examples: the supplied hero composition, navigation/footer and a dashboard component workbench. The rest of the home sections, product/inquiry journeys, account forms, operational screens and reports retain their assigned later phases. Links to those unfinished public destinations show an unavailable state. Sidebar destinations currently display the same foundation workbench, rather than pretending their business operations exist.

Owner review update, 23 October 2026: Poppins replaces Brice for English throughout both apps and dashboards. Cairo remains the Arabic font. Thin SVG chevrons follow the owner's supplied arrow reference and rotate smoothly in both languages. The owner also authorized sensible UI/UX corrections during implementation, using installed skills, with organized app folders and shared code preserved. These changes supersede earlier Brice and strict visual-fidelity references; business scope and phase approval gates are unchanged.

Please review Poppins Regular/SemiBold/Bold for English, Cairo for Arabic, the two public headers, mobile menus, dashboard sidebar/drawer, controls, and the 320–1440px layouts. The shared font declarations live in `shared/assets/css/fonts.css`; the three self-hosted Poppins WOFF2 files and license live in `shared/assets/fonts/poppins/`.

The review strip and role selector are review tools. They are not Figma build annotations and are not shown in live mode. The displayed records and amounts are demonstrations, with no saving, ordering, payment or backend publication.

### Review correction verification

Both review builds and lint passed after the Poppins/chevron update. All 40 built-browser cases passed again, now checking that the actual local Poppins/Cairo faces loaded, no Brice or external Google Fonts request occurred, and the standard chevron fits and changes direction with the expanded state in EN/AR. Public HTML/hydration checks also passed. UI/UX Pro Max and responsive-design guidance informed keyboard/focus, hierarchy, consistent icon alignment, logical RTL spacing and overflow review. The native role-select arrow was left as the browser default. No application dependency was added for fonts or icons.

### Motion and navigation review update

The shared header now owns dropdown/drawer behavior separately from the public page shell. At widths of at least 1024px with a precise pointer and hover support, hovering a retail category opens its panel; a 120ms leave grace lets the pointer move into the panel. The panel overlays the page without shifting its content. Small-screen navigation uses tap/click accordion controls. Desktop touch input also retains click operation. Closed panels are inert and hidden from assistive technology. Arrow Down opens the desktop panel and focuses its first link; Escape closes it and restores trigger focus. Clicking or focusing outside closes it.

The chevron rotates through a 200ms CSS transition instead of swapping arrow shapes. Interruptible transitions handle the flyout and mobile accordion. Shared button feedback, dialog/drawer entrances and a short hero-copy reveal use the same restrained motion timing. These are the starting motion rules for subsequent phases, not a claim that unbuilt pages are animated. The installed Emil design-engineering skill informed easing, timing, interruption, touch behavior and reduced-motion choices. No animation package was added.

Both public websites now show the supplied Narmer logo with a subtle reveal and a small gold loading line on initial document entry. There is no forced minimum wait or simulated progress percentage. The intro clears when local fonts and initial hero/logo images settle, or after a maximum 1100ms asset wait following hydration, then fades out over 220ms. It does not replay on client-side navigation in the same document. A CSS fallback hides it after 1400ms if JavaScript never runs, and reduced-motion mode skips it. It never captures pointer events or removes the underlying pre-rendered content.

Source responsibilities: `shared/ui/PublicHeader.jsx` contains header interactions; `shared/ui/SiteLoader.jsx` contains the brief initial intro; `shared/assets/css/motion.css` contains shared timing/transitions/keyframes. Both apps import those shared styles. Each app retains its own routes, content and business modules.

After this update, both review builds and lint passed without warnings/errors, all 40 responsive browser cases passed, and 14 focused motion cases passed with no console/page errors. The motion checks cover both stores/languages for the bounded intro and reduced motion, both languages for desktop hover/opening and closing rotation/keyboard focus and mobile touch accordion expansion/collapse, and both stores for the no-JavaScript loader fallback. The mobile check also verifies the expanded links have their full height; this caught and corrected inline link clipping in the shared submenu. Rendered English/Arabic desktop and mobile captures were inspected. All four public HTML/hydration checks passed again. Browser automation now waits for animated states instead of assuming an immediate arrow flip.

Motion evidence: [results](../../output/playwright/phase-1/motion/results.json), [English desktop hover](../../output/playwright/phase-1/motion/en-desktop-hover.png), [Arabic desktop hover](../../output/playwright/phase-1/motion/ar-desktop-hover.png), [English mobile tap](../../output/playwright/phase-1/motion/en-mobile-tap.png), [Arabic mobile tap](../../output/playwright/phase-1/motion/ar-mobile-tap.png), [B2C logo intro](../../output/playwright/phase-1/motion/b2c-en-logo-intro.png), and [B2B logo intro](../../output/playwright/phase-1/motion/b2b-en-logo-intro.png). Still images document the visual states; the transition test records intermediate and final arrow transforms. These are Chromium desktop and emulated-touch checks, not physical-device or Safari/Firefox acceptance.

## What changed

- Kept the existing two JavaScript React/Vite apps and separate builds. Each owns its routing, content and future business features.
- Added a small [shared source boundary](../../shared/) for the actual common design system, locale, controls, transport/session helpers and dashboard/public layout structures. App-specific navigation and business destinations remain in each app.
- Configured Tailwind's Vite integration and React Router in declarative mode. Added no UI framework, translation library, state/query framework, animation package or rendering service.
- Used CURRENT navy `#073B50`, gold `#BF8D34`, pale `#EEF4F6`, cream `#FBF7EF`, rounded shadowless surfaces, owner-approved Poppins and supplied Cairo WOFF2 assets. Logo and campaign assets come from CURRENT Figma; the original supplied files remain intact.
- Built distinct B2C utility/category navigation and B2B manufacturing/wholesale/request navigation. Retail mobile utilities have four 44px targets and exactly three 6px gaps, totaling 194px. Arabic mirrors layout while keeping controls and avatar initials centered.
- Built the dashboard shell with a 240px desktop sidebar, mobile modal drawer, bottom language/logout controls, notification dialog, correct role labels and role-filtered navigation. B2C moderators land on Orders; B2B staff land on Requests. Reports are excluded for moderators.
- Added shared buttons, labelled fields/errors, loading/empty/error feedback, keyboard tabs, modal focus containment/Escape/focus restoration, and labelled responsive records. Reduced-motion preferences are respected.
- Added store-scoped API URL construction, `X-Language`, response-envelope/error handling, raw binary upload/read paths, support request IDs, `Retry-After` parsing, stale-read cancellation and strict disconnected behavior. Fixture/unconfigured modes cannot send API calls or return fake API success.
- Kept access tokens in memory. Added store-scoped single-flight refresh, native same-origin Web Locks, session restoration, protected-read retry once, stale refresh/logout guards and store-scoped logout notification. Mutations are not automatically replayed. HttpOnly cookies remain browser-owned.
- Added private tab-state expiry/forget/clear primitives and fragment consumption helpers. Binary values and temporary/data image URLs cannot be persisted through the helper. Identity/role changes clear the affected store's recovery state. Feature phases must still preserve original submission ownership and exact uncertain-commit replay; a login must not silently transform a guest submission into an account submission.
- Isolated public review copy in each app's `src/content/home.js` and component records in [shared fixtures](../../shared/fixtures/foundation.js). No fabricated backend IDs are submitted.

## Public HTML and SEO foundation

The selected proof uses Vite's build-time rendering and React's existing server renderer. [The small build script](../../shared/scripts/prerender.mjs) renders the same app routes into `dist/index.html` and `dist/ar/index.html`. The browser hydrates that content. `.prerender/` is a local build artifact, not a production server or deployed application.

Both apps deliver an H1, page text, links, image descriptions, localized title/description, social metadata and correct HTML language/direction without requiring JavaScript. Canonical, Open Graph URL and reciprocal language links are prepared to use `VITE_SITE_ORIGIN`; with no real origin configured, no domain is invented.

Review/unconfigured pages are noindex. The root SPA fallback also starts with noindex; its fallback tag is removed before client rendering so the app owns one current robots tag. The current generated `robots.txt` disallows crawling while these are review builds. No dummy sitemap, fake reviews, retail offers for B2B, or invented business structured data was added.

This is the requested public-HTML proof, not the finished SEO launch setup. Public route expansion and truthful page-specific structured data belong to Phases 2/4. Actual origins, catalog/content regeneration, canonical/hreflang acceptance, sitemap, hosting redirects/real error statuses and final indexing rules remain tracked for integration/release readiness. Do not deploy the current review robots rules as the final public policy.

Implementation references: [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite), [React Router declarative setup](https://reactrouter.com/start/declarative/installation), and [Vite rendering guidance](https://vite.dev/guide/ssr.html).

## Verification performed

| Check                                      | Actual result                                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting build and lint, both starter apps | Passed before changes                                                                                                                                                       |
| Normal production build, both apps         | Passed; unconfigured builds denied dashboard access                                                                                                                         |
| Final review build and lint, both apps     | Passed; no lint warnings/errors                                                                                                                                             |
| Shared foundation logic                    | 13 Node tests passed, 0 failed                                                                                                                                              |
| Built-browser layout/interaction matrix    | 40 cases passed: 2 stores × 2 languages × 5 widths × public/dashboard; 0 console/page errors                                                                                |
| Focused motion behavior                    | 14 cases passed: logo wait/fallback, reduced motion, desktop hover, opening/closing arrow interpolation, keyboard focus and touch accordion geometry; 0 console/page errors |
| Widths                                     | 1440, 1024, 768, 390 and 320px; no page overflow, clipped checked controls/text or broken images                                                                            |
| Keyboard behavior                          | Public menus, dashboard drawer and dialog Escape/focus restoration; dialog Tab containment; directional tab keys; form validation and disabled control                      |
| Role behavior                              | Fixture moderator navigation excludes admin sections; unconfigured mode has no fixture role bypass and denies anonymous dashboard access                                    |
| Delivered HTML and hydration               | Four EN/AR app routes passed with JavaScript disabled and enabled; hydrated mobile menus work, with no hydration errors                                                     |
| Public loading separation                  | Public route requests contain no dashboard JS and no API calls                                                                                                              |
| Native refresh coordination                | Two same-origin browser tabs serialized through actual Web Locks with a stubbed refresh operation; no real cookie/backend claim                                             |
| Dependency advisory                        | Confirmed existing Vite 8.3.2 advisory; patched to 8.3.5 on the same release line. npm reported zero vulnerabilities for both installs                                      |

Tests cover origin validation, money/null/zero, localization/error codes, store/token routing, JSON/binary errors, file transport, stale reads, refresh single-flight, lock names, expired/malformed private recovery, forbidden persisted binary values, fragment removal, and refresh/logout versus newer identities. A separate read-only review identified the logout/login race and identity-transition clearing condition; both were corrected and the race received a deterministic regression test.

Browser QA found and corrected dialog focus cycling, modal placement, duplicate fallback robots tags and three icon callsite mappings. The final matrix uses built files so renamed asset imports are verified without development-server cache effects.

Evidence: [browser matrix](../../output/playwright/phase-1/browser-results.json), [built review HTML/hydration](../../output/playwright/phase-1/production-review.json), [unconfigured guard checks](../../output/playwright/phase-1/production-unconfigured.json), and [native lock check](../../output/playwright/phase-1/session-browser-results.json). The unconfigured guard check predates later presentation/fixture extraction changes; its guard/configuration behavior was unchanged.

Representative captures: [B2C desktop](../../output/playwright/phase-1/b2c-en-1440-public.png), [B2C Arabic mobile](../../output/playwright/phase-1/b2c-ar-390-public.png), [B2B desktop](../../output/playwright/phase-1/b2b-en-1440-public.png), [B2B mobile](../../output/playwright/phase-1/b2b-en-390-public.png), [dashboard desktop](../../output/playwright/phase-1/b2c-en-1440-dashboard.png), and [Arabic dashboard mobile](../../output/playwright/phase-1/b2c-ar-390-dashboard.png). All 16 representative captures are in that evidence directory.

## Performance baseline

Final review entry JavaScript is approximately 287KB uncompressed / 92KB gzip per app. The dashboard is a separate approximately 21KB / 6KB gzip chunk. Shared CSS is approximately 28KB / 6.6KB gzip. Build-time rendering code stays outside `dist/`.

The two logo resources total approximately 18KB after size-appropriate lossless WebP conversion, compared with about 501KB in the downloaded originals. Retail campaign images total about 69KB; B2B hero images total about 149KB. Explicit geometry prevents image-driven layout changes. The CSS defines three local font weights per language; the browser fetches weights used by the displayed language/content. The three Poppins Latin WOFF2 files total about 24KB, and the font license is included in each build.

Unthrottled localhost browser measurements are saved in the hydration evidence. They are only a local baseline, not field Core Web Vitals, a mobile-network result, or proof of launch performance. Hosting, compression/caching and later feature bundles still need release checks.

## Remaining limits and next gate

- API/site origins, CORS/TLS/cookie arrangement, staging users, SMTP, media providers and actual backend behavior remain unverified. No API, provider, database or production data was contacted.
- Browser checks used installed Chromium on Windows. Safari/Firefox, actual phones and screen-reader testing remain later release checks.
- Web Locks serialize same-origin tabs. Different origins cannot coordinate that way. The documented unsupported-browser fallback serializes one tab only; do not claim cross-tab cookie acceptance there.
- Actual Auth login/logout sequencing and cross-tab cookie rotation require integration tests once the environment is available. The in-memory race tests do not prove server cookie behavior.
- Full catalog/inquiry content, client factual/policy data and actual size-chart values remain replaceable review inputs. The numeric Size Charts backend contract is already settled; its editor and product integration remain in their assigned phases.
- Current Figma source-lock metadata describes its dated planning checkpoint; execution status is now owned by the tracker, not its historical `codeNotStarted` field.

Owner acceptance: confirmed on 23 October 2026. **Phase 2 is authorized and in progress.** The execution tracker owns current phase status and later approval gates.
