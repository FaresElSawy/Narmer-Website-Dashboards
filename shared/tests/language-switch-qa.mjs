import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/language-switch')
await mkdir(output, { recursive: true })
const checks = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const [store, port] of [
    ['b2b', 5284],
    ['b2c', 5283],
  ]) {
    for (const language of ['en', 'ar']) {
      for (const width of [1440, 1024, 768, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        const id = `${engine}-${store}-${language}-${width}`
        try {
          await page.goto(`http://127.0.0.1:${port}/${language}`)
          await page.locator('.public-header').waitFor()
          let link = page.locator('.public-header .language-link:visible').first()
          if (width < 1024) {
            await page.locator('.mobile-menu-button').click()
            link = page.locator('.navigation-drawer .language-link')
          }
          await link.waitFor()
          const icon = link.locator('.language-link-icon')
          assert.equal(await icon.getAttribute('aria-hidden'), 'true', id)
          const geometry = await icon.boundingBox()
          assert.equal(geometry.width, 20, id)
          assert.equal(geometry.height, 20, id)
          assert.notEqual(
            await icon.evaluate((node) => getComputedStyle(node).maskImage),
            'none',
            id,
          )
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            id,
          )
          assert.equal(await page.locator('.public-footer .language-link-icon').count(), 0, id)
          if (width === 1440 || width === 320)
            await page.screenshot({ path: resolve(output, `${id}.png`) })
          const next = language === 'ar' ? 'en' : 'ar'
          assert.equal(await link.getAttribute('href'), `/${next}`, id)
          await link.click()
          await page.waitForURL(`http://127.0.0.1:${port}/${next}`)
          await page.waitForFunction((value) => document.documentElement.lang === value, next)
          assert.deepEqual(errors, [], id)
          checks.push({ id, passed: true })
        } finally {
          await context.close()
        }
      }
    }
  }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
console.log(`${checks.length} public language-icon and switching cases passed.`)
