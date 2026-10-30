import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createReportsFixture } from '../../B2C-Website/src/features/reports/fixtures.js'
import {
  staffOrderFixtureRows,
  createStaffOrdersFixture,
} from '../../B2C-Website/src/features/dashboard/order-fixtures.js'
const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  browser = await chromium.launch({ headless: true }),
  output = resolve('output/playwright/phase7'),
  results = [],
  origin = 'http://127.0.0.1:5298'
await mkdir(output, { recursive: true })
async function setup(role = 'admin') {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage(),
    calls = [],
    errors = []
  const user = {
      id: '000000000000000000009000',
      name: 'QA staff',
      email: 'staff@example.test',
      phone: '+201001234567',
      role,
      store: 'b2c',
      emailVerified: true,
    },
    state = { fault: null, refreshRole: null },
    rows = staffOrderFixtureRows()
  rows.forEach((row, index) => {
    row.createdAt = `2026-10-${20 + index}T12:00:00.000Z`
    if (row.payment.verifiedAt) row.payment.verifiedAt = row.createdAt
    if (row.payment.cashCollectedAt) row.payment.cashCollectedAt = row.createdAt
    if (row.refund) row.refund.at = row.createdAt
  })
  const reports = createReportsFixture(rows, []),
    orders = createStaffOrdersFixture(rows)
  page.setDefaultTimeout(10000)
  page.on('pageerror', (error) => errors.push(error.message))
  await context.route('https://**/*', (route) => route.abort())
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method(),
      path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2c/, ''),
      headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-language',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Access-Control-Expose-Headers': 'Retry-After,X-Request-Id',
        'Content-Type': 'application/json',
      }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    calls.push({ path, method, query: url.search, auth: req.headers().authorization })
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
    if (path === '/auth/refresh') {
      if (state.refreshRole && calls.some((call) => call.path.startsWith('/reports/')))
        user.role = state.refreshRole
      return respond(200, { user, accessToken: 'phase7-test', expiresIn: 900 })
    }
    if (path === '/notifications/unread-count') return respond(200, { unreadCount: 0 })
    if (path.startsWith('/reports/')) {
      const fault = state.fault
      state.fault = null
      if (fault === 'unauthorized') return respond(401, 'UNAUTHORIZED')
      if (fault === 'forbidden') return respond(403, 'FORBIDDEN')
      if (fault === 'rate') return respond(429, 'TOO_MANY_REQUESTS', { 'Retry-After': '2' })
      if (fault === 'REPORT_BUSY' || fault === 'REPORT_TOTAL_UNAVAILABLE')
        return respond(503, fault)
      if (fault === 'network') return route.abort('failed')
      const data = await reports(path + url.search)
      if (fault === 'unsafe') data.metrics.placedOrderAmount = Number.MAX_SAFE_INTEGER + 1
      if (fault === 'inconsistent') data.orderAmounts.total++
      if (fault === 'stale') await new Promise((done) => setTimeout(done, 800))
      return respond(200, data).catch(() => {})
    }
    if (path.startsWith('/orders'))
      return respond(
        200,
        await orders(path + url.search, {
          method,
          body: req.postData() ? JSON.parse(req.postData()) : undefined,
          user,
        }),
      )
    return respond(404, 'NOT_FOUND')
  })
  return { page, context, calls, state, rows, errors }
}
const reportCalls = (calls) => calls.filter((call) => call.path.startsWith('/reports/'))
const visit = (page, route = 'overview', query = '') =>
  page.goto(
    `${origin}/en/dashboard/${route}?from=2026-10-01&through=2026-10-27&interval=day${query}`,
    { waitUntil: 'networkidle' },
  )
async function run(name, action, role) {
  const current = await setup(role)
  try {
    await action(current)
    assert.deepEqual(current.errors, [])
    results.push({ name, passed: true })
  } catch (error) {
    console.error(name, error.message)
    console.error(
      (
        await current.page
          .locator('body')
          .innerText({ timeout: 3000 })
          .catch(() => '')
      ).slice(0, 1800),
    )
    await current.page
      .screenshot({ path: resolve(output, `${name}-failure.png`), fullPage: true, timeout: 3000 })
      .catch(() => {})
    throw error
  } finally {
    await current.context.close()
  }
}
try {
  await run('sunday-week-uses-exact-daily-source', async ({ page, calls }) => {
    await visit(page)
    await page.locator('.report-footnotes').waitFor()
    await page.getByRole('combobox', { name: 'Interval', exact: true }).click()
    await page.getByRole('option', { name: 'Week · Sunday start', exact: true }).click()
    await page.getByRole('button', { name: 'Apply period', exact: true }).click()
    await page.waitForURL('**/*interval=week*')
    await page.locator('.report-data summary').click()
    assert.match(await page.locator('.report-data tbody tr').first().innerText(), /27 Sept 2026/)
    assert.equal(reportCalls(calls).length, 1)
    assert.equal(new URLSearchParams(reportCalls(calls)[0].query).get('interval'), 'day')
    assert.equal(
      await page.locator('.report-metric').first().locator('strong').innerText(),
      'EGP 5,094.00',
    )
  })
  for (const fault of [
    'REPORT_BUSY',
    'REPORT_TOTAL_UNAVAILABLE',
    'network',
    'unsafe',
    'inconsistent',
  ])
    await run(`error-${fault}`, async ({ page, state, calls }) => {
      state.fault = fault
      await visit(page, fault === 'inconsistent' ? 'finance' : 'overview')
      await page.locator('.report-failure').waitFor()
      assert.equal(await page.locator('.report-metric').count(), 0)
      assert.equal(reportCalls(calls).length, 1)
      assert.equal(await page.locator('.report-date-field').count(), 2)
      await page.getByRole('button', { name: 'Try again', exact: true }).click()
      await page.locator('.report-footnotes').waitFor()
      assert.equal(reportCalls(calls).length, 2)
    })
  await run('rate-budget-manual-retry', async ({ page, state, calls }) => {
    state.fault = 'rate'
    await visit(page)
    await page.locator('.report-failure').waitFor()
    assert(await page.getByRole('button', { name: /Retry in/ }).isDisabled())
    assert.equal(reportCalls(calls).length, 1)
    await page.locator('.dashboard-sidebar a[href$="/orders"]').click()
    await page.locator('.staff-table').waitFor()
    assert(calls.some((call) => call.path === '/orders'))
    await page.goBack({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Try again', exact: true }).waitFor()
    assert.equal(reportCalls(calls).length, 1)
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await page.locator('.report-footnotes').waitFor()
    assert.equal(reportCalls(calls).length, 2)
  })
  await run('401-refresh-once', async ({ page, state, calls }) => {
    state.fault = 'unauthorized'
    await visit(page)
    await page.locator('.report-footnotes').waitFor()
    assert.equal(reportCalls(calls).length, 2)
    assert.equal(calls.filter((call) => call.path === '/auth/refresh').length, 2)
    assert(reportCalls(calls).every((call) => call.auth === 'Bearer phase7-test'))
  })
  await run('403-refresh-identity-hide-reports', async ({ page, state, calls }) => {
    state.fault = 'forbidden'
    state.refreshRole = 'moderator'
    await visit(page)
    await page.waitForURL('**/dashboard/orders')
    assert.equal(reportCalls(calls).length, 1)
    assert.equal(await page.locator('.report-metric').count(), 0)
    assert.equal(await page.locator('a[href$="/finance"]').count(), 0)
  })
  await run(
    'moderator-direct-report-denied',
    async ({ page, calls }) => {
      await visit(page, 'finance')
      await page.waitForURL('**/dashboard/orders')
      assert.equal(reportCalls(calls).length, 0)
    },
    'moderator',
  )
  await run('stale-period-response-discarded', async ({ page, state, calls }) => {
    state.fault = 'stale'
    await page.goto(
      `${origin}/en/dashboard/overview?from=2026-10-01&through=2026-10-27&interval=day`,
      { waitUntil: 'domcontentloaded' },
    )
    await page.locator('.report-date-field button').first().click()
    await page.locator('.report-calendar:popover-open [data-date="2026-10-26"]').click()
    await page.getByRole('button', { name: 'Apply period', exact: true }).click()
    await page.locator('.report-footnotes').waitFor()
    await page.waitForTimeout(900)
    assert.equal(await page.locator('.report-metric').nth(1).locator('strong').innerText(), '0')
    assert.equal(reportCalls(calls).length, 2)
    assert(reportCalls(calls).at(-1).query.includes('2026-10-25T21'))
  })
  await run('return-invalidates-cached-ranking', async ({ page, calls }) => {
    await visit(page, 'performance')
    await page.locator('.report-footnotes').waitFor()
    assert.equal(await page.locator('.report-metric').first().locator('strong').innerText(), '1')
    await page.locator('.dashboard-sidebar a[href$="/orders"]').click()
    await page.getByRole('link', { name: 'Review order', exact: true }).nth(3).click()
    await page.getByRole('button', { name: 'Returned', exact: true }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirm change', exact: true })
      .click()
    await page.locator('.staff-status--returned').waitFor()
    await page.locator('.dashboard-sidebar a[href$="/performance"]').click()
    await page.locator('.report-footnotes').waitFor()
    assert.equal(await page.locator('.report-metric').first().locator('strong').innerText(), '0')
    assert.equal(reportCalls(calls).length, 2)
    assert.equal(
      calls.filter((call) => call.method === 'PATCH' && call.path.endsWith('/status')).length,
      1,
    )
  })
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'recovery-results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} intercepted report recovery / authorization checks passed`)
