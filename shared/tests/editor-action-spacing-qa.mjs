import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/editor-action-spacing'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar']) {
      const context = await browser.newContext({
          viewport: { width: 1440, height: 956 },
          reducedMotion: 'reduce',
        }),
        page = await context.newPage(),
        ar = language === 'ar',
        errors = []
      await context.route('https://**/*', (route) => route.abort())
      page.on('pageerror', (error) => errors.push(error.message))
      page.setDefaultTimeout(10000)
      try {
        for (const section of ['categories', 'products', 'size-charts']) {
          await page.setViewportSize({ width: 1440, height: 956 })
          await page.goto(`http://127.0.0.1:5283/${language}/dashboard/${section}`, {
            waitUntil: 'networkidle',
          })
          await page
            .getByRole('combobox', { name: ar ? 'الدور التجريبي' : 'Review role', exact: true })
            .click()
          await page
            .getByRole('listbox')
            .getByRole('option', { name: 'superAdmin', exact: true })
            .click()
          await page.locator('.staff-table .staff-edit-icon').first().click()
          const sidebar = page.locator('.staff-detail-grid > aside'),
            remove = sidebar.getByRole('button', { name: ar ? /^حذف / : /^Delete / }),
            save = sidebar.getByRole('button', {
              name: ar ? 'حفظ التغييرات' : 'Save changes',
              exact: true,
            })
          await remove.waitFor()
          for (const width of [1920, 1440, 1024, 768, 360, 320]) {
            await page.setViewportSize({ width, height: 956 })
            await page.evaluate(async () => {
              await document.fonts.ready
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              )
            })
            await remove.scrollIntoViewIfNeeded()
            const geometry = await sidebar.evaluate((element) => {
              const buttons = [...element.querySelectorAll('button')],
                remove = buttons.find((button) =>
                  /^(Delete |حذف )/.test(button.textContent.trim()),
                ),
                save = element.querySelector('button[type=submit]')
              return {
                remove: remove.getBoundingClientRect().toJSON(),
                save: save.getBoundingClientRect().toJSON(),
                margin: parseFloat(getComputedStyle(remove).marginBlockStart),
              }
            })
            assert.equal(geometry.margin, 16)
            if (section === 'products' && width <= 1100) {
              assert.ok(
                geometry.remove.bottom <= geometry.save.top ||
                  geometry.save.bottom <= geometry.remove.top,
                JSON.stringify(geometry),
              )
            } else {
              const gap = geometry.remove.top - geometry.save.bottom
              assert.ok(gap >= 15.5 && gap <= 16.5, `${section} ${width}: ${gap}px`)
            }
            assert.ok((await remove.innerText()).trim().length > 0)
            assert.equal(await remove.locator('svg').count(), 0)
            assert.ok(await save.isVisible())
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
            if ([1440, 360].includes(width))
              await page.screenshot({
                path: resolve(output, `${engine}-${language}-${section}-${width}.png`),
              })
            results.push({ engine, language, section, width, margin: geometry.margin })
          }
        }
        assert.deepEqual(errors, [])
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} category/product/chart editor action-spacing views passed`)
