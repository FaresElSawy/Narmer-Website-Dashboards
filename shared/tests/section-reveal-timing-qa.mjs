import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const source = await readFile('shared/assets/js/page-motion.js', 'utf8')
const output = resolve('output/playwright/section-reveal-timing')
await mkdir(output, { recursive: true })
const checks = [],
  errors = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 960 } })
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(`http://127.0.0.1:5284/${language}`, { waitUntil: 'networkidle' })
        await page.locator('.site-loader').waitFor({ state: 'hidden' })
        const hero = await page.locator('.campaign-copy h1').evaluate((node) => ({
          duration: getComputedStyle(node).animationDuration,
          delay: getComputedStyle(node).animationDelay,
        }))
        assert.equal(hero.duration, '0.72s')
        assert.equal(hero.delay, '0.3s')
        await page.route('**/__reveal-timing.js', (route) =>
          route.fulfill({ contentType: 'text/javascript', body: source }),
        )
        await page.evaluate(async () => {
          document.body.replaceChildren()
          const { startPageMotion } = await import('/__reveal-timing.js')
          window.startTiming = startPageMotion
          const root = document.createElement('main')
          root.style.cssText = 'display:flow-root;min-height:3000px'
          document.body.append(root)
          const node = document.createElement('section')
          node.className = 'account-panel'
          node.style.cssText =
            'height:300px;width:300px;margin:1100px 0 0;padding:16px;background:#eef4f6'
          node.innerHTML = '<h2>Reveal timing</h2><input aria-label="Timing input">'
          root.append(node)
          window.timingNode = node
          window.stopTiming = startPageMotion(root)
          window.timingStarts = 0
          const original = node.animate.bind(node)
          node.animate = (...args) => {
            window.timingStarts++
            return original(...args)
          }
          scrollTo(0, node.getBoundingClientRect().top + scrollY - (innerHeight - 40))
        })
        await page.waitForTimeout(200)
        assert.equal(
          await page.evaluate(() => window.timingStarts),
          0,
          'A few visible pixels must not trigger the reveal',
        )
        assert.equal(
          await page.locator('.account-panel').getAttribute('data-motion-pending'),
          'true',
        )
        await page.evaluate(() =>
          scrollTo(0, window.timingNode.getBoundingClientRect().top + scrollY - innerHeight * 0.65),
        )
        await page.waitForFunction(() => window.timingStarts === 1)
        const middle = await page.locator('.account-panel').evaluate((node) => {
          const animation = node.getAnimations()[0]
          animation.pause()
          animation.currentTime = 240
          return {
            duration: animation.effect.getTiming().duration,
            opacity: +getComputedStyle(node).opacity,
            y: new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,
          }
        })
        assert.equal(middle.duration, 720)
        assert.ok(middle.opacity > 0.2 && middle.opacity < 0.85, JSON.stringify(middle))
        assert.ok(middle.y > 3 && middle.y < 20, JSON.stringify(middle))
        await page
          .locator('.account-panel')
          .evaluate((node) => node.getAnimations().forEach((animation) => animation.finish()))
        await page.evaluate(() => scrollTo(0, 0))
        await page.waitForTimeout(80)
        await page.evaluate(() => scrollTo(0, 700))
        await page.waitForTimeout(80)
        assert.equal(
          await page.evaluate(() => window.timingStarts),
          1,
          'The same section must not replay on every scroll',
        )
        // A very tall block still reveals by viewport position, without a percentage-of-element threshold.
        await page.evaluate(() => {
          window.stopTiming()
          scrollTo(0, 0)
          window.timingNode.style.height = '6000px'
          window.stopTiming = window.startTiming(document.querySelector('main'))
          scrollTo(0, window.timingNode.getBoundingClientRect().top + scrollY - innerHeight * 0.65)
        })
        await page.waitForFunction(() => window.timingNode.getAnimations().length > 0)
        await page.locator('input').focus()
        assert.equal(
          await page.locator('.account-panel').evaluate((node) => node.getAnimations().length),
          0,
        )
        await page.evaluate(() => {
          window.stopTiming()
          scrollTo(0, 0)
          document.activeElement.blur()
          window.stopTiming = window.startTiming(document.querySelector('main'))
        })
        assert.equal(
          await page.locator('.account-panel').getAttribute('data-motion-pending'),
          'true',
        )
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.waitForFunction(() => !window.timingNode.hasAttribute('data-motion-pending'))
        await page.waitForFunction(() => getComputedStyle(window.timingNode).opacity === '1')
        assert.equal(
          await page.locator('.account-panel').evaluate((node) => getComputedStyle(node).opacity),
          '1',
        )
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await page.evaluate(() => {
          window.stopTiming()
          window.stopTiming = window.startTiming(document.querySelector('main'))
          window.stopTiming()
        })
        assert.equal(await page.locator('.account-panel').getAttribute('data-motion-pending'), null)
        checks.push({
          id: `${engine}-${language}-${width}-viewport-timing-pace-tall-focus-reduced-cleanup`,
          middle,
        })
        await page.close()
        const home = await browser.newPage({ viewport: { width, height: 960 } })
        await home.goto(`http://127.0.0.1:5284/${language}`, { waitUntil: 'networkidle' })
        await home.locator('.site-loader').waitFor({ state: 'hidden' })
        await home.evaluate(() => {
          const node = document.querySelector('.business-service-card')
          scrollTo(0, node.getBoundingClientRect().top + scrollY - innerHeight * 0.65)
        })
        await home.waitForFunction(
          () => document.querySelector('.business-service-card').getAnimations().length > 0,
        )
        await home.waitForTimeout(180)
        if (engine === 'chromium')
          await home.screenshot({
            path: resolve(output, `${language}-${width}-service-reveal.png`),
          })
        await home.waitForTimeout(900)
        assert.ok(await home.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
        await home.close()
      }
  } finally {
    await browser.close()
  }
  console.log(`${engine}: later viewport triggers and visible motion checked`)
}
assert.deepEqual(errors, [])
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2))
console.log(`${checks.length} section timing checks passed.`)
