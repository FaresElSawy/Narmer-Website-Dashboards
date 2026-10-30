import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/dashboard-controls'),
  checks = [],
  failures = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar'])
    for (const width of [1440, 390]) {
      const ar = language === 'ar',
        context = await browser.newContext({
          viewport: { width, height: 1000 },
          hasTouch: width === 390,
        }),
        page = await context.newPage(),
        prefix = `${engine}-${language}-${width}`,
        errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      let discard = true
      page.on('dialog', (dialog) => (discard ? dialog.accept() : dialog.dismiss()))
      try {
        await page.goto(`http://127.0.0.1:5284/${language}/dashboard/forms/fabric`)
        let services = page.getByRole('group', {
          name: ar ? 'نوع النموذج' : 'Form type',
          exact: true,
        })
        await services.waitFor()
        assert.equal(await services.getByRole('button').count(), 5)
        if (width === 1440) {
          const tops = await services
            .getByRole('button')
            .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top))
          assert.equal(new Set(tops).size, 1)
        }
        for (const [index, type] of [
          'spinning',
          'weaving',
          'fabric',
          'school-uniforms',
          'wholesale',
        ].entries()) {
          await services.getByRole('button').nth(index).click()
          await page.waitForURL(`**/dashboard/forms/${type}`)
          await page.waitForFunction(
            (i) =>
              document
                .querySelectorAll('.staff-service-options button')
                [i]?.getAttribute('aria-pressed') === 'true',
            index,
          )
        }
        await page.mouse.move(0, 0)
        await page.waitForFunction(
          () =>
            getComputedStyle(document.querySelector('.staff-service-options [aria-pressed="true"]'))
              .backgroundColor === 'rgb(191, 141, 52)',
        )
        if (width === 1440) {
          await services.getByRole('button').last().hover()
          await page.waitForFunction(
            () =>
              getComputedStyle(
                document.querySelector('.staff-service-options [aria-pressed="true"]'),
              ).backgroundColor === 'rgb(7, 59, 80)',
          )
          await page.mouse.move(0, 0)
        }
        await page.waitForFunction(
          () =>
            getComputedStyle(document.querySelector('.staff-service-options [aria-pressed="true"]'))
              .backgroundColor === 'rgb(191, 141, 52)',
        )
        await page.screenshot({ path: resolve(output, `${prefix}-services.png`) })
        await services.getByRole('button').nth(2).click()
        await page.waitForURL('**/dashboard/forms/fabric')
        await page.waitForFunction(
          () =>
            document
              .querySelectorAll('.staff-service-options button')[2]
              ?.getAttribute('aria-pressed') === 'true',
        )
        await page.locator('textarea').first().fill('Unsaved review help')
        await page
          .getByText(ar ? 'تغييرات غير محفوظة' : 'Unsaved changes', { exact: true })
          .waitFor()
        discard = false
        await services.getByRole('button').first().click()
        assert.ok(page.url().endsWith('/forms/fabric'))
        discard = true
        checks.push(
          `${prefix} five service buttons, correct routes/highlight and retained dirty form`,
        )

        const widget = page
          .getByRole('combobox', { name: ar ? 'نوع الحقل' : 'Widget type', exact: true })
          .nth(2)
        await widget.click()
        const questionList = page.getByRole('listbox')
        const overlay = await questionList.evaluate((node) => {
          const box = node.getBoundingClientRect(),
            x = box.x + box.width / 2,
            y = Math.min(box.bottom - 12, innerHeight - 12)
          return node.contains(document.elementFromPoint(x, y))
        })
        assert.ok(overlay, 'The open question list must paint above the following card')
        await page.screenshot({ path: resolve(output, `${prefix}-question-overlay.png`) })
        await page.keyboard.press('Escape')
        const reorder = page.locator('.staff-reorder')
        assert.equal(await reorder.first().locator('svg').count(), 1)
        assert.equal(
          await reorder
            .first()
            .locator('svg')
            .evaluate((node) => getComputedStyle(node).width),
          '18px',
        )
        assert.ok(await reorder.first().isDisabled())
        const keyInputs = page.getByLabel(ar ? 'مفتاح السؤال الثابت' : 'Stable question key', {
            exact: true,
          }),
          firstKey = await keyInputs.first().inputValue(),
          secondKey = await keyInputs.nth(1).inputValue()
        await reorder.nth(1).click()
        assert.equal(await keyInputs.first().inputValue(), secondKey)
        assert.equal(await keyInputs.nth(1).inputValue(), firstKey)
        await reorder.nth(2).click()
        assert.equal(await keyInputs.first().inputValue(), firstKey)
        checks.push(
          `${prefix} question menu overlay and SVG reorder controls preserve field values`,
        )

        const requiredCheck = page
            .getByRole('checkbox', { name: ar ? 'إجابة مطلوبة' : 'Required answer', exact: true })
            .first(),
          wasRequired = await requiredCheck.isChecked()
        await requiredCheck.focus()
        await page.keyboard.press('Space')
        assert.equal(await requiredCheck.isChecked(), !wasRequired)
        assert.equal(
          await requiredCheck.evaluate((node) => getComputedStyle(node).appearance),
          'none',
        )
        await page.keyboard.press('Space')
        assert.equal(await requiredCheck.isChecked(), wasRequired)

        const combo = page.getByRole('combobox', {
          name: ar ? 'حالة النشر' : 'Publication state',
          exact: true,
        })
        await combo.focus()
        await page.keyboard.press('ArrowDown')
        let list = page.getByRole('listbox')
        await list.waitFor()
        await page.keyboard.press('End')
        await page.keyboard.press('Enter')
        assert.equal(await combo.innerText(), ar ? 'غير منشور' : 'Unpublished')
        await combo.click()
        await list.waitFor()
        await page.keyboard.press('Escape')
        assert.equal(await combo.getAttribute('aria-expanded'), 'false')
        assert.ok(await combo.evaluate((node) => document.activeElement === node))
        await combo.click()
        await page.getByRole('heading', { level: 1 }).click()
        assert.equal(await combo.getAttribute('aria-expanded'), 'false')
        await combo.click()
        await list.getByRole('option', { name: ar ? 'منشور' : 'Published', exact: true }).click()
        await combo.focus()
        if (ar) await combo.dispatchEvent('keydown', { key: 'غ', bubbles: true })
        else await page.keyboard.press('u')
        await list.waitFor()
        assert.equal(
          await page
            .locator(`[id="${await combo.getAttribute('aria-activedescendant')}"]`)
            .innerText(),
          ar ? 'غير منشور' : 'Unpublished',
        )
        await page.keyboard.press('Escape')
        await combo.click()
        await page.screenshot({ path: resolve(output, `${prefix}-dropdown.png`) })
        await page.keyboard.press('Tab')
        assert.equal(await combo.getAttribute('aria-expanded'), 'false')
        checks.push(
          `${prefix} branded menu pointer/keyboard selection, focus, Escape, Tab and outside dismissal`,
        )

        for (const route of [
          'forms/fabric',
          'products/0000000000000000000000c8',
          'wholesale/0000000000000000000001f6',
          'settings',
        ]) {
          await page.goto(`http://127.0.0.1:5284/${language}/dashboard/${route}`)
          await page.locator('textarea').first().waitFor()
          const styles = await page.locator('textarea').evaluateAll((nodes) =>
            nodes.map((node) => {
              const style = getComputedStyle(node)
              return {
                border: style.borderTopWidth,
                color: style.borderTopColor,
                background: style.backgroundColor,
                resize: style.resize,
              }
            }),
          )
          assert.ok(
            styles.every(
              (style) =>
                style.border === '1px' &&
                style.color === 'rgb(158, 180, 190)' &&
                style.background === 'rgb(255, 255, 255)' &&
                style.resize === 'vertical',
            ),
            JSON.stringify(styles),
          )
          await page.locator('textarea').first().focus()
          assert.equal(
            await page
              .locator('textarea')
              .first()
              .evaluate((node) => getComputedStyle(node).outlineColor),
            'rgb(191, 141, 52)',
          )
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
          )
        }
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: resolve(output, `${prefix}-textarea.png`), fullPage: true })
        checks.push(
          `${prefix} all description/help textareas bordered, focused and free of page overflow`,
        )

        await page.goto(`http://127.0.0.1:5284/${language}/dashboard/wholesale/new`)
        await page
          .getByLabel(ar ? 'العنوان * · الإنجليزية' : 'Title * · English', { exact: true })
          .fill('Validation sample')
        await page
          .getByLabel(ar ? 'العنوان * · العربية' : 'Title * · Arabic', { exact: true })
          .fill('عينة تحقق')
        await page
          .getByRole('button', { name: ar ? 'حفظ التغييرات' : 'Save changes', exact: true })
          .click()
        const requiredSource = page.getByRole('combobox', {
          name: ar ? 'المنتج المصدر' : 'Source product',
          exact: true,
        })
        assert.equal(await requiredSource.getAttribute('aria-invalid'), 'true')
        assert.ok(await requiredSource.evaluate((node) => node === document.activeElement))
        await page
          .getByText(ar ? 'اختر أحد الخيارات.' : 'Choose an option.', { exact: true })
          .waitFor()
        assert.ok(page.url().endsWith('/wholesale/new'))
        checks.push(
          `${prefix} required custom select keeps validation and focuses the invalid source`,
        )

        await page.goto(`http://127.0.0.1:5284/${language}/dashboard/homepage`)
        const upload = page
          .getByLabel(ar ? 'رفع صورة سطح المكتب' : 'Upload desktop image', { exact: true })
          .first()
        await upload.setInputFiles(resolve('shared/assets/images/offer-logo.webp'))
        await page.locator('.narmer-file-name').filter({ hasText: 'offer-logo.webp' }).waitFor()
        await page.getByText(ar ? 'صورة مخصصة' : 'Custom override', { exact: true }).waitFor()
        assert.equal(
          await page
            .locator('.narmer-file-picker input')
            .first()
            .evaluate((node) => getComputedStyle(node).opacity),
          '0',
        )
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: resolve(output, `${prefix}-upload.png`) })
        checks.push(`${prefix} branded raw-image upload and selected filename`)

        await page.goto(`http://127.0.0.1:5284/${language}/dashboard/accounts`)
        await page
          .getByRole('button', {
            name: ar ? 'إنشاء حساب موظف' : 'Create staff account',
            exact: true,
          })
          .click()
        const dialog = page.getByRole('dialog', {
          name: ar ? 'إنشاء حساب موظف' : 'Create staff account',
          exact: true,
        })
        await dialog.getByLabel(ar ? 'الاسم *' : 'Name *', { exact: true }).fill('Review staff')
        const email = `${prefix}@example.test`
        await dialog.getByLabel(ar ? 'البريد الإلكتروني *' : 'Email *', { exact: true }).fill(email)
        await dialog.getByLabel(ar ? 'الهاتف *' : 'Phone *', { exact: true }).fill('+201001234567')
        const role = dialog.getByRole('combobox', { name: ar ? 'الدور' : 'Role', exact: true })
        await page.setViewportSize({ width, height: 700 })
        await role.scrollIntoViewIfNeeded()
        const closedScrollHeight = await dialog.evaluate((node) => node.scrollHeight)
        await role.click()
        const roleList = dialog.getByRole('listbox')
        await roleList.waitFor()
        assert.ok(
          await dialog.evaluate(
            (node, before) => node.scrollHeight <= before + 1,
            closedScrollHeight,
          ),
          'Opening the role menu must not add dialog scroll',
        )
        const menuBounds = await roleList.boundingBox(),
          dialogBounds = await dialog.boundingBox()
        assert.ok(
          menuBounds.y >= dialogBounds.y &&
            menuBounds.y + menuBounds.height <= dialogBounds.y + dialogBounds.height,
        )
        await page.screenshot({ path: resolve(output, `${prefix}-role-menu.png`) })
        await dialog.getByRole('option', { name: ar ? 'مسؤول' : 'Admin', exact: true }).click()
        await page.screenshot({ path: resolve(output, `${prefix}-create-staff.png`) })
        await dialog
          .getByRole('button', {
            name: ar ? 'إنشاء حساب للمراجعة' : 'Create review account',
            exact: true,
          })
          .click()
        await dialog
          .getByText(ar ? 'تم إنشاء حساب للمراجعة' : 'Review account created', { exact: true })
          .waitFor()
        await dialog.getByRole('button', { name: ar ? 'تم' : 'Done', exact: true }).click()
        await page.getByText('Review staff', { exact: true }).waitFor()
        assert.deepEqual(errors, [])
        checks.push(`${prefix} local staff-creation form, role choice and list refresh`)
      } catch (error) {
        failures.push({ name: prefix, error: error.stack })
        await page.screenshot({ path: resolve(output, `${prefix}-failure.png`), fullPage: true })
      }
      await context.close()
    }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, failures }, null, 2))
assert.equal(failures.length, 0, JSON.stringify(failures))
console.log(`${checks.length} dashboard control checks passed`)
