import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-audit'),
  checks = [],
  failures = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar']) {
    const ar = language === 'ar',
      context = await browser.newContext({
        viewport: { width: 1024, height: 768 },
        reducedMotion: 'reduce',
      }),
      page = await context.newPage(),
      base = `http://127.0.0.1:5284/${language}/dashboard`
    let allow = false,
      warnings = 0
    page.on('dialog', async (dialog) => {
      warnings++
      if (allow) await dialog.accept()
      else await dialog.dismiss()
    })
    try {
      await page.goto(`${base}/requests`)
      await page
        .locator('.dashboard-sidebar')
        .getByRole('link', { name: ar ? 'نماذج الطلبات' : 'Request forms', exact: true })
        .click()
      const title = page.getByLabel(ar ? 'العنوان · الإنجليزية' : 'Title · English', {
        exact: true,
      })
      await title.fill('Unsaved audit change')
      await page.getByText(ar ? 'تغييرات غير محفوظة' : 'Unsaved changes', { exact: true }).waitFor()
      const formIndex = await page.evaluate(() => history.state.idx)
      await page.goBack()
      await page.waitForFunction(() => location.pathname.endsWith('/forms'))
      assert.equal(await title.inputValue(), 'Unsaved audit change')
      assert.equal(warnings, 1)
      await page.waitForFunction((index) => history.state.idx === index, formIndex)
      allow = true
      await page.goBack()
      await page.waitForURL(`${base}/requests`)
      await page.getByRole('heading', { name: ar ? 'الطلبات' : 'Requests', exact: true }).waitFor()
      assert.equal(warnings, 2)
      checks.push(
        `${engine} ${language} browser Back warns and Cancel keeps edits; acceptance leaves`,
      )

      await page.goForward()
      await page.waitForURL('**/dashboard/forms')
      await title.waitFor()
      await title.fill('Saved audit change')
      await page
        .getByRole('button', { name: ar ? 'حفظ التغييرات' : 'Save changes', exact: true })
        .click()
      await page.getByText(ar ? 'تم الحفظ' : 'Changes saved', { exact: true }).waitFor()
      const before = warnings
      await page.goBack()
      await page.waitForURL(`${base}/requests`)
      assert.equal(warnings, before)
      checks.push(`${engine} ${language} save clears the guard and browser Forward remains usable`)

      await page
        .locator('.dashboard-sidebar')
        .getByRole('link', { name: ar ? 'الحسابات' : 'Accounts', exact: true })
        .click()
      await page
        .getByRole('button', { name: ar ? 'إنشاء حساب موظف' : 'Create staff account', exact: true })
        .click()
      const dialog = page.getByRole('dialog', {
        name: ar ? 'إنشاء حساب موظف' : 'Create staff account',
        exact: true,
      })
      await dialog.getByLabel(ar ? 'الاسم *' : 'Name *', { exact: true }).fill('Unsaved staff name')
      const accountIndex = await page.evaluate(() => history.state.idx)
      allow = false
      await page.goBack()
      await page.waitForFunction(() => location.pathname.endsWith('/accounts'))
      assert.equal(
        await dialog.getByLabel(ar ? 'الاسم *' : 'Name *', { exact: true }).inputValue(),
        'Unsaved staff name',
      )
      await page.waitForFunction((index) => history.state.idx === index, accountIndex)
      await page.screenshot({ path: resolve(output, `${engine}-${language}-modal-history.png`) })
      allow = true
      await page.goBack()
      await page.waitForURL(`${base}/requests`)
      await page.getByRole('heading', { name: ar ? 'الطلبات' : 'Requests', exact: true }).waitFor()
      checks.push(`${engine} ${language} unsaved staff modal also survives cancelled browser Back`)

      await page.goto(`${base}/products/new`)
      await page
        .getByLabel(ar ? 'الاسم * · الإنجليزية' : 'Name * · English', { exact: true })
        .fill('New audit product')
      await page
        .getByLabel(ar ? 'الاسم * · العربية' : 'Name * · Arabic', { exact: true })
        .fill('منتج مراجعة')
      const beforeCreate = warnings
      await page
        .getByRole('button', { name: ar ? 'حفظ التغييرات' : 'Save changes', exact: true })
        .click()
      await page.waitForURL(/\/products\/[a-f\d]{24}$/)
      assert.equal(warnings, beforeCreate)
      checks.push(
        `${engine} ${language} successful creation redirects without a stale dirty warning`,
      )
    } catch (error) {
      failures.push({ engine, language, error: error.stack })
      await page.screenshot({
        path: resolve(output, `${engine}-${language}-navigation-failure.png`),
      })
    }
    await context.close()
  }
  await browser.close()
}
await writeFile(
  resolve(output, 'navigation-results.json'),
  JSON.stringify({ checks, failures }, null, 2),
)
assert.equal(failures.length, 0, JSON.stringify(failures))
console.log(`${checks.length} dashboard history and unsaved-edit checks passed`)
