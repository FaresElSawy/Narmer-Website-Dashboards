import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/quick-shop'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 360]) {
        const context = await browser.newContext({
            viewport: { width, height: 956 },
            reducedMotion: 'reduce',
          }),
          page = await context.newPage(),
          ar = language === 'ar',
          id = `${engine}-${language}-${width}`,
          errors = []
        page.on('pageerror', (e) => errors.push(e.message))
        page.setDefaultTimeout(12000)
        await page.route('https://narmer-ecommerce.vercel.app/**', (r) => r.abort())
        async function fits() {
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            id,
          )
        }
        async function count(value) {
          await page.waitForFunction(
            (n) => document.querySelector('.header-cart-count')?.textContent.trim() === String(n),
            value,
          )
        }
        async function choose() {
          const size = page
            .locator('.quick-shop .product-options:not(.product-colors) button:not(:disabled)')
            .first()
          await size.click()
        }
        try {
          await page.goto(`http://127.0.0.1:5283/${language}`, { waitUntil: 'networkidle' })
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
          const card = page.locator('.retail-curated .product-card').first()
          if (width === 1440) {
            const add = card.locator('.product-card-quick-actions .button--secondary')
            await add.hover()
            assert.equal(
              await add.locator('.icon').evaluate((el) => getComputedStyle(el).filter),
              'none',
            )
          }
          await card.locator('.product-card-quick-actions .button--secondary').click()
          await page.locator('.quick-shop .purchase-buttons').waitFor()
          assert.ok(await page.locator('.quick-shop .purchase-buttons button').first().isDisabled())
          await choose()
          await fits()
          await page.screenshot({ path: resolve(output, `${id}-options.png`), fullPage: true })
          await page.locator('.quick-shop .purchase-buttons button').first().click()
          await page.locator('dialog.quick-shop').waitFor({ state: 'detached' })
          await count(1)
          await page
            .locator('.notification')
            .filter({ hasText: ar ? 'تمت إضافة' : 'Product added' })
            .waitFor()
          if (width === 360) {
            assert.ok(await page.locator('.floating-cart').isVisible())
            const toast = await page.locator('.notifications').boundingBox(),
              floating = await page.locator('.floating-cart').boundingBox()
            assert.ok(toast.y + toast.height < floating.y)
            assert.ok(toast.height <= 60, `${id}: mobile notification is too tall`)
            assert.ok(toast.width <= 320, `${id}: mobile notification is too wide`)
            const dismiss = await page.locator('.notification button').boundingBox()
            assert.ok(dismiss.width >= 44 && dismiss.height >= 44)
          } else assert.equal(await page.locator('.floating-cart').isVisible(), false)
          await page.screenshot({ path: resolve(output, `${id}-added.png`), fullPage: true })
          await page.locator('.notification button').click()
          assert.equal(await page.locator('.notification').count(), 0)
          await card.locator('.quick-buy-icon').click()
          await choose()
          await page.locator('.quick-shop .purchase-buttons button').last().click()
          await page.waitForURL(`**/${language}/checkout`)
          await page.locator('.checkout-form').waitFor()
          await count(2)
          assert.equal(await page.locator('.floating-cart').count(), 0)
          await page.locator(`.header-actions a[href="/${language}/cart"]`).click()
          await page.locator('.cart-line').waitFor()
          assert.equal(await page.locator('.cart-line input[type="number"]').inputValue(), '2')
          await page.locator('.cart-line .quantity-control button').last().click()
          await count(3)
          await page
            .locator('.cart-line .button')
            .filter({ hasText: ar ? 'إزالة' : 'Remove' })
            .click()
          await page.locator('.cart-line').waitFor({ state: 'detached' })
          const text = await page.locator('.feedback strong').boundingBox(),
            btn = await page.locator('.feedback .button').boundingBox()
          assert.ok(btn.y >= text.y + text.height + 15)
          await page.locator('.feedback .button').click()
          await page.locator('.product-card h3 a').first().click()
          await page.locator('.product-selection').waitFor()
          await page
            .getByRole('button', { name: ar ? 'اشترِ الآن' : 'Buy now', exact: true })
            .click()
          await page.waitForURL(`**/${language}/checkout`)
          await count(1)
          await page.locator(`.header-actions a[href="/${language}/account"]`).click()
          await page.locator('.auth-panel input[name="password"]').fill('NarmerDemo123')
          await page.locator('.auth-panel form button[type="submit"]').click()
          await page.locator('.account-overview').waitFor()
          await count(1)
          await page.locator('.account-back').click()
          await page.locator('.retail-curated .product-card h3 a').first().click()
          await page
            .getByRole('button', { name: ar ? 'حفظ في المفضلة' : 'Save to wishlist', exact: true })
            .click()
          await page
            .locator('.notification')
            .filter({ hasText: ar ? 'تم الحفظ في المفضلة' : 'Saved to your wishlist' })
            .waitFor()
          assert.equal(await page.locator('.notification').count(), 1)
          assert.equal(await page.locator('.shop-notice').count(), 0)
          await page
            .getByRole('button', { name: ar ? 'إضافة إلى السلة' : 'Add to cart', exact: true })
            .first()
            .click()
          await page
            .locator('.notification')
            .filter({ hasText: ar ? 'تمت إضافة' : 'Product added' })
            .waitFor()
          assert.equal(await page.locator('.notification').count(), 1)
          assert.equal(await page.locator('.shop-notice').count(), 0)
          await page.evaluate(() => document.fonts.ready)
          await page.screenshot({
            path: resolve(output, `${id}-product-notification.png`),
            fullPage: true,
          })
          await fits()
          assert.deepEqual(errors, [])
          results.push({ id, passed: true })
        } catch (e) {
          await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
          throw e
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} quick shopping / Buy now / badge / floating cart journeys passed`)
