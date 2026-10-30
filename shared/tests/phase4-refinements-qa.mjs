import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase4-refinements')
await mkdir(output, { recursive: true })
const results = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 768, 390, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          hasTouch: width < 1024,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          errors = [],
          id = `${engine}-${language}-${width}`,
          ar = language === 'ar'
        let apiCalls = 0
        page.setDefaultTimeout(10000)
        page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`))
        page.on('request', (request) => {
          if (request.url().includes('/api/v1/')) apiCalls++
        })
        async function go(path = '') {
          await page.goto(`http://127.0.0.1:5283/${language}${path}`)
          await page.locator('h1').first().waitFor()
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
          await page.evaluate(() => document.fonts.ready)
        }
        async function fits() {
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            id,
          )
          assert.ok(
            !(await page.locator('body').innerText()).includes('\u2014'),
            `${id}: visible em dash`,
          )
        }
        try {
          await go()
          assert.equal(await page.locator('.retail-sale .product-card').count(), 0)
          assert.equal(await page.locator('.retail-curated .product-card').count(), 4)
          assert.ok(
            (await page.locator('.campaign-photo img').last().getAttribute('src')).includes(
              'brown',
            ),
          )
          for (const selector of ['.retail-sale-feature', '.retail-story']) {
            const button = page.locator(`${selector} .button--accent`)
            await button.hover()
            await page.waitForTimeout(220)
            assert.equal(
              await button.evaluate((node) => getComputedStyle(node).backgroundColor),
              width === 1440 ? 'rgb(209, 160, 75)' : 'rgb(191, 141, 52)',
            )
          }
          await fits()
          if (width === 1440) {
            for (const [key, label, image] of [
              ['men', ar ? 'رجالي' : 'Men', 'menu-men-maison'],
              ['women', ar ? 'حريمي' : 'Women', 'menu-women-pink'],
            ]) {
              const trigger = page
                .locator('.desktop-navigation')
                .getByRole('button', { name: label, exact: true })
              await trigger.focus()
              await page.keyboard.press('ArrowDown')
              const panel = page.locator('#category-navigation')
              await panel.waitFor({ state: 'visible' })
              assert.equal(await panel.getAttribute('data-open'), 'true')
              await page.waitForFunction(
                () => document.querySelector('#category-navigation a') === document.activeElement,
              )
              assert.equal(await panel.locator('.directional-arrow').count(), 1)
              assert.ok(
                (await panel.locator('.retail-menu-image').getAttribute('src')).includes(image),
              )
              await panel.locator('.retail-menu-image').evaluate((node) => node.decode())
              assert.equal(
                await panel
                  .locator('.retail-menu-image')
                  .evaluate((node) => node.complete && node.naturalWidth > 0),
                true,
              )
              const geometry = await panel.locator('.retail-menu-image').boundingBox()
              assert.ok(Math.abs(geometry.width / geometry.height - 400 / 220) < 0.01)
              assert.equal(
                await panel
                  .locator('.retail-menu-image')
                  .evaluate((node) => getComputedStyle(node).objectFit),
                'contain',
              )
              assert.equal(
                await panel
                  .locator('.retail-menu-image')
                  .evaluate((node) => getComputedStyle(node).transform),
                'matrix(1.3, 0, 0, 1.3, 0, 0)',
              )
              assert.equal(
                await panel
                  .locator('.retail-menu-columns')
                  .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
                3,
              )
              assert.ok(!(await panel.innerText()).includes('design approval'))
              await page.screenshot({ path: resolve(output, `${id}-${key}-menu.png`) })
              await page.keyboard.press('Escape')
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
              assert.ok(await trigger.evaluate((node) => node === document.activeElement))
            }
            await page.setViewportSize({ width: 390, height: 1000 })
            assert.equal(
              await page
                .locator('#category-navigation')
                .evaluate((node) => getComputedStyle(node).display),
              'none',
            )
            await page.setViewportSize({ width, height: 1000 })
          } else {
            await page.locator('.mobile-menu-button').click()
            const toggle = page.locator('.mobile-category-toggle').first()
            await toggle.click()
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
            await page.locator('.mobile-category-links[data-open="true"] a').first().click()
            await page.locator('.catalog-count').waitFor()
            assert.equal(await page.locator('dialog[open]').count(), 0)
          }
          for (const query of [
            'collection=men',
            'collection=women',
            'sort=newest',
            'saleOnly=true',
          ]) {
            await go(`/products?${query}`)
            await page.locator('.catalog-count').waitFor()
            const filters = page.locator('.catalog-filter-panel')
            assert.equal(await filters.getAttribute('open'), null)
            assert.ok((await filters.boundingBox()).height < 60)
            assert.ok(
              await page
                .locator('.product-card')
                .first()
                .evaluate((node) =>
                  [
                    'borderTopLeftRadius',
                    'borderTopRightRadius',
                    'borderBottomLeftRadius',
                    'borderBottomRightRadius',
                  ].every((key) => parseFloat(getComputedStyle(node)[key]) > 0),
                ),
            )
            await filters.locator('summary').click()
            await page.getByRole('combobox', { name: ar ? 'المقاس' : 'Size', exact: true }).click()
            await page.getByRole('option', { name: /^S \(/ }).click()
            await page.waitForURL('**/*size=s*')
            await page.locator('.catalog-filter-count').waitFor()
            await fits()
            await filters.locator('summary').click()
          }
          await go('/products/logo-hoodie')
          const selection = page.locator('.product-selection')
          await selection.waitFor()
          assert.equal(
            await selection
              .getByRole('button', { name: 'S', exact: true })
              .getAttribute('aria-pressed'),
            'true',
          )
          assert.equal(
            await selection.getByRole('button', { name: /^(XL|XL -)/ }).isDisabled(),
            true,
          )
          const before = await page.locator('.offer-main-image img').first().getAttribute('src')
          const thumbnails = await page.locator('.offer-gallery button').first().boundingBox()
          assert.ok(thumbnails.width <= 104 && thumbnails.width >= 76)
          const beige = selection.getByRole('button', { name: ar ? 'بيج' : 'Beige', exact: true })
          assert.equal(await selection.locator('.product-colors button').count(), 1)
          assert.equal(
            await beige
              .locator('.color-swatch')
              .evaluate((node) => getComputedStyle(node).borderRadius),
            '50%',
          )
          assert.equal(await page.locator('.offer-gallery button').count(), 4)
          await page.locator('.offer-gallery button').nth(1).click()
          await page.waitForFunction(
            (first) =>
              document
                .querySelector('.offer-slide:not(.offer-slide--outgoing) img')
                ?.getAttribute('src') !== first,
            before,
          )
          await fits()
          if (width === 1440 || width === 390)
            await page.screenshot({ path: resolve(output, `${id}-product.png`), fullPage: true })
          await go('/account/login')
          await page.locator('input[name="email"]').waitFor()
          assert.ok(
            (await page.locator('.auth-art img').getAttribute('src')).includes(
              'customer-login-campaign',
            ),
          )
          await fits()
          if (width === 1440 || width === 390) {
            await page.locator('.auth-art img').evaluate((node) => node.decode())
            await page.screenshot({ path: resolve(output, `${id}-login.png`), fullPage: true })
          }
          assert.deepEqual(errors, [], id)
          assert.equal(apiCalls, 0)
          results.push({
            id,
            passed: true,
            checks: [
              'home-sale-and-hover',
              'navigation',
              'four-collection-filters',
              'card-corners',
              'variant-preview-stock-thumbnails',
              'customer-login-campaign',
              'overflow-and-copy',
            ],
          })
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} responsive EN/AR refinement scenarios passed`)
