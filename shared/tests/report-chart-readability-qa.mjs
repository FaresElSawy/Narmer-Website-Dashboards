import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/report-chart-readability'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of engine === 'chromium' ? [1920, 1440, 900, 390, 320] : [1440, 390]) {
        const context = await browser.newContext({
            viewport: { width, height: 1000 },
            reducedMotion: 'reduce',
            hasTouch: width < 500,
          }),
          page = await context.newPage(),
          errors = []
        page.setDefaultTimeout(12000)
        page.on('pageerror', (error) => errors.push(error.message))
        await context.route('https://**/*', (route) => route.abort())
        try {
          for (const route of ['overview', 'finance']) {
            const id = `${engine}-${language}-${width}-${route}`
            await page.goto(`http://127.0.0.1:5283/${language}/dashboard/${route}`, {
              waitUntil: 'networkidle',
            })
            await page.evaluate(() => document.fonts.ready)
            await page.locator('.report-footnotes').waitFor()
            assert.equal(await page.locator('.feedback--error').count(), 0, id)
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
              false,
              id,
            )
            const charts = page.locator('.report-chart')
            assert.equal(await charts.count(), route === 'finance' ? 4 : 1, id)
            const geometry = await charts.evaluateAll((nodes) =>
              nodes.map((node) => {
                const svg = node.querySelector(':scope > svg'),
                  text = svg.querySelector('text'),
                  matrix = text.getScreenCTM()
                return {
                  height: svg.getBoundingClientRect().height,
                  textPixels:
                    parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b),
                  lineCount: svg.querySelectorAll('.report-trend-line').length,
                  bars: svg.querySelectorAll('.report-bar').length,
                }
              }),
            )
            for (const item of geometry) {
              assert(Math.abs(item.height - 212) < 1, id)
              assert(
                item.textPixels >= 9.5 && item.textPixels <= 12,
                `${id}: scaled text ${item.textPixels}`,
              )
              assert.equal(item.lineCount, route === 'finance' ? 0 : 1)
              if (route === 'finance') assert(item.bars > 0)
            }
            if (route === 'overview') {
              const styles = await charts.locator('.report-trend-line').evaluate((node) => ({
                stroke: getComputedStyle(node).stroke,
                path: node.getAttribute('d'),
                dot: getComputedStyle(node.nextElementSibling).fill,
              }))
              assert.equal(styles.stroke, 'rgb(7, 59, 80)')
              assert.equal(styles.dot, 'rgb(191, 141, 52)')
              assert(styles.path.includes('C'))
            } else {
              for (const [chartIndex, chart] of (await charts.all()).entries()) {
                const index = await chart
                  .locator('.report-bar')
                  .evaluateAll((nodes) =>
                    nodes.findIndex((node) => Number(node.getAttribute('height')) > 0),
                  )
                assert(index >= 0, id)
                if (width < 500) await chart.locator('.report-bar').nth(index).tap()
                else await chart.locator('.report-bar').nth(index).hover()
                await page.waitForFunction(
                  ({ chartIndex, language }) =>
                    document
                      .querySelectorAll('.report-finance-trend .report-bar-readout strong')
                      [chartIndex]?.textContent.includes(language === 'en' ? '849.00' : '٨٤٩'),
                  { chartIndex, language },
                )
                assert.match(
                  await chart.locator('.report-bar-readout strong').innerText(),
                  language === 'en' ? /849\.00/ : /٨٤٩/,
                )
              }
            }
            for (const chart of await charts.all()) {
              await chart.locator('summary').click()
              assert(await chart.locator('table').isVisible())
              const inspect = chart.getByRole('combobox')
              await inspect.focus()
              await inspect.press('Home')
              await inspect.press('Enter')
              assert(await chart.locator('.report-chart-values').isVisible())
              await chart.locator('summary').click()
            }
            if (engine === 'chromium' && [1920, 390].includes(width)) {
              const panel =
                route === 'finance'
                  ? page.locator('.report-panel:has(.report-finance-trends)')
                  : page.locator('.report-overview-grid > .report-panel').first()
              await panel.screenshot({ path: resolve(output, `${id}.png`) })
            }
            assert.deepEqual(errors, [], id)
            results.push({ id, passed: true, geometry })
          }
          if (engine === 'chromium' && language === 'en' && width === 320) {
            for (const query of [
              'from=2026-01-01&through=2026-12-30&interval=day',
              'from=2099-03-01&through=2099-03-01&interval=day',
              'from=2026-10-01&through=2026-10-28&interval=week',
            ]) {
              await page.goto(`http://127.0.0.1:5283/en/dashboard/finance?${query}`, {
                waitUntil: 'networkidle',
              })
              await page.locator('.report-footnotes').waitFor()
              assert.equal(await page.locator('.feedback--error').count(), 0)
              const overlap = await page
                .locator('.report-chart > svg')
                .evaluateAll((nodes) =>
                  nodes.some((svg) =>
                    [...svg.querySelectorAll('.report-bar')].some(
                      (bar, index, bars) =>
                        index > 0 &&
                        Number(bars[index - 1].getAttribute('x')) +
                          Number(bars[index - 1].getAttribute('width')) >
                          Number(bar.getAttribute('x')) + 0.01,
                    ),
                  ),
                )
              assert.equal(overlap, false, query)
              assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
                false,
              )
              results.push({ id: query, passed: true })
            }
          }
        } catch (error) {
          await page
            .screenshot({
              path: resolve(output, `${engine}-${language}-${width}-failure.png`),
              fullPage: true,
            })
            .catch(() => {})
          throw error
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} chart readability / interaction checks passed`)
