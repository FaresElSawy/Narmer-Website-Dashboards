import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const browser = await chromium.launch({ headless: true })
const errors = [],
  results = [],
  guarded = process.argv.includes('--guarded')
try {
  for (const [store, port] of [
    ['b2c', Number(process.env.NARMER_B2C_PORT || 5283)],
    ['b2b', Number(process.env.NARMER_B2B_PORT || 5284)],
  ]) {
    for (const language of ['en', 'ar']) {
      const url = `http://127.0.0.1:${port}/${language}/`
      const noJs = await browser.newContext({ javaScriptEnabled: false })
      const staticPage = await noJs.newPage()
      await staticPage.goto(url)
      assert.ok((await staticPage.locator('h1').innerText()).length > 5)
      assert.ok((await staticPage.title()).includes(language === 'ar' ? 'نارمر' : 'Narmer'))
      assert.equal(
        await staticPage.locator('html').getAttribute('dir'),
        language === 'ar' ? 'rtl' : 'ltr',
      )
      assert.equal(
        await staticPage.locator('meta[name="robots"]').getAttribute('content'),
        'noindex, nofollow',
      )
      await noJs.close()
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      page.on('pageerror', (error) => errors.push({ url: page.url(), message: error.message }))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push({ url: page.url(), message: message.text() })
      })
      const network = []
      page.on('request', (request) => network.push(request.url()))
      await page.addInitScript(() => {
        window.vitals = { cls: 0, lcp: 0, shifts: [] }
        new PerformanceObserver((list) =>
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              window.vitals.cls += entry.value
              window.vitals.shifts.push({
                value: entry.value,
                at: entry.startTime,
                path: location.pathname,
                fonts: document.fonts.status,
                main: document.querySelector('#main')?.getBoundingClientRect().toJSON(),
                sources: (entry.sources || []).map((source) => ({
                  tag: source.node?.tagName,
                  className:
                    typeof source.node?.className === 'string' ? source.node.className : '',
                  connected: source.node?.isConnected,
                  display:
                    source.node instanceof Element ? getComputedStyle(source.node).display : null,
                  actual:
                    source.node instanceof Element
                      ? source.node.getBoundingClientRect().toJSON()
                      : null,
                  previous: source.previousRect.toJSON(),
                  current: source.currentRect.toJSON(),
                })),
              })
            }
          }),
        ).observe({ type: 'layout-shift', buffered: true })
        new PerformanceObserver((list) => {
          window.vitals.lcp = list.getEntries().at(-1).startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      assert.equal(
        network.some((value) => /Dashboard-.*\.js|\/api\/v1\//.test(value)),
        false,
      )
      const initialLayout = await page.evaluate(() => ({
        cls: window.vitals.cls,
        scrollY,
        height: document.documentElement.scrollHeight,
      }))
      await page
        .getByRole('button', { name: language === 'ar' ? 'القائمة' : 'Menu', exact: true })
        .click()
      assert.equal(
        await page.locator('dialog[open]').count(),
        1,
        'Hydrated menu is not interactive',
      )
      await page.keyboard.press('Escape')
      const metrics = await page.evaluate(() => ({
        ...window.vitals,
        resourceBytes: performance
          .getEntriesByType('resource')
          .reduce((sum, entry) => sum + entry.transferSize, 0),
      }))
      metrics.initialLayout = initialLayout
      metrics.afterMenu = await page.evaluate(() => ({
        scrollY,
        height: document.documentElement.scrollHeight,
      }))
      if (store === 'b2c') assert.equal(await page.locator('.floating-cart').count(), 1)
      await page.goto(url.replace(/\/$/, ''), { waitUntil: 'networkidle' })
      if (store === 'b2c') assert.equal(await page.locator('.floating-cart').count(), 1)
      if (guarded) {
        await page.goto(url + 'dashboard', { waitUntil: 'networkidle' })
        assert.equal(await page.locator('.dashboard-sidebar').count(), 0)
        assert.equal(await page.getByRole('combobox').count(), 0)
        assert.match(
          await page.locator('main').innerText(),
          language === 'ar' ? /دخول الموظفين/ : /Staff sign in/,
        )
      }
      results.push({ store, language, staticHtml: true, hydration: true, guarded, metrics })
      await page.close()
    }
  }
} finally {
  await browser.close()
}
await writeFile(
  resolve(
    process.env.NARMER_QA_OUTPUT ||
      `output/playwright/phase-1/production-${guarded ? 'unconfigured' : 'review'}.json`,
  ),
  JSON.stringify({ results, errors }, null, 2),
)
console.log(JSON.stringify({ results, errors }, null, 2))
assert.equal(errors.length, 0)
