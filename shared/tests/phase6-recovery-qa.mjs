import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createCatalogFixture } from '../../B2C-Website/src/features/dashboard/catalog-fixtures.js'
import { createStaffContentFixture } from '../../B2C-Website/src/features/dashboard/staff-fixtures.js'
import { createStaffOrdersFixture } from '../../B2C-Website/src/features/dashboard/order-fixtures.js'
const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve(process.env.NARMER_QA_OUTPUT || 'output/playwright/phase6-recovery'),
  results = [],
  proof = await readFile('shared/assets/images/offer-logo.webp'),
  id = (n) => n.toString(16).padStart(24, '0')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
async function setup(role = 'admin') {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 956 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage(),
    user = {
      id: id(9000),
      name: 'QA staff',
      email: 'staff@example.test',
      phone: '+201001234567',
      role,
      store: 'b2c',
      emailVerified: true,
    },
    calls = [],
    state = { fault: null, failRead: false }
  const product = {
      id: id(100),
      version: 0,
      type: 'simple',
      name: { en: 'QA product', ar: 'منتج اختبار' },
      description: { en: '', ar: '' },
      slug: 'qa-product',
      categoryId: id(11),
      sizeChartId: null,
      price: 79900,
      discountedPrice: null,
      effectivePrice: 79900,
      stock: 10,
      sku: null,
      isActive: true,
      images: [],
    },
    catalog = createCatalogFixture([product]),
    staff = createStaffContentFixture([product]),
    orders = createStaffOrdersFixture()
  await page.addInitScript(() => {
    window.__proofUrls = { created: [], revoked: [] }
    const make = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (blob) => {
      const url = make(blob)
      window.__proofUrls.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      window.__proofUrls.revoked.push(url)
      revoke(url)
    }
  })
  page.on('dialog', (dialog) => dialog.accept())
  page.setDefaultTimeout(10000)
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2c/, ''),
      method = req.method(),
      headers = {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5295',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-language',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Expose-Headers': 'Retry-After,X-Request-Id',
        'Content-Type': 'application/json',
      }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    const body = req.postData() ? JSON.parse(req.postData()) : undefined
    calls.push({ path: url.pathname, method, body })
    const respond = (status, data, extra = {}) =>
      route.fulfill({
        status,
        headers: { ...headers, ...extra },
        body: JSON.stringify(
          status < 400
            ? { success: true, code: 'OK', data }
            : { success: false, code: data, errors: [], message: data },
        ),
      })
    if (path === '/auth/refresh')
      return respond(200, { user, accessToken: 'phase6-test', expiresIn: 900 })
    if (path === '/auth/logout') return respond(200, null)
    const options = { method, body, user, language: 'en' }
    if (path === `/products/${id(100)}` && method === 'GET' && state.failRead) {
      state.failRead = false
      return respond(500, 'INTERNAL_ERROR')
    }
    if (
      path === `/products/${id(100)}` &&
      method === 'PATCH' &&
      state.fault === 'conflict-read-fail'
    ) {
      state.fault = null
      await catalog(path, { ...options, body: { ...body, price: 85000 } })
      state.failRead = true
      return respond(409, 'PRODUCT_CONFLICT')
    }
    if (path === `/products/${id(100)}` && method === 'PATCH' && state.fault === 'rate') {
      state.fault = null
      return respond(429, 'TOO_MANY_REQUESTS', { 'Retry-After': '1' })
    }
    if (path.endsWith('/proof'))
      return route.fulfill({
        status: 200,
        headers: { ...headers, 'Content-Type': 'image/webp' },
        body: proof,
      })
    try {
      let result
      for (const handler of [catalog, staff, orders]) {
        result = await handler(path + (url.search || ''), options)
        if (result !== undefined) break
      }
      if (result === undefined) return respond(404, 'NOT_FOUND')
      if (path.startsWith('/orders/') && method === 'GET' && result.payment)
        result.payment.hasProof = true
      if (state.fault === 'malformed' && ['PATCH', 'POST'].includes(method)) {
        state.fault = null
        return route.fulfill({ status: method === 'POST' ? 201 : 200, headers, body: '{' })
      }
      if (state.fault === 'lost-status' && path.endsWith('/status')) {
        state.fault = null
        return route.abort('failed')
      }
      return respond(200, result)
    } catch (error) {
      return respond(error.status || 500, error.code || 'INTERNAL_ERROR')
    }
  })
  return { context, page, user, calls, state }
}
async function run(name, role, action) {
  const current = await setup(role)
  try {
    await action(current)
    results.push({ name, passed: true })
  } catch (error) {
    await current.page.screenshot({ path: resolve(output, `${name}-failure.png`), fullPage: true })
    throw error
  } finally {
    await current.context.close()
  }
}
try {
  for (const mode of ['lost-status', 'malformed'])
    await run(`status-${mode}`, 'admin', async ({ page, state, calls }) => {
      await page.goto(`http://127.0.0.1:5295/en/dashboard/orders/${id(12000)}`, {
        waitUntil: 'networkidle',
      })
      state.fault = mode
      await page.getByRole('button', { name: 'Accepted', exact: true }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Confirm change', exact: true })
        .click()
      await page.getByRole('button', { name: 'Shipped', exact: true }).waitFor()
      assert.equal(
        calls.filter((c) => c.method === 'PATCH' && c.path.endsWith('/status')).length,
        1,
      )
      assert.equal(await page.locator('.feedback--error').count(), 0)
    })
  await run('conflict-then-failed-read', 'admin', async ({ page, state, calls }) => {
    await page.goto(`http://127.0.0.1:5295/en/dashboard/products/${id(100)}`, {
      waitUntil: 'networkidle',
    })
    await page.getByLabel('Price (EGP)', { exact: true }).fill('799.25')
    state.fault = 'conflict-read-fail'
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByRole('button', { name: 'Read current record', exact: true }).waitFor()
    assert.ok(await page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled())
    await page.getByRole('button', { name: 'Read current record', exact: true }).click()
    await page
      .getByRole('button', { name: 'I reviewed the differences; keep my edits', exact: true })
      .click()
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.locator('.feedback--success').waitFor()
    const writes = calls.filter(
      (c) => c.method === 'PATCH' && c.path.endsWith(`/products/${id(100)}`),
    )
    assert.deepEqual(
      writes.map((c) => c.body.version),
      [0, 1],
    )
  })
  await run('malformed-profile-save-reconciles', 'admin', async ({ page, state, calls }) => {
    await page.goto('http://127.0.0.1:5295/en/dashboard/profile', { waitUntil: 'networkidle' })
    await page.getByLabel('Name', { exact: true }).fill('Updated staff')
    state.fault = 'malformed'
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.locator('.feedback--success').waitFor()
    assert.equal(
      calls.filter((c) => c.method === 'PATCH' && c.path.endsWith('/users/me')).length,
      1,
    )
    let dialogs = 0
    page.removeAllListeners('dialog')
    page.on('dialog', (d) => {
      dialogs++
      d.dismiss()
    })
    await page.getByRole('link', { name: 'Orders', exact: true }).click()
    await page.waitForURL('**/dashboard/orders')
    assert.equal(dialogs, 0)
  })
  await run(
    'malformed-account-create-blocks-replay',
    'superAdmin',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5295/en/dashboard/accounts', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Create staff account', exact: true }).click()
      const dialog = page.getByRole('dialog')
      for (const [name, value] of [
        ['Name', 'New staff'],
        ['Email', 'new-staff@example.test'],
        ['Phone', '+201001234567'],
        ['Initial password', 'Temporary123'],
      ])
        await dialog.getByLabel(name, { exact: true }).fill(value)
      state.fault = 'malformed'
      await dialog.getByRole('button', { name: 'Create account', exact: true }).click()
      await dialog.getByText('The account may have been created.', { exact: false }).waitFor()
      assert.ok(
        await dialog.getByRole('button', { name: 'Create account', exact: true }).isDisabled(),
      )
      assert.equal(await dialog.getByLabel('Initial password', { exact: true }).inputValue(), '')
      assert.equal(calls.filter((c) => c.method === 'POST' && c.path.endsWith('/users')).length, 1)
    },
  )
  await run('malformed-password-clears-session', 'admin', async ({ page, state, calls }) => {
    await page.goto('http://127.0.0.1:5295/en/dashboard/profile', { waitUntil: 'networkidle' })
    for (const [name, value] of [
      ['Current password', 'Temporary123'],
      ['New password', 'NewPassword123'],
      ['Confirm new password', 'NewPassword123'],
    ])
      await page.getByLabel(name, { exact: true }).fill(value)
    state.fault = 'malformed'
    await page.getByRole('button', { name: 'Change password', exact: true }).click()
    await page.waitForURL('**/dashboard/login')
    assert.equal(
      calls.filter((c) => c.method === 'POST' && c.path.endsWith('/auth/change-password')).length,
      1,
    )
    assert.ok(calls.some((c) => c.path === '/api/v1/b2c/auth/change-password'))
  })
  await run(
    'handover-prefix-and-unknown-session-clear',
    'superAdmin',
    async ({ page, state, calls }) => {
      await page.goto(`http://127.0.0.1:5295/en/dashboard/accounts/${id(2)}`, {
        waitUntil: 'networkidle',
      })
      await page
        .getByRole('button', {
          name: 'Transfer super-admin ownership to this account',
          exact: true,
        })
        .click()
      state.fault = 'malformed'
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Confirm ownership transfer', exact: true })
        .click()
      await page.waitForURL('**/dashboard/login')
      assert.equal(
        calls.filter(
          (c) => c.method === 'POST' && c.path === '/api/v1/admin/b2c/auth/super-admin/handover',
        ).length,
        1,
      )
    },
  )
  await run('private-proof-revoked-on-navigation', 'moderator', async ({ page }) => {
    await page.goto(`http://127.0.0.1:5295/en/dashboard/orders/${id(12000)}`, {
      waitUntil: 'networkidle',
    })
    await page.getByRole('button', { name: 'View transfer proof', exact: true }).click()
    await page.locator('.staff-proof-image').waitFor()
    const url = await page.locator('.staff-proof-image').getAttribute('src')
    assert.ok(url.startsWith('blob:'))
    await page.getByRole('link', { name: 'Orders', exact: true }).click()
    await page.waitForURL('**/dashboard/orders')
    await page.waitForFunction((url) => window.__proofUrls.revoked.includes(url), url)
    assert.equal(await page.locator('.staff-proof-image').count(), 0)
  })
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} Phase 6 intercepted recovery/privacy checks passed`)
