import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { reviewCatalogue } from '../../B2C-Website/src/content/catalogue.js'
import { fixtureId } from '../../B2C-Website/src/features/shop/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/catalogue')
const manifest = JSON.parse(await readFile('B2C-Website/dist/.vite/manifest.json', 'utf8'))
const imagePath = (image) => '/' + manifest[`src/assets/images/products/${image.file}`].file
await mkdir(output, { recursive: true })
const results = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage(),
          errors = [],
          id = `${engine}-${language}-${width}`
        let apiRequests = 0
        page.setDefaultTimeout(12000)
        page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`))
        page.on('request', (request) => {
          if (request.url().includes('/api/v1/')) apiRequests++
        })
        async function go(path) {
          await page.goto(`http://127.0.0.1:5283/${language}${path}`)
          await page.waitForFunction(() => !document.querySelector('.site-loader'))
          await page.locator('h1').first().waitFor()
        }
        async function fits() {
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${id}: overflow`,
          )
        }
        try {
          await go('/products')
          await page.waitForFunction(() => document.querySelectorAll('.product-card').length === 11)
          await page.locator('.product-card-image img').evaluateAll((images) =>
            Promise.all(
              images.map((image) => {
                image.loading = 'eager'
                return image.decode()
              }),
            ),
          )
          await fits()
          await page.screenshot({ path: resolve(output, `${id}-all-products.png`), fullPage: true })
          for (const [category, count] of [
            [10, 5],
            [20, 6],
            [11, 3],
            [12, 2],
            [21, 2],
            [22, 1],
            [23, 3],
          ]) {
            await go(`/products?categoryId=${fixtureId(category)}`)
            await page.waitForFunction(
              (count) => document.querySelectorAll('.product-card').length === count,
              count,
            )
            await fits()
          }
          let photos = 0
          for (const product of reviewCatalogue) {
            await go(`/products/${product.slug}`)
            await page.locator('.product-selection').waitFor()
            assert.equal(await page.locator('h1').textContent(), product.name[language])
            assert.equal(
              await page.locator('.offer-gallery button').count(),
              product.gallery.length,
            )
            const gallery = await page.locator('.offer-gallery img').evaluateAll((images) =>
              Promise.all(
                images.map(async (image) => {
                  image.loading = 'eager'
                  await image.decode()
                  return {
                    src: image.currentSrc,
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                  }
                }),
              ),
            )
            for (const [index, image] of gallery.entries()) {
              assert.ok(
                new URL(image.src).pathname === imagePath(product.gallery[index]),
                `${product.slug}: gallery ${index}: ${image.src} should match ${product.gallery[index].file}`,
              )
              assert.equal(image.width, product.gallery[index].width)
              assert.equal(image.height, product.gallery[index].height)
            }
            const primary = page.locator('.offer-main-image img').first()
            await primary.evaluate((image) => image.decode())
            assert.ok(
              (await primary.getAttribute('src')) === imagePath(product.gallery[0]),
              `${product.slug}: model cover`,
            )
            assert.equal(await page.locator('.product-colors button').count(), 1)
            assert.equal(
              await page.locator('.product-options:not(.product-colors) button').count(),
              6,
            )
            await fits()
            photos += gallery.length
            if (product.slug === 'embroidered-hoodie-white') {
              assert.equal(
                await page.locator('.product-selection .button--accent').isDisabled(),
                true,
              )
              await page.screenshot({
                path: resolve(output, `${id}-embroidered-hoodie.png`),
                fullPage: true,
              })
            }
          }
          assert.equal(photos, 42)
          await go('/products/sporty-quarter-zip-brown')
          assert.equal(
            await page.getByRole('button', { name: 'M', exact: true }).getAttribute('aria-pressed'),
            'true',
          )
          await page.locator('.product-selection .button--accent').click()
          await page.locator('.shop-notice').waitFor()
          await page.locator(`.header-actions a[href="/${language}/cart"]`).click()
          await page.locator('.cart-line').waitFor()
          assert.ok(
            (await page.locator('.cart-line').innerText()).includes(
              language === 'ar' ? 'سبورتي' : 'Sporty',
            ),
          )
          assert.deepEqual(errors, [], id)
          assert.equal(apiRequests, 0)
          results.push({ id, passed: true, products: 11, photos: 42, categories: 7, cart: true })
        } finally {
          await context.close()
        }
      }
  } finally {
    await browser.close()
  }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
console.log(
  `${results.length} catalogue scenarios passed: all 11 products, 42 photos, category counts and Cart`,
)
