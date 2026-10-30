import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-actions'),
  results = [],
  cases = {
    b2c: [
      ['products', 'list'],
      ['products', 'edit'],
      ['products', 'variants'],
      ['products', 'images'],
      ['categories', 'list'],
      ['categories', 'edit'],
      ['size-charts', 'list'],
      ['size-charts', 'edit'],
      ['accounts', 'list'],
      ['accounts', 'edit'],
      ['homepage', 'editor'],
    ],
    b2b: [
      ['products', 'list'],
      ['products', 'edit'],
      ['wholesale', 'list'],
      ['wholesale', 'edit'],
      ['accounts', 'list'],
      ['accounts', 'edit'],
      ['homepage', 'editor'],
      ['forms/fabric', 'editor'],
    ],
  }
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
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      await context.route('https://**/*', (route) => route.abort())
      try {
        for (const [store, routes] of Object.entries(cases)) {
          const base = `http://127.0.0.1:${store === 'b2c' ? 5283 : 5284}/${language}/dashboard`
          const editLinks = () =>
            store === 'b2c'
              ? page.locator('.staff-table .staff-edit-icon')
              : page.locator('.staff-table a').filter({ hasText: ar ? /^تعديل/ : /^Edit/ })
          for (const [section, mode] of routes) {
            await page.setViewportSize({ width: 1440, height: 956 })
            await page.goto(`${base}/${section}`, { waitUntil: 'networkidle' })
            const role = page.getByRole('combobox', {
              name: ar ? 'الدور التجريبي' : 'Review role',
              exact: true,
            })
            await role.click()
            await page
              .getByRole('listbox')
              .getByRole('option', { name: 'superAdmin', exact: true })
              .click()
            await page.waitForFunction(() => !document.querySelector('#workspace .skeleton'))
            if (['edit', 'variants', 'images'].includes(mode)) {
              await editLinks().first().click()
              await page.locator('#workspace form').filter({ visible: true }).first().waitFor()
            }
            if (mode === 'variants') {
              await page
                .getByRole('tab', {
                  name: ar ? 'التركيبات والمخزون' : 'Variants & stock',
                  exact: true,
                })
                .click()
              await page.locator('.staff-variant summary').first().click()
            }
            if (mode === 'images')
              await page.getByRole('tab', { name: ar ? 'الصور' : 'Images', exact: true }).click()
            if (mode === 'list' && section === 'accounts')
              assert.ok(
                (await page
                  .getByRole('link', { name: ar ? 'عرض فقط' : 'View only', exact: true })
                  .count()) > 0,
              )
            for (const width of [1440, 768, 360]) {
              await page.setViewportSize({ width, height: 956 })
              await page.evaluate(async () => {
                await document.fonts.ready
                await new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                )
              })
              const tableIcons = store === 'b2c' && mode === 'list'
              const controls = tableIcons
                ? page.locator('#workspace .staff-row-icon')
                : page.locator('#workspace button, #workspace a').filter({
                    hasText: ar ? /^(حذف |إزالة|تعديل)/ : /^(Delete |Remove|Edit|Clear override)/,
                  })
              await controls.filter({ visible: true }).first().waitFor()
              assert.ok(
                await page
                  .locator('#workspace .staff-row-icon')
                  .evaluateAll((elements) => elements.every((element) => element.closest('table'))),
                'Icon actions must stay inside tables',
              )
              if (store === 'b2b')
                assert.equal(await page.locator('#workspace .staff-row-icon').count(), 0)
              const actions = tableIcons
                ? await page
                    .locator('.staff-row-icon')
                    .filter({ visible: true })
                    .evaluateAll((elements) =>
                      elements.map((element) => {
                        const box = element.getBoundingClientRect(),
                          svg = element.querySelector('svg'),
                          symbol = svg.getBoundingClientRect()
                        return {
                          label: element.getAttribute('aria-label'),
                          title: element.title,
                          text: element.textContent.trim(),
                          width: box.width,
                          height: box.height,
                          symbolWidth: symbol.width,
                          symbolHeight: symbol.height,
                          rotate: getComputedStyle(svg).rotate,
                        }
                      }),
                    )
                : []
              assert.ok(
                !tableIcons || actions.length,
                `${store} ${section} ${mode}: no table icon actions`,
              )
              for (const action of actions) {
                assert.ok(action.label && action.title === action.label, JSON.stringify(action))
                assert.equal(action.text, '')
                assert.ok(action.width >= 44 && action.height >= 44, JSON.stringify(action))
                assert.equal(action.symbolWidth, 20)
                assert.equal(action.symbolHeight, 20)
                assert.ok(['none', '0deg'].includes(action.rotate), JSON.stringify(action))
              }
              assert.ok(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                `${store} ${section} ${mode} ${width}: overflow`,
              )
              if ([1440, 360].includes(width) && ['list', 'images', 'editor'].includes(mode))
                await page.screenshot({
                  path: resolve(
                    output,
                    `${engine}-${language}-${store}-${section.replaceAll('/', '-')}-${mode}-${width}.png`,
                  ),
                  fullPage: mode === 'images',
                })
              results.push({
                engine,
                language,
                store,
                section,
                mode,
                width,
                actions: await controls.filter({ visible: true }).count(),
                presentation: tableIcons ? 'table-icons' : 'text',
              })
            }
            if (section === 'products' && mode === 'edit') {
              await page.getByRole('button', { name: ar ? /^حذف / : /^Delete / }).click()
              const dialog = page.getByRole('dialog')
              await dialog
                .getByRole('button', { name: ar ? 'تأكيد الحذف' : 'Confirm deletion', exact: true })
                .waitFor()
              if (store === 'b2c')
                assert.ok((await dialog.locator('.staff-reference strong').innerText()).length > 0)
              await dialog
                .getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true })
                .click()
            }
          }
          // Record deletion remains hidden from admins outside the existing shipping exception.
          await page.goto(`${base}/products`, { waitUntil: 'networkidle' })
          await page
            .getByRole('combobox', { name: ar ? 'الدور التجريبي' : 'Review role', exact: true })
            .click()
          await page
            .getByRole('listbox')
            .getByRole('option', { name: 'admin', exact: true })
            .click()
          await editLinks().first().click()
          await page.locator('#workspace form').filter({ visible: true }).first().waitFor()
          assert.equal(
            await page.getByRole('button', { name: ar ? /^حذف / : /^Delete / }).count(),
            0,
          )
        }
        assert.deepEqual(errors, [])
      } catch (error) {
        await page.screenshot({ path: resolve(output, `${engine}-${language}-failure.png`) })
        throw error
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(
  `${results.length} dashboard action views passed: B2C table icons, text editor buttons and restored B2B controls`,
)
