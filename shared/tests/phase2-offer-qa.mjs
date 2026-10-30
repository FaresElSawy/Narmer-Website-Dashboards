import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import {
  localizedOffer,
  localizedForm,
  reviewDefinitions,
  reviewOffers,
} from '../../B2B-Website/src/features/inquiry/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase-2-offers')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  runtimeErrors = []
const currentImage = '.offer-main-image .offer-slide:not([aria-hidden]) img'
let imageUrl
async function audit(page, width) {
  await page.locator('.offer-details h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  const geometry = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON()
    return {
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      image: rect('.offer-main-image'),
      title: rect('.offer-details h1'),
      font: parseFloat(getComputedStyle(document.querySelector('.offer-details h1')).fontSize),
      h1s: document.querySelectorAll('h1').length,
      clipped: [...document.querySelectorAll('h1,h2,.button')]
        .filter((node) => node.getClientRects().length && node.scrollWidth > node.clientWidth + 3)
        .map((node) => node.textContent),
    }
  })
  assert.ok(geometry.scroll <= width + 1)
  assert.equal(geometry.h1s, 1)
  assert.ok(geometry.font <= 40)
  assert.deepEqual(geometry.clipped, [])
  if (width >= 1024) {
    assert.ok(
      Math.abs(geometry.image.y - geometry.title.y) < 1,
      'Title must align beside the image',
    )
    assert.ok(Math.abs(geometry.image.width / geometry.image.height - 704 / 650) < 0.01)
  } else {
    assert.ok(geometry.title.y > geometry.image.bottom)
    assert.ok(
      Math.abs(
        geometry.image.width / geometry.image.height - (width <= 640 ? 342 / 420 : 704 / 650),
      ) < 0.01,
    )
  }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 1024, 768, 390, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
          hasTouch: width < 768,
        })
        const page = await context.newPage()
        page.setDefaultTimeout(6000)
        page.on('pageerror', (error) =>
          runtimeErrors.push({ engine, language, width, error: error.message }),
        )
        const id = `${engine}-${language}-${width}`
        try {
          await page.goto(`http://127.0.0.1:5284/${language}/wholesale`, {
            waitUntil: 'networkidle',
          })
          assert.equal(await page.locator('.offer-card>span span').count(), 0)
          const links = await page
            .locator('.offer-card')
            .evaluateAll((nodes) => nodes.map((node) => node.href))
          assert.equal(links.length, 4)
          checks.push({ id: `${id}-collection-no-arrows` })
          for (const [index, url] of links.entries()) {
            await page.goto(url, { waitUntil: 'networkidle' })
            await audit(page, width)
            assert.equal(
              await page.locator('.offer-gallery').count(),
              index === 2 ? 1 : 0,
              'Gallery must follow the source image count',
            )
            assert.equal(await page.locator('.offer-gallery button').count(), index === 2 ? 3 : 0)
            assert.equal(
              await page.locator('.offer-composition tbody tr').count(),
              index === 2 ? 4 : 1,
            )
            if (index === 2) {
              const sources = await page
                .locator('.offer-gallery img')
                .evaluateAll((nodes) => nodes.map((node) => node.src))
              assert.equal(new Set(sources).size, 3)
              for (const position of [1, 2, 0]) {
                await page.locator('.offer-gallery button').nth(position).click()
                await page.waitForFunction(
                  (position) =>
                    document
                      .querySelectorAll('.offer-gallery button')
                      [position]?.getAttribute('aria-pressed') === 'true',
                  position,
                )
                await page.locator(currentImage).evaluate((image) => image.decode())
                assert.equal(
                  await page.locator(currentImage).getAttribute('src'),
                  new URL(sources[position]).pathname,
                )
              }
              const trigger = page.locator('.size-guide-trigger')
              await trigger.click()
              const dialog = page.locator('.size-guide[open]')
              assert.equal(await dialog.locator('tbody tr').count(), 3)
              assert.equal(await dialog.locator('thead th').count(), 4)
              if (engine === 'chromium' && width === 1440)
                await dialog.screenshot({ path: resolve(output, `${id}-numeric-guide.png`) })
              await page.keyboard.press('Escape')
              await dialog.waitFor({ state: 'hidden' })
              assert.equal(await trigger.evaluate((node) => node === document.activeElement), true)
            } else assert.equal(await page.locator('.size-guide-trigger').count(), 0)
            const table = await page.locator('.offer-composition').evaluate((node) => ({
              height: node.clientHeight,
              content: node.scrollHeight,
              width: node.clientWidth,
              contentWidth: node.scrollWidth,
            }))
            assert.ok(
              table.content <= table.height + 1,
              'Small composition must not have a vertical scrollbar',
            )
            assert.ok(
              table.contentWidth <= table.width + 1,
              'Small composition must not have a horizontal scrollbar',
            )
            if (!imageUrl)
              imageUrl = new URL(await page.locator(currentImage).getAttribute('src'), page.url())
                .href
            if (engine === 'chromium' && [1440, 390].includes(width))
              await page.screenshot({
                path: resolve(output, `${id}-offer-${index + 1}.png`),
                fullPage: true,
              })
            checks.push({ id: `${id}-offer-${index + 1}` })
          }
        } catch (error) {
          failures.push({ id, error: error.message })
          await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
        }
        await context.close()
        console.log(`${id}: all four offer layouts checked`)
      }
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          id = `${engine}-${language}-${width}-mock-gallery-guide`
        page.setDefaultTimeout(6000)
        page.on('pageerror', (error) => runtimeErrors.push({ id, error: error.message }))
        let count = 10,
          chartMode = 'numeric',
          productReads = 0,
          unexpectedWrites = 0,
          compositionRows = 4
        const chart = {
          id: '000000000000000000000900',
          name: language === 'ar' ? 'دليل المقاسات' : 'Size guide',
          alt: language === 'ar' ? 'صورة دليل المقاسات' : 'Size guide image',
          image: null,
          measurements: { unit: 'cm', rows: [{ size: 'S', chest: 50, length: 66, sleeve: 60 }] },
        }
        await page.route('**/api/v1/**', async (route) => {
          const request = route.request(),
            path = new URL(request.url()).pathname
          let data
          if (request.method() !== 'GET' && !path.endsWith('/auth/refresh')) unexpectedWrites++
          if (path.endsWith('/auth/refresh'))
            return route.fulfill({
              status: 401,
              json: { success: false, code: 'UNAUTHORIZED', errors: [] },
            })
          if (path.endsWith('/forms'))
            data = { items: reviewDefinitions().map((form) => localizedForm(form, language)) }
          else if (path.includes('/forms/')) data = localizedForm(reviewDefinitions()[2], language)
          else if (path.includes('/b2c/products/')) {
            productReads++
            assert.equal(request.headers().authorization, undefined)
            if (chartMode === 'error')
              return route.fulfill({
                status: 503,
                json: { success: false, code: 'UNAVAILABLE', errors: [] },
              })
            data = {
              sizeChart:
                chartMode === 'null'
                  ? null
                  : {
                      ...chart,
                      measurements: chartMode === 'image' ? null : chart.measurements,
                      image: ['image', 'mixed'].includes(chartMode)
                        ? {
                            id: '000000000000000000000901',
                            url: imageUrl,
                            width: 1200,
                            height: 1200,
                          }
                        : null,
                    },
            }
          } else if (path.includes('/wholesale/offers/')) {
            data = localizedOffer(reviewOffers()[2], language)
            data.product.images = Array.from({ length: count }, (_, index) => ({
              id: String(index).padStart(24, '0'),
              url: imageUrl,
              width: 1200,
              height: 1200,
            }))
            if (compositionRows > 4) {
              data.product.options[1].values = Array.from(
                { length: compositionRows },
                (_, index) => ({ key: `size-${index}`, name: `Size ${index + 1}` }),
              )
              data.product.variants = data.product.options[1].values.map((value, index) => ({
                id: String(index + 1000).padStart(24, '0'),
                values: { color: 'navy', size: value.key },
                images: data.product.images,
              }))
              data.composition = data.product.variants.map((variant) => ({
                variantId: variant.id,
                quantity: 3,
              }))
              data.piecesPerPouch = compositionRows * 3
            }
          } else data = path.endsWith('/homepage') ? { slots: [] } : { seo: {} }
          await route.fulfill({ json: { success: true, code: 'OK', data } })
        })
        const url = `http://127.0.0.1:5294/${language}/wholesale/offers/0000000000000000000001f6`
        try {
          await page.goto(url, { waitUntil: 'networkidle' })
          await audit(page, width)
          assert.equal(await page.locator('.offer-gallery button').count(), 10)
          await page.locator(currentImage).evaluate((image) => image.decode())
          for (let index = 1; index < 10; index++)
            await page
              .getByRole('button', {
                name: language === 'ar' ? 'الصورة التالية' : 'Next image',
                exact: true,
              })
              .click()
          assert.equal(
            await page.locator('.offer-gallery button').last().getAttribute('aria-pressed'),
            'true',
          )
          const visible = await page.locator('.offer-gallery').evaluate((node) => {
            const end = node.lastElementChild.getBoundingClientRect(),
              box = node.getBoundingClientRect()
            return end.left >= box.left - 1 && end.right <= box.right + 1
          })
          assert.equal(visible, true)
          const beforeScroll = await page.evaluate(() => scrollY)
          await page
            .getByRole('button', {
              name: language === 'ar' ? 'الصورة التالية' : 'Next image',
              exact: true,
            })
            .click()
          assert.equal(
            await page.locator('.offer-gallery button').first().getAttribute('aria-pressed'),
            'true',
          )
          assert.equal(
            await page.evaluate(() => scrollY),
            beforeScroll,
            'Changing images must not scroll the page',
          )
          await page
            .getByRole('button', {
              name: language === 'ar' ? 'الصورة السابقة' : 'Previous image',
              exact: true,
            })
            .click()
          assert.equal(
            await page.locator('.offer-gallery button').last().getAttribute('aria-pressed'),
            'true',
          )
          assert.equal(await page.locator('.gallery-arrow:disabled').count(), 0)
          if (engine === 'chromium')
            await page.screenshot({ path: resolve(output, `${id}-gallery.png`), fullPage: true })
          checks.push({ id: `${id}-10-images-next-previous-scroll` })
          for (const number of [2, 1, 0]) {
            count = number
            await page.goto(url, { waitUntil: 'networkidle' })
            await audit(page, width)
            assert.equal(
              await page.locator('.offer-gallery button').count(),
              number > 1 ? number : 0,
            )
            assert.equal(await page.locator('.gallery-arrow').count(), number > 1 ? 2 : 0)
            checks.push({ id: `${id}-${number}-images` })
          }
          for (const mode of ['numeric', 'mixed', 'image', 'null', 'error']) {
            chartMode = mode
            await page.goto(url, { waitUntil: 'networkidle' })
            await page.locator('.offer-details h1').waitFor()
            if (mode === 'null') {
              await page.waitForFunction(() => !document.querySelector('.size-guide-trigger'))
              assert.equal(await page.locator('.size-guide-trigger').count(), 0)
            } else if (mode === 'error') {
              await page.locator('.offer-guide-error').waitFor()
              chartMode = 'numeric'
              await page.locator('.offer-guide-error button').click()
              await page.locator('.size-guide-trigger').waitFor()
            } else {
              await page.locator('.size-guide-trigger').click()
              const dialog = page.locator('.size-guide[open]')
              assert.equal(await dialog.locator('table').count(), mode === 'image' ? 0 : 1)
              assert.equal(await dialog.locator('img').count(), mode === 'image' ? 1 : 0)
              await page.keyboard.press('Escape')
            }
            checks.push({ id: `${id}-chart-${mode}` })
          }
          assert.ok(productReads > 0)
          assert.equal(unexpectedWrites, 0)
          compositionRows = 20
          await page.goto(url, { waitUntil: 'networkidle' })
          await page.locator('.offer-composition tbody tr').nth(19).waitFor({ state: 'attached' })
          const scroll = await page.locator('.offer-composition').evaluate((node) => {
            node.scrollTop = node.scrollHeight
            return { content: node.scrollHeight, height: node.clientHeight, top: node.scrollTop }
          })
          assert.ok(
            scroll.content > scroll.height && scroll.top > 0,
            'Long dashboard composition must remain scrollable',
          )
          checks.push({ id: `${id}-long-composition-scrolls` })
        } catch (error) {
          failures.push({ id, error: error.message })
          await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
        }
        await context.close()
        console.log(`${id}: conditional gallery and guide checked`)
      }
  } finally {
    await browser.close()
  }
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify({ passed: checks.length, checks, failures, runtimeErrors }, null, 2),
)
console.log(JSON.stringify({ passed: checks.length, failures, runtimeErrors }, null, 2))
if (failures.length || runtimeErrors.length) process.exitCode = 1
