import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/product-editor-review'),
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
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('dialog', (dialog) => dialog.accept())
      await context.route('https://**/*', (route) => route.abort())
      const text = (en, arabic) => (ar ? arabic : en)
      async function tab(en, arabic) {
        await page.getByRole('tab', { name: text(en, arabic), exact: true }).click()
      }
      async function save() {
        await page
          .getByRole('button', { name: text('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await page.locator('.feedback--success').waitFor()
      }
      try {
        await page.goto(`http://127.0.0.1:5283/${language}/dashboard/products`, {
          waitUntil: 'networkidle',
        })
        await page.locator('.staff-table tbody tr').first().getByRole('link').click()
        await page.getByRole('tab').first().waitFor()
        await page.evaluate(() => document.fonts.ready)
        assert.equal(await page.getByRole('tab').count(), 3)
        assert.equal(
          await page
            .getByRole('combobox', {
              name: text('Product type - fixed after creation', 'نوع المنتج - ثابت بعد الإنشاء'),
              exact: true,
            })
            .isDisabled(),
          true,
        )
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        const editorUrl = page.url()
        await tab('Images', 'الصور')
        assert.equal(
          await page
            .getByRole('tabpanel', { name: text('Images', 'الصور'), exact: true })
            .evaluate((el) => getComputedStyle(el).animationName),
          'product-tab-enter',
        )
        assert.equal(page.url(), editorUrl)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await tab('Product details', 'تفاصيل المنتج')
        const name = page.getByLabel(text('Name * · English', 'الاسم * · الإنجليزية'), {
          exact: true,
        })
        // The same draft survives tab switches and validation reveals hidden fields.
        const originalName = await name.inputValue()
        await name.fill(`${originalName} QA`)
        await tab('Variants & stock', 'التركيبات والمخزون')
        const rows = page.locator('.staff-variant'),
          count = await rows.count()
        assert.ok(count >= 2)
        const collapsed = await rows.first().boundingBox()
        assert.ok(collapsed.height <= 85, `collapsed row ${collapsed.height}px`)
        await rows.first().locator('summary').click()
        await rows.nth(1).locator('summary').click()
        assert.equal(await page.locator('.staff-variant[open]').count(), 1)
        const second = rows.nth(1),
          fields = await second.locator('.staff-field-pair').boundingBox(),
          remove = await second
            .getByRole('button', { name: text('Remove variant', 'إزالة التركيبة') })
            .boundingBox()
        assert.ok(remove.y - fields.y - fields.height >= 15)
        const price = second.getByLabel(text('Price (EGP)', 'السعر (جنيه مصري)'), { exact: true })
        await price.fill('751.25')
        await tab('Product details', 'تفاصيل المنتج')
        assert.equal(await name.inputValue(), `${originalName} QA`)
        await name.fill('')
        await tab('Images', 'الصور')
        await page
          .getByRole('button', { name: text('Save changes', 'حفظ التغييرات'), exact: true })
          .click()
        await page.waitForFunction(
          () =>
            !document.activeElement?.closest('[hidden]') &&
            document.activeElement?.tagName === 'INPUT',
        )
        assert.equal(await name.isVisible(), true)
        await name.fill(originalName)
        await save()
        await tab('Variants & stock', 'التركيبات والمخزون')
        await rows.nth(1).locator('summary').click()
        assert.equal(await price.inputValue(), '751.25')
        await tab('Images', 'الصور')
        const cards = page.locator('.product-image-card'),
          before = await cards.count()
        assert.equal(await page.locator('.product-image-library').count(), 1)
        assert.ok(before > 0 && before <= 5, `deduplicated image count ${before}`)
        const targets = page.locator('.product-size-choices input')
        await targets.first().check()
        for (let i = 1; i < (await targets.count()); i++) await targets.nth(i).uncheck()
        await page
          .locator('input[type=file]')
          .setInputFiles({ name: 'review.webp', mimeType: 'image/webp', buffer: bytes })
        await page.waitForFunction(
          (n) => document.querySelectorAll('.product-image-card').length === n,
          before + 1,
        )
        await save()
        assert.match(await cards.last().innerText(), /[sS]/, await cards.last().innerText())
        const uploadedSrc = await cards.last().locator('img').getAttribute('src')
        await cards
          .last()
          .getByRole('button', {
            name: text('Edit visibility', 'اختيار المقاسات'),
            exact: true,
          })
          .click()
        await page.locator('.product-size-choices input').nth(2).check()
        await page.locator('.product-save-actions button:disabled').waitFor()
        assert.equal(
          await page
            .getByRole('button', { name: text('Save changes', 'حفظ التغييرات'), exact: true })
            .isDisabled(),
          true,
        )
        await page
          .getByRole('button', { name: text('Apply visibility', 'تطبيق الاختيار'), exact: true })
          .click()
        await save()
        const viewGallery = page.getByRole('combobox', {
            name: text('View gallery', 'عرض الصور'),
            exact: true,
          }),
          selectedGalleryName = await viewGallery
            .locator('..')
            .locator('select option[value="0"]')
            .innerText()
        await viewGallery.click()
        await page
          .getByRole('listbox')
          .getByRole('option', { name: selectedGalleryName, exact: true })
          .click()
        await page
          .getByRole('button', {
            name: text('Move image 5 earlier', 'نقل الصورة 5 للأمام'),
            exact: true,
          })
          .click()
        await save()
        assert.equal(await cards.nth(3).locator('img').getAttribute('src'), uploadedSrc)
        await viewGallery.click()
        await page
          .getByRole('listbox')
          .getByRole('option', { name: text('All images', 'كل الصور'), exact: true })
          .click()
        await tab('Variants & stock', 'التركيبات والمخزون')
        const imageCounts = await page.locator('.product-variant-image-count').allTextContents()
        assert.ok(
          parseInt(imageCounts[0]) === parseInt(imageCounts[1]) + 1,
          JSON.stringify(imageCounts),
        )
        assert.equal(parseInt(imageCounts[2]), parseInt(imageCounts[0]))
        for (const width of [1440, 1024, 768, 440, 360, 320]) {
          await page.setViewportSize({ width, height: 956 })
          await page.evaluate(() => document.fonts.ready)
          for (const [en, arabic, suffix] of [
            ['Product details', 'تفاصيل المنتج', 'details'],
            ['Variants & stock', 'التركيبات والمخزون', 'variants'],
            ['Images', 'الصور', 'images'],
          ]) {
            await tab(en, arabic)
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
              `${id} ${width} ${suffix} overflow`,
            )
            if ([1440, 360].includes(width))
              await page.screenshot({
                path: resolve(output, `${id}-${width}-${suffix}.png`),
                fullPage: true,
              })
          }
        }
        assert.deepEqual(errors, [])
        // New records explain the required save-before-upload sequence from the first view.
        await page.setViewportSize({ width: 1440, height: 956 })
        await page.goto(`http://127.0.0.1:5283/${language}/dashboard/products/new`, {
          waitUntil: 'networkidle',
        })
        await page.locator('.staff-image-steps').waitFor()
        const type = page.getByRole('combobox', {
          name: text('Product type', 'نوع المنتج'),
          exact: true,
        })
        async function chooseType(value) {
          await type.click()
          await page
            .getByRole('listbox')
            .getByRole('option', {
              name: value === 'simple' ? text('Simple', 'بسيط') : text('Variant', 'متعدد الخيارات'),
              exact: true,
            })
            .click()
        }
        await page
          .getByLabel(text('Price (EGP)', 'السعر (جنيه مصري)'), { exact: true })
          .fill('12.50')
        await chooseType('variant')
        assert.equal(await page.getByRole('tab').count(), 3)
        await tab('Variants & stock', 'التركيبات والمخزون')
        assert.equal(await type.isVisible(), true)
        await chooseType('simple')
        assert.equal(await page.getByRole('tab').count(), 2)
        assert.equal(
          await page
            .getByLabel(text('Price (EGP)', 'السعر (جنيه مصري)'), { exact: true })
            .inputValue(),
          '12.50',
        )
        await tab('Images', 'الصور')
        assert.equal(await page.locator('input[type=file]').isDisabled(), true)
        await tab('Product details', 'تفاصيل المنتج')
        await page
          .getByLabel(text('Name * · English', 'الاسم * · الإنجليزية'), { exact: true })
          .fill('QA simple product')
        await page
          .getByLabel(text('Name * · Arabic', 'الاسم * · العربية'), { exact: true })
          .fill('منتج اختبار')
        await page.getByLabel('Slug', { exact: true }).fill('qa-simple-product')
        await page.getByLabel(text('Price (EGP)', 'السعر (جنيه مصري)'), { exact: true }).fill('10')
        const category = page.getByRole('combobox', {
            name: text('Category', 'التصنيف'),
            exact: true,
          }),
          categoryName = await category.locator('..').locator('select option').nth(1).innerText()
        await category.click()
        await page
          .getByRole('listbox')
          .getByRole('option', { name: categoryName, exact: true })
          .click()
        await page
          .getByRole('button', {
            name: text('Save and continue to images', 'حفظ ومتابعة لإضافة الصور'),
            exact: true,
          })
          .click()
        await page.waitForURL(/products\/[a-f0-9]{24}\?step=images$/)
        await page
          .locator('[role="tab"][aria-selected="true"]')
          .filter({ hasText: text('Images', 'الصور') })
          .waitFor()
        assert.equal(
          await page
            .getByRole('tab', { name: text('Images', 'الصور'), exact: true })
            .getAttribute('aria-selected'),
          'true',
        )
        assert.equal(await page.locator('input[type=file]').isEnabled(), true)
        await page
          .locator('input[type=file]')
          .setInputFiles({ name: 'simple.webp', mimeType: 'image/webp', buffer: bytes })
        await page.locator('.product-image-card').waitFor()
        await save()
        await page.goto(`http://127.0.0.1:5283/${language}/dashboard/size-charts/new`, {
          waitUntil: 'networkidle',
        })
        assert.equal(await page.locator('input[type=file]:disabled').count(), 2)
        await page
          .getByLabel(text('Name * · English', 'الاسم * · الإنجليزية'), { exact: true })
          .fill('QA chart')
        await page
          .getByLabel(text('Name * · Arabic', 'الاسم * · العربية'), { exact: true })
          .fill('جدول اختبار')
        await page
          .getByRole('button', {
            name: text('Save and continue to images', 'حفظ ومتابعة لإضافة الصور'),
            exact: true,
          })
          .click()
        await page.waitForURL(/size-charts\/[a-f0-9]{24}\?step=images$/)
        await page.locator('input[type=file]:enabled').first().waitFor({ state: 'attached' })
        assert.equal(await page.locator('input[type=file]:enabled').count(), 2)
        await page
          .locator('input[type=file]')
          .last()
          .setInputFiles({ name: 'chart.webp', mimeType: 'image/webp', buffer: bytes })
        await page.locator('.staff-chart-images img').waitFor()
        await save()
        await page.setViewportSize({ width: 360, height: 956 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.screenshot({ path: resolve(output, `${id}-chart-step2.png`), fullPage: true })
        assert.deepEqual(errors, [])
        results.push({ id, passed: true, widths: [1440, 1024, 768, 440, 360, 320] })
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
console.log(
  `${results.length} product-editor workflows and ${results.length * 18} responsive tab views passed`,
)
