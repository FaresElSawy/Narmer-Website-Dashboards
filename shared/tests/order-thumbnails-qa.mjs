import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  output = resolve('output/playwright/order-thumbnails'),
  results = []
await mkdir(output, { recursive: true })
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar']) {
      const context = await browser.newContext({
          viewport: { width: 1440, height: 956 },
          reducedMotion: 'reduce',
        }),
        page = await context.newPage(),
        ar = language === 'ar'
      await context.route('https://**/*', (route) => route.abort())
      try {
        await page.goto(
          `http://127.0.0.1:5283/${language}/dashboard/orders/000000000000000000002ee0`,
          { waitUntil: 'networkidle' },
        )
        const image = page.locator('.staff-order-product img')
        await image.waitFor()
        assert.ok(await image.evaluate((img) => img.complete && img.naturalWidth > 0))
        const name = await page.locator('.staff-order-product').innerText()
        assert.ok(name.includes(ar ? 'سويت شيرت ميزون - أسود' : 'Maison sweatshirt - Black'))
        assert.ok(name.includes(ar ? 'صورة المنتج الحالية' : 'Current product image'))
        const source = await image.getAttribute('src')
        for (const width of [1440, 768, 440, 360, 320]) {
          await page.setViewportSize({ width, height: 956 })
          await page.evaluate(() => document.fonts.ready)
          const box = await image.boundingBox()
          assert.equal(box.width, 52)
          assert.equal(box.height, 60)
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          if ([1440, 360].includes(width))
            await page.screenshot({
              path: resolve(output, `${engine}-${language}-${width}.png`),
              fullPage: true,
            })
        }
        await context.route(`**/${source.split('/').at(-1)}`, (route) => route.abort())
        await page.reload({ waitUntil: 'networkidle' })
        await page.locator('.staff-order-image-placeholder').waitFor()
        assert.ok(
          (await page.locator('.staff-order-product').innerText()).includes(
            ar ? 'سويت شيرت ميزون - أسود' : 'Maison sweatshirt - Black',
          ),
        )
        assert.ok(
          (await page.locator('.staff-order-product').innerText()).includes(
            ar ? 'الصورة غير متاحة' : 'Image unavailable',
          ),
        )
        results.push({
          id: `${engine}-${language}`,
          passed: true,
          widths: [1440, 768, 440, 360, 320],
          brokenImageFallback: true,
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
console.log(
  '4 current-order-thumbnail workflows passed at five widths, including unavailable-image fallback',
)
