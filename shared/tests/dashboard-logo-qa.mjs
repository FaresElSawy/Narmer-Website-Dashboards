import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-logo'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const store of ['b2c', 'b2b'])
      for (const language of ['en', 'ar']) {
        const context = await browser.newContext({
            viewport: { width: 1440, height: 956 },
            reducedMotion: 'reduce',
          }),
          page = await context.newPage(),
          ar = language === 'ar',
          base = `http://127.0.0.1:${store === 'b2c' ? 5283 : 5284}/${language}/dashboard`,
          home = `${base}/${store === 'b2c' ? 'orders' : 'requests'}`
        let allow = false,
          warnings = 0
        page.on('dialog', async (dialog) => {
          warnings++
          await (allow ? dialog.accept() : dialog.dismiss())
        })
        await context.route('https://**/*', (route) => route.abort())
        try {
          for (const role of ['admin', 'superAdmin', 'moderator'])
            for (const width of [1440, 360]) {
              await page.setViewportSize({ width, height: 956 })
              await page.goto(`${base}/profile`, { waitUntil: 'networkidle' })
              const selector = page.getByRole('combobox', {
                name: ar ? 'الدور التجريبي' : 'Review role',
                exact: true,
              })
              await selector.click()
              await page
                .getByRole('listbox')
                .getByRole('option', { name: role, exact: true })
                .click()
              const name = page.getByLabel(ar ? 'الاسم' : 'Name', { exact: true })
              await name.waitFor()
              const guard =
                engine === 'chromium' && language === 'en' && role === 'admin' && width === 1440
              if (guard) await name.fill('Unsaved logo check')
              async function logo() {
                if (width === 360) {
                  await page
                    .getByRole('button', { name: ar ? 'القائمة' : 'Menu', exact: true })
                    .click()
                  return page.locator('.dashboard-drawer[open] .sidebar-brand a')
                }
                return page.locator('.dashboard-sidebar .sidebar-brand a')
              }
              const link = await logo()
              assert.equal(
                await link.getAttribute('href'),
                `/${language}/dashboard/${store === 'b2c' ? 'orders' : 'requests'}`,
              )
              const prompt = guard ? page.waitForEvent('dialog') : null
              await link.click()
              if (guard) {
                await prompt
                assert.equal(page.url(), `${base}/profile`)
                assert.equal(await name.inputValue(), 'Unsaved logo check')
                assert.equal(warnings, 1)
                allow = true
                await (await logo()).click()
              }
              await page.waitForURL(home)
              allow = false
              assert.equal(await selector.innerText(), role)
              assert.equal(await page.locator('.dashboard-drawer[open]').count(), 0)
              results.push({ engine, store, language, role, width, destination: home })
            }
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
  `${results.length} dashboard logo checks passed; both stores, languages, roles and desktop/mobile`,
)
