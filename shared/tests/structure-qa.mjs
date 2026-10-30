import { createRequire } from 'node:module'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/structure')
await mkdir(output, { recursive: true })
const checks = [],
  errors = [],
  assets = new Set()
const apps = [
  ['B2B-Website', 5284],
  ['B2C-Website', 5283],
]
for (const [app, port] of apps) {
  const routes = JSON.parse(await readFile(`${app}/dist/routes.json`, 'utf8'))
  for (const page of routes.pages) {
    for (const path of [page.url, `${page.url}/`, `/${page.file}`, `${page.url}/index.html`]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      assert.equal(response.status, 200, path)
      const html = await response.text()
      assert.match(html, /<h1\b/)
      assert.ok(html.includes(`"narmer-page-route">${JSON.stringify(page.url)}`), path)
      assert.ok(html.includes(`lang="${page.language}"`))
      for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g))
        assets.add(`http://127.0.0.1:${port}${asset[1]}`)
    }
    checks.push({ id: `${app}-${page.url}-named-and-clean-html`, passed: true })
  }
}
for (const asset of assets) assert.equal((await fetch(asset)).status, 200, asset)
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const [app, port] of apps)
      for (const language of ['en', 'ar']) {
        for (const width of [1440, 390]) {
          const page = await browser.newPage({
            viewport: { width, height: 960 },
            reducedMotion: 'reduce',
          })
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text())
          })
          page.on('response', (response) => {
            if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
          })
          const prefix = language === 'ar' ? '/ar' : ''
          const paths =
            app === 'B2B-Website'
              ? [
                  'index.html',
                  'spinning.html',
                  'wholesale.html',
                  'wholesale-quarter-zip-sweatshirt.html',
                ]
              : ['index.html']
          for (const path of paths) {
            await page.goto(`http://127.0.0.1:${port}${prefix}/${path}`, {
              waitUntil: 'networkidle',
            })
            await page.locator('h1').waitFor()
            await page.waitForURL((url) => url.pathname.startsWith(`/${language}`))
            assert.equal(
              await page.locator('html').getAttribute('dir'),
              language === 'ar' ? 'rtl' : 'ltr',
            )
            assert.match(
              await page.locator('h1').evaluate((node) => getComputedStyle(node).fontFamily),
              language === 'ar' ? /Cairo/ : /Poppins/,
            )
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            )
            assert.deepEqual(
              await page.evaluate(() =>
                [...document.images]
                  .filter(
                    (image) =>
                      image.complete && !image.naturalWidth && image.getClientRects().length,
                  )
                  .map((image) => image.src),
              ),
              [],
            )
            checks.push({
              id: `${engine}-${app}-${language}-${width}-${path}-hydrated`,
              passed: true,
            })
          }
          if (engine === 'chromium')
            await page.screenshot({ path: resolve(output, `${app}-${language}-${width}.png`) })
          await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
          assert.equal(new URL(page.url()).pathname, '/en')
          await page.close()
        }
        const noJs = await browser.newPage({ javaScriptEnabled: false })
        await noJs.goto(`http://127.0.0.1:${port}/${language}`, { waitUntil: 'networkidle' })
        assert.ok((await noJs.locator('h1').innerText()).length > 3)
        checks.push({ id: `${engine}-${app}-${language}-without-js`, passed: true })
        await noJs.close()
      }
  } finally {
    await browser.close()
  }
  console.log(`${engine}: structure and hydration checked`)
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify({ checks, assetsChecked: assets.size, errors }, null, 2),
)
assert.deepEqual(errors, [])
console.log(`${checks.length} organization checks passed; ${assets.size} linked assets load.`)
