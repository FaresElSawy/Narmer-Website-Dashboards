import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/public-controls'),
  checks = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar'])
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          hasTouch: width < 768,
        }),
        page = await context.newPage(),
        errors = [],
        id = `${engine}-${language}-${width}`
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('dialog', (dialog) => dialog.accept())
      await page.goto(`http://127.0.0.1:5284/${language}/request?service=fabric`)
      const service = page.locator('.service-picker [role=combobox]')
      await service.waitFor()
      const footer = page.locator('.footer-credits')
      assert.equal(
        await footer.locator('a').nth(0).getAttribute('href'),
        'https://dtech-agency.com/',
      )
      assert.equal(await footer.locator('a').nth(1).getAttribute('href'), 'https://glitci.com/')
      assert.equal(
        await footer.locator('p').nth(0).innerText(),
        'Developed by D-Tech & Glitci Solutions',
      )
      assert.equal(
        await footer.locator('p').nth(1).innerText(),
        'All rights reserved © 2026 Narmer Clothing Factory.',
      )
      assert.equal(await footer.evaluate((node) => getComputedStyle(node).textAlign), 'center')
      await footer.screenshot({ path: resolve(output, `${id}-footer.png`) })
      await service.click()
      await page.keyboard.press('Home')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() =>
        document
          .querySelector('#request-service')
          .textContent.includes(document.documentElement.lang === 'ar' ? 'الغزل' : 'Spinning'),
      )
      assert.equal(await page.locator('.service-picker select').inputValue(), 'spinning')
      const boolean = page.locator('#question-answer-has-design')
      await boolean.click()
      assert.equal(await page.getByRole('listbox').getByRole('option').count(), 3)
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('select[name=has-design]').inputValue(), 'no')
      const choice = page.locator('#question-answer-material-source')
      await choice.focus()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('select[name=material-source]').inputValue(), 'discuss')
      const upload = page.locator('.upload-label input[type=file]')
      const checkbox = page.getByRole('checkbox').first()
      await checkbox.focus()
      await page.keyboard.press('Space')
      assert.equal(await checkbox.isChecked(), true)
      assert.equal(await checkbox.evaluate((node) => getComputedStyle(node).appearance), 'none')
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('.check-option input:checked'))
            .backgroundColor === 'rgb(191, 141, 52)',
      )
      assert.notEqual(
        await checkbox.evaluate((node) => getComputedStyle(node).outlineStyle),
        'none',
      )
      await page
        .locator('.inquiry-choice-field')
        .screenshot({ path: resolve(output, `${id}-checkboxes.png`) })
      await page.keyboard.press('Space')
      assert.equal(await checkbox.isChecked(), false)
      await upload.scrollIntoViewIfNeeded()
      if (width === 1440) {
        const box = await upload.boundingBox(),
          rtl = language === 'ar'
        await page.mouse.move(rtl ? box.x + box.width - 35 : box.x + 35, box.y + 20)
        await page.screenshot({ path: resolve(output, `${id}-upload-hover.png`) })
        // Chromium exposes this pseudo-element's computed color; WebKit is inspected visually.
        if (engine === 'chromium') {
          await page.waitForFunction(
            () =>
              getComputedStyle(
                document.querySelector('.upload-label input'),
                '::file-selector-button',
              ).backgroundColor === 'rgb(21, 82, 104)',
          )
        }
      }
      assert.ok(
        await page
          .locator('.request-start select')
          .evaluateAll((nodes) =>
            nodes.every((node) => node.classList.contains('narmer-select-native')),
          ),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      checks.push(
        `${id} public service, boolean and choice keyboard selection, branded controls and upload`,
      )
      await page.goto(`http://127.0.0.1:5284/${language}/account/login`)
      await page.locator('input[name=password]').fill('NarmerDemo123')
      await page.locator('.auth-submit').click()
      await page.waitForURL(`**/${language}/account`)
      await page.locator('.account-links a[href$="profile"]').click()
      await page.locator(`.profile-sidebar a[href='/${language}/requests']`).click()
      const status = page.locator('.history-filters [role=combobox]').first()
      await status.click()
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      await page.waitForURL('**/requests?status=contacted')
      await page.waitForFunction(
        () => document.querySelector('.history-filters select')?.value === 'contacted',
      )
      assert.equal(await page.locator('.history-filters select').first().inputValue(), 'contacted')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      assert.deepEqual(errors, [])
      await page.screenshot({ path: resolve(output, `${id}-history.png`) })
      checks.push(`${id} customer history filter updates its URL without overflow or page errors`)
      await context.close()
    }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks }, null, 2))
console.log(`${checks.length} public-control checks passed`)
