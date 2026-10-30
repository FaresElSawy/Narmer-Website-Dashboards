import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chooseDateTime } from './calendar-helpers.mjs'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/promotions-controls'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar']) {
      const context = await browser.newContext({
          viewport: { width: 1440, height: 956 },
          reducedMotion: 'reduce',
          timezoneId: 'Africa/Cairo',
        }),
        page = await context.newPage(),
        ar = language === 'ar',
        errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.setDefaultTimeout(10000)
      await context.route('https://**/*', (route) => route.abort())
      const text = (en, arabic) => (ar ? arabic : en)
      try {
        await page.goto(`http://127.0.0.1:5283/${language}/dashboard/promotions`, {
          waitUntil: 'networkidle',
        })
        for (const kind of ['sales', 'coupons']) {
          if (kind === 'coupons')
            await page
              .getByRole('button', { name: text('Coupons', 'الكوبونات'), exact: true })
              .click()
          await page
            .getByRole('button', {
              name:
                kind === 'sales'
                  ? text('Create sale', 'إضافة حملة')
                  : text('Create coupon', 'إضافة كوبون'),
              exact: true,
            })
            .click()
          const modal = page.locator('dialog.modal[open]')
          await modal
            .getByLabel(text('Name · English', 'الاسم · الإنجليزية'), { exact: true })
            .fill(`QA ${kind}`)
          await modal
            .getByLabel(text('Name · Arabic', 'الاسم · العربية'), { exact: true })
            .fill(`اختبار ${kind}`)
          if (kind === 'sales') await modal.locator('.staff-target-products input').first().check()
          else
            await modal.getByLabel(text('Coupon code', 'رمز الكوبون'), { exact: true }).fill('QA10')
          assert.equal(
            await modal.locator('input[type=datetime-local],input[type=date]').count(),
            0,
          )
          if (kind === 'sales') {
            await modal
              .getByRole('button', { name: text('Save changes', 'حفظ التغييرات'), exact: true })
              .click()
            await page.locator('.narmer-date-popover:popover-open').waitFor()
            await page.keyboard.press('Escape')
            assert.equal(await modal.isVisible(), true)
          }
          await chooseDateTime(
            page,
            text('Starts (your device time)', 'يبدأ (بتوقيت جهازك)'),
            '2030-01-01T10:05',
          )
          await chooseDateTime(
            page,
            text('Ends - exclusive (your device time)', 'ينتهي - غير شامل (بتوقيت جهازك)'),
            '2030-01-02T11:15',
          )
          await modal
            .getByRole('button', { name: text('Save changes', 'حفظ التغييرات'), exact: true })
            .click()
          await modal.waitFor({ state: 'detached' })
          const toggle = page.getByRole('switch', {
            name: `${text('Enabled', 'تفعيل')}: ${ar ? 'اختبار' : 'QA'} ${kind}`,
          })
          await toggle.waitFor()
          assert.equal(await toggle.getAttribute('aria-checked'), 'true')
          await toggle.click()
          await page.waitForFunction(
            () =>
              document
                .querySelector('.promotion-state [role=switch]')
                ?.getAttribute('aria-checked') === 'false',
          )
          await toggle.click()
          await page.waitForFunction(
            () =>
              document
                .querySelector('.promotion-state [role=switch]')
                ?.getAttribute('aria-checked') === 'true',
          )
          assert.equal(await page.getByRole('button', { name: `Delete QA ${kind}` }).count(), 0)
          await page
            .getByRole('combobox', { name: text('Review role', 'الدور التجريبي'), exact: true })
            .click()
          await page
            .getByRole('listbox')
            .getByRole('option', { name: 'superAdmin', exact: true })
            .click()
          const remove = page.getByRole('button', {
            name: ar ? `حذف اختبار ${kind}` : `Delete QA ${kind}`,
            exact: true,
          })
          await remove.waitFor()
          assert.equal(await remove.locator('svg').count(), 1)
          const icon = await remove.locator('svg').boundingBox()
          assert.equal(icon.width, 20)
          assert.equal(icon.height, 20)
          assert.equal((await remove.innerText()).trim(), '')
          for (const width of [1440, 768, 440, 360, 320]) {
            await page.setViewportSize({ width, height: 956 })
            await page.evaluate(() => document.fonts.ready)
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
            const edit = page.getByRole('button', {
              name: text(`Edit QA ${kind}`, `تعديل اختبار ${kind}`),
              exact: true,
            })
            for (const action of [edit, remove]) {
              const target = await action.boundingBox()
              assert.ok(target.width >= 44 && target.height >= 44)
              const symbol = await action.locator('svg').boundingBox()
              assert.equal(symbol.width, 20)
              assert.equal(symbol.height, 20)
            }
            const { editBox, removeBox } = await edit.evaluate((button) => ({
              editBox: button.getBoundingClientRect().toJSON(),
              removeBox: button.parentElement
                .querySelector('.staff-delete-icon')
                .getBoundingClientRect()
                .toJSON(),
            }))
            assert.ok(
              Math.abs(editBox.y - removeBox.y) <= 2,
              `Edit and Delete must share one row: ${JSON.stringify({ width, editBox, removeBox })}`,
            )
            if ([1440, 360].includes(width))
              await page.screenshot({
                path: resolve(output, `${engine}-${language}-${kind}-${width}-table.png`),
              })
            await edit.click()
            await page
              .getByRole('button', {
                name: text('Starts (your device time)', 'يبدأ (بتوقيت جهازك)'),
                exact: true,
              })
              .click()
            const calendar = page.locator('.narmer-date-popover:popover-open')
            await calendar.waitFor()
            const box = await calendar.boundingBox()
            const apply = await calendar
              .getByRole('button', { name: text('Apply', 'تطبيق'), exact: true })
              .boundingBox()
            assert.ok(
              apply.y + apply.height <= box.y + box.height - 7,
              `calendar action is clipped: ${JSON.stringify({ box, apply })}`,
            )
            assert.ok(
              box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 957,
              JSON.stringify(box),
            )
            const before = await calendar.evaluate((element) => ({
              scrollHeight: element.scrollHeight,
              scrollTop: element.scrollTop,
            }))
            for (const label of [
              text('Year', 'السنة'),
              text('Hour', 'الساعة'),
              text('Minute', 'الدقيقة'),
            ]) {
              const control = calendar.getByRole('combobox', { name: label, exact: true })
              await control.click()
              const menu = calendar.getByRole('listbox')
              await menu.waitFor()
              const menuBox = await menu.boundingBox(),
                afterBox = await calendar.boundingBox()
              assert.deepEqual(afterBox, box, `${label} moved/resized the calendar`)
              assert.deepEqual(
                await calendar.evaluate((element) => ({
                  scrollHeight: element.scrollHeight,
                  scrollTop: element.scrollTop,
                })),
                before,
                `${label} added calendar scrolling`,
              )
              assert.ok(
                menuBox.x >= 0 &&
                  menuBox.x + menuBox.width <= width &&
                  menuBox.y >= 0 &&
                  menuBox.y + menuBox.height <= 956,
                JSON.stringify(menuBox),
              )
              assert.ok(
                await menu
                  .locator('li > span')
                  .evaluateAll((items) =>
                    items.every((item) => item.getBoundingClientRect().height < 25),
                  ),
                `${label} text wrapped`,
              )
              if ([1440, 360].includes(width))
                await page.screenshot({
                  path: resolve(
                    output,
                    `${engine}-${language}-${kind}-${width}-${label === text('Year', 'السنة') ? 'year' : label === text('Hour', 'الساعة') ? 'hour' : 'minute'}.png`,
                  ),
                })
              await page.keyboard.press('Escape')
              assert.equal(await calendar.isVisible(), true)
            }
            if ([1440, 360].includes(width))
              await page.screenshot({
                path: resolve(output, `${engine}-${language}-${kind}-${width}-calendar.png`),
              })
            await calendar
              .getByRole('button', { name: text('Close calendar', 'إغلاق التقويم'), exact: true })
              .click()
            await page
              .locator('dialog.modal[open]')
              .getByRole('button', { name: text('Close', 'إغلاق'), exact: true })
              .click()
          }
          await page.setViewportSize({ width: 1440, height: 956 })
          await remove.click()
          await page
            .getByRole('dialog')
            .getByRole('button', { name: text('Close', 'إغلاق'), exact: true })
            .click()
          await page
            .getByRole('combobox', { name: text('Review role', 'الدور التجريبي'), exact: true })
            .click()
          await page
            .getByRole('listbox')
            .getByRole('option', { name: 'admin', exact: true })
            .click()
        }
        await page.goto(`http://127.0.0.1:5283/${language}/dashboard/size-charts`, {
          waitUntil: 'networkidle',
        })
        assert.equal(await page.locator('.staff-delete-icon').count(), 0)
        await page
          .getByRole('combobox', { name: text('Review role', 'الدور التجريبي'), exact: true })
          .click()
        await page
          .getByRole('listbox')
          .getByRole('option', { name: 'superAdmin', exact: true })
          .click()
        await page.locator('.staff-delete-icon').click()
        await page
          .getByRole('dialog')
          .getByRole('button', { name: text('Confirm deletion', 'تأكيد الحذف'), exact: true })
          .click()
        await page.getByRole('dialog').locator('.feedback--error').waitFor()
        assert.equal(await page.locator('.staff-table tbody tr').count(), 1)
        assert.deepEqual(errors, [])
        results.push({
          id: `${engine}-${language}`,
          passed: true,
          widths: [1440, 768, 440, 360, 320],
        })
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
  '4 Sales/Coupons calendar, switch, delete-icon and chart reference-protection workflows passed',
)
