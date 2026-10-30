import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chooseDateTime } from './calendar-helpers.mjs'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-dialog-spacing'),
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
          port = store === 'b2c' ? 5283 : 5284
        await context.route('https://**/*', (route) => route.abort())
        page.setDefaultTimeout(10000)
        const routes =
          store === 'b2c'
            ? [
                ['orders/000000000000000000002ee0', 'order-status'],
                ['products/000000000000000000000064'],
                ['categories', 'first'],
                ['size-charts', 'first'],
                ['promotions?tab=sales'],
                ['promotions?tab=coupons'],
                ['shipping'],
                ['accounts', 'account'],
              ]
            : [
                ['requests/0000000000000000000007d2', 'contacted'],
                ['products/0000000000000000000000c8'],
                ['wholesale/0000000000000000000001f6'],
                ['accounts', 'account'],
              ]
        try {
          for (const [route, follow] of routes) {
            console.log(`Checking ${engine} ${store} ${language} ${route}`)
            await page.goto(`http://127.0.0.1:${port}/${language}/dashboard/${route}`, {
              waitUntil: 'networkidle',
            })
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
            if (follow === 'order-status' || follow === 'contacted') {
              await page
                .getByRole('button', {
                  name:
                    follow === 'contacted'
                      ? ar
                        ? 'تسجيل إتمام التواصل'
                        : 'Mark contacted'
                      : ar
                        ? 'ملغي'
                        : 'Canceled',
                  exact: true,
                })
                .click()
              await checkDialog(follow === 'contacted' ? 'contacted' : 'status', route)
              await page
                .getByRole('dialog')
                .getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true })
                .click()
              continue
            }
            if (route.startsWith('promotions') || route === 'shipping') {
              const coupon = route.includes('coupons'),
                shipping = route === 'shipping',
                name = shipping
                  ? ar
                    ? 'إضافة استثناء'
                    : 'Add override'
                  : coupon
                    ? ar
                      ? 'إضافة كوبون'
                      : 'Create coupon'
                    : ar
                      ? 'إضافة حملة'
                      : 'Create sale'
              await page.getByRole('button', { name, exact: true }).click()
              const dialog = page.getByRole('dialog')
              await checkFormDialog(route)
              if (shipping) {
                const governorate = dialog.getByRole('combobox', {
                  name: ar ? 'المحافظة' : 'Governorate',
                  exact: true,
                })
                await governorate.click()
                await dialog
                  .getByRole('listbox')
                  .getByRole('option', { name: ar ? 'القاهرة' : 'Cairo', exact: true })
                  .click()
                await dialog
                  .getByLabel(ar ? 'رسوم التوصيل (جنيه مصري)' : 'Delivery fee (EGP)', {
                    exact: true,
                  })
                  .fill('20')
              } else {
                await dialog
                  .getByLabel(ar ? 'الاسم · الإنجليزية' : 'Name · English', { exact: true })
                  .fill('Spacing example')
                await dialog
                  .getByLabel(ar ? 'الاسم · العربية' : 'Name · Arabic', { exact: true })
                  .fill('مثال المسافات')
                if (coupon)
                  await dialog
                    .getByLabel(ar ? 'رمز الكوبون' : 'Coupon code', { exact: true })
                    .fill('SPACE10')
                else {
                  await dialog.locator('.staff-target-products input').first().check()
                  await chooseDateTime(
                    page,
                    ar ? 'يبدأ (بتوقيت جهازك)' : 'Starts (your device time)',
                    '2030-01-01T10:00',
                  )
                  await chooseDateTime(
                    page,
                    ar ? 'ينتهي - غير شامل (بتوقيت جهازك)' : 'Ends - exclusive (your device time)',
                    '2030-01-02T10:00',
                  )
                }
              }
              await dialog
                .getByRole('button', { name: ar ? 'حفظ التغييرات' : 'Save changes', exact: true })
                .click()
              await dialog.waitFor({ state: 'detached' })
            }
            if (follow === 'first')
              await page.locator('.staff-table tbody tr').first().getByRole('link').click()
            if (follow === 'account')
              await page
                .getByRole('link', { name: ar ? 'تعديل الحساب' : 'Edit account', exact: true })
                .last()
                .click()
            const deletion = page.getByRole('button', { name: ar ? /^حذف / : /^Delete / }).first()
            await deletion.click()
            await checkDialog('deletion', route)
            await page
              .getByRole('dialog')
              .getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true })
              .click()
            if (follow === 'account') {
              await page
                .getByRole('button', {
                  name: ar
                    ? store === 'b2b'
                      ? 'نقل صلاحية المسؤول الرئيسي لهذا الحساب'
                      : 'نقل المسؤولية الرئيسية لهذا الحساب'
                    : 'Transfer super-admin ownership to this account',
                  exact: true,
                })
                .click()
              await checkDialog('handover', route)
              await page
                .getByRole('dialog')
                .getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true })
                .click()
              await page
                .getByRole('button', {
                  name: ar ? 'إنشاء حساب موظف' : 'Create staff account',
                  exact: true,
                })
                .click()
              await checkFormDialog('staff-creation')
              await page
                .getByRole('dialog')
                .getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true })
                .click()
            }
          }
          async function checkFormDialog(route) {
            for (const width of [1440, 360]) {
              await page.setViewportSize({ width, height: 956 })
              await page.evaluate(() => document.fonts.ready)
              const dialog = page.getByRole('dialog'),
                action = dialog.locator('button[type="submit"]').last()
              await action.scrollIntoViewIfNeeded()
              const gap = await action.evaluate((button) => {
                const group = button.closest('.staff-actions, .staff-save-bar') || button,
                  before = group.previousElementSibling
                return group.getBoundingClientRect().top - before.getBoundingClientRect().bottom
              })
              assert.ok(gap >= 15, `${store} ${language} ${route}: form action gap ${gap}`)
              assert.ok(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth))
              results.push({
                id: `${engine}-${store}-${language}-${width}-${route}-form`,
                gap,
                passed: true,
              })
            }
            await page.setViewportSize({ width: 1440, height: 956 })
          }
          async function checkDialog(kind, route) {
            for (const width of [1440, 360]) {
              await page.setViewportSize({ width, height: 956 })
              await page.evaluate(() => document.fonts.ready)
              const dialog = page.getByRole('dialog'),
                measurement = await dialog
                  .getByRole('button', {
                    name:
                      kind === 'contacted'
                        ? ar
                          ? 'نعم، تم التواصل'
                          : 'Yes, mark contacted'
                        : kind === 'status'
                          ? ar
                            ? 'تأكيد التغيير'
                            : 'Confirm change'
                          : kind === 'deletion'
                            ? ar
                              ? 'تأكيد الحذف'
                              : 'Confirm deletion'
                            : ar
                              ? 'تأكيد نقل المسؤولية'
                              : 'Confirm ownership transfer',
                    exact: true,
                  })
                  .evaluate((button) => {
                    const message = [...button.closest('dialog').querySelectorAll(':scope > p')]
                        .at(-1)
                        .getBoundingClientRect(),
                      action = button.getBoundingClientRect()
                    return {
                      gap: action.top - message.bottom,
                      x: action.x,
                      width: action.width,
                      height: action.height,
                      margin: getComputedStyle(button).marginTop,
                    }
                  }),
                { gap, ...action } = measurement,
                id = `${engine}-${store}-${language}-${width}-${route.replaceAll('/', '-').replaceAll('?', '-')}-${kind}`
              if (gap < 15) await page.screenshot({ path: resolve(output, `${id}-failure.png`) })
              assert.ok(gap >= 15, `${id}: ${JSON.stringify(measurement)}`)
              assert.ok(
                await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
                `${id}: dialog overflow`,
              )
              assert.ok(action.height >= 44 && action.x >= 0 && action.x + action.width <= width)
              if (engine === 'chromium' && (route === 'accounts' || route === 'shipping'))
                await page.screenshot({ path: resolve(output, `${id}.png`) })
              results.push({ id, gap, passed: true })
            }
            await page.setViewportSize({ width: 1440, height: 956 })
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
  `${results.length} deletion and handover dialog spacing checks passed; no deletion or transfer was submitted`,
)
