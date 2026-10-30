import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/public-menu-focus'),
  checks = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const [store, port] of [
    ['b2b', 5284],
    ['b2c', 5283],
  ])
    for (const language of ['en', 'ar']) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      })
      await page.goto(`http://127.0.0.1:${port}/${language}`)
      const trigger = page.locator('.desktop-dropdown button').first()
      for (let i = 0; i < 10; i++) {
        await trigger.hover()
        await page.mouse.move(2, 950)
        await page.waitForFunction(
          () => document.querySelector('#category-navigation').dataset.open === 'false',
        )
        await trigger.focus()
        await page.keyboard.press('ArrowDown')
        try {
          await page.waitForFunction(
            () => document.querySelector('#category-navigation a') === document.activeElement,
            {},
            { timeout: 1000, polling: 20 },
          )
        } catch (error) {
          console.log(
            JSON.stringify({
              engine,
              store,
              language,
              i,
              state: await page.evaluate(() => ({
                active: document.activeElement.outerHTML,
                open: document.querySelector('#category-navigation').dataset.open,
                visibility: document.visibilityState,
              })),
            }),
          )
          throw error
        }
        if (i === 9)
          await page.screenshot({ path: resolve(output, `${engine}-${store}-${language}.png`) })
        await page.keyboard.press('Escape')
        await page.waitForFunction(
          () => document.activeElement?.matches('.desktop-dropdown button'),
          {},
          { polling: 20, timeout: 1000 },
        )
        assert.ok(await trigger.evaluate((node) => node === document.activeElement))
        checks.push(
          `${engine} ${store} ${language} pointer-close/ArrowDown/Escape repetition ${i + 1}`,
        )
      }
      await page.setViewportSize({ width: 390, height: 844 })
      await page.locator('.mobile-menu-button').click()
      const mobileTrigger = page.locator('.mobile-category-toggle').first()
      await mobileTrigger.focus()
      await page.keyboard.press('Enter')
      const firstMobileLink = page.locator('.mobile-category-links a').first()
      assert.equal(await firstMobileLink.getAttribute('tabindex'), '0')
      await page.keyboard.press('Tab')
      assert.ok(await firstMobileLink.evaluate((node) => node === document.activeElement))
      await mobileTrigger.click()
      assert.equal(await firstMobileLink.getAttribute('tabindex'), '-1')
      checks.push(`${engine} ${store} ${language} mobile expanded/closed keyboard access`)
      await page.close()
    }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks }, null, 2))
console.log(`${checks.length} repeated public-menu focus checks passed`)
