import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'
import { createStaffFixture } from '../../B2B-Website/src/features/dashboard/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/staff-access')
await mkdir(output, { recursive: true })
const checks = []
async function setup(browser, store, language = 'en', width = 1440) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage(),
    port = store === 'b2b' ? 5294 : 5295
  const origin = `http://127.0.0.1:${port}`,
    base = `${origin}/${language}/dashboard`
  const state = {
    user: null,
    loginRole: store === 'b2b' ? 'admin' : 'moderator',
    loginStore: store,
    loginError: null,
    logoutError: false,
    unpublished: false,
  }
  const inquiry = createReviewInquiry({ images: {} }),
    staff = createStaffFixture(inquiry.staffData)
  const calls = [],
    errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.setDefaultTimeout(12000)
  await context.route('https://narmer-ecommerce.vercel.app/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method()
    const path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2[bc]/, '')
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-language',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-expose-headers': 'Retry-After',
    }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    calls.push({ path, method, admin: url.pathname.includes('/admin/') })
    const respond = (status, data, code = 'OK', extra = {}) =>
      route.fulfill({
        status,
        headers: { ...headers, ...extra },
        body: JSON.stringify({
          success: status < 400,
          code,
          message: code,
          data,
          errors: [],
          requestId: 'staff-access-ui-test',
        }),
      })
    if (path === '/auth/refresh')
      return state.user
        ? respond(200, { user: state.user, accessToken: 'test-only-token', expiresIn: 900 })
        : respond(401, null, 'UNAUTHORIZED')
    if (path === '/auth/login') {
      if (state.loginError)
        return respond(
          state.loginError === 'TOO_MANY_REQUESTS' ? 429 : 401,
          null,
          state.loginError,
          { 'Retry-After': '1' },
        )
      state.user = {
        id: '000000000000000000000bb9',
        store: state.loginStore,
        role: state.loginRole,
        name: 'QA staff',
        email: 'staff@example.test',
        phone: '+201001234567',
        emailVerified: true,
      }
      return respond(200, { user: state.user, accessToken: 'test-only-token', expiresIn: 900 })
    }
    if (path === '/auth/logout') {
      if (state.logoutError) return respond(503, null, 'INTERNAL_ERROR')
      state.user = null
      return respond(200, null)
    }
    if (path === '/auth/forgot-password') return respond(200, null, 'OTP_REQUESTED')
    if (path === '/auth/reset-password') {
      state.user = null
      return respond(200, null, 'PASSWORD_RESET')
    }
    if (path === '/homepage' || path === '/site-settings') return respond(200, null)
    if (!url.pathname.includes('/admin/') && path === '/forms')
      return respond(
        200,
        state.unpublished ? { items: [], supportedFieldTypes: [] } : await inquiry.forms(language),
      )
    if (!url.pathname.includes('/admin/') && path.startsWith('/forms/'))
      return state.unpublished
        ? respond(404, null, 'FORM_NOT_FOUND')
        : respond(200, await inquiry.form(path.split('/').at(-1), language))
    try {
      const data = await staff(`${path}${url.search}`, {
        method,
        user: state.user,
        language,
        body: request.postData() ? JSON.parse(request.postData()) : undefined,
      })
      return respond(200, data)
    } catch (error) {
      return respond(error.status || 500, null, error.code || 'INTERNAL_ERROR')
    }
  })
  async function submit() {
    await page.waitForFunction(
      () =>
        /Staff sign in|دخول الموظفين/.test(
          document.querySelector('.staff-access h1')?.textContent || '',
        ) && !document.querySelector('input[name=otp]'),
    )
    await page.locator('.staff-access input[type=email]').fill('staff@example.test')
    await page.locator('.staff-access input[type=password]').fill('NarmerTest123')
    await page.locator('.staff-access button[type=submit]').click()
  }
  async function logout() {
    if (width < 768) {
      await page.locator('.dashboard-menu').click()
      await page
        .locator('.dashboard-drawer')
        .getByRole('button', { name: language === 'ar' ? 'تسجيل الخروج' : 'Logout', exact: true })
        .click()
    } else
      await page
        .locator('.dashboard-sidebar')
        .getByRole('button', { name: language === 'ar' ? 'تسجيل الخروج' : 'Logout', exact: true })
        .click()
  }
  return { context, page, origin, base, state, calls, errors, submit, logout }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const store of ['b2b', 'b2c'])
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const env = await setup(browser, store, language, width)
        const { page, context, base, state, errors, submit, logout } = env
        const id = `${engine}-${store}-${language}-${width}`
        try {
          await page.goto(base)
          await page.locator('.staff-access input[type=email]').waitFor()
          assert.equal(new URL(page.url()).pathname, `/${language}/dashboard/login`)
          assert.equal(
            await page
              .locator('.account-nav,.account-heading,.public-header,.public-footer')
              .count(),
            0,
          )
          assert.equal(await page.locator('a[href$="/register"]').count(), 0)
          assert.equal(await page.locator('.auth-art').count(), 0)
          const card = await page.locator('.staff-access-panel').boundingBox()
          assert.ok(card.width <= 420 && Math.abs(card.x + card.width / 2 - width / 2) < 2)
          const switcher = page.locator('.staff-access-language a')
          assert.equal(await switcher.locator('.language-link-icon[aria-hidden=true]').count(), 1)
          assert.equal(
            await switcher.getAttribute('href'),
            `/${language === 'ar' ? 'en' : 'ar'}/dashboard/login`,
          )
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({ path: resolve(output, `${id}-login.png`), fullPage: true })
          const password = page.locator('input[name=password]')
          const eye = page.locator('.staff-password-toggle')
          await password.fill('EyeToggleTest123')
          await eye.click()
          assert.equal(await password.getAttribute('type'), 'text')
          assert.equal(await password.inputValue(), 'EyeToggleTest123')
          assert.equal(await eye.getAttribute('aria-pressed'), 'true')
          await eye.press('Space')
          assert.equal(await password.getAttribute('type'), 'password')
          assert.equal(await eye.getAttribute('aria-pressed'), 'false')
          await page.locator('a[href$="/forgot-password"]').click()
          await page.waitForFunction(() => !document.querySelector('input[name=password]'))
          await page.locator('input[type=email]').fill('staff@example.test')
          await page.locator('button[type=submit]').click()
          await page.locator('.feedback--success').waitFor()
          await page.locator('a[href$="/reset-password"]').click()
          await page.locator('input[name=otp]').waitFor()
          await page.locator('input[name=otp]').fill('012345')
          await page.locator('input[name=password]').fill('NarmerTest123')
          await page.locator('button[type=submit]').click()
          await page.waitForURL(`${base}/login`)
          state.loginError = 'INVALID_CREDENTIALS'
          await submit()
          await page.getByRole('alert').waitFor()
          assert.equal(await page.locator('input[name=password]').inputValue(), '')
          assert.equal(await page.locator('input[type=email]').inputValue(), 'staff@example.test')
          state.loginError = null
          await submit()
          await page.locator('.dashboard').waitFor()
          assert.equal(
            new URL(page.url()).pathname,
            `/${language}/dashboard/${store === 'b2b' ? 'requests' : 'orders'}`,
          )
          state.logoutError = true
          await logout()
          await page.getByRole('alert').waitFor()
          assert.equal(await page.locator('.dashboard').count(), 1)
          if (width < 768) await page.locator('.dashboard-drawer .close-button').click()
          state.logoutError = false
          await logout()
          await page.locator('.staff-access input[type=email]').waitFor()
          assert.equal(new URL(page.url()).pathname, `/${language}/dashboard/login`)
          assert.equal(await page.locator('input[name=password]').inputValue(), '')
          assert.deepEqual(errors, [])
          checks.push(
            `${id}: layout, recovery, login errors, role landing and logout failure/success`,
          )
        } catch (error) {
          await page
            .screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
            .catch(() => {})
          throw new Error(`${id}: ${error.message}`, { cause: error })
        } finally {
          await context.close()
        }
      }
  for (const store of ['b2b', 'b2c'])
    for (const denial of ['customer', 'other-store']) {
      const env = await setup(browser, store),
        { page, base, state, submit, calls } = env
      state.loginRole = denial === 'customer' ? 'user' : 'admin'
      if (denial === 'other-store') state.loginStore = store === 'b2b' ? 'b2c' : 'b2b'
      await page.goto(base)
      await submit()
      await page.getByRole('alert').waitFor()
      assert.equal(await page.locator('.dashboard').count(), 0)
      assert.equal(calls.filter((call) => call.admin).length, 0)
      checks.push(`${engine} ${store}: ${denial} cannot open dashboard or read staff data`)
      await env.context.close()
    }
  for (const language of ['en', 'ar'])
    for (const width of [1440, 390]) {
      const env = await setup(browser, 'b2b', language, width),
        { page, origin, state } = env
      await page.goto(`${origin}/${language}/account/login`)
      await page.locator('.auth-panel input[type=email]').waitFor()
      assert.equal(await page.locator('.account-nav,.account-heading').count(), 0)
      assert.equal(await page.locator('.auth-art').isVisible(), width > 900)
      await page.screenshot({
        path: resolve(output, `${engine}-${language}-${width}-customer.png`),
        fullPage: true,
      })
      state.unpublished = true
      await page.goto(`${origin}/${language}/request`)
      await page.locator('.inquiry-unavailable-actions').waitFor()
      assert.equal(await page.getByRole('alert').count(), 0)
      assert.equal(
        await page.locator('.inquiry-unavailable-actions a').getAttribute('href'),
        `/${language}/contact`,
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      checks.push(
        `${engine} ${language} ${width}: customer Figma layout and single unpublished-form state`,
      )
      await env.context.close()
    }
  await browser.close()
  console.log(`${engine}: staff/customer authentication presentation checks passed`)
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
console.log(`${checks.length} staff access scenarios passed; all API responses intercepted.`)
