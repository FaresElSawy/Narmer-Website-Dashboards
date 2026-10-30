import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase6-layout'),
  results = []
await mkdir(output, { recursive: true })
const routes = [
  'orders',
  'orders/000000000000000000002ee0',
  'products',
  'products/000000000000000000000064',
  'products/new',
  'categories',
  'categories/new',
  'promotions',
  'shipping',
  'size-charts',
  'size-charts/new',
  'homepage',
  'accounts',
  'notifications',
  'profile',
  'settings',
]
const smoke = process.env.NARMER_PHASE6_SMOKE === '1'
for (const engine of smoke ? ['chromium'] : ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of smoke ? ['en'] : ['en', 'ar'])
      for (const width of smoke
        ? [1440]
        : engine === 'chromium'
          ? [1440, 768, 440, 360, 320]
          : [1440, 360]) {
        const context = await browser.newContext({
          viewport: { width, height: 956 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          errors = []
        page.on('pageerror', (e) => errors.push(e.message))
        page.on('dialog', (dialog) => dialog.accept())
        page.setDefaultTimeout(10000)
        await context.route('https://**/*', (route) => route.abort())
        try {
          for (const route of routes) {
            const id = `${engine}-${language}-${width}-${route.replaceAll('/', '-')}`
            await page.goto(
              `${process.env.NARMER_REVIEW_URL || 'http://127.0.0.1:5283'}/${language}/dashboard/${route}`,
              { waitUntil: 'networkidle' },
            )
            await page.evaluate(() => document.fonts.ready)
            await page
              .locator('#workspace h1')
              .waitFor()
              .catch(async (error) => {
                await page.screenshot({
                  path: resolve(output, `${id}-failure.png`),
                  fullPage: true,
                })
                throw new Error(
                  `${id}: ${error.message}; ${await page.locator('body').innerText()}`,
                )
              })
            await page.waitForFunction(() => !document.querySelector('#workspace .skeleton'))
            assert.deepEqual(errors, [], id)
            assert.equal(
              await page.locator('#workspace .feedback--error').count(),
              0,
              `${id}: failed dashboard read`,
            )
            const issues = await page.evaluate(() => {
              const problems = []
              if (document.documentElement.scrollWidth > innerWidth + 1)
                problems.push('page overflow')
              for (const el of document.querySelectorAll('#workspace select'))
                if (
                  el.getBoundingClientRect().width > 2 &&
                  getComputedStyle(el).opacity !== '0' &&
                  getComputedStyle(el).visibility !== 'hidden'
                )
                  problems.push('native select visible')
              for (const el of document.querySelectorAll(
                '#workspace input:not([type=hidden]), #workspace textarea, #workspace .narmer-select-trigger',
              )) {
                const b = el.getBoundingClientRect()
                if (b.width > 2 && b.height > 2 && (b.left < -1 || b.right > innerWidth + 1))
                  problems.push('control overflow')
              }
              return problems
            })
            if (
              issues.length ||
              (width === 360 && engine === 'chromium') ||
              (width === 1440 && language === 'en' && engine === 'chromium')
            )
              await page.screenshot({ path: resolve(output, `${id}.png`), fullPage: true })
            assert.deepEqual(issues, [], id)
            results.push({ id, passed: true })
          }
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} Phase 6 dashboard layout cases passed`)
