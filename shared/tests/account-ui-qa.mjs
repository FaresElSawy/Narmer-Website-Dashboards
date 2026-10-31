import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/account-ui')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const store of ['b2c', 'b2b'])
    for (const language of ['en', 'ar'])
      for (const width of [1440, 960, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        })
        try {
          const page = await context.newPage(),
            errors = [],
            id = `${store}-${language}-${width}`
          const origin = `http://127.0.0.1:${store === 'b2c' ? 5283 : 5284}`
          const base = `${origin}/${language}`,
            ar = language === 'ar'
          page.setDefaultTimeout(12000)
          page.on('pageerror', (error) => errors.push(error.message))
          await context.route('https://**/*', (route) => route.abort())
          for (const route of ['register', 'reset-password', 'login']) {
            await page.goto(`${base}/account/${route}`, { waitUntil: 'networkidle' })
            const input = page.locator('input[name="password"]')
            const toggle = page.getByRole('button', {
              name: ar ? 'إظهار كلمة المرور' : 'Show password',
              exact: true,
            })
            await input.fill('LocalPreview123')
            assert.equal(await input.getAttribute('type'), 'password')
            assert.equal(await toggle.getAttribute('aria-controls'), await input.getAttribute('id'))
            await toggle.click()
            assert.equal(await input.getAttribute('type'), 'text')
            assert.equal(await input.inputValue(), 'LocalPreview123')
            const hide = page.getByRole('button', {
              name: ar ? 'إخفاء كلمة المرور' : 'Hide password',
              exact: true,
            })
            assert.equal(await hide.getAttribute('aria-pressed'), 'true')
            await hide.press('Space')
            assert.equal(await input.getAttribute('type'), 'password')
            assert.equal(page.url(), `${base}/account/${route}`)
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            )
          }
          assert.equal(await page.locator('.auth-breadcrumb').count(), store === 'b2c' ? 1 : 0)
          if (width > 900) {
            await page.locator('.auth-art img').evaluate((image) => image.decode())
            assert.match(
              await page.locator('.auth-art img').getAttribute('src'),
              store === 'b2b' ? /account-manufacturing/ : /customer-login-campaign/,
            )
          }
          await page.locator('input[name="password"]').fill('')
          await page.evaluate(() => document.fonts.ready)
          await page.screenshot({ path: resolve(output, `${id}-login.png`), fullPage: true })
          await page.locator('input[name="email"]').fill('mariam@example.test')
          await page.locator('input[name="password"]').fill('NarmerDemo123')
          await page.locator('.auth-panel button[type="submit"]').click()
          await page.waitForURL(`${base}/account`)
          await page.locator('.account-overview-actions button').waitFor()
          assert.equal(
            await page
              .getByRole('button', { name: ar ? 'تسجيل الخروج' : 'Sign out', exact: true })
              .count(),
            1,
          )
          assert.equal(
            await page.locator(`.account-links a[href="/${language}/requests"]`).count(),
            store === 'b2b' ? 1 : 0,
          )
          const actions = await page.locator('.account-overview-actions').boundingBox()
          const links = await page.locator('.account-links').boundingBox()
          assert.ok(actions.y - (links.y + links.height) >= 27)
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({ path: resolve(output, `${id}-overview.png`), fullPage: true })
          await page.locator(`.account-nav a[href="/${language}/account/profile"]`).click()
          await page.locator('.profile-form').waitFor()
          assert.equal(
            await page
              .locator('.account-panel--profile button')
              .filter({ hasText: ar ? 'تسجيل الخروج' : 'Sign out' })
              .count(),
            0,
          )
          assert.equal(
            await page.locator(`.account-panel--profile a[href="/${language}/requests"]`).count(),
            0,
          )
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({ path: resolve(output, `${id}-profile.png`), fullPage: true })
          await page.locator(`.account-nav a[href="/${language}/account"]`).click()
          await page.locator('.account-overview-actions button').click()
          await page.waitForURL(`${base}`)
          if (store === 'b2b' && width === 1440) {
            assert.ok(
              !/Illustrative manufacturing imagery|Illustrative wholesale imagery|صور توضيحية للتصنيع|وليست صور منتجات الكتالوج/.test(
                await page.locator('body').innerText(),
              ),
            )
            for (const route of [
              'services/spinning',
              'services/weaving',
              'services/fabric',
              'services/school-uniforms',
              'wholesale',
              'contact',
              'request',
              'requests',
              'track',
            ]) {
              await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' })
              assert.equal(
                await page
                  .locator('.business-service-breadcrumb,.inquiry-heading > a,.auth-breadcrumb')
                  .count(),
                0,
              )
              assert.ok(
                !/Home \/ Narmer Business|الرئيسية \/ نارمر للأعمال/.test(
                  await page.locator('main').innerText(),
                ),
              )
              assert.ok(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
              )
              if (route === 'services/school-uniforms')
                await page.screenshot({
                  path: resolve(output, `${id}-service.png`),
                  fullPage: true,
                })
            }
          }
          assert.deepEqual(errors, [], id)
          results.push({ store, language, width, passed: true })
        } finally {
          await context.close()
        }
      }
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results))
