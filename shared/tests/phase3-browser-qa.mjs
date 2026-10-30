import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
async function choose(page, label, value) {
  const control = page.getByRole('combobox', { name: label, exact: true }),
    text = await control.locator('..').locator(`select option[value="${value}"]`).innerText()
  await control.click()
  await page.getByRole('listbox').getByRole('option', { name: text, exact: true }).click()
}
const output = resolve('output/playwright/phase-3')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  errors = []
const routes = [
  'requests',
  'requests/0000000000000000000007d2',
  'forms/fabric',
  'products',
  'products/0000000000000000000000c8',
  'products/source/0000000000000000000000ca',
  'wholesale/0000000000000000000001f6',
  'accounts/000000000000000000000bb8',
  'notifications',
  'profile',
  'homepage',
  'settings',
]
async function check(name, action) {
  try {
    const evidence = await action()
    checks.push({ name, evidence })
    console.log(`PASS ${name}`)
  } catch (error) {
    failures.push({ name, message: error.stack })
    console.error(`FAIL ${name}: ${error.message}`)
  }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar'])
    for (const width of [1440, 768, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      page.on('pageerror', (error) =>
        errors.push({ engine, language, width, message: error.message }),
      )
      for (const route of routes)
        await check(`${engine} ${language} ${width} ${route}`, async () => {
          await page.goto(`http://127.0.0.1:5284/${language}/dashboard/${route}`)
          await page.locator('.workspace-content h1').waitFor()
          await page
            .locator('.workspace-content [aria-busy=true]')
            .waitFor({ state: 'hidden' })
            .catch(() => {})
          await page.waitForTimeout(80)
          assert.equal(
            await page.locator('.workspace-content [role=alert]').count(),
            0,
            await page.locator('.workspace-content').innerText(),
          )
          const geometry = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - innerWidth,
            dir: document.documentElement.dir,
            font: getComputedStyle(document.querySelector('h1')).fontFamily,
            fields: [...document.querySelectorAll('.staff-table td')].every(
              (node) => node.dataset.label,
            ),
          }))
          assert.ok(geometry.overflow <= 1, JSON.stringify(geometry))
          assert.equal(geometry.dir, language === 'ar' ? 'rtl' : 'ltr')
          assert.ok(geometry.font.includes(language === 'ar' ? 'Cairo' : 'Poppins'))
          if (width === 390) assert.equal(geometry.fields, true)
          if (engine === 'chromium' && [1440, 390].includes(width))
            await page.screenshot({
              path: resolve(output, `${language}-${width}-${route.replaceAll('/', '-')}.png`),
              fullPage: true,
            })
          return geometry
        })
      await context.close()
    }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage()
  page.on('dialog', (dialog) => dialog.accept())
  await check(`${engine} staff request and notification states`, async () => {
    await page.goto('http://127.0.0.1:5284/en/dashboard/requests')
    await page.getByRole('link', { name: 'View request' }).first().click()
    await page.getByRole('button', { name: 'Mark contacted', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, mark contacted' }).click()
    await page.getByRole('button', { name: 'Contacted', exact: true }).waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Contacted', exact: true }).isDisabled(),
      true,
    )
    await page.getByRole('link', { name: 'Notifications', exact: true }).click()
    await page.getByRole('button', { name: 'Mark read', exact: true }).first().click()
    await page.waitForTimeout(120)
    assert.ok((await page.locator('.staff-table').innerText()).includes('Read'))
    await choose(page, 'Review role', 'moderator')
    await page.waitForTimeout(100)
    assert.ok((await page.locator('.staff-table').innerText()).includes('Unread'))
    for (const target of ['Request forms', 'Products', 'Accounts', 'Settings'])
      assert.equal(
        await page
          .locator('.dashboard-sidebar')
          .getByRole('link', { name: target, exact: true })
          .count(),
        0,
      )
    await page.goto('http://127.0.0.1:5284/en/dashboard/forms/fabric')
    await choose(page, 'Review role', 'moderator')
    await page.getByText('You do not have access to this section').waitFor()
  })
  await check(`${engine} Forms replacement and publication`, async () => {
    await page.goto('http://127.0.0.1:5284/en/dashboard/forms/fabric')
    await page.getByLabel('Title · English').fill('Updated fabric form')
    await page.getByRole('button', { name: 'Add question', exact: true }).click()
    await page.getByLabel('Stable question key').last().fill('deadline')
    await page.getByLabel('Label · English', { exact: true }).last().fill('Deadline')
    await page.getByLabel('Label · Arabic', { exact: true }).last().fill('الموعد')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('Title · English').inputValue(), 'Updated fabric form')
    await page.getByRole('link', { name: 'View website', exact: true }).click()
    await page.getByLabel('Service *', { exact: true }).selectOption('fabric')
    await page.getByLabel(/^Deadline/).waitFor()
  })
  await check(`${engine} native product create and edit`, async () => {
    await page.goto('http://127.0.0.1:5284/en/dashboard/products/new')
    await page.getByLabel('Name * · English').fill('Sample new shirt')
    await page.getByLabel('Name * · Arabic').fill('قميص جديد')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.waitForURL(/\/products\/[a-f\d]{24}$/)
    await page
      .getByLabel('Upload image', { exact: true })
      .setInputFiles(resolve('shared/assets/images/offer-logo.webp'))
    await page.locator('.staff-gallery-editor img').waitFor()
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
    assert.equal(await page.locator('.staff-gallery-editor img').count(), 1)
  })
  await check(`${engine} wholesale native-source creation`, async () => {
    await page.goto('http://127.0.0.1:5284/en/dashboard/wholesale/new')
    await choose(page, 'Source product', '0000000000000000000000c8')
    await page.getByLabel('Title * · English').fill('40 piece pouch')
    await page.getByLabel('Title * · Arabic').fill('عبوة 40 قطعة')
    await page.getByLabel('Pieces per pouch', { exact: true }).fill('40')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.waitForURL(/\/wholesale\/[a-f\d]{24}$/)
    assert.equal(
      await page.getByRole('combobox', { name: 'Publication state', exact: true }).innerText(),
      'Unpublished',
    )
    await choose(page, 'Publication state', 'true')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
  })
  await check(`${engine} settings save and homepage mobile override`, async () => {
    await page.goto('http://127.0.0.1:5284/en/dashboard/settings')
    await page.getByLabel('Phone', { exact: true }).fill('+201001234567')
    await page.getByLabel('Default page title · English').fill('Example business title')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
    await page
      .locator('.dashboard-sidebar')
      .getByRole('link', { name: 'Homepage content', exact: true })
      .click()
    await page
      .getByLabel('Upload mobile image')
      .first()
      .setInputFiles(resolve('shared/assets/images/offer-logo.webp'))
    await page.waitForTimeout(150)
    await page.getByLabel('Alt text · English').first().fill('Example mobile hero')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
    await page.getByRole('link', { name: 'View website', exact: true }).click()
    await page.locator('footer').getByRole('link', { name: 'Contact', exact: true }).click()
    await page.locator('a[href="tel:+201001234567"]').waitFor()
    await page.getByRole('link', { name: 'Home', exact: true }).first().click()
    await page.setViewportSize({ width: 390, height: 844 })
    const source = await page
      .locator('.business-home-mobile-hero source')
      .getAttribute('srcset')
      .catch(() => null)
    assert.ok(source?.includes('offer-logo'), source)
  })
  await context.close()
  await browser.close()
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify({ checks, failures, errors }, null, 2),
)
assert.equal(errors.length, 0, JSON.stringify(errors))
assert.equal(failures.length, 0, `${failures.length} failed checks`)
console.log(`${checks.length} Phase 3 browser checks passed`)
