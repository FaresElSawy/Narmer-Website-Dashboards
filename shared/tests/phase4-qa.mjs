import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase4')
await mkdir(output, { recursive: true })
const results = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 768, 390, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          errors = [],
          id = `${engine}-${language}-${width}`
        page.setDefaultTimeout(12000)
        page.on('pageerror', (error) => errors.push(error.message))
        let apiCalls = 0
        page.on('request', (request) => {
          if (request.url().includes('/api/v1/')) apiCalls++
        })
        try {
          for (const [name, path] of [
            ['home', ''],
            ['collection', '/products'],
            ['product', '/products/logo-hoodie'],
            ['wishlist', '/wishlist'],
            ['cart', '/cart'],
            ['login', '/account/login'],
          ]) {
            await page.goto(`http://127.0.0.1:5283/${language}${path}`)
            await page.locator('h1').first().waitFor()
            if (name === 'collection') await page.locator('.catalog-count').waitFor()
            if (name === 'product') await page.locator('.product-selection').waitFor()
            await page.waitForFunction(() => !document.querySelector('.site-loader'))
            await page.evaluate(() => document.fonts.ready)
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
              `${id}:${name} overflow`,
            )
            assert.equal(
              await page.locator('link[rel="icon"]').getAttribute('href'),
              '/assets/images/favicon-gold.png',
            )
            assert.equal(await page.locator('.footer-credits a').count(), 2)
            if (width === 1440 || width === 390)
              await page.screenshot({ path: resolve(output, `${id}-${name}.png`), fullPage: true })
            results.push({ id: `${id}:${name}`, passed: true })
          }
          assert.deepEqual(errors, [], id)
          assert.equal(apiCalls, 0, `${id}: review must not call backend`)
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} Phase 4 responsive/RTL page cases passed.`)
