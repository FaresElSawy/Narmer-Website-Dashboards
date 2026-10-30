import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve(process.env.NARMER_QA_OUTPUT || 'output/playwright/profile-password-sizing'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const [store, port] of [
      ['b2c', 5283],
      ['b2b', 5284],
    ]) {
      for (const language of ['en', 'ar']) {
        const context = await browser.newContext({
            viewport: { width: 1440, height: 956 },
            reducedMotion: 'reduce',
          }),
          page = await context.newPage()
        await context.route('https://**/*', (route) => route.abort())
        try {
          await page.goto(`http://127.0.0.1:${port}/${language}/dashboard/profile`, {
            waitUntil: 'networkidle',
          })
          const form = page.locator('.staff-password-form'),
            button = form.getByRole('button')
          await button.waitFor()
          for (const width of [1920, 1440, 1024, 768, 360, 320]) {
            await page.setViewportSize({ width, height: 956 })
            await page.evaluate(() => document.fonts.ready)
            await button.scrollIntoViewIfNeeded()
            const boxes = await form.evaluate((element) => ({
              button: element.querySelector('button').getBoundingClientRect().toJSON(),
              input: [...element.querySelectorAll('input')].at(-1).getBoundingClientRect().toJSON(),
            }))
            assert.equal(boxes.button.height, 48, JSON.stringify(boxes))
            assert.ok(boxes.button.height <= boxes.input.height, JSON.stringify(boxes))
            assert.ok(Math.abs(boxes.button.width - boxes.input.width) <= 2, JSON.stringify(boxes))
            if (width > 760)
              assert.ok(
                Math.abs(boxes.button.bottom - boxes.input.bottom) <= 1,
                JSON.stringify(boxes),
              )
            else assert.ok(boxes.button.top - boxes.input.bottom >= 15, JSON.stringify(boxes))
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
            if ([1440, 360].includes(width))
              await page.screenshot({
                path: resolve(output, `${store}-${engine}-${language}-${width}.png`),
              })
            results.push({
              engine,
              store,
              language,
              width,
              buttonHeight: boxes.button.height,
              inputHeight: boxes.input.height,
            })
          }
          assert.equal(await button.isDisabled(), true)
          await form.locator('input').nth(0).fill('FixtureCurrent9!')
          await form.locator('input').nth(1).fill('FixtureNext9!')
          await form.locator('input').nth(2).fill('FixtureNext9!')
          await page.waitForFunction(
            () => !document.querySelector('.staff-password-form button').disabled,
          )
          assert.equal(await button.isEnabled(), true)
          await form.locator('input').nth(2).fill('Different9!')
          await page.waitForFunction(
            () => document.querySelector('.staff-password-form button').disabled,
          )
          assert.equal(await button.isDisabled(), true)
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} password button sizing views passed; no password changes submitted`)
