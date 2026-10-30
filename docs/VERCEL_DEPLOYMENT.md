# Narmer GitHub and Vercel test deployment

Prepared 30 October 2026 for the owner-authorized GitHub repository `FaresElSawy/Narmer-Website-Dashboards`. This is online testing, not final business-launch acceptance. Both apps remain separate React/Vite/Tailwind applications with shared frontend source.

## Project configuration

| Setting                               | B2C                               | B2B                               |
| ------------------------------------- | --------------------------------- | --------------------------------- |
| Connected project name                | `narmer-b2c`                      | `narmer-b2b`                      |
| Root Directory                        | `B2C-Website`                     | `B2B-Website`                     |
| Framework preset                      | Other                             | Other                             |
| Node.js                               | 24.x                              | 24.x                              |
| Install command                       | `npm ci`                          | `npm ci`                          |
| Build command                         | `npm run build:vercel`            | `npm run build:vercel`            |
| Include source outside Root Directory | Enabled, for `../shared`          | Enabled, for `../shared`          |
| Deployment output                     | Build Output API `.vercel/output` | Build Output API `.vercel/output` |

The committed app-level `vercel.json` files set the install/build commands and framework. Do not replace their output with the source folder or upload `node_modules`. Each build installs its existing lockfile, compiles the client, pre-renders public EN/AR pages and translates `dist/routes.json` into Vercel routing rules. Generated assets retain Vite content hashes. GitHub/Vercel build on Linux rather than uploading Windows dependencies.

The test build always uses `.env.staging`: live data from the owner-approved temporary API, same-origin browser API forwarding, and no final site origin. It publishes `noindex, nofollow` and disallows crawling. No SMTP, database, JWT, GitHub or Vercel secret belongs in a `VITE_` variable or this repository.

## API and sign-in requirements

The test API is `https://narmer-ecommerce.vercel.app`. Build-time public reads use that HTTPS origin. Browser calls use the website's own origin; Vercel forwards only the current store's `/api/v1` routes. B2B additionally forwards GET/HEAD of a B2C product detail for its supported size guide. Other store/admin routes are not forwarded.

API forwarding disables caching and preserves authentication headers, the original browser Origin and the backend cookie flags. It does not spoof an approved Origin, disable TLS validation or bypass backend authorization. The backend owner must allow the actual website origins for credentialed authentication. Use the exact stable test URLs recorded after setup; do not allow every `*.vercel.app` domain. Preview URLs that are not allowed may display public pages while authentication fails.

The generated route rules serve public named HTML, retain saved offer redirects, and load `app.html` for dashboard/account/customer routes. Unrecognized paths/assets receive HTTP 404. Newly published dynamic product/offer pages can render through the client; rebuild after catalog/publication changes to refresh public HTML and the saved redirect map. A code push triggers a build; editing backend content alone does not create a Git commit or automatically regenerate static pages.

## Local checks before pushing

From the repository root:

```powershell
npm.cmd --prefix B2B-Website run format
npm.cmd --prefix B2B-Website run format:check
npm.cmd --prefix B2B-Website run lint
npm.cmd --prefix B2C-Website run lint
npm.cmd --prefix B2B-Website test
npm.cmd --prefix B2B-Website run build:vercel
npm.cmd --prefix B2C-Website run build:vercel
```

Both apps use the same shared Node test suite; running it once is sufficient. Keep source, required assets, package lockfiles and tests. Local references, archived original images, `.env.integration`/local overrides, logs, `tmp`, `output`, `dist`, `.prerender`, `.vercel` and installed dependencies are ignored by Git. The live-test evidence and original files remain in the owner's local workspace.

## Future changes

Both projects are connected to the repository in the Vercel team `faresehab96-2347s-projects`. Use the `testing` branch for online review. The production branch remains `main`, and the Ignored Build Step is set to **Only build pre-production**. Production builds are intentionally disabled for this test setup.

Edit source, run the relevant checks, commit and push to `testing`. Vercel then rebuilds each connected project from GitHub. Review the deployment status and use the stable test links. No manual build upload is needed for normal code updates. A change under `shared/` must reach both projects, so do not enable a skip rule that watches only one app directory.

## Verified Preview deployments

On 30 October 2026, push `13462df` to `testing` automatically created both deployments. Vercel reported **Ready** for B2C in 20 seconds and B2B in 21 seconds.

| Site | Stable review URL                                                    | Vercel build details                                                                  |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| B2C  | https://narmer-b2c-git-testing-faresehab96-2347s-projects.vercel.app | https://vercel.com/faresehab96-2347s-projects/narmer-b2c/4afRNdQh2epZJfHFgFJR5HaxGBNC |
| B2B  | https://narmer-b2b-git-testing-faresehab96-2347s-projects.vercel.app | https://vercel.com/faresehab96-2347s-projects/narmer-b2b/ABRqYUh9LMgH4MrYY1pRg6NnBAnE |

Local preparation passed both app lints, Prettier checks, all 136 shared tests, and both staging builds with public HTML/asset proof (12 B2C and 20 B2B EN/AR pages). The first cloud builds reported an npm environment warning about Vercel's `cache-dir` setting. B2B also reported that its package's Node 24 requirement overrode a project setting of Node 26; the build itself used Node 24 and succeeded.

Ready confirms a successful hosted build, not a completed signed-in hosted acceptance test. Backend origin allowlisting, actual hosted cookie/authentication behavior and the remaining Phase 8 external checks must still be verified. Vercel Preview protection may require reviewers to sign in to Vercel; no protection was disabled.

Final production domains, indexing, content/provider acceptance and release approval remain separate.
