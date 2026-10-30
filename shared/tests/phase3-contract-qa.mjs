import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'
import { createStaffFixture } from '../../B2B-Website/src/features/dashboard/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve(process.env.NARMER_QA_OUTPUT || 'output/playwright/phase-3-contracts')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  bytes = await readFile(resolve('shared/assets/images/offer-logo.webp'))
const id = (n) => n.toString(16).padStart(24, '0')
const ok = (data) => ({ success: true, code: 'OK', message: 'OK', data, requestId: 'phase3-mock' })
const bad = (code) => ({
  success: false,
  code,
  message: code,
  errors: [],
  requestId: 'phase3-mock',
})
async function run(name, action) {
  try {
    await action()
    checks.push(name)
    console.log(`PASS ${name}`)
  } catch (error) {
    failures.push({ name, error: error.stack })
    console.error(`FAIL ${name}: ${error.message}`)
  }
}
async function setup(browser, role = 'admin') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage()
  const user = {
    id: id(9000),
    role,
    store: 'b2b',
    name: 'QA staff',
    email: 'staff@example.test',
    phone: '+201001234567',
    emailVerified: true,
  }
  const inquiry = createReviewInquiry({ images: {} }),
    fixture = createStaffFixture(inquiry.staffData)
  const calls = [],
    state = {
      fail: null,
      denyImages: false,
      denyLeads: false,
      hold: null,
      release: null,
      mutation401: false,
    },
    errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())
  await page.addInitScript(() => {
    window.__blobUploads = []
    const fetchOriginal = window.fetch.bind(window)
    window.fetch = async (url, options) => {
      if (String(url).includes('/media/product/') && options?.body instanceof Blob) {
        const buffer = await options.body.arrayBuffer()
        window.__blobUploads.push({
          length: buffer.byteLength,
          type: options.headers.get('Content-Type'),
        })
      }
      return fetchOriginal(url, options)
    }
    window.__privateUrls = { created: [], revoked: [] }
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (blob) => {
      const url = create(blob)
      window.__privateUrls.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      window.__privateUrls.revoked.push(url)
      revoke(url)
    }
  })
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method(),
      path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2b/, '')
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-origin': 'http://127.0.0.1:5294',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-language',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-expose-headers': 'Retry-After,X-Request-Id',
    }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    assert.ok(
      url.pathname.startsWith('/api/v1/admin/b2b/') || url.pathname.startsWith('/api/v1/b2b/'),
      req.url(),
    )
    const raw = req.postDataBuffer(),
      body =
        req.headers()['content-type']?.includes('application/json') && raw
          ? JSON.parse(raw.toString())
          : raw
            ? new Blob([raw])
            : undefined
    calls.push({
      path,
      fullPath: url.pathname,
      method,
      body: raw && req.headers()['content-type']?.includes('application/json') ? body : undefined,
      rawBytes: raw?.length || 0,
      type: req.headers()['content-type'],
      token: req.headers().authorization,
    })
    const respond = (status, data, extra = {}) =>
      route.fulfill({
        status,
        headers: { ...headers, ...extra },
        body: JSON.stringify(status < 400 ? ok(data) : bad(data)),
      })
    if (path === '/auth/refresh')
      return respond(200, { user, accessToken: `token-${role}`, expiresIn: 900 })
    if (path === '/auth/logout') return respond(200, null)
    if (state.mutation401 && method === 'PATCH') {
      state.mutation401 = false
      return respond(401, 'UNAUTHORIZED')
    }
    if (state.denyLeads && path === '/leads') return respond(403, 'FORBIDDEN')
    if (state.hold === path && method === 'GET')
      await new Promise((resolve) => {
        state.release = resolve
      })
    if (path.includes('/images/'))
      return state.denyImages
        ? respond(403, 'FORBIDDEN')
        : route.fulfill({
            status: 200,
            headers: { ...headers, 'content-type': 'image/webp' },
            body: bytes,
          })
    if (state.fail && path === '/forms/fabric' && method === 'PATCH') {
      const mode = state.fail
      state.fail = null
      if (mode === 'validation') return respond(422, 'INVALID_FORM')
      if (mode === 'rate') return respond(429, 'TOO_MANY_REQUESTS', { 'Retry-After': '1' })
      if (mode === 'conflict') {
        const fresh = await fixture(path, { method: 'GET', user, language: 'en' })
        await fixture(path, {
          method,
          user,
          language: 'en',
          body: { version: fresh.version, title: { en: 'Other staff title', ar: 'عنوان آخر' } },
        })
        return respond(409, 'FORM_CONFLICT')
      }
      if (mode === 'committed') await fixture(path, { method, user, language: 'en', body })
      return route.abort('failed')
    }
    try {
      const data = await fixture(`${path}${url.search}`, {
        method,
        body,
        user,
        language: req.headers()['x-language'] || 'en',
      })
      return respond(method === 'POST' && path.startsWith('/media/') ? 201 : 200, data)
    } catch (error) {
      return respond(error.status || 500, error.code || 'INTERNAL_ERROR')
    }
  })
  return { context, page, calls, state, errors }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  const testCase = async (name, action, role) =>
    run(`${engine} ${name}`, async () => {
      const env = await setup(browser, role)
      try {
        await action(env)
        assert.deepEqual(env.errors, [])
      } finally {
        await env.context.close()
      }
    })
  await testCase(
    'moderator route gate does not fetch admin-only forms',
    async ({ page, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByText('You do not have access to this section', { exact: true }).waitFor()
      assert.equal(
        calls.some((call) => call.path.startsWith('/forms')),
        false,
      )
      assert.equal(
        await page.locator('.dashboard-sidebar').getByRole('link', { name: 'Accounts' }).count(),
        0,
      )
    },
    'moderator',
  )
  await testCase(
    'server permission denial stays an error rather than empty data',
    async ({ page, state }) => {
      state.denyLeads = true
      await page.goto('http://127.0.0.1:5294/en/dashboard/requests')
      await page.getByText('You do not have permission for this action.').first().waitFor()
      assert.equal(
        await page.getByText('No requests match these filters', { exact: true }).count(),
        0,
      )
    },
  )
  await testCase(
    'private image bytes are revoked on navigation and denial stays separate',
    async ({ page, state, calls }) => {
      await page.goto(`http://127.0.0.1:5294/en/dashboard/requests/${id(2002)}`)
      await page.getByRole('img', { name: 'Private request reference' }).waitFor()
      assert.ok(
        calls.find((call) => call.path.includes('/images/')).token.startsWith('Bearer token-'),
      )
      await page
        .locator('.dashboard-sidebar')
        .getByRole('link', { name: 'Requests', exact: true })
        .click()
      await page.waitForFunction(
        () => window.__privateUrls.created.length === window.__privateUrls.revoked.length,
      )
      const urls = await page.evaluate(() => window.__privateUrls)
      assert.deepEqual(urls.created, urls.revoked)
      state.denyImages = true
      await page.goto(`http://127.0.0.1:5294/en/dashboard/requests/${id(2002)}`)
      await page.getByText('You do not have permission for this action.').waitFor()
      assert.equal(await page.getByRole('img', { name: 'Private request reference' }).count(), 0)
    },
    'moderator',
  )
  await testCase('validation keeps the unsaved bilingual form', async ({ page, state }) => {
    await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
    await page.getByLabel('Title · English').fill('My retained title')
    state.fail = 'validation'
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('INVALID_FORM', { exact: false }).waitFor()
    assert.equal(await page.getByLabel('Title · English').inputValue(), 'My retained title')
  })
  await testCase(
    'conflict requires review and explicit fresh-version save',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English').fill('My retained title')
      state.fail = 'conflict'
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.getByText('Review the changed record', { exact: true }).waitFor()
      assert.equal(await page.getByLabel('Title · English').inputValue(), 'My retained title')
      assert.equal(
        await page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled(),
        true,
      )
      assert.equal(
        calls.filter((call) => call.path === '/forms/fabric' && call.method === 'PATCH').length,
        1,
      )
      await page
        .getByRole('button', { name: 'I reviewed the differences; keep my edits', exact: true })
        .click()
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
      const patches = calls.filter(
        (call) => call.path === '/forms/fabric' && call.method === 'PATCH',
      )
      assert.deepEqual(
        patches.map((call) => call.body.version),
        [3, 4],
      )
    },
  )
  await testCase(
    'lost response to a committed save reconciles without replay',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English').fill('Committed title')
      state.fail = 'committed'
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
      assert.equal(
        calls.filter((call) => call.path === '/forms/fabric' && call.method === 'PATCH').length,
        1,
      )
    },
  )
  await testCase(
    'uncertain uncommitted save preserves edits until compared',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English').fill('Uncertain title')
      state.fail = 'uncommitted'
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.getByText('Review the changed record', { exact: true }).waitFor()
      assert.equal(await page.getByLabel('Title · English').inputValue(), 'Uncertain title')
      assert.equal(
        calls.filter((call) => call.path === '/forms/fabric' && call.method === 'PATCH').length,
        1,
      )
    },
  )
  await testCase(
    '429 preserves edits and prevents an early write',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English').fill('Rate-limited title')
      state.fail = 'rate'
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.getByText('Too many attempts. Wait before trying again.').waitFor()
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      assert.equal(
        calls.filter((call) => call.path === '/forms/fabric' && call.method === 'PATCH').length,
        1,
      )
      assert.equal(await page.getByLabel('Title · English').inputValue(), 'Rate-limited title')
      await page.waitForTimeout(1100)
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
    },
  )
  await testCase(
    'expired mutation session refreshes without automatically replaying',
    async ({ page, state, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English').fill('Session-safe edit')
      state.mutation401 = true
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.getByText('Your session was renewed. Review your edits and save again.').waitFor()
      assert.equal(
        calls.filter((call) => call.path === '/forms/fabric' && call.method === 'PATCH').length,
        1,
      )
      assert.equal(await page.getByLabel('Title · English').inputValue(), 'Session-safe edit')
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
    },
  )
  await testCase(
    'profile edits use same-store self endpoint and only changed fields',
    async ({ page, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/profile')
      await page.getByLabel('Name', { exact: true }).fill('Updated staff')
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
      const call = calls.find((call) => call.path === '/users/me' && call.method === 'PATCH')
      assert.equal(call.fullPath, '/api/v1/b2b/users/me')
      assert.deepEqual(call.body, { name: 'Updated staff' })
    },
    'moderator',
  )
  await testCase(
    'native product upload uses raw bytes and current target version',
    async ({ page, calls }) => {
      await page.goto(`http://127.0.0.1:5294/en/dashboard/products/${id(200)}`)
      await page
        .getByLabel('Upload image', { exact: true })
        .setInputFiles(resolve('shared/assets/images/offer-logo.webp'))
      await page.locator('.staff-gallery-editor img').nth(1).waitFor()
      await page.getByRole('button', { name: 'Save changes', exact: true }).click()
      await page.locator('.feedback--success').getByText('Changes saved', { exact: true }).waitFor()
      const upload = calls.find((call) => call.path === `/media/product/${id(200)}`)
      const blobs = await page.evaluate(() => window.__blobUploads)
      assert.equal(blobs[0].length, bytes.length)
      assert.equal(blobs[0].type, 'image/webp')
      // WebKit's interception API omits Blob bodies; inspect its fetch boundary above.
      if (engine === 'chromium') assert.equal(upload.rawBytes, bytes.length)
      assert.equal(upload.type, 'image/webp')
      const patch = calls.find(
        (call) => call.path === `/wholesale/products/${id(200)}` && call.method === 'PATCH',
      )
      assert.equal(patch.body.version, 0)
      assert.equal(patch.body.imageIds.length, 2)
      assert.equal(
        calls.some((call) => call.fullPath.includes('/b2c/')),
        false,
      )
    },
  )
  await testCase(
    'super-admin protected account and reference-blocked deletion',
    async ({ page }) => {
      await page.goto(`http://127.0.0.1:5294/en/dashboard/accounts/${id(3003)}`)
      await page.getByText('Protected account · view only').waitFor()
      assert.equal(await page.getByRole('button', { name: /Delete account/ }).count(), 0)
      await page.goto(`http://127.0.0.1:5294/en/dashboard/products/${id(200)}`)
      await page.getByRole('button', { name: 'Delete product', exact: true }).click()
      await page.getByRole('button', { name: 'Confirm deletion', exact: true }).click()
      await page.getByText('WHOLESALE_REFERENCED', { exact: false }).first().waitFor()
      assert.equal(await page.getByRole('dialog').isVisible(), true)
    },
    'superAdmin',
  )
  await testCase(
    'handover requires a confirmed target and clears the acting session',
    async ({ page, calls }) => {
      await page.goto(`http://127.0.0.1:5294/en/dashboard/accounts/${id(3000)}`)
      await page
        .getByRole('button', {
          name: 'Transfer super-admin ownership to this account',
          exact: true,
        })
        .click()
      assert.equal(calls.filter((call) => call.path === '/auth/super-admin/handover').length, 0)
      await page.getByRole('button', { name: 'Confirm ownership transfer', exact: true }).click()
      await page.waitForURL(/\/account\/login$/)
      const transfer = calls.find((call) => call.path === '/auth/super-admin/handover')
      assert.equal(transfer.fullPath, '/api/v1/admin/b2b/auth/super-admin/handover')
      assert.deepEqual(transfer.body, { userId: id(3000) })
      assert.equal(await page.locator('.dashboard-sidebar').count(), 0)
    },
    'superAdmin',
  )
  await testCase(
    'cancelled dirty logout keeps the session and sends no logout request',
    async ({ page, calls }) => {
      await page.goto('http://127.0.0.1:5294/en/dashboard/forms/fabric')
      await page.getByLabel('Title · English', { exact: true }).fill('Unsaved before logout')
      await page.getByText('Unsaved changes', { exact: true }).waitFor()
      page.removeAllListeners('dialog')
      page.on('dialog', (dialog) => dialog.dismiss())
      await page
        .locator('.dashboard-sidebar')
        .getByRole('button', { name: 'Logout', exact: true })
        .click()
      assert.equal(
        calls.some((call) => call.path === '/auth/logout'),
        false,
      )
      assert.equal(
        await page.getByLabel('Title · English', { exact: true }).inputValue(),
        'Unsaved before logout',
      )
      page.removeAllListeners('dialog')
      page.on('dialog', (dialog) => dialog.accept())
      await page
        .locator('.dashboard-sidebar')
        .getByRole('button', { name: 'Logout', exact: true })
        .click()
      await page.locator('.staff-access input[type=email]').waitFor()
      assert.equal(calls.filter((call) => call.path === '/auth/logout').length, 1)
    },
  )
  await testCase(
    'cancelled dirty handover keeps edits before any ownership mutation',
    async ({ page, calls }) => {
      await page.goto(`http://127.0.0.1:5294/en/dashboard/accounts/${id(3000)}`)
      await page
        .locator('.staff-editor')
        .getByLabel('Name', { exact: true })
        .fill('Unsaved target name')
      await page
        .getByRole('button', {
          name: 'Transfer super-admin ownership to this account',
          exact: true,
        })
        .click()
      page.removeAllListeners('dialog')
      page.on('dialog', (dialog) => dialog.dismiss())
      await page.getByRole('button', { name: 'Confirm ownership transfer', exact: true }).click()
      assert.equal(
        calls.some((call) => call.path === '/auth/super-admin/handover'),
        false,
      )
      assert.equal(
        await page.locator('.staff-editor').getByLabel('Name', { exact: true }).inputValue(),
        'Unsaved target name',
      )
      page.removeAllListeners('dialog')
      page.on('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Confirm ownership transfer', exact: true }).click()
      await page.waitForURL(/\/account\/login$/)
      assert.equal(calls.filter((call) => call.path === '/auth/super-admin/handover').length, 1)
    },
    'superAdmin',
  )
  await testCase(
    'late private response cannot return after cross-tab logout',
    async ({ page, state }) => {
      state.hold = `/leads/${id(2002)}`
      await page.goto(`http://127.0.0.1:5294/en/dashboard/requests/${id(2002)}`)
      await page.waitForFunction(() =>
        document.querySelector('.workspace-content [aria-busy=true]'),
      )
      await page.evaluate(() => {
        const channel = new BroadcastChannel('narmer:b2b:session')
        channel.postMessage({ type: 'clear' })
        setTimeout(() => channel.close(), 100)
      })
      await page.locator('.staff-access input[type=email]').waitFor()
      state.release?.()
      await page.waitForTimeout(150)
      assert.equal(await page.getByRole('img', { name: 'Private request reference' }).count(), 0)
      assert.equal(await page.getByText('Example buyer 3', { exact: true }).count(), 0)
    },
    'moderator',
  )
  await testCase('live admin cannot create an account', async ({ page, calls }) => {
    await page.goto('http://127.0.0.1:5294/en/dashboard/accounts', { waitUntil: 'networkidle' })
    await page.getByRole('table').waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Create staff account', exact: true }).count(),
      0,
    )
    assert.equal(
      calls.some((call) => call.method === 'POST' && call.path === '/users'),
      false,
    )
  })
  await browser.close()
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify(
    { checks, failures, mode: 'All API requests intercepted; no backend or provider reached.' },
    null,
    2,
  ),
)
assert.equal(failures.length, 0, JSON.stringify(failures))
console.log(`${checks.length} Phase 3 contract and recovery cases passed`)
