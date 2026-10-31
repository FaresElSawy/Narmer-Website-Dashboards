import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createStaffFixture } from '../../B2B-Website/src/features/dashboard/fixtures.js'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'

const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/account-staff-request')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = [],
  origin = 'http://127.0.0.1:5296'
try {
  for (const role of ['admin', 'moderator', 'superAdmin'])
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 956 },
          reducedMotion: 'reduce',
        })
        try {
          const page = await context.newPage(),
            calls = [],
            errors = []
          const user = {
            id: '000000000000000000009000',
            store: 'b2b',
            role,
            name: 'Staff review',
            email: 'staff@example.test',
            phone: '+201001234567',
          }
          const fixture = createStaffFixture(createReviewInquiry({ images: {} }).staffData)
          page.on('pageerror', (error) => errors.push(error.message))
          await context.route('https://**/*', (route) => route.abort())
          await context.route('**/api/v1/**', async (route) => {
            const request = route.request(),
              url = new URL(request.url())
            const path = url.pathname.replace(/^\/api\/v1\/(?:admin\/)?b2b/, '')
            calls.push(url.pathname)
            let data
            if (path === '/auth/refresh')
              data = { user, accessToken: 'local-staff-token', expiresIn: 900 }
            else if (path === '/users/me') data = user
            else if (url.pathname.includes('/admin/'))
              data = await fixture(path + url.search, { user, language })
            else if (path === '/homepage') data = { store: 'b2b', slots: [] }
            else if (path === '/site-settings') data = { store: 'b2b', social: {} }
            else data = { items: [] }
            await route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify({ success: true, code: 'OK', data }),
            })
          })
          await page.goto(`${origin}/${language}/account`, { waitUntil: 'networkidle' })
          const link = page.locator(`.account-links a[href="/${language}/dashboard/requests"]`)
          await link.waitFor()
          assert.ok(
            (await link.innerText()).includes(
              language === 'ar' ? 'سجل الطلبات' : 'Request history',
            ),
          )
          assert.equal(
            await page.locator(`.account-links a[href="/${language}/requests"]`).count(),
            0,
          )
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          )
          await page.screenshot({
            path: resolve(output, `${role}-${language}-${width}.png`),
            fullPage: true,
          })
          await link.click()
          await page.waitForURL(`${origin}/${language}/dashboard/requests`)
          await page.locator('.staff-table').waitFor()
          assert.ok(calls.includes('/api/v1/admin/b2b/leads'))
          assert.equal(calls.includes('/api/v1/b2b/leads'), false)
          assert.deepEqual(errors, [])
          results.push({ role, language, width, passed: true })
        } finally {
          await context.close()
        }
      }
} finally {
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results))
