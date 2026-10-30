import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/phase7'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of engine === 'chromium' ? [1440, 900, 390, 320] : [1440, 390]) {
        const context = await browser.newContext({
            viewport: { width, height: 1000 },
            reducedMotion: 'reduce',
            hasTouch: width < 500,
          }),
          page = await context.newPage(),
          errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.setDefaultTimeout(10000)
        await context.route('https://**/*', (route) => route.abort())
        try {
          for (const route of ['overview', 'finance', 'performance']) {
            const id = `${engine}-${language}-${width}-${route}`
            await page.goto(`http://127.0.0.1:5283/${language}/dashboard/${route}`, {
              waitUntil: 'networkidle',
            })
            await page.evaluate(() => document.fonts.ready)
            await page.locator('.report-footnotes').waitFor()
            assert.equal(await page.locator('.feedback--error').count(), 0, id)
            assert.deepEqual(errors, [], id)
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
              false,
              `${id}: page overflow`,
            )
            assert.equal(
              await page
                .locator('input[type=date],input[type=datetime-local],input[type=time]')
                .count(),
              0,
              id,
            )
            for (const element of await page.locator('.reports button').all()) {
              if (!(await element.isVisible())) continue
              const rect = await element.boundingBox()
              assert(rect.width > 22 && rect.height > 28, `${id}: tiny control`)
            }
            if (route !== 'performance') {
              for (const details of await page.locator('.report-data').all()) {
                await details.locator('summary').click()
                assert(await details.locator('table').isVisible())
                await details.locator('summary').click()
              }
            }
            if (engine === 'chromium' && [1440, 390].includes(width))
              await page.screenshot({ path: resolve(output, `${id}.png`), fullPage: true })
            // Open the house calendar and its year menu: both must float without page overflow.
            await page.locator('.report-date-field .narmer-date-trigger').first().click()
            const calendar = page.locator('.report-calendar:popover-open')
            await calendar.waitFor()
            assert.equal(await calendar.locator('select').count(), 2)
            const year = calendar.locator('.narmer-select-trigger').nth(1)
            await year.click()
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
              false,
              `${id}: calendar overflow`,
            )
            await page.keyboard.press('Escape')
            await page.keyboard.press('Escape')
            if (route === 'overview' && width === 390) {
              await page.locator('.report-date-field .narmer-date-trigger').first().tap()
              await page.waitForFunction(() => document.activeElement?.hasAttribute('data-date'))
              const original = await page.locator('[data-date]:focus').getAttribute('data-date')
              await page.keyboard.press('ArrowDown')
              await page.waitForFunction(
                (previous) => document.activeElement?.getAttribute('data-date') !== previous,
                original,
              )
              assert.notEqual(
                await page.locator('[data-date]:focus').getAttribute('data-date'),
                original,
              )
              await page.keyboard.press('Enter')
              assert.equal(await page.locator('.report-calendar:popover-open').count(), 0)
            }
            results.push({ id, passed: true })
          }
          // Moderator cannot enter reports even through a direct URL.
          if (engine === 'chromium' && width === 1440) {
            await page.locator('.review-bar .narmer-select-trigger').click()
            await page.getByRole('option', { name: 'moderator', exact: true }).click()
            await page.waitForURL('**/dashboard/orders')
            for (const route of ['overview', 'finance', 'performance'])
              assert.equal(
                await page.locator(`a[href="/${language}/dashboard/${route}"]`).count(),
                0,
              )
            results.push({ id: `${language}-moderator-guard`, passed: true })
          }
        } catch (error) {
          await page.screenshot({
            path: resolve(output, `${engine}-${language}-${width}-failure.png`),
            fullPage: true,
          })
          throw error
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'layout-results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} report layout / role checks passed`)
