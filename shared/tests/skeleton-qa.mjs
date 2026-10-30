import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/skeletons')
await mkdir(output, { recursive: true })
const checks = []
const cases = [
  { name: 'account-session', port: 5294, path: 'account/login', hold: 'refresh', variant: 'form' },
  { name: 'account-route', port: 5294, path: 'account/login', hold: 'module', variant: 'form' },
  { name: 'b2b-dashboard', port: 5294, path: 'dashboard', hold: 'refresh', variant: 'content' },
  { name: 'b2c-dashboard', port: 5295, path: 'dashboard', hold: 'refresh', variant: 'content' },
  { name: 'questionnaire', port: 5294, path: 'request', hold: 'form', variant: 'form' },
  { name: 'offers', port: 5294, path: 'wholesale', hold: 'offers', variant: 'cards' },
  {
    name: 'offer-detail',
    port: 5294,
    path: 'wholesale/offers/0000000000000000000001f6',
    hold: 'offers',
    variant: 'product',
  },
]
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  for (const language of ['en', 'ar']) {
    for (const width of [1440, 390]) {
      for (const sample of cases) {
        const motion = language === 'en' && width === 1440 ? 'no-preference' : 'reduce'
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: motion,
        })
        const page = await context.newPage()
        page.setDefaultTimeout(12000)
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        let release
        const gate = new Promise((done) => (release = done))
        if (sample.hold === 'module')
          await context.route('**/*AccountRoutes.jsx*', async (route) => {
            await gate
            await route.continue()
          })
        // These controlled responses test pending/settled UI without using a real account or API write.
        await context.route('https://narmer-ecommerce.vercel.app/**', async (route) => {
          const path = new URL(route.request().url()).pathname
          if (
            (sample.hold === 'refresh' && path.endsWith('/auth/refresh')) ||
            (sample.hold === 'form' && path.includes('/forms/')) ||
            (sample.hold === 'offers' && path.includes('/wholesale/offers'))
          )
            await gate
          let status = 200,
            code = 'OK',
            data = null
          if (path.endsWith('/auth/refresh')) {
            status = 401
            code = 'UNAUTHORIZED'
          } else if (path.endsWith('/forms')) data = { items: [], supportedFieldTypes: [] }
          else if (path.includes('/forms/')) {
            status = 404
            code = 'FORM_NOT_FOUND'
          } else if (path.endsWith('/wholesale/offers'))
            data = { items: [], pagination: { page: 1, pages: 0, total: 0, limit: 100 } }
          else if (path.includes('/wholesale/offers/')) {
            status = 404
            code = 'WHOLESALE_OFFER_NOT_FOUND'
          }
          await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({
              success: status === 200,
              code,
              message: code,
              data,
              requestId: 'skeleton-ui-test',
            }),
          })
        })
        const id = `${engine}-${language}-${width}-${sample.name}`
        try {
          await page.goto(`http://127.0.0.1:${sample.port}/${language}/${sample.path}`)
          const skeleton =
            sample.hold === 'refresh'
              ? page.getByRole('status', {
                  name: language === 'ar' ? 'جارٍ استعادة الجلسة' : 'Restoring your session',
                })
              : page.locator(`.skeleton--${sample.variant}`).first()
          await skeleton.waitFor()
          await page.locator('.site-loader').waitFor({ state: 'hidden' })
          await skeleton.scrollIntoViewIfNeeded()
          assert.equal(await skeleton.getAttribute('role'), 'status', id)
          assert.equal(await skeleton.getAttribute('aria-busy'), 'true', id)
          const label = await skeleton.getAttribute('aria-label')
          assert.ok(language === 'ar' ? /[\u0600-\u06ff]/.test(label) : /[A-Za-z]/.test(label), id)
          assert.equal(await skeleton.innerText(), '', id)
          assert.equal(await skeleton.locator('input,button,a,[tabindex]').count(), 0, id)
          assert.equal(await skeleton.locator('[aria-hidden=true]').count(), 1, id)
          assert.equal(await page.locator('.spinner,.feedback--loading').count(), 0, id)
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            id,
          )
          const animation = await skeleton
            .locator('.skeleton-shapes')
            .evaluate((node) => getComputedStyle(node).animationName)
          assert.equal(animation, motion === 'reduce' ? 'none' : 'skeleton-pulse', id)
          if (sample.name === 'account-session' || sample.name === 'offer-detail')
            await page.screenshot({ path: resolve(output, `${id}.png`) })
          release()
          await skeleton.waitFor({ state: 'detached' })
          if (sample.name.startsWith('account'))
            await page.locator('.auth-panel input[type=email]').waitFor()
          else if (sample.name.endsWith('dashboard'))
            await page.locator('.staff-access input[type=email]').waitFor()
          else if (sample.name === 'questionnaire')
            await page
              .getByRole('status')
              .filter({
                hasText: /This questionnaire is currently unavailable|النموذج غير متاح حاليًا/,
              })
              .waitFor()
          else if (sample.name === 'offer-detail') await page.getByRole('alert').first().waitFor()
          else
            await page
              .getByRole('status')
              .filter({ hasText: /No offers available|لا توجد عروض/ })
              .waitFor()
          if (sample.name === 'offer-detail') {
            await page.evaluate(
              async (label) => {
                const urls = performance.getEntriesByType('resource').map((entry) => entry.name)
                const react = await import(urls.find((url) => url.includes('/react.js?')))
                const dom = await import(urls.find((url) => url.includes('/react-dom_client.js?')))
                const { createRoot } = dom.default || dom
                const { createElement } = react.default || react
                const { Feedback } = await import(
                  urls.find((url) => url.includes('/shared/ui/Primitives.jsx'))
                )
                const host = document.createElement('div')
                document.querySelector('main').append(host)
                createRoot(host).render(
                  createElement(Feedback, {
                    kind: 'loading',
                    skeleton: 'image',
                    title: label,
                  }),
                )
              },
              language === 'ar' ? 'جارٍ تحميل الصورة' : 'Loading private image',
            )
            const image = page.locator('.skeleton--image')
            await image.waitFor()
            const box = await image.locator('.skeleton-image').boundingBox()
            assert.ok(box.width > 0 && Math.abs(box.width / box.height - 1.08) < 0.01, id)
            assert.equal(await image.getAttribute('aria-busy'), 'true', id)
            await image.screenshot({ path: resolve(output, `${id}-image.png`) })
          }
          assert.deepEqual(errors, [], id)
          checks.push({ id, variant: sample.variant, motion, passed: true })
          await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
        } catch (error) {
          await page.screenshot({ path: resolve(output, `${id}-failure.png`) }).catch(() => {})
          throw new Error(`${id}: ${error.message}`, { cause: error })
        } finally {
          release()
          await context.close()
        }
      }
      console.log(`${engine} ${language} ${width}: 7 skeleton cases passed.`)
    }
  }
  await browser.close()
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(checks, null, 2))
console.log(`${checks.length} skeleton loading/lifecycle cases passed.`)
