import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chooseDateTime } from './calendar-helpers.mjs'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/phase6-workflows'),
  results = [],
  bytes = await readFile('shared/assets/images/offer-logo.webp')
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
        id = `${engine}-${language}`,
        errors = []
      page.setDefaultTimeout(12000)
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('dialog', (d) => d.accept())
      await context.route('https://**/*', (r) => r.abort())
      const title = (en, arabic) => (ar ? arabic : en)
      async function go(section) {
        await page.locator(`.dashboard-sidebar a[href="/${language}/dashboard/${section}"]`).click()
        await page.locator('#workspace h1').waitFor()
        await page.waitForFunction(() => !document.querySelector('#workspace .skeleton'))
      }
      async function choose(label, value, scope = page) {
        const control = scope.getByRole('combobox', { name: label, exact: true }),
          text = await control.locator('..').locator(`select option[value="${value}"]`).innerText()
        await control.click()
        await page
          .getByRole('listbox')
          .last()
          .getByRole('option', { name: text, exact: true })
          .click()
      }
      async function saved(scope = page) {
        await scope
          .getByRole('button', { name: title('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await page.locator('.feedback--success').last().waitFor()
      }
      async function names(scope, en = 'QA item', arabic = 'عنصر اختبار') {
        await scope
          .getByLabel(/English|الإنجليزية/)
          .filter({ visible: true })
          .first()
          .fill(en)
        await scope
          .getByLabel(/Arabic|العربية/)
          .filter({ visible: true })
          .first()
          .fill(arabic)
      }
      try {
        await page.goto(
          `${process.env.NARMER_REVIEW_URL || 'http://127.0.0.1:5296'}/${language}/dashboard/orders`,
          { waitUntil: 'networkidle' },
        )
        await page.locator('.staff-table tbody tr').first().waitFor()
        await page.locator('.staff-table tbody tr').first().getByRole('link').click()
        await page.getByRole('button', { name: title('Accepted', 'مقبول'), exact: true }).click()
        await page
          .getByRole('dialog')
          .getByRole('button', { name: title('Confirm change', 'تأكيد التغيير'), exact: true })
          .click()
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        assert.ok(
          await page
            .getByRole('button', { name: title('Shipped', 'تم الشحن'), exact: true })
            .isVisible(),
        )
        await go('products')
        await page.locator('.staff-table tbody tr').first().getByRole('link').click()
        await page
          .getByRole('tab', { name: title('Variants & stock', 'التركيبات والمخزون'), exact: true })
          .click()
        await page.locator('.staff-variant').first().locator('summary').click()
        const price = page
          .locator('.staff-variant')
          .first()
          .getByLabel(title('Price (EGP)', 'السعر (جنيه مصري)'), { exact: true })
        await price.fill('750.25')
        await saved()
        assert.equal(await price.inputValue(), '750.25')
        await page.getByRole('tab', { name: title('Images', 'الصور'), exact: true }).click()
        const gallery = page.locator('.product-image-library'),
          before = await gallery.locator('img').count()
        await page
          .locator('input[type=file]')
          .first()
          .setInputFiles({ name: 'review.webp', mimeType: 'image/webp', buffer: bytes })
        await page.waitForFunction(
          (n) =>
            document.querySelector('.product-image-library')?.querySelectorAll('img').length === n,
          before + 1,
        )
        await saved()
        await page.setViewportSize({ width: 360, height: 956 })
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: resolve(output, `${id}-product-mobile.png`), fullPage: true })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.setViewportSize({ width: 1440, height: 956 })
        await go('size-charts')
        await page
          .getByRole('link', { name: title('Add chart', 'إضافة جدول'), exact: true })
          .click()
        await names(page, 'QA size guide', 'دليل اختبار')
        await page.getByRole('button', { name: title('Add row', 'إضافة صف'), exact: true }).click()
        await page.getByLabel(title('Size', 'المقاس'), { exact: true }).fill('XXL')
        for (const [en, arabic, value] of [
          ['Chest (cm)', 'الصدر (سم)', '21.1'],
          ['Length (cm)', 'الطول (سم)', '65'],
          ['Sleeve (cm)', 'الكم (سم)', '60'],
        ])
          await page.getByLabel(title(en, arabic), { exact: true }).fill(value)
        await page
          .getByRole('button', {
            name: title('Save and continue to images', 'حفظ ومتابعة لإضافة الصور'),
            exact: true,
          })
          .click()
        await page.waitForURL(/size-charts\/[a-f0-9]{24}\?step=images$/)
        assert.equal(
          await page.getByLabel(title('Chest (cm)', 'الصدر (سم)'), { exact: true }).inputValue(),
          '21.1',
        )
        await go('categories')
        await page
          .getByRole('link', { name: title('Add category', 'إضافة تصنيف'), exact: true })
          .click()
        await names(page, 'QA category', 'تصنيف اختبار')
        await page.getByLabel('Slug', { exact: true }).fill(`qa-${engine}-${language}`)
        await page
          .getByRole('button', { name: title('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await page.waitForURL(/categories\/[a-f0-9]{24}$/)
        await go('promotions')
        await page
          .getByRole('button', { name: title('Create sale', 'إضافة حملة'), exact: true })
          .click()
        const modal = page.getByRole('dialog')
        await names(modal, 'QA sale', 'حملة اختبار')
        await modal.locator('.staff-target-products input[type=checkbox]').first().check()
        await choose(title('Discount type', 'نوع الخصم'), 'fixed', modal)
        await modal
          .getByLabel(title('Discount (EGP)', 'الخصم (جنيه مصري)'), { exact: true })
          .fill('25.50')
        await chooseDateTime(
          page,
          title('Starts (your device time)', 'يبدأ (بتوقيت جهازك)'),
          '2030-01-01T10:00',
        )
        await chooseDateTime(
          page,
          title('Ends - exclusive (your device time)', 'ينتهي - غير شامل (بتوقيت جهازك)'),
          '2030-01-02T10:00',
        )
        await modal
          .getByRole('button', { name: title('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await modal.waitFor({ state: 'detached' })
        await page.locator('.staff-table').getByText(title('QA sale', 'حملة اختبار')).waitFor()
        await page.getByRole('button', { name: title('Coupons', 'الكوبونات'), exact: true }).click()
        await page
          .getByRole('button', { name: title('Create coupon', 'إضافة كوبون'), exact: true })
          .click()
        await names(modal, 'QA coupon', 'كوبون اختبار')
        await modal.getByLabel(title('Coupon code', 'رمز الكوبون'), { exact: true }).fill('QA10')
        await modal
          .getByRole('button', { name: title('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await modal.waitFor({ state: 'detached' })
        await page.locator('.staff-table').getByText('QA10').waitFor()
        await go('shipping')
        await page
          .getByLabel(title('Default fee (EGP)', 'الرسوم الافتراضية (جنيه مصري)'), { exact: true })
          .fill('0')
        await saved(page.locator('.staff-editor').first())
        await page
          .getByRole('button', { name: title('Add override', 'إضافة استثناء'), exact: true })
          .click()
        await choose(title('Governorate', 'المحافظة'), 'cairo', modal)
        await modal
          .getByLabel(title('Delivery fee (EGP)', 'رسوم التوصيل (جنيه مصري)'), { exact: true })
          .fill('25.50')
        await modal
          .getByRole('button', { name: title('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await modal.waitFor({ state: 'detached' })
        await page.locator('.staff-table tbody tr').waitFor()
        await page
          .locator('.staff-table tbody tr')
          .getByRole('button', { name: /Delete|حذف/ })
          .click()
        await modal
          .getByRole('button', { name: title('Confirm deletion', 'تأكيد الحذف'), exact: true })
          .click()
        await modal.waitFor({ state: 'detached' })
        await page.waitForFunction(
          () => document.querySelectorAll('.staff-table tbody tr').length === 0,
        )
        await page
          .getByLabel(
            title('Receiving instructions - blank clears', 'تعليمات الاستقبال - فارغ للإزالة'),
            { exact: true },
          )
          .fill('DEMO ONLY')
        await saved(page.locator('.staff-editor').last())
        await go('homepage')
        await page
          .getByLabel(title('Alt text · English', 'النص البديل · الإنجليزية'), { exact: true })
          .first()
          .fill('QA banner')
        await saved()
        await go('settings')
        await page.getByLabel(title('Phone', 'الهاتف'), { exact: true }).fill('+201000000003')
        await saved()
        await page.locator('.workspace-header a[href$="/notifications"]').click()
        await page
          .locator('.staff-table tbody tr')
          .first()
          .getByRole('button', { name: title('Mark read', 'تعليم كمقروء'), exact: true })
          .click()
        await page
          .getByText(title('2 unread notifications', '2 إشعار غير مقروء'), { exact: true })
          .waitFor()
        await choose(title('Review role', 'الدور التجريبي'), 'superAdmin')
        await go('accounts')
        await page
          .getByRole('button', {
            name: title('Create staff account', 'إنشاء حساب موظف'),
            exact: true,
          })
          .click()
        for (const [en, arabic, value] of [
          ['Name', 'الاسم', 'QA moderator'],
          ['Email', 'البريد الإلكتروني', `qa-${engine}-${language}@example.test`],
          ['Phone', 'الهاتف', '+201001234567'],
          ['Initial password', 'كلمة المرور الأولية', 'NarmerStaff123'],
        ])
          await modal.getByLabel(title(en, arabic), { exact: true }).fill(value)
        await modal
          .getByRole('button', { name: title('Create account', 'إنشاء الحساب'), exact: true })
          .click()
        await modal
          .getByText(title('Account created', 'تم إنشاء الحساب'), { exact: true })
          .waitFor()
        await modal
          .getByRole('button', { name: title('Handoff complete', 'تم التسليم'), exact: true })
          .click()
        await modal.waitFor({ state: 'detached' })
        for (const input of await page.locator('input[type=password]').all())
          assert.equal(await input.inputValue(), '')
        await choose(title('Review role', 'الدور التجريبي'), 'moderator')
        assert.equal(await page.locator('.dashboard-sidebar a[href$="/products"]').count(), 0)
        await page.locator('.dashboard-sidebar a[href$="/orders"]').click()
        await page.locator('.staff-table').waitFor()
        await page.setViewportSize({ width: 360, height: 956 })
        await page.screenshot({
          path: resolve(output, `${id}-moderator-mobile.png`),
          fullPage: true,
        })
        assert.deepEqual(errors, [])
        results.push({ id, passed: true })
      } catch (error) {
        await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
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
console.log(`${results.length} Phase 6 operational workflows passed`)
