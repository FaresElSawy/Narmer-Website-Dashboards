import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/phase-3-interactions')
await mkdir(output, { recursive: true })
const checks = [],
  failures = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar']) {
    const ar = language === 'ar',
      context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      page = await context.newPage()
    let discard = true,
      handledDialog = Promise.resolve()
    page.on('dialog', (dialog) => {
      handledDialog = discard ? dialog.accept() : dialog.dismiss()
    })
    try {
      await page.goto(`http://127.0.0.1:5284/${language}/dashboard/forms/fabric`)
      const menu = page.getByRole('button', { name: ar ? 'القائمة' : 'Menu', exact: true })
      await menu.click()
      const dialog = page.getByRole('dialog', { name: ar ? 'مساحة العمل' : 'Workspace' })
      await dialog.waitFor()
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab')
        assert.ok(await dialog.evaluate((node) => node.contains(document.activeElement)))
      }
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden' })
      assert.ok(await menu.evaluate((node) => node === document.activeElement))
      const before = await page.locator('.staff-editor input[pattern]').count(),
        add = page.getByRole('button', { name: ar ? 'إضافة سؤال' : 'Add question', exact: true })
      await add.focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('.staff-editor input[pattern]').count(), before + 1)
      discard = false
      await menu.click()
      const confirmation = page.waitForEvent('dialog')
      await dialog.getByRole('link', { name: ar ? 'الطلبات' : 'Requests', exact: true }).click()
      await confirmation
      await handledDialog
      await page.waitForURL(`**/${language}/dashboard/forms/fabric`)
      assert.ok(page.url().endsWith('/forms/fabric'))
      discard = true
      await page.keyboard.press('Escape')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const reducedDuration = await page
        .locator('.staff-panel')
        .first()
        .evaluate((node) => parseFloat(getComputedStyle(node).animationDuration))
      assert.ok(reducedDuration <= 0.002, reducedDuration)
      checks.push(
        `${engine} ${language} keyboard, dialog focus, dirty navigation and reduced motion`,
      )
      await page.goto(
        `http://127.0.0.1:5284/${language}/dashboard/wholesale/0000000000000000000001f6`,
      )
      const addVariant = page.getByRole('button', {
        name: ar ? 'إضافة خيار منتج إلى العبوة' : 'Add product variant to pouch',
        exact: true,
      })
      await addVariant.waitFor()
      assert.equal(await addVariant.isEnabled(), true)
      assert.equal(await page.locator('.staff-composition-row').count(), 4)
      await addVariant.click()
      await addVariant.click()
      assert.equal(await page.locator('.staff-composition-row').count(), 6)
      assert.equal(await addVariant.isDisabled(), true)
      assert.ok(
        (
          await page
            .locator('.staff-composition-row')
            .nth(4)
            .locator('select option:checked')
            .innerText()
        ).includes('XXL'),
      )
      assert.ok(
        (
          await page
            .locator('.staff-composition-row')
            .nth(5)
            .locator('select option:checked')
            .innerText()
        ).includes('XXXL'),
      )
      await page.locator('.staff-composition-row').last().getByRole('button').click()
      assert.equal(await addVariant.isEnabled(), true)
      await addVariant.click()
      await page
        .getByRole('button', { name: ar ? 'حفظ التغييرات' : 'Save changes', exact: true })
        .click()
      await page.getByText(ar ? 'تم الحفظ' : 'Changes saved', { exact: true }).waitFor()
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({
        path: resolve(output, `${engine}-${language}-six-variants-mobile.png`),
        fullPage: true,
      })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.screenshot({
        path: resolve(output, `${engine}-${language}-six-variants-desktop.png`),
        fullPage: true,
      })
      checks.push(
        `${engine} ${language} six real variants, unique selection, exhausted-source explanation and save`,
      )
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`http://127.0.0.1:5283/${language}/dashboard`)
      const retailMenu = page.getByRole('button', { name: ar ? 'القائمة' : 'Menu', exact: true })
      await retailMenu.click()
      await page.getByRole('dialog', { name: ar ? 'مساحة العمل' : 'Workspace' }).waitFor()
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.activeElement?.classList.contains('dashboard-menu'))
      checks.push(`${engine} ${language} shared B2C drawer focus regression`)
    } catch (error) {
      failures.push({ engine, language, error: error.stack })
      await page.screenshot({
        path: resolve(output, `${engine}-${language}-failure.png`),
        fullPage: true,
      })
    }
    await context.close()
  }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, failures }, null, 2))
assert.equal(failures.length, 0, JSON.stringify(failures))
console.log(`${checks.length} focused keyboard/motion/variant checks passed`)
