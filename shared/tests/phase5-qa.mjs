import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const smoke = process.argv.includes('--smoke')
const output = resolve(
  process.env.NARMER_QA_OUTPUT || `output/playwright/phase5${smoke ? '-smoke' : ''}`,
)
const results = []
await mkdir(output, { recursive: true })
for (const engine of smoke ? ['chromium'] : ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar']) {
      for (const width of smoke ? [360] : [1440, 768, 440, 360, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 956 },
          hasTouch: width < 640,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          ar = language === 'ar',
          id = `${engine}-${language}-${width}`
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.route('https://narmer-ecommerce.vercel.app/**', (route) => {
          errors.push('Unexpected real backend request')
          return route.abort()
        })
        async function fits() {
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${id}: overflow ${page.url()}`,
          )
          assert.ok(
            await page
              .locator('meta[name="robots"]')
              .evaluateAll(
                (nodes) =>
                  nodes.length > 0 && nodes.every((node) => node.content === 'noindex, nofollow'),
              ),
          )
          assert.ok(!new URL(page.url()).searchParams.has('token'))
        }
        async function shot(name) {
          await fits()
          if ([1440, 440, 360].includes(width))
            await page.screenshot({ path: resolve(output, `${id}-${name}.png`), fullPage: true })
        }
        async function product() {
          await page.locator('.product-selection').waitFor()
          await page.locator('.product-selection .button--accent').click()
          await page.locator('.notification').waitFor()
          await page.locator(`.header-actions a[href="/${language}/cart"]`).click()
          await page.locator('.cart-line').first().waitFor()
          await page
            .getByRole('link', {
              name: ar ? 'المتابعة لإتمام الطلب' : 'Continue to checkout',
              exact: true,
            })
            .click()
          await page.locator('.checkout-form input[name="name"]').waitFor()
        }
        async function details(method, saved = false) {
          if (saved) {
            await page
              .getByRole('button', {
                name: ar ? 'استخدام بيانات حسابي' : 'Use my account details',
                exact: true,
              })
              .click()
            const address = page.locator('.checkout-form .narmer-select-trigger').first()
            await address.click()
            await page.getByRole('option').filter({ hasText: 'Home' }).click()
            assert.equal(
              await page.locator('.checkout-fields .narmer-select-native').inputValue(),
              '',
            )
            assert.ok(await page.locator('input[name="district"]').inputValue())
          } else {
            for (const [name, value] of Object.entries({
              name: ar ? 'منى اختبار' : 'Mona Example',
              email: 'mona@example.test',
              phone: '+201001234567',
              district: ar ? 'مدينة نصر' : 'Nasr City',
              building: '12',
              street: ar ? 'شارع تجريبي' : 'Example Street',
            }))
              await page.locator(`.checkout-form input[name="${name}"]`).fill(value)
          }
          const governorate = page.locator('.checkout-fields .narmer-select-trigger')
          await governorate.click()
          assert.equal(await page.locator('.narmer-select-list [role="option"]').count(), 28)
          await page.getByRole('option', { name: ar ? 'القاهرة' : 'Cairo', exact: true }).click()
          if (method === 'instapay')
            await page.getByRole('button', { name: 'InstaPay', exact: true }).click()
          await page.locator('input[name="couponCode"]').fill('WELCOME10')
          await page
            .getByRole('button', { name: ar ? 'تطبيق الكود' : 'Apply code', exact: true })
            .click()
          await page.locator('.checkout-aside [role="status"]').waitFor()
          await shot(`${saved ? 'account' : 'guest'}-${method}-details`)
          await page.locator('.checkout-form button[type="submit"]').click()
          await page.waitForURL(`**/${language}/checkout/review`)
          await page.locator('.order-summary .order-total').waitFor()
          await shot(`${saved ? 'account' : 'guest'}-${method}-review`)
          if (method === 'instapay') {
            assert.match(await page.locator('.receiving-account').innerText(), /SAMPLE ONLY/)
            assert.equal(await page.locator('.checkout-aside .button--accent').isDisabled(), true)
            await page.locator('input[type="file"]').setInputFiles({
              name: 'proof.webp',
              mimeType: 'image/webp',
              buffer: Buffer.from(
                'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==',
                'base64',
              ),
            })
            await page
              .getByRole('button', { name: ar ? 'رفع الصورة' : 'Upload screenshot', exact: true })
              .click()
            await page
              .getByRole('status')
              .filter({ hasText: ar ? 'تم رفع الصورة' : 'Screenshot uploaded' })
              .waitFor()
          }
          await page.locator('.checkout-aside .button--accent').click()
          await page.waitForURL(`**/${language}/checkout/received/*`)
          await page.locator('.order-acknowledgement').waitFor()
          await page.waitForFunction(() => !document.querySelector('.header-cart-count'))
          await shot(`${saved ? 'account' : 'guest'}-${method}-received`)
          const orderId = new URL(page.url()).pathname.split('/').at(-1)
          assert.match(orderId, /^[0-9a-f]{24}$/)
          await page
            .getByRole('link', { name: ar ? 'عرض إيصال الطلب' : 'View order receipt', exact: true })
            .click()
          await page.locator('.order-receipt').waitFor()
          assert.equal(
            (await page.locator('.checkout-steps [aria-current="step"]').innerText()).includes(
              '3.',
            ),
            true,
          )
          assert.equal(
            (await page.locator('.order-receipt .order-reference').innerText()).includes(orderId),
            true,
          )
          await shot(`${saved ? 'account' : 'guest'}-${method}-receipt`)
          assert.equal(await page.locator('.receipt-masthead').isVisible(), false)
          await page.emulateMedia({ media: 'print' })
          assert.ok(await page.locator('.receipt-masthead .brand-crop img').isVisible())
          assert.ok(
            await page
              .locator('.receipt-masthead img')
              .evaluate((img) => img.complete && img.naturalWidth > 0),
          )
          assert.ok(await page.locator('.receipt-item-head').isVisible())
          assert.ok(await page.locator('.receipt-thanks').isVisible())
          assert.equal(
            await page
              .locator('.public-header:visible,.public-footer:visible,.no-print:visible')
              .count(),
            0,
          )
          assert.ok(!(await page.locator('body').innerText()).includes('review-track-'))
          if (engine === 'chromium' && width === 1440 && method === 'instapay') {
            await page.pdf({
              path: resolve(output, `${language}-receipt.pdf`),
              preferCSSPageSize: true,
              printBackground: true,
            })
            await page.pdf({
              path: resolve(output, `${language}-receipt-no-backgrounds.pdf`),
              preferCSSPageSize: true,
              printBackground: false,
            })
          }
          await page.emulateMedia({ media: 'screen' })
          await page
            .getByRole('link', { name: ar ? 'تتبع طلبك' : 'Track your order', exact: true })
            .filter({ has: page.locator(':scope') })
            .first()
            .click()
          await page.locator('.order-status').waitFor()
          if (method === 'instapay') {
            await page
              .getByRole('button', {
                name: ar ? 'عرض صورة التحويل الخاصة' : 'View private payment screenshot',
                exact: true,
              })
              .click()
            await page.locator('.order-proof img').waitFor()
            assert.match(await page.locator('.order-proof img').getAttribute('src'), /^blob:/)
          }
          await fits()
          results.push({ id, flow: `${saved ? 'account' : 'guest'}-${method}`, passed: true })
        }
        try {
          await page.goto(`http://127.0.0.1:5283/${language}/products/logo-hoodie`, {
            waitUntil: 'networkidle',
          })
          await page.evaluate(() => document.fonts.ready)
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
          await product()
          await details('cod')
          await page
            .getByRole('link', { name: ar ? 'متابعة التسوق' : 'Continue shopping', exact: true })
            .click()
          await page
            .locator(`.product-card a[href="/${language}/products/logo-hoodie"]`)
            .first()
            .click()
          await product()
          await details('instapay')
          if ([1440, 360].includes(width)) {
            await page.locator(`.header-actions a[href="/${language}/account"]`).click()
            const signIn = page.locator('.account-page .feedback a[href$="/login"]')
            if (await signIn.count()) await signIn.click()
            await page.locator('input[name="password"]').fill('NarmerDemo123')
            await page.locator('.auth-panel form button[type="submit"]').click()
            await page.waitForURL(`**/${language}/account`)
            await page.locator(`.account-nav a[href="/${language}/orders"]`).click()
            await page.locator('.orders-history .feedback').waitFor()
            assert.equal(await page.locator('.order-history-card').count(), 0)
            await page.locator('.orders-history .feedback .button').click()
            await page
              .locator(`.product-card a[href="/${language}/products/logo-hoodie"]`)
              .first()
              .click()
            await product()
            await details('cod', true)
            await page.locator(`.public-footer a[href="/${language}/orders"]`).click()
            await page.locator('.order-history-card').first().waitFor()
            assert.equal(await page.locator('.order-history-card').count(), 1)
            if (width < 640)
              assert.ok(
                await page
                  .locator('.order-history-card .order-reference')
                  .evaluate((node) => node.getBoundingClientRect().height < 28),
              )
            await shot('account-history')
          }
          assert.deepEqual(errors, [], id)
        } catch (error) {
          await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
          throw error
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} Phase 5 guest/account checkout, receipt and tracking flows passed`)
