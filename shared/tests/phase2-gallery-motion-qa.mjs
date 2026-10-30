import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase-2-gallery-motion')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  errors = []
const currentImage = '.offer-slide:not([aria-hidden]) img'
async function selected(page, index) {
  await page.waitForFunction(
    (index) =>
      document.querySelectorAll('.offer-gallery button')[index]?.getAttribute('aria-pressed') ===
      'true',
    index,
  )
}
async function settled(page) {
  await page.locator('.offer-slide--outgoing').waitFor({ state: 'detached' })
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390])
        for (const reduced of [false, true]) {
          const id = `${engine}-${language}-${width}-${reduced ? 'reduced' : 'motion'}`
          const context = await browser.newContext({
            viewport: { width, height: 1000 },
            reducedMotion: reduced ? 'reduce' : 'no-preference',
          })
          const page = await context.newPage()
          page.setDefaultTimeout(6000)
          page.on('pageerror', (error) => errors.push({ id, error: error.message }))
          try {
            await page.goto(
              `http://127.0.0.1:5284/${language}/wholesale/offers/0000000000000000000001f6`,
              { waitUntil: 'networkidle' },
            )
            const first = await page.locator(currentImage).getAttribute('src')
            const next = page.getByRole('button', {
              name: language === 'ar' ? 'الصورة التالية' : 'Next image',
              exact: true,
            })
            const previous = page.getByRole('button', {
              name: language === 'ar' ? 'الصورة السابقة' : 'Previous image',
              exact: true,
            })
            await next.scrollIntoViewIfNeeded()
            const top = await page.evaluate(() => scrollY)
            await next.click()
            await selected(page, 1)
            if (!reduced) {
              await page.locator('.offer-slide--incoming').waitFor()
              const sample = await page.locator('.offer-main-image').evaluate((node) => {
                for (const animation of node.getAnimations({ subtree: true })) {
                  animation.pause()
                  animation.currentTime = 190
                }
                const incoming = node.querySelector('.offer-slide--incoming'),
                  outgoing = node.querySelector('.offer-slide--outgoing')
                return {
                  duration: getComputedStyle(incoming).animationDuration,
                  inX: new DOMMatrixReadOnly(getComputedStyle(incoming).transform).m41,
                  outX: new DOMMatrixReadOnly(getComputedStyle(outgoing).transform).m41,
                  width: node.clientWidth,
                  opacity: getComputedStyle(incoming).opacity,
                }
              })
              assert.equal(sample.duration, '0.38s')
              assert.equal(sample.opacity, '1')
              assert.ok(Math.abs(sample.inX) > 0 && Math.abs(sample.inX) < sample.width)
              assert.ok(
                language === 'ar'
                  ? sample.inX < 0 && sample.outX > 0
                  : sample.inX > 0 && sample.outX < 0,
              )
              if (engine === 'chromium')
                await page
                  .locator('.offer-main-image')
                  .screenshot({ path: resolve(output, `${id}-mid-slide.png`) })
              await page.locator('.offer-main-image').evaluate(async (node) => {
                const animations = node.getAnimations({ subtree: true })
                await Promise.all(
                  animations.map((animation) => {
                    animation.play()
                    return animation.finished.catch(() => {})
                  }),
                )
              })
            }
            await settled(page)
            assert.notEqual(await page.locator(currentImage).getAttribute('src'), first)
            assert.equal(await page.evaluate(() => scrollY), top)
            await next.click()
            await selected(page, 2)
            await settled(page)
            await next.click()
            await selected(page, 0)
            await settled(page)
            assert.equal(await page.locator(currentImage).getAttribute('src'), first)
            await previous.click()
            await selected(page, 2)
            await settled(page)
            assert.equal(await page.locator('.gallery-arrow:disabled').count(), 0)
            await page.locator('.gallery-arrow--next').evaluate((button) => {
              for (let i = 0; i < 5; i++)
                button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
            })
            await selected(page, 1)
            await settled(page)
            await previous.focus()
            await page.keyboard.press('Enter')
            await selected(page, 0)
            assert.equal(
              await page.locator('.offer-slide--incoming').count(),
              0,
              'Keyboard switching should be immediate',
            )
            const small = await page
              .locator('.offer-composition')
              .evaluate((node) => node.scrollHeight <= node.clientHeight + 1)
            assert.equal(small, true)
            checks.push({ id })
          } catch (error) {
            failures.push({ id, error: error.message })
            await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
          }
          await context.close()
        }
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      }),
      page = await context.newPage()
    const id = `${engine}-slow-next-image`
    try {
      let release
      const hold = new Promise((resolve) => {
        release = resolve
      })
      await page.route('**/offer-logo-*.webp', async (route) => {
        await hold
        await route.continue()
      })
      await page.goto('http://127.0.0.1:5284/en/wholesale/offers/0000000000000000000001f6', {
        waitUntil: 'domcontentloaded',
      })
      await page.locator(currentImage).evaluate((image) => image.decode())
      const original = await page.locator(currentImage).getAttribute('src')
      await page.getByRole('button', { name: 'Next image', exact: true }).click()
      await page.waitForTimeout(100)
      assert.equal(await page.locator(currentImage).getAttribute('src'), original)
      release()
      await selected(page, 1)
      await settled(page)
      assert.notEqual(await page.locator(currentImage).getAttribute('src'), original)
      checks.push({ id })
    } catch (error) {
      failures.push({ id, error: error.message })
    }
    await context.close()
  } finally {
    await browser.close()
  }
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify({ passed: checks.length, failures, errors }, null, 2),
)
console.log(JSON.stringify({ passed: checks.length, failures, errors }, null, 2))
if (failures.length || errors.length) process.exitCode = 1
