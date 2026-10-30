# Narmer websites

The B2B and B2C websites are separate React/Vite/Tailwind apps. Their page source is organized by name, and each build uses the same English/Arabic folder layout requested by the owner.

| Folder                                          | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `B2B-Website/src/pages/`                        | Business website and B2B staff dashboard pages               |
| `B2C-Website/src/pages/`                        | Retail website and B2C staff dashboard pages                 |
| Each app's `src/assets/`                        | App CSS, browser entry JavaScript and app-only images        |
| `shared/assets/`                                | Shared `fonts`, `images`, `css` and `js`, maintained once    |
| `shared/ui/`                                    | Reusable React interface components                          |
| Each app's `src/features/`                      | Its business state, validation and API helpers               |
| Each app's `dist/`                              | Generated website: English HTML, `ar/`, and sorted assets    |
| `docs/implementation-handoff/`                  | Phase tracker, working rules and handoffs                    |
| `Backend Files/`, `Files/`, `Narmer UI Design/` | Supplied references, preserved separately from frontend code |
| `output/`, `tmp/`                               | Local verification evidence and temporary working files      |

Start with [the project organization guide](docs/implementation-handoff/PROJECT_STRUCTURE.md). See each website's README for development/build commands. Edit `src/` and `shared/`; rebuild generated HTML rather than editing it directly.

Format all editable website/shared code from this folder with `npm.cmd --prefix B2B-Website run format`. Use `npm.cmd --prefix B2B-Website run format:check` to verify formatting. Both app packages expose these commands; generated `dist/` assets remain optimized and are not editable source.

## GitHub and Vercel test deployments

This repository contains the two separate apps and their shared source. Each app uses its own locked dependencies and Vercel project. It does not require a root npm workspace or a new application framework. Use Node.js 24 and `npm ci` inside each app.

Run `npm run build:vercel` inside either app to build the live temporary-API test version, pre-render public pages, and prepare `.vercel/output`. The test configuration is non-secret and non-indexable. Local environment overrides, original references, dependencies, generated builds and private verification evidence are excluded from Git.

See [the Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md) for project roots, API Origin requirements, review URLs and the future push-to-deploy workflow. Phase 8 testing/release gaps remain documented in [the test report](docs/implementation-handoff/PHASE_8_TEST_REPORT.md); a test deployment is not final release acceptance.
