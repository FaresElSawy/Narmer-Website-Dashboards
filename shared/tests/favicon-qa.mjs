import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/favicons')
await mkdir(output, { recursive: true })
const checks = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const port of [5284, 5283]) {
      for (const language of ['en', 'ar']) {
        const context = await browser.newContext({ reducedMotion: 'reduce' })
        try {
          const page = await context.newPage(),
            errors = [],
            origin = `http://127.0.0.1:${port}`
          page.on('pageerror', (error) => errors.push(error.message))
          const expectIcon = async () => {
            const path = '/assets/images/favicon-gold.png'
            await page.waitForFunction(
              (value) => document.querySelector('link[rel="icon"]')?.getAttribute('href') === value,
              path,
            )
            assert.equal(await page.locator('link[rel="icon"]').count(), 1)
            const response = await context.request.get(`${origin}${path}`)
            assert.equal(response.status(), 200)
            const app = port === 5284 ? 'B2B-Website' : 'B2C-Website'
            assert.deepEqual(
              await response.body(),
              await readFile(`${app}/public/assets/images/favicon-gold.png`),
            )
          }
          await page.goto(`${origin}/${language}`)
          await expectIcon()
          await page.locator(`a[href="/${language}/dashboard"]`).first().click()
          await expectIcon()
          await page.goBack()
          await expectIcon()
          for (const path of ['login', 'forgot-password', 'reset-password']) {
            await page.goto(`${origin}/${language}/dashboard/${path}`)
            await page.locator('.staff-access-panel').waitFor()
            await expectIcon()
            if (path === 'login' && language === 'en')
              assert.equal(await page.title(), 'Staff Login | Narmer')
          }
          await page.reload()
          await expectIcon()
          await page.locator('.staff-access-brand').click()
          await expectIcon()
          assert.deepEqual(errors, [])
          checks.push({ engine, port, language, passed: true })
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
console.log(`${checks.length} favicon route, refresh, asset and staff-title cases passed.`)
