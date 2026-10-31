import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/storefront-review')
await mkdir(output, { recursive: true })
const results = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 1024, 768, 390, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
          hasTouch: width < 1024,
        })
        const page = await context.newPage(),
          errors = [],
          ar = language === 'ar',
          id = `${engine}-${language}-${width}`
        page.setDefaultTimeout(12000)
        page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`))
        async function go(path = '') {
          await page.goto(`http://127.0.0.1:5283/${language}${path}`, { waitUntil: 'networkidle' })
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
          await page.locator('h1').first().waitFor()
          await page.evaluate(() => document.fonts.ready)
        }
        async function fits() {
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${id}: overflow`,
          )
        }
        async function cards() {
          assert.ok(
            await page.locator('.product-card').evaluateAll((nodes) =>
              nodes.every((card) =>
                [...card.querySelectorAll('.product-card-copy > *, h3')].every((node) => {
                  const a = card.getBoundingClientRect(),
                    b = node.getBoundingClientRect()
                  return (
                    b.left >= a.left + 8 &&
                    b.right <= a.right - 8 &&
                    node.scrollWidth <= node.clientWidth + 1
                  )
                }),
              ),
            ),
            `${id}: card contents`,
          )
          assert.equal(await page.locator('.product-card-price small').count(), 0)
          const action = page.locator('.product-card-action').first()
          assert.equal(await action.evaluate((n) => getComputedStyle(n).textDecorationLine), 'none')
          assert.equal(await action.evaluate((n) => getComputedStyle(n).borderTopWidth), '0px')
          assert.equal(
            await action.locator('svg').evaluate((n) => n.getBoundingClientRect().width),
            width < 640 ? 14 : 16,
          )
        }
        try {
          await go()
          await fits()
          assert.deepEqual(
            await page.locator('.retail-collections h3').allTextContents(),
            ar ? ['قسم الرجال', 'قسم النساء'] : ['Men’s Section', 'Women’s Section'],
          )
          const story = await page.locator('.retail-story').boundingBox(),
            overlay = await page.locator('.retail-story > div').boundingBox()
          assert.ok(
            Math.abs(story.height - overlay.height) < 1 && Math.abs(story.y - overlay.y) < 1,
            `${id}: overlay coverage`,
          )
          const heading = await page.locator('.retail-section-heading h2').boundingBox(),
            shop = await page.locator('.retail-section-heading .button').boundingBox()
          assert.ok(
            Math.abs(heading.y + heading.height / 2 - shop.y - shop.height / 2) < 2,
            `${id}: section header alignment`,
          )
          await cards()
          if (width >= 1024) {
            const nav = await page.locator('.desktop-navigation').boundingBox()
            assert.ok(Math.abs(nav.x + nav.width / 2 - width / 2) < 1, `${id}: centered navigation`)
            assert.equal(await page.locator('.desktop-navigation a[href$="/about"]').count(), 1)
            const lang = await page.locator('.retail-language-switch').boundingBox(),
              utilities = await page.locator('.header-actions .icon-button').nth(2).boundingBox()
            assert.ok(
              ar ? lang.x + lang.width < utilities.x : lang.x > utilities.x + utilities.width,
              `${id}: language at end`,
            )
          } else {
            await page.locator('.mobile-menu-button').click()
            assert.ok(await page.locator('.navigation-drawer a[href$="/about"]').isVisible())
            await page.keyboard.press('Escape')
          }
          assert.equal(
            await page
              .locator('footer nav')
              .filter({ has: page.locator('strong', { hasText: ar ? 'تسوق' : 'Shop' }) })
              .locator('a[href$="/about"]')
              .count(),
            0,
          )
          assert.equal(await page.locator('footer a[href$="/about"]').count(), 1)
          if (width === 1440 || width === 390)
            await page.screenshot({ path: resolve(output, `${id}-home.png`), fullPage: true })
          await go('/products')
          await page.locator('.catalog-count').waitFor()
          await cards()
          const nav = page.locator('.shop-pagination')
          assert.equal(await nav.locator('button').count(), 2)
          assert.ok(
            await nav.locator('button').evaluateAll((nodes) => nodes.every((n) => n.disabled)),
          )
          await page.locator('.catalog-filter-panel summary').click()
          assert.equal(await page.locator('input[name="min"],input[name="max"]').count(), 0)
          const price = page.getByRole('combobox', {
            name: ar ? 'نطاق السعر (جنيه)' : 'Price range (EGP)',
          })
          const priceBox = await price.boundingBox(),
            saleBox = await page.locator('.sale-filter').boundingBox()
          if (width >= 360)
            assert.ok(
              Math.abs(priceBox.y + priceBox.height / 2 - saleBox.y - saleBox.height / 2) < 1,
              `${id}: sale alignment`,
            )
          assert.equal(
            await page.locator('.sale-filter').evaluate((n) => getComputedStyle(n).borderTopWidth),
            '0px',
          )
          await price.click()
          await page.getByRole('option', { name: '0 - 100', exact: true }).click()
          await page.waitForFunction(
            () => document.querySelector('.shop-pagination span')?.textContent === '0 / 0',
          )
          assert.ok(
            await nav.locator('button').evaluateAll((nodes) => nodes.every((n) => n.disabled)),
          )
          await price.click()
          await page.getByRole('option', { name: '500 - 1,000', exact: true }).click()
          await page.waitForFunction(() => document.querySelectorAll('.product-card').length === 11)
          await page.locator('.sale-filter input').click()
          await page.waitForFunction(() => document.querySelectorAll('.product-card').length === 3)
          await fits()
          if (width === 1440 || width === 390 || width === 320)
            await page.screenshot({ path: resolve(output, `${id}-filters.png`), fullPage: true })
          for (const path of ['/wishlist', '/cart']) {
            await go(path)
            const title = page.locator('.feedback strong'),
              button = page.locator('.feedback .button').first()
            await button.waitFor()
            const a = await title.boundingBox(),
              b = await button.boundingBox()
            assert.ok(
              b.y >= a.y + a.height + 15 && Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 1,
              `${id}:${path} feedback spacing`,
            )
            await fits()
          }
          await go('/products/logo-hoodie')
          await page.locator('.product-selection').waitFor()
          if (width < 640) {
            assert.equal(
              await page
                .locator('.product-selection h1')
                .evaluate((n) => getComputedStyle(n).fontSize),
              '26px',
            )
            assert.equal(
              await page.locator('.detail-price').evaluate((n) => getComputedStyle(n).fontSize),
              '24px',
            )
          }
          await fits()
          if (width === 390 || width === 320)
            await page.screenshot({ path: resolve(output, `${id}-product.png`), fullPage: true })
          if (width === 390) {
            await page.locator('.product-selection .button--accent').click()
            await page.locator('.shop-notice').waitFor()
            await page.locator(`.header-actions a[href="/${language}/account"]`).click()
            const signIn = page.locator('.account-page .feedback a[href$="/login"]')
            if (await signIn.count()) await signIn.click()
            await page.locator('input[name="password"]').fill('NarmerDemo123')
            await page.locator('.auth-panel form button[type="submit"]').click()
            await page.waitForURL(`**/${language}/account`)
            await page.locator(`.header-actions a[href="/${language}/cart"]`).click()
            await page.locator('.cart-line').waitFor()
            assert.equal(await page.locator('.cart-merge').count(), 0)
            assert.equal(await page.locator('.cart-summary dd').first().textContent(), '1')
            await fits()
            await page.screenshot({ path: resolve(output, `${id}-cart.png`), fullPage: true })
          }
          assert.deepEqual(errors, [], id)
          results.push({ id, passed: true })
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(`${results.length} storefront UI review scenarios passed`)
