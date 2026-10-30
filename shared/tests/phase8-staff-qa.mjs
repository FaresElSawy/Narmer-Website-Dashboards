import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createStaffContentFixture } from '../../B2C-Website/src/features/dashboard/staff-fixtures.js'
import { createStaffFixture } from '../../B2B-Website/src/features/dashboard/fixtures.js'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/phase8/staff'),
  results = []
await mkdir(output, { recursive: true })
const browser = await engines.chromium.launch({ headless: true })
async function setup(store, role = 'superAdmin', fault = null) {
  const port = store === 'b2c' ? 5295 : 5294,
    origin = 'http://127.0.0.1:' + port,
    user = {
      id: '000000000000000000009000',
      name: 'Local QA staff',
      email: 'local@example.test',
      phone: '+201001234567',
      store,
      role,
      emailVerified: true,
    },
    context = await browser.newContext({
      viewport: { width: 1440, height: 956 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage(),
    handler =
      store === 'b2c'
        ? createStaffContentFixture()
        : createStaffFixture(createReviewInquiry({ images: {} }).staffData),
    calls = [],
    errors = []
  let ended = false
  page.on('pageerror', (error) => errors.push(error.message))
  page.setDefaultTimeout(10000)
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2[bc]/, ''),
      method = req.method(),
      headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-language',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Content-Type': 'application/json',
      }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    const respond = (status, data, code = 'OK') =>
      route.fulfill({
        status,
        headers,
        body: JSON.stringify(
          status < 400
            ? { success: true, code, data }
            : { success: false, code, errors: [], message: code },
        ),
      })
    if (path === '/auth/refresh')
      return ended
        ? respond(401, null, 'UNAUTHORIZED')
        : respond(200, { user, accessToken: 'local-intercepted-token', expiresIn: 900 })
    const body = req.postData() ? JSON.parse(req.postData()) : undefined
    calls.push({
      path: url.pathname,
      method,
      keys: Object.keys(body || {}),
      authenticated: Boolean(req.headers().authorization),
    })
    if (path === '/auth/change-password' && method === 'POST') {
      assert.deepEqual(Object.keys(body).sort(), ['currentPassword', 'newPassword'])
      if (fault === 'current') return respond(400, null, 'INVALID_CURRENT_PASSWORD')
      ended = true
      if (fault === 'malformed') return route.fulfill({ status: 200, headers, body: '{' })
      return respond(200, null, 'PASSWORD_CHANGED')
    }
    try {
      const data = await handler(path + url.search, { method, body, user, language: 'en' })
      if (path === '/users' && method === 'POST' && fault === 'dto')
        return respond(201, { ...data, store: store === 'b2b' ? 'b2c' : 'b2b' })
      if (path === '/users' && method === 'POST' && fault === 'lost') return route.abort('failed')
      return respond(method === 'POST' ? 201 : 200, data)
    } catch (error) {
      return respond(error.status || 404, null, error.code || 'NOT_FOUND')
    }
  })
  return { context, page, origin, calls, errors }
}
async function run(store, name, role, fault, action) {
  const current = await setup(store, role, fault)
  try {
    await action(current)
    assert.deepEqual(current.errors, [])
    results.push({ store, name, passed: true })
  } finally {
    await current.context.close()
  }
}
try {
  for (const store of ['b2b', 'b2c']) {
    await run(store, 'admin-cannot-create', 'admin', null, async ({ page, origin }) => {
      await page.goto(origin + '/en/dashboard/accounts', { waitUntil: 'networkidle' })
      assert.equal(
        await page.getByRole('button', { name: 'Create staff account', exact: true }).count(),
        0,
      )
    })
    for (const fault of [null, 'lost', 'dto']) {
      await run(
        store,
        fault ? 'uncertain-create-no-replay-' + fault : 'create-handoff-secret-clear',
        'superAdmin',
        fault,
        async ({ page, origin, calls }) => {
          await page.goto(origin + '/en/dashboard/accounts', { waitUntil: 'networkidle' })
          await page.getByRole('button', { name: 'Create staff account', exact: true }).click()
          const dialog = page.getByRole('dialog')
          for (const [label, value] of [
            ['Name', 'Disposable local test'],
            ['Email', 'phase8@example.test'],
            ['Phone', '+201001234567'],
            ['Initial password', 'LocalSecretCanary8'],
          ])
            await dialog.getByLabel(label, { exact: true }).fill(value)
          await dialog.getByRole('button', { name: 'Create account', exact: true }).click()
          if (fault) {
            await dialog.getByText('The account may have been created.', { exact: false }).waitFor()
            assert.ok(
              await dialog
                .getByRole('button', { name: 'Create account', exact: true })
                .isDisabled(),
            )
            assert.equal(
              await dialog.getByLabel('Initial password', { exact: true }).inputValue(),
              '',
            )
          } else {
            await dialog.getByRole('button', { name: 'Handoff complete' }).waitFor()
            page.once('dialog', (d) => d.dismiss())
            await page.keyboard.press('Escape')
            assert.ok(await dialog.isVisible())
            assert.equal(
              await dialog.getByLabel('Initial password', { exact: true }).inputValue(),
              'LocalSecretCanary8',
            )
            await dialog.getByRole('button', { name: 'Handoff complete' }).click()
            await dialog.waitFor({ state: 'hidden' })
            await page.getByRole('button', { name: 'Create staff account', exact: true }).click()
            assert.equal(
              await page
                .getByRole('dialog')
                .getByLabel('Initial password', { exact: true })
                .inputValue(),
              '',
            )
          }
          const writes = calls.filter(
            (call) => call.method === 'POST' && call.path.endsWith('/users'),
          )
          assert.equal(writes.length, 1)
          assert.equal(writes[0].path, '/api/v1/admin/' + store + '/users')
          assert.equal(writes[0].authenticated, true)
          assert.deepEqual(writes[0].keys.sort(), ['email', 'name', 'password', 'phone', 'role'])
          assert.equal(
            await page.evaluate(() =>
              JSON.stringify([Object.values(localStorage), Object.values(sessionStorage)]).includes(
                'LocalSecretCanary8',
              ),
            ),
            false,
          )
        },
      )
    }
    for (const fault of [null, 'current', 'malformed']) {
      await run(
        store,
        'own-password-' + (fault || 'success'),
        'moderator',
        fault,
        async ({ page, origin, calls }) => {
          await page.goto(origin + '/en/dashboard/profile', { waitUntil: 'networkidle' })
          for (const [label, value] of [
            ['Current password', 'LocalCurrent8'],
            ['New password', 'LocalNext8'],
            ['Confirm new password', 'LocalNext8'],
          ])
            await page.getByLabel(label, { exact: true }).fill(value)
          await page.getByRole('button', { name: 'Change password', exact: true }).click()
          if (fault === 'current') {
            await page.locator('.feedback--error').waitFor()
            assert.ok(page.url().endsWith('/dashboard/profile'))
            assert.equal(
              await page.getByLabel('Current password', { exact: true }).inputValue(),
              'LocalCurrent8',
            )
          } else await page.waitForURL('**/dashboard/login')
          const writes = calls.filter((call) => call.path.endsWith('/auth/change-password'))
          assert.equal(writes.length, 1)
          assert.equal(writes[0].path, '/api/v1/' + store + '/auth/change-password')
        },
      )
    }
  }
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(
  results.length +
    ' intercepted staff permission, handoff and recovery checks passed; no external writes',
)
