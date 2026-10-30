import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRetailFixture, fixtureId } from '../../B2C-Website/src/features/shop/fixtures.js'
import { commerceProducts } from './retail-sample-products.mjs'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase4-journeys')
await mkdir(output, { recursive: true })
const manifest = JSON.parse(await readFile('B2C-Website/dist/.vite/manifest.json', 'utf8'))
const imagePath = Object.values(manifest).find((entry) => entry.file?.includes('offer-logo-')).file
const images = Object.fromEntries(
  [
    'logo',
    'logoDetail',
    'white',
    'quarter',
    'green',
    'brown',
    'mission',
    'blue',
    'ivory',
    'art',
    'pink',
  ].map((key, i) => [
    key,
    {
      id: fixtureId(900 + i),
      url: `http://127.0.0.1:5283/${imagePath}?view=${key}`,
      width: 1200,
      height: 1200,
    },
  ]),
)
const results = []
async function setup(browser, language, width, conflict = false, pendingRestore = false) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage(),
    calls = [],
    errors = []
  page.setDefaultTimeout(12000)
  page.on('pageerror', (error) => errors.push(error.message))
  const state = {
    user: null,
    unavailable: false,
    unavailableSaved: false,
    limit: false,
    delay: false,
  }
  const customer = {
    id: fixtureId(800),
    store: 'b2c',
    role: 'user',
    name: 'Review customer',
    email: 'review@example.test',
    phone: '+201001234567',
    emailVerified: true,
  }
  const fixture = createRetailFixture(
    { getSnapshot: () => ({ user: state.user }) },
    images,
    commerceProducts,
  )
  if (conflict) {
    const line = { productId: fixtureId(100), variantId: fixtureId(210), quantity: 8 }
    await fixture.setQuantity(line)
    state.user = customer
    await fixture.setQuantity(line)
    state.user = null
  }
  await context.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace('/api/v1/b2c', ''),
      method = request.method(),
      language = request.headers()['x-language'] || 'en'
    calls.push({
      path,
      method,
      authorization: Boolean(request.headers().authorization),
      body: request.postDataJSON(),
    })
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-origin': 'http://127.0.0.1:5295',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
    }
    if (method === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          ...headers,
          'access-control-allow-headers': 'authorization,content-type,x-language',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,PATCH',
        },
      })
    let data,
      status = 200
    try {
      if (path === '/auth/refresh') {
        if (pendingRestore) await new Promise((resolve) => setTimeout(resolve, 3500))
        status = 401
        throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED', status })
      } else if (path === '/auth/login') {
        state.user =
          request.postDataJSON().email === 'staff@example.test'
            ? { ...customer, role: 'admin' }
            : customer
        data = { user: state.user, accessToken: 'mock-token', expiresIn: 900 }
      } else if (path === '/auth/logout') {
        state.user = null
        data = null
      } else if (path === '/users/me')
        data = { ...state.user, createdAt: '2026-10-24T00:00:00.000Z' }
      else if (path === '/users/me/addresses') data = []
      else if (path === '/categories') data = await fixture.categories({ language })
      else if (path === '/homepage') data = await fixture.homepage({ language })
      else if (path === '/site-settings') data = await fixture.settings()
      else if (path === '/products/facets')
        data = await fixture.facets(url.searchParams, { language })
      else if (path === '/products') {
        if (state.delay && url.searchParams.get('size') === 's')
          await new Promise((resolve) => setTimeout(resolve, 450))
        data = await fixture.products(url.searchParams, { language })
      } else if (path.startsWith('/products/'))
        data = await fixture.product(path.split('/')[2], { language })
      else if (path === '/cart/merge') {
        await new Promise((resolve) => setTimeout(resolve, 150))
        data = await fixture.merge()
      } else if (path === '/cart/items') {
        if (state.writeDelay) await new Promise((resolve) => setTimeout(resolve, 250))
        if (state.limit)
          return route.fulfill({
            status: 429,
            headers: { ...headers, 'retry-after': '2' },
            json: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Wait', errors: [] },
          })
        const body = request.postDataJSON()
        data = await fixture.setQuantity(body, !request.headers().authorization, { language })
        if (state.dropResponse) {
          state.dropResponse = false
          return route.abort('failed')
        }
        if (!body.quantity) state.unavailable = false
      } else if (path === '/cart') {
        data = await fixture.cart(!request.headers().authorization, { language })
        if (state.unavailable && data.items.length) {
          Object.assign(data.items[0], {
            name: null,
            slug: null,
            images: [],
            values: null,
            sku: null,
            price: null,
            discountedPrice: null,
            unitPrice: null,
            stock: null,
            lineTotal: null,
            status: 'unavailable',
          })
          data.subtotal = null
          data.canCheckout = false
        }
      } else if (path === '/wishlist') {
        data = await fixture.wishlist({ language })
        if (state.unavailableSaved) {
          data.items.push({ productId: fixtureId(9999), product: null, status: 'unavailable' })
          data.itemCount++
        }
      } else if (path.startsWith('/wishlist/items/')) {
        const id = path.split('/')[3]
        if (id === fixtureId(9999) && method === 'DELETE') state.unavailableSaved = false
        data = await fixture.save(id, method === 'DELETE', { language })
      } else throw new Error(`Unexpected mock request ${method} ${path}`)
      await route.fulfill({ status, headers, json: { success: true, code: 'OK', data } })
    } catch (error) {
      await route.fulfill({
        status: error.status || 500,
        headers,
        json: {
          success: false,
          code: error.code || 'MOCK_UNHANDLED',
          message: error.message,
          errors: [],
        },
      })
    }
  })
  const base = `http://127.0.0.1:5295/${language}`
  const go = async (path) => {
    await page.goto(`${base}${path}`)
    await page.waitForFunction(() => !document.querySelector('.site-loader'))
    await page.locator('h1').first().waitFor()
  }
  const header = async (name) => {
    await page.locator(`.header-actions a[href="/${language}/${name}"]`).click()
  }
  const login = async () => {
    await page.locator('input[name="email"]').fill('review@example.test')
    await page.locator('input[name="password"]').fill('NarmerDemo123')
    await page.locator('.auth-panel form button[type="submit"]').click()
  }
  return { context, page, state, calls, errors, go, header, login, base, fixture }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const ar = language === 'ar',
          run = await setup(browser, language, width),
          { page, state, calls, errors, go, header, login, context } = run
        const id = `${engine}-${language}-${width}`
        try {
          await go('/products/000000000000000000000064/logo-hoodie')
          await page.getByRole('button', { name: ar ? 'بيج' : 'Beige', exact: true }).click()
          await page.getByRole('button', { name: 'XXXL', exact: true }).click()
          const initialImage = await page
            .locator('.offer-main-image img')
            .first()
            .getAttribute('src')
          await page.getByRole('button', { name: ar ? 'بني' : 'Brown', exact: true }).click()
          assert.equal(
            await page.getByRole('button', { name: 'M', exact: true }).getAttribute('aria-pressed'),
            'true',
          )
          assert.ok(
            (await page.locator('.detail-price').innerText())
              .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
              .includes('699'),
          )
          assert.notEqual(
            await page.locator('.offer-main-image img').first().getAttribute('src'),
            initialImage,
          )
          await page.getByRole('button', { name: ar ? 'بيج' : 'Beige', exact: true }).click()
          await page.getByRole('button', { name: 'XXXL', exact: true }).click()
          await page.locator('.offer-gallery button').nth(1).waitFor()
          await page.locator('.gallery-arrow--previous').click()
          await page.waitForFunction(
            () =>
              document
                .querySelectorAll('.offer-gallery button')[1]
                ?.getAttribute('aria-pressed') === 'true',
          )
          await page.locator('.gallery-arrow--next').click()
          await page.waitForFunction(
            () =>
              document
                .querySelectorAll('.offer-gallery button')[0]
                ?.getAttribute('aria-pressed') === 'true',
          )
          await page
            .getByRole('button', { name: ar ? 'دليل المقاسات' : 'Size guide', exact: true })
            .click()
          await page.locator('dialog[open] table').waitFor()
          assert.ok(
            await page
              .locator('dialog[open] table')
              .innerText()
              .then((text) => text.includes('XXXL')),
          )
          await page.keyboard.press('Escape')
          await page
            .getByRole('button', { name: ar ? 'إضافة إلى السلة' : 'Add to cart', exact: true })
            .click()
          await page.locator('.shop-notice').waitFor()
          await header('cart')
          await page.locator('.cart-line').waitFor()
          assert.equal(
            await page
              .getByRole('button', { name: ar ? 'تحديث الكمية' : 'Update quantity', exact: true })
              .count(),
            0,
          )
          await page
            .getByRole('button', { name: ar ? 'زيادة الكمية' : 'Increase quantity', exact: true })
            .click()
          await page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '2',
          )
          await page
            .getByRole('button', { name: ar ? 'تقليل الكمية' : 'Decrease quantity', exact: true })
            .click()
          await page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '1',
          )
          const validWrites = calls.filter((call) => call.path === '/cart/items').length
          await page.locator('.cart-line input').fill('')
          await page.locator('.cart-line input').press('Enter')
          await page.locator('.shop-quantity .field-error').waitFor()
          await page.locator('.cart-line input').fill('1.5')
          await page.locator('.cart-line input').press('Enter')
          assert.equal(calls.filter((call) => call.path === '/cart/items').length, validWrites)
          await page.locator('.cart-line input[type="number"]').fill('10000')
          await page.locator('.cart-line input').press('Enter')
          await page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '10000',
          )
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          const lastWrite = calls.filter((call) => call.path === '/cart/items').at(-1)
          assert.equal(lastWrite.body.quantity, 10000)
          assert.equal(lastWrite.body.variantId, fixtureId(205))
          assert.equal(lastWrite.authorization, false)
          await header('wishlist')
          await page
            .locator(`.shop-page a[href="/${language}/account/login"]`)
            .filter({ hasText: ar ? 'تسجيل الدخول' : 'Sign in' })
            .first()
            .click()
          await login()
          await page.waitForURL(`**/${language}/wishlist`)
          assert.equal(calls.filter((call) => call.path === '/cart/merge').length, 1)
          assert.equal(calls.find((call) => call.path === '/cart/merge').authorization, true)
          await header('cart')
          await page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '10000',
          )
          await page.locator('.cart-line h2 a').click()
          await page
            .getByRole('button', { name: ar ? 'حفظ في المفضلة' : 'Save to wishlist', exact: true })
            .click()
          await page.locator('.shop-notice').waitFor()
          await header('wishlist')
          await page.locator('.saved-product').waitFor()
          await page
            .getByRole('button', {
              name: ar ? 'إزالة من المفضلة' : 'Remove from wishlist',
              exact: true,
            })
            .click()
          await page.locator('.saved-product').waitFor({ state: 'detached' })
          state.unavailableSaved = true
          await header('cart')
          await page.locator('.cart-line').waitFor()
          await header('wishlist')
          await page.locator('.saved-product .feedback').waitFor()
          await page
            .getByRole('button', {
              name: ar ? 'إزالة من المفضلة' : 'Remove from wishlist',
              exact: true,
            })
            .click()
          await page.locator('.saved-product').waitFor({ state: 'detached' })
          assert.ok(
            calls.some(
              (call) =>
                call.path === `/wishlist/items/${fixtureId(9999)}` && call.method === 'DELETE',
            ),
          )
          state.unavailable = true
          await header('cart')
          await page.locator('.cart-line .field-error').waitFor()
          assert.ok(
            (await page.locator('.cart-summary').innerText()).includes(
              ar ? 'غير متاح' : 'Unavailable',
            ),
          )
          await page
            .getByRole('button', { name: ar ? 'إزالة المنتج' : 'Remove item', exact: true })
            .click()
          await page.locator('.cart-line').waitFor({ state: 'detached' })
          assert.equal(calls.filter((call) => call.path === '/cart/items').at(-1).body.quantity, 0)
          assert.deepEqual(errors, [], id)
          results.push({
            id: `${id}:variant-gallery-size-cart-merge-wishlist-unavailable`,
            passed: true,
          })
        } finally {
          await context.close()
        }
        const multiple = await setup(browser, language, width)
        try {
          for (const [id, quantity] of [
            [101, 1],
            [102, 3],
            [103, 1],
          ])
            await multiple.fixture.setQuantity({ productId: fixtureId(id), quantity })
          await multiple.go('/cart')
          await multiple.page.locator('.cart-line').nth(2).waitFor()
          const rows = multiple.page.locator('.cart-line')
          const originalOrder = await rows.locator('h2 a').allTextContents()
          multiple.state.writeDelay = true
          await rows
            .nth(0)
            .getByRole('button', { name: ar ? 'زيادة الكمية' : 'Increase quantity' })
            .click()
          assert.equal(
            await rows
              .nth(0)
              .getByRole('button', { name: ar ? 'زيادة الكمية' : 'Increase quantity' })
              .isDisabled(),
            true,
          )
          await multiple.page.waitForFunction(
            () => document.querySelector('.cart-line input')?.value === '2',
          )
          assert.deepEqual(await rows.locator('h2 a').allTextContents(), originalOrder)
          await rows.nth(0).locator('input').fill('4')
          await rows.nth(0).locator('input').press('Tab')
          await multiple.page.keyboard.press('Tab')
          await multiple.page.waitForFunction(
            () =>
              document.querySelector('.cart-line input')?.value === '4' &&
              document.querySelector('.cart-layout')?.getAttribute('aria-busy') === 'false',
          )
          assert.deepEqual(await rows.locator('h2 a').allTextContents(), originalOrder)
          await rows
            .nth(1)
            .getByRole('button', { name: ar ? 'تقليل الكمية' : 'Decrease quantity' })
            .click()
          await multiple.page.waitForFunction(
            () => document.querySelectorAll('.cart-line input')[1]?.value === '2',
          )
          assert.deepEqual(await rows.locator('h2 a').allTextContents(), originalOrder)
          multiple.state.dropResponse = true
          await rows
            .nth(2)
            .getByRole('button', { name: ar ? 'زيادة الكمية' : 'Increase quantity' })
            .click()
          await multiple.page.waitForFunction(
            () =>
              document.querySelectorAll('.cart-line input')[2]?.value === '2' &&
              document.querySelector('.cart-layout')?.getAttribute('aria-busy') === 'false',
          )
          assert.deepEqual(await rows.locator('h2 a').allTextContents(), originalOrder)
          assert.deepEqual(multiple.errors, [])
          results.push({ id: `${id}:three-line-autosave-order-and-lost-response`, passed: true })
        } finally {
          await multiple.context.close()
        }
        const conflict = await setup(browser, language, width, true)
        try {
          await conflict.go('/account/login')
          await conflict.login()
          await conflict.page.waitForURL(`**/${language}/cart`)
          await conflict.page.locator('.cart-merge .feedback--error').waitFor()
          await conflict.page
            .getByRole('button', { name: ar ? 'سلة الزائر' : 'Guest cart', exact: true })
            .click()
          await conflict.page.locator('.cart-line input').fill('4')
          await conflict.page.locator('.cart-line input').press('Enter')
          await conflict.page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '4',
          )
          await conflict.page
            .getByRole('button', { name: ar ? 'دمج السلتين' : 'Merge carts', exact: true })
            .click()
          await conflict.page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '12',
          )
          await conflict.page
            .getByRole('button', { name: ar ? 'دمج السلتين' : 'Merge carts', exact: true })
            .click()
          await conflict.page.locator('.cart-layout[aria-busy="false"]').waitFor()
          await conflict.page
            .locator('.cart-merge [role="status"]')
            .filter({ hasText: ar ? 'لا توجد منتجات' : 'There are no guest items' })
            .waitFor()
          assert.equal(await conflict.page.locator('.cart-summary dd').first().textContent(), '12')
          assert.deepEqual(conflict.errors, [])
          await conflict.page.evaluate(() => scrollTo(0, 0))
          await conflict.page.screenshot({
            path: resolve(output, `${id}-merge-recovered.png`),
            fullPage: true,
          })
          results.push({ id: `${id}:failed-merge-preserved-recovered-repeat`, passed: true })
        } finally {
          await conflict.context.close()
        }
        const catalog = await setup(browser, language, width)
        try {
          await catalog.go('/products')
          await catalog.page.locator('.catalog-count').waitFor()
          await catalog.page
            .getByRole('button', { name: ar ? 'التالي' : 'Next page', exact: true })
            .click()
          await catalog.page.waitForFunction(
            () => document.querySelectorAll('.product-card').length === 1,
          )
          assert.ok(catalog.page.url().includes('page=2'))
          assert.equal(
            await catalog.page
              .getByRole('button', { name: ar ? 'التالي' : 'Next page', exact: true })
              .isDisabled(),
            true,
          )
          assert.equal(
            await catalog.page
              .getByRole('button', { name: ar ? 'السابق' : 'Previous', exact: true })
              .isEnabled(),
            true,
          )
          await catalog.page.goBack()
          await catalog.page.waitForFunction(
            () => document.querySelectorAll('.product-card').length === 12,
          )
          catalog.state.delay = true
          await catalog.page.locator('.catalog-filter-panel > summary').click()
          await catalog.page
            .getByRole('combobox', { name: ar ? 'المقاس' : 'Size', exact: true })
            .click()
          await catalog.page.getByRole('option', { name: /^S \(/ }).click()
          await catalog.page.waitForURL('**/*size=s*')
          await catalog.page.goBack()
          await catalog.page.waitForFunction(
            () => document.querySelectorAll('.product-card').length === 12,
          )
          await catalog.page.waitForTimeout(550)
          assert.equal(await catalog.page.locator('.product-card').count(), 12)
          await catalog.go('/products?minPrice=0&maxPrice=0')
          await catalog.page.waitForFunction(
            () => document.querySelectorAll('.product-card').length === 1,
          )
          assert.ok(catalog.page.url().includes('minPrice=0'))
          await catalog.page.locator('.product-card h3 a').click()
          await catalog.page
            .getByRole('button', { name: ar ? 'إضافة إلى السلة' : 'Add to cart', exact: true })
            .click()
          await catalog.page.locator('.shop-notice').waitFor()
          await catalog.header('cart')
          await catalog.page.locator('.cart-line').waitFor()
          assert.equal(await catalog.page.locator('.cart-summary .field-error').count(), 0)
          const subtotal = await catalog.page.locator('.cart-summary dd').nth(1).textContent()
          assert.ok(subtotal.includes(ar ? '٠' : '0'))
          await catalog.go('/products/00000000000000000000006e/essential-sweatshirt')
          assert.equal(
            await catalog.page
              .getByRole('button', { name: ar ? 'إضافة إلى السلة' : 'Add to cart', exact: true })
              .isDisabled(),
            true,
          )
          assert.deepEqual(catalog.errors, [])
          results.push({
            id: `${id}:pagination-filters-stale-response-zero-price-out-of-stock`,
            passed: true,
          })
        } finally {
          await catalog.context.close()
        }
        const limited = await setup(browser, language, width)
        try {
          await limited.go('/products/000000000000000000000065/everyday-sweatshirt')
          limited.state.limit = true
          const add = limited.page.getByRole('button', {
            name: ar ? 'إضافة إلى السلة' : 'Add to cart',
            exact: true,
          })
          await add.click()
          await limited.page.locator('.feedback--error').waitFor()
          await add.click()
          assert.equal(limited.calls.filter((call) => call.path === '/cart/items').length, 1)
          limited.state.limit = false
          await limited.page.waitForTimeout(2200)
          await add.click()
          await limited.page.locator('.shop-notice').waitFor()
          assert.equal(limited.calls.filter((call) => call.path === '/cart/items').length, 2)
          await limited.header('cart')
          await limited.page.locator('.cart-line').waitFor()
          limited.state.dropResponse = true
          await limited.page.locator('.cart-line input').fill('2')
          await limited.page.locator('.cart-line input').press('Enter')
          await limited.page.waitForFunction(
            () => document.querySelector('.cart-summary dd')?.textContent === '2',
          )
          assert.equal(limited.calls.filter((call) => call.path === '/cart/items').length, 3)
          assert.deepEqual(limited.errors, [])
          results.push({ id: `${id}:429-no-premature-replay-recovery`, passed: true })
        } finally {
          await limited.context.close()
        }
      }
    const pending = await setup(browser, 'en', 390, false, true)
    try {
      await pending.go('/products/everyday-sweatshirt')
      const add = pending.page.getByRole('button', { name: 'Add to cart', exact: true })
      await add.waitFor()
      assert.equal(await add.isDisabled(), true)
      assert.equal(pending.calls.filter((call) => call.path === '/cart/items').length, 0)
      await pending.page.waitForFunction(() =>
        [...document.querySelectorAll('button')].some(
          (button) => button.textContent === 'Add to cart' && !button.disabled,
        ),
      )
      results.push({
        id: `${engine}:restoring-identity-blocks-shopping-until-settled`,
        passed: true,
      })
    } finally {
      await pending.context.close()
    }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} intercepted Phase 4 shopping and merge journey cases passed.`)
