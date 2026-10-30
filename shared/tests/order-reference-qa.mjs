import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { staffOrderFixtureRows } from '../../B2C-Website/src/features/dashboard/order-fixtures.js'
import { createReportsFixture } from '../../B2C-Website/src/features/reports/fixtures.js'
import { retailHomepage } from '../../B2C-Website/src/features/shop/fixtures.js'

const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/order-reference')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const origin = process.env.NARMER_ORDER_QA_ORIGIN || 'http://127.0.0.1:5295'
const results = []
try {
  for (const language of ['en', 'ar']) {
    for (const role of ['admin', 'user']) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      })
      try {
        const page = await context.newPage(),
          errors = [],
          calls = []
        const user = { id: '000000000000000000009000', store: 'b2c', role, name: 'Current staff' }
        const rows = staffOrderFixtureRows()
        delete rows[2].orderNumber
        rows[0].history.push(
          {
            status: 'accepted',
            at: rows[0].createdAt,
            actorId: '000000000000000000000070',
            actor: { name: '<Saved Staff>', role: 'moderator' },
          },
          {
            status: 'canceled',
            at: rows[0].createdAt,
            actorId: '000000000000000000000071',
            actor: null,
          },
        )
        const reports = createReportsFixture(rows, [])
        page.on('pageerror', (error) => errors.push(error.message))
        page.setDefaultTimeout(12000)
        await context.route('https://**/*', (route) => route.abort())
        await context.route('**/api/v1/**', async (route) => {
          const request = route.request(),
            url = new URL(request.url())
          const path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2c/, '')
          calls.push(url.pathname)
          let data
          if (path === '/auth/refresh')
            data = { user, accessToken: 'local-qa-token', expiresIn: 900 }
          else if (path === '/users/me') data = user
          else if (path === '/categories') data = []
          else if (path === '/homepage') data = retailHomepage(language, {})
          else if (path === '/site-settings') data = {}
          else if (path === '/notifications/unread-count') data = { unreadCount: 0 }
          else if (path.startsWith('/reports/'))
            data = await reports(path + url.search, { language })
          else if (path === '/orders')
            data = { items: rows, pagination: { page: 1, pages: 1, total: rows.length, limit: 20 } }
          else if (path.startsWith('/orders/'))
            data = rows.find((row) => row.id === path.split('/').at(-1))
          else if (path === '/cart') data = { items: [], itemCount: 0 }
          else data = { items: [], pagination: { page: 1, pages: 0, total: 0, limit: 20 } }
          if (role === 'user' && data) {
            data = structuredClone(data)
            for (const order of data.items || [data])
              if (order.history)
                order.history = order.history.map(({ status, at }) => ({ status, at }))
          }
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ success: true, code: 'OK', data }),
          })
        })
        const base = `${origin}/${language}`
        if (role === 'admin') {
          await page.goto(`${base}/dashboard/orders`, { waitUntil: 'networkidle' })
          const table = page.locator('.staff-table')
          assert.ok((await table.innerText()).includes(rows[0].orderNumber))
          assert.ok((await table.innerText()).includes(rows[1].id))
          assert.ok((await table.innerText()).includes(rows[2].id))
          const refreshCount = calls.filter((path) => path.endsWith('/auth/refresh')).length
          assert.equal(refreshCount, 1)
          await page.locator(`a[href="/${language}/dashboard/orders/${rows[0].id}"]`).click()
          await page
            .getByRole('columnheader', { name: language === 'ar' ? 'بواسطة' : 'By', exact: true })
            .waitFor()
          assert.ok((await page.locator('main').innerText()).includes(rows[0].orderNumber))
          assert.ok(
            (await page.locator('main').innerText()).includes(
              language === 'ar' ? 'مشرف: <Saved Staff>' : 'Moderator: <Saved Staff>',
            ),
          )
          assert.ok(
            (await page.locator('main').innerText()).includes(
              language === 'ar' ? 'بيانات الموظف غير متاحة' : 'Staff member unavailable',
            ),
          )
          assert.ok(!(await page.locator('main').innerText()).includes('000000000000000000000070'))
          assert.equal(calls.filter((path) => path.endsWith('/auth/refresh')).length, refreshCount)
          await page.screenshot({ path: resolve(output, `${language}-staff.png`), fullPage: true })
          await page.setViewportSize({ width: 390, height: 844 })
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({
            path: resolve(output, `${language}-staff-mobile.png`),
            fullPage: true,
          })
          await page.setViewportSize({ width: 1440, height: 1000 })
          await page.goto(`${base}/dashboard/overview`, { waitUntil: 'networkidle' })
          assert.ok(
            (await page.locator('.staff-table').last().innerText()).includes(rows[0].orderNumber),
          )
        } else {
          await page.goto(`${base}/orders`, { waitUntil: 'networkidle' })
          await page.locator('.order-history-card').first().waitFor()
          assert.ok(
            (await page.locator('.order-history-list').innerText()).includes(rows[0].orderNumber),
          )
          assert.ok((await page.locator('.order-history-list').innerText()).includes(rows[1].id))
          assert.equal(await page.locator(`a[href="/${language}/orders/${rows[0].id}"]`).count(), 1)
          for (const path of [
            `orders/${rows[0].id}`,
            `orders/${rows[0].id}/receipt`,
            `checkout/received/${rows[0].id}`,
            `track/${rows[0].id}#token=local-test-tracking-key`,
          ]) {
            await page.goto(`${base}/${path}`, { waitUntil: 'networkidle' })
            await page.locator('.order-reference').waitFor()
            assert.ok(
              (await page.locator('.order-reference').innerText()).includes(rows[0].orderNumber),
            )
            assert.ok(!(await page.locator('main').innerText()).includes('Saved Staff'))
          }
          await page.screenshot({
            path: resolve(output, `${language}-tracking.png`),
            fullPage: true,
          })
        }
        assert.ok(calls.every((path) => !path.includes('NRM-')))
        assert.deepEqual(errors, [])
        results.push({ language, role, passed: true })
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results))
