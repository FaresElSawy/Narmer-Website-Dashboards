import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const b2b = process.argv.includes('--b2b'),
  origin = `http://127.0.0.1:${b2b ? 5284 : 5283}`
const output = resolve(`output/playwright/phase4${b2b ? '-b2b' : ''}-accounts`)
await mkdir(output, { recursive: true })
const checks = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of b2b ? [1440, 360] : [1440, 768, 440, 360, 320]) {
        const context = await browser.newContext({
            viewport: { width, height: 1000 },
            reducedMotion: 'reduce',
          }),
          page = await context.newPage(),
          errors = [],
          id = `${engine}-${language}-${width}`
        page.setDefaultTimeout(12000)
        page.on('pageerror', (error) => errors.push(error.message))
        let apiCalls = 0
        page.on('request', (request) => {
          if (request.url().includes('/api/v1/')) apiCalls++
        })
        try {
          await page.goto(`${origin}/${language}/account/register`)
          await page.locator('input[name="name"]').fill('Retail Review')
          await page.locator('input[name="email"]').fill('retail-review@example.test')
          await page.locator('input[name="phone"]').fill('+201001234567')
          await page.locator('input[name="password"]').fill('NarmerDemo123')
          await page.locator('.auth-panel form button[type="submit"]').click()
          await page.waitForURL(`**/${language}/account/verify`)
          await page.locator('input[name="otp"]').fill('012345')
          await page.locator('.auth-panel form button[type="submit"]').click()
          await page.waitForURL(`**/${language}/account/login`)
          await page.locator('input[name="password"]').fill('NarmerDemo123')
          await page.locator('.auth-panel form button[type="submit"]').click()
          await page.waitForURL(`**/${language}/account`)
          await page.locator('.account-overview').waitFor()
          async function inspect(name, path) {
            assert.equal(
              await page.locator('.account-nav a[aria-current="page"]').getAttribute('href'),
              `/${language}${path}`,
            )
            assert.equal(await page.locator('h1:visible').count(), 1)
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            )
            if ([1440, 440, 360].includes(width))
              await page.screenshot({ path: resolve(output, `${id}-${name}.png`), fullPage: true })
          }
          await inspect('overview', '/account')
          await page.locator(`.account-links a[href="/${language}/account/profile"]`).click()
          await page.locator('input[name="name"]').waitFor()
          await inspect('profile', '/account/profile')
          await page.locator('input[name="name"]').fill('Retail Updated')
          await page.locator('.profile-form button[type="submit"]').click()
          await page.locator('.feedback--success').waitFor()
          await page
            .locator('.notification')
            .filter({ hasText: language === 'ar' ? 'تم حفظ الملف الشخصي' : 'Profile saved' })
            .waitFor()
          await page.locator(`.account-nav a[href="/${language}/account/addresses"]`).click()
          await page.locator('.address-form').waitFor()
          assert.equal(await page.locator('.feedback--success').count(), 0)
          await inspect('address-form', '/account/addresses')
          for (const [name, value] of Object.entries({
            label: 'Review delivery',
            governorate: 'Cairo',
            district: 'Nasr City',
            building: '12',
            street: 'Review street',
          }))
            await page.locator(`.address-form input[name="${name}"]`).fill(value)
          await page.locator('.address-form button[type="submit"]').click()
          await page.waitForFunction(
            () => document.querySelector('.address-item h3')?.textContent === 'Review delivery',
          )
          await page
            .locator('.notification')
            .filter({ hasText: language === 'ar' ? 'تم حفظ العنوان' : 'Address saved' })
            .waitFor()
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({ path: resolve(output, `${id}-addresses.png`), fullPage: true })
          await inspect('saved-address', '/account/addresses')
          await page.locator('.address-actions button').first().click()
          assert.equal(
            await page.locator('.address-form input[name="label"]').inputValue(),
            'Review delivery',
          )
          await page.locator('.account-cancel').click()
          await page.locator('.address-item .address-actions button').last().click()
          await page.locator('.address-item').waitFor({ state: 'detached' })
          if (!b2b) {
            await page.locator(`.account-nav a[href="/${language}/orders"]`).click()
            await page.locator('.orders-history .feedback').waitFor()
            await inspect('orders-empty', '/orders')
          }
          await page.locator(`.account-nav a[href="/${language}/account/profile"]`).click()
          await page.locator('.profile-sidebar button').click()
          await page.waitForURL(`${origin}/${language}`)
          assert.deepEqual(errors, [], id)
          assert.equal(apiCalls, 0)
          checks.push({ id, passed: true })
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
console.log(
  `${checks.length} ${b2b ? 'B2B' : 'B2C'} fixture registration/OTP/profile/address/logout journeys passed.`,
)
