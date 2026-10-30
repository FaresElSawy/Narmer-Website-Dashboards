import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/brand-button'),
  checks = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar'])
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
          viewport: { width, height: 960 },
          hasTouch: width === 390,
          reducedMotion: 'reduce',
        }),
        page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' && /hydration|Minified React|TypeError/.test(message.text()))
          errors.push(message.text())
      })
      await page.goto(`http://127.0.0.1:5284/${language}`, { waitUntil: 'networkidle' })
      const button = page.locator('.public-hero .button--accent').first()
      await button.waitFor()
      assert.ok(
        await page
          .locator('#category-navigation a')
          .evaluateAll((nodes) => nodes.every((node) => node.tabIndex === -1)),
      )
      assert.equal(await page.locator('#category-navigation').getAttribute('aria-hidden'), 'true')
      assert.equal(
        await button.evaluate((n) => getComputedStyle(n).backgroundColor),
        'rgb(191, 141, 52)',
      )
      await button.hover()
      const expected = width === 1440 ? 'rgb(209, 160, 75)' : 'rgb(191, 141, 52)'
      assert.equal(await button.evaluate((n) => getComputedStyle(n).backgroundColor), expected)
      if (width === 1440)
        assert.equal(await button.evaluate((n) => getComputedStyle(n).color), 'rgb(16, 42, 51)')
      await button.screenshot({ path: resolve(output, `${engine}-${language}-${width}.png`) })
      checks.push(
        `${engine} ${language} ${width} gold-on-navy primary, lighter-gold desktop hover and no touch hover override`,
      )
      const wholesale = page.locator('.business-wholesale__copy .button--accent')
      await wholesale.hover()
      assert.equal(await wholesale.evaluate((n) => getComputedStyle(n).backgroundColor), expected)
      await page.goto(`http://127.0.0.1:5284/${language}/services/spinning`)
      await page.waitForFunction(() => !document.querySelector('.site-loader'))
      const lightButton = page.locator('.business-service-cta .button--accent:visible')
      await lightButton.hover()
      assert.equal(
        await lightButton.evaluate((n) => getComputedStyle(n).backgroundColor),
        width === 1440 ? 'rgb(7, 59, 80)' : 'rgb(191, 141, 52)',
      )
      await page.goto(`http://127.0.0.1:5284/${language}/dashboard/requests`)
      const priority = page.locator('.staff-priority .button--accent')
      await priority.hover()
      assert.equal(await priority.evaluate((n) => getComputedStyle(n).backgroundColor), expected)
      await priority.screenshot({
        path: resolve(output, `${engine}-${language}-${width}-priority.png`),
      })
      await page.goto(`http://127.0.0.1:5283/${language}`)
      const retailButton = page.locator('.campaign-copy .button--accent').first()
      await retailButton.hover()
      assert.equal(
        await retailButton.evaluate((n) => getComputedStyle(n).backgroundColor),
        expected,
      )
      assert.equal(await page.locator('.footer-credits').count(), 1)
      checks.push(
        `${engine} ${language} ${width} wholesale/dashboard/B2C navy contexts and unchanged light-surface hover`,
      )
      assert.deepEqual(errors, [])
      await context.close()
    }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks }, null, 2))
console.log(`${checks.length} Narmer button-state checks passed`)
