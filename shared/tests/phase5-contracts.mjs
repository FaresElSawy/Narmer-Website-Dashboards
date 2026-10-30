import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRetailFixture, fixtureId } from '../../B2C-Website/src/features/shop/fixtures.js'
import { createOrdersFixture } from '../../B2C-Website/src/features/orders/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase5-contracts'),
  results = []
const smoke = process.argv.includes('--smoke')
const proofBytes = Buffer.from(
  'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==',
  'base64',
)
const customer = {
  id: fixtureId(800),
  store: 'b2c',
  role: 'user',
  name: 'Review customer',
  email: 'review@example.test',
  phone: '+201001234567',
  emailVerified: true,
}
const input = {
  customer: { name: 'Mona', email: 'mona@example.test', phone: '+201001234567' },
  address: {
    governorate: 'Cairo',
    governorateCode: 'cairo',
    district: 'Nasr City',
    building: '12',
    street: 'Example Street',
    floor: '',
    apartment: '',
    details: '',
  },
  paymentMethod: 'cod',
}
await mkdir(output, { recursive: true })
for (const engine of smoke ? ['chromium'] : ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of smoke ? ['en'] : ['en', 'ar']) {
      for (const scenario of [
        'lost',
        'instapay-lost',
        'rate',
        'stock',
        'proof',
        'zero',
        'tracking',
        'account',
        'expired',
      ]) {
        const ar = language === 'ar',
          id = `${engine}-${language}-${scenario}`
        const context = await browser.newContext({
          viewport: { width: 390, height: 956 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        page.setDefaultTimeout(12000)
        const state = {
          user: scenario === 'account' ? customer : null,
          previews: 0,
          uploads: 0,
          placements: [],
          calls: [],
          errors: [],
          last: null,
        }
        const session = { getSnapshot: () => ({ user: state.user }) }
        const retail = createRetailFixture(session),
          orders = createOrdersFixture({ session, retail })
        await retail.setQuantity({
          productId: fixtureId(100),
          variantId: fixtureId(200),
          quantity: 1,
        })
        if (scenario === 'tracking') {
          const quote = await orders.preview({ ...input, paymentMethod: 'instapay' }, 'guest')
          const proof = await orders.upload(
            quote.checkoutId,
            new Blob([proofBytes], { type: 'image/webp' }),
            'guest',
          )
          state.last = await orders.place(
            { checkoutId: quote.checkoutId, proofId: proof.id },
            'guest',
          )
          state.user = customer
        }
        page.on('pageerror', (error) => state.errors.push(error.message))
        function decorated(order) {
          if (scenario === 'tracking')
            return {
              ...order,
              status: 'returned',
              refund: { amount: order.totals.total, at: order.updatedAt },
              history: [...order.history, { status: 'returned', at: order.updatedAt }],
            }
          if (scenario !== 'zero') return order
          return {
            ...order,
            items: order.items.map((item) => ({
              ...item,
              price: 12300,
              discountedPrice: null,
              unitPrice: 12300,
              lineTotal: 12300,
              couponDiscount: 0,
              lineTotalAfterDiscount: 12300,
            })),
            coupon: null,
            shipping: { ...order.shipping, fee: 0 },
            totals: { subtotal: 12300, discountAmount: 0, shippingFee: 0, total: 12300 },
          }
        }
        await context.route('**/api/v1/**', async (route) => {
          const request = route.request(),
            url = new URL(request.url()),
            path = url.pathname.replace('/api/v1/b2c', ''),
            method = request.method()
          const lang = request.headers()['x-language'] || 'en',
            authorization = !!request.headers().authorization
          const owner = authorization ? customer.id : 'guest',
            headers = { 'content-type': 'application/json' }
          const call = {
            path,
            method,
            authorization,
            url: request.url(),
            token: !!request.headers()['x-order-token'],
          }
          state.calls.push(call)
          let data
          try {
            if (path === '/auth/refresh') {
              if (!state.user)
                throw Object.assign(new Error('Unauthorized'), {
                  status: 401,
                  code: 'UNAUTHORIZED',
                })
              data = { user: state.user, accessToken: 'mock-customer', expiresIn: 900 }
            } else if (path === '/categories') data = await retail.categories({ language: lang })
            else if (path === '/homepage') data = await retail.homepage({ language: lang })
            else if (path === '/site-settings') data = await retail.settings()
            else if (path === '/users/me') data = state.user
            else if (path === '/users/me/addresses')
              data = [
                {
                  id: 'saved-home',
                  label: 'Home',
                  governorate: 'Cairo',
                  district: '',
                  building: '12A',
                  street: 'Saved Street',
                  floor: '',
                  apartment: '',
                  details: '',
                  contactPhone: null,
                },
              ]
            else if (path === '/products/facets')
              data = await retail.facets(url.searchParams, { language: lang })
            else if (path === '/products')
              data = await retail.products(url.searchParams, { language: lang })
            else if (path.startsWith('/products/'))
              data = await retail.product(path.split('/')[2], { language: lang })
            else if (path === '/cart') data = await retail.cart(!authorization, { language: lang })
            else if (path === '/cart/items')
              data = await retail.setQuantity(request.postDataJSON(), !authorization, {
                language: lang,
              })
            else if (path === '/shipping-fees') data = await orders.shippingFees({ language: lang })
            else if (path === '/shipping-fees/quote')
              data = await orders.shippingQuote(url.searchParams.get('governorateCode'), {
                language: lang,
              })
            else if (path === '/cart/coupon-preview')
              data = await orders.coupon(request.postDataJSON(), owner, { language: lang })
            else if (path === '/cart/checkout') {
              state.previews++
              data = await orders.preview(request.postDataJSON(), owner, { language: lang })
              if (scenario === 'expired' && state.previews === 1)
                data.expiresAt = new Date(Date.now() + 1000).toISOString()
              if (scenario === 'zero')
                data = {
                  ...data,
                  items: data.items.map((item) => ({
                    ...item,
                    price: 0,
                    unitPrice: 0,
                    lineTotal: 0,
                    lineTotalAfterDiscount: 0,
                  })),
                  coupon: null,
                  shipping: { ...data.shipping, fee: 0 },
                  totals: { subtotal: 0, discountAmount: 0, shippingFee: 0, total: 0 },
                }
            } else if (/^\/cart\/checkout\/[^/]+\/proof$/.test(path)) {
              state.uploads++
              const body = new Blob([request.postDataBuffer()], {
                type: request.headers()['content-type'],
              })
              assert.equal(body.type, 'image/webp')
              data = await orders.upload(path.split('/')[3], body, owner, { language: lang })
              if (scenario === 'proof' && state.uploads === 1) return route.abort('failed')
            } else if (path === '/cart/checkout/orders') {
              const body = request.postDataJSON()
              state.placements.push({ body, authorization })
              if (scenario === 'rate' && state.placements.length === 1)
                return route.fulfill({
                  status: 429,
                  headers: { ...headers, 'retry-after': '1' },
                  json: {
                    success: false,
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Wait',
                    data: null,
                    requestId: 'review',
                  },
                })
              if (scenario === 'stock' && state.placements.length === 1)
                throw Object.assign(new Error('Stock changed'), {
                  status: 409,
                  code: 'ORDER_STOCK_UNAVAILABLE',
                })
              data = await orders.place(body, owner, { language: lang })
              state.last = data
              data = { ...data, order: decorated(data.order) }
              if (['lost', 'instapay-lost'].includes(scenario) && state.placements.length === 1)
                return route.abort('failed')
            } else if (path === '/orders')
              data = await orders.orders(url.searchParams, { language: lang })
            else if (/^\/orders\/(tracking\/)?[^/]+\/proof$/.test(path)) {
              throw Object.assign(new Error('Proof unavailable'), {
                status: 404,
                code: 'ORDER_PROOF_NOT_FOUND',
              })
            } else if (/^\/orders\/(tracking\/)?[^/]+$/.test(path))
              data = decorated(
                await orders.order(path.split('/').at(-1), {
                  token: request.headers()['x-order-token'],
                  language: lang,
                }),
              )
            else throw new Error(`Unexpected intercepted path ${method} ${path}`)
            return route.fulfill({
              status: 200,
              headers,
              json: {
                success: true,
                code: 'OK',
                message: 'Request completed',
                data,
                requestId: 'review',
              },
            })
          } catch (error) {
            if (!error.status) state.errors.push(error.message)
            return route.fulfill({
              status: error.status || 500,
              headers,
              json: {
                success: false,
                code: error.code || 'UNEXPECTED',
                message: error.message,
                data: null,
                errors: [],
                requestId: 'review',
              },
            })
          }
        })
        async function fillDetails() {
          await page.locator('.checkout-form').waitFor()
          if (scenario === 'account') {
            await page
              .getByRole('button', {
                name: ar ? 'استخدام بيانات حسابي' : 'Use my account details',
                exact: true,
              })
              .click()
            await page.locator('.checkout-form .narmer-select-trigger').first().click()
            await page.getByRole('option').filter({ hasText: 'Home' }).click()
            assert.equal(
              await page.locator('.checkout-fields .narmer-select-native').inputValue(),
              '',
            )
            assert.equal(await page.locator('input[name="district"]').inputValue(), '')
          } else
            for (const [name, value] of Object.entries({
              name: 'Mona',
              email: 'mona@example.test',
              phone: '+201001234567',
              building: '12',
              street: 'Example Street',
            }))
              await page.locator(`.checkout-form input[name="${name}"]`).fill(value)
          await page.locator('input[name="district"]').fill('Nasr City')
          await page.locator('.checkout-fields .narmer-select-trigger').click()
          await page.getByRole('option', { name: ar ? 'القاهرة' : 'Cairo', exact: true }).click()
          if (['proof', 'instapay-lost'].includes(scenario))
            await page.getByRole('button', { name: 'InstaPay', exact: true }).click()
          await page.locator('.checkout-form button[type="submit"]').click()
          await page.waitForURL('**/checkout/review')
        }
        async function place() {
          await page.locator('.checkout-aside .button--accent').click()
        }
        try {
          if (scenario === 'tracking') {
            const orderId = state.last.order.id,
              token = state.last.trackingToken
            await page.goto(`http://127.0.0.1:5295/${language}/track/${orderId}#token=${token}`, {
              waitUntil: 'networkidle',
            })
            await page.locator('.order-status').waitFor()
            assert.match(
              await page.locator('.order-status .order-note').innerText(),
              ar ? /لا يؤكد تنفيذ تحويل/ : /does not confirm a money transfer/,
            )
            assert.equal(new URL(page.url()).hash, '')
            const calls = state.calls.filter((call) => call.path.includes('/orders/tracking/'))
            assert.ok(
              calls.length > 0 &&
                calls.every(
                  (call) => !call.authorization && call.token && !call.url.includes(token),
                ),
            )
            await page
              .getByRole('button', {
                name: ar ? 'عرض صورة التحويل الخاصة' : 'View private payment screenshot',
                exact: true,
              })
              .click()
            await page.locator('.order-proof [role="alert"]').waitFor()
            assert.equal(state.uploads, 0)
          } else {
            await page.goto(`http://127.0.0.1:5295/${language}/checkout`, {
              waitUntil: 'networkidle',
            })
            await fillDetails()
            if (['proof', 'instapay-lost'].includes(scenario)) {
              if (scenario === 'proof')
                for (const file of [
                  { name: 'bad.gif', mimeType: 'image/gif', buffer: Buffer.from('bad') },
                  {
                    name: 'huge.webp',
                    mimeType: 'image/webp',
                    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
                  },
                ]) {
                  await page.locator('input[type=file]').setInputFiles(file)
                  await page
                    .getByRole('button', {
                      name: ar ? 'رفع الصورة' : 'Upload screenshot',
                      exact: true,
                    })
                    .click()
                  await page.locator('.order-error').waitFor()
                  assert.equal(state.uploads, 0)
                }
              await page
                .locator('input[type=file]')
                .setInputFiles({ name: 'proof.webp', mimeType: 'image/webp', buffer: proofBytes })
              await page
                .getByRole('button', { name: ar ? 'رفع الصورة' : 'Upload screenshot', exact: true })
                .click()
              if (scenario === 'proof') {
                await page
                  .getByRole('status')
                  .filter({ hasText: ar ? 'نتيجة الرفع السابق' : 'previous upload result' })
                  .waitFor()
                assert.equal(state.uploads, 1)
                await page
                  .getByRole('button', {
                    name: ar ? 'رفع صورة مرة أخرى' : 'Upload screenshot again',
                    exact: true,
                  })
                  .click()
              }
              await page
                .getByRole('status')
                .filter({ hasText: ar ? 'تم رفع الصورة' : 'Screenshot uploaded' })
                .waitFor()
              assert.equal(state.uploads, scenario === 'proof' ? 2 : 1)
            }
            if (scenario === 'expired') {
              await page
                .getByText(
                  ar
                    ? 'انتهت صلاحية عرض الطلب. عد إلى التفاصيل لطلب عرض جديد.'
                    : 'This checkout quote has expired. Return to details for a fresh quote.',
                  { exact: true },
                )
                .waitFor()
              assert.equal(await page.locator('.checkout-aside .button--accent').isDisabled(), true)
              assert.equal(state.placements.length, 0)
              await page
                .getByRole('button', { name: ar ? 'تعديل التفاصيل' : 'Edit details', exact: true })
                .click()
              await page.locator('.checkout-form button[type="submit"]').click()
              await page.waitForURL('**/checkout/review')
            }
            await place()
            if (['lost', 'instapay-lost', 'rate', 'stock'].includes(scenario)) {
              await page.locator('.order-error').waitFor()
              if (['lost', 'instapay-lost'].includes(scenario)) {
                assert.equal(
                  await page
                    .getByRole('button', {
                      name: ar ? 'تعديل التفاصيل' : 'Edit details',
                      exact: true,
                    })
                    .isDisabled(),
                  true,
                )
                await page.reload({ waitUntil: 'networkidle' })
                await page
                  .getByRole('button', {
                    name: ar ? 'التحقق من الطلب الأصلي' : 'Reconcile original order',
                    exact: true,
                  })
                  .waitFor()
              } else if (scenario === 'rate') {
                await place()
                assert.equal(state.placements.length, 1)
                await page.waitForTimeout(1100)
              } else {
                await page
                  .getByRole('button', {
                    name: ar ? 'تعديل التفاصيل' : 'Edit details',
                    exact: true,
                  })
                  .click()
                await page.locator('.checkout-form button[type="submit"]').click()
                await page.waitForURL('**/checkout/review')
              }
              await place()
            }
            await page.waitForURL('**/checkout/received/*')
            await page.locator('.order-acknowledgement').waitFor()
            if (['lost', 'instapay-lost'].includes(scenario)) {
              assert.deepEqual(state.placements[0], state.placements[1])
              assert.equal(state.previews, 1)
            }
            if (scenario === 'account')
              assert.ok(state.placements.every((call) => call.authorization))
            assert.ok(
              state.placements.every((call) =>
                Object.keys(call.body).every((key) => ['checkoutId', 'proofId'].includes(key)),
              ),
            )
            if (scenario === 'zero')
              assert.ok(
                (await page.locator('.order-summary .order-total').innerText()).includes(
                  ar ? '١٢٣' : '123',
                ),
              )
          }
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            id,
          )
          assert.deepEqual(state.errors, [], id)
          results.push({
            id,
            passed: true,
            previews: state.previews,
            uploads: state.uploads,
            placements: state.placements.length,
          })
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
console.log(
  `${results.length} intercepted Phase 5 checkout recovery and private tracking scenarios passed`,
)
