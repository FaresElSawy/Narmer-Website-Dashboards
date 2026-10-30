import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase-2-page-motion')
await mkdir(output, { recursive: true })
const checks = [],
  errors = []
const source = await readFile('shared/assets/js/page-motion.js', 'utf8')
const record = () => {
  window.motionLog = []
  const original = Element.prototype.animate
  Element.prototype.animate = function (frames, options) {
    window.motionLog.push({
      name: this.className,
      options,
      ready: document.documentElement.dataset.siteReady,
    })
    return original.call(this, frames, options)
  }
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 768, 390]) {
        for (const [store, port] of [
          ['b2b', 5284],
          ['b2c', 5283],
        ]) {
          const id = `${engine}-${store}-${language}-${width}`
          const page = await browser.newPage({ viewport: { width, height: 960 } })
          page.on('pageerror', (error) => errors.push({ id, error: error.message }))
          await page.addInitScript(record)
          await page.goto(`http://127.0.0.1:${port}/${language}`, { waitUntil: 'networkidle' })
          await page.locator('.site-loader').waitFor({ state: 'hidden' })
          assert.equal(
            await page
              .locator('.campaign-photo')
              .first()
              .evaluate((node) => getComputedStyle(node).animationName),
            'hero-image-enter',
          )
          if (store === 'b2b') {
            const card = page.locator('.business-service-card').first()
            await card.scrollIntoViewIfNeeded()
            await page.waitForFunction(() =>
              window.motionLog.some((item) => item.name === 'business-service-card'),
            )
            const sample = await card.evaluate((node) => {
              const animation = node
                .getAnimations()
                .find((item) => item.effect.getTiming().duration === 720)
              if (!animation) return null
              animation.pause()
              animation.currentTime = 120
              return {
                opacity: +getComputedStyle(node).opacity,
                y: new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,
              }
            })
            if (sample) {
              assert.ok(sample.opacity > 0 && sample.opacity < 1)
              assert.ok(sample.y > 0 && sample.y < 20)
            }
            if (engine === 'chromium' && width !== 768)
              await page.screenshot({ path: resolve(output, `${id}-services-entering.png`) })
            await card.evaluate((node) =>
              node.getAnimations().forEach((animation) => animation.finish()),
            )
            const before = await page.evaluate(
              () => window.motionLog.filter((item) => item.name === 'business-service-card').length,
            )
            await page.evaluate(() => scrollTo(0, 0))
            await card.scrollIntoViewIfNeeded()
            await page.waitForTimeout(160)
            assert.equal(
              await page.evaluate(
                () =>
                  window.motionLog.filter((item) => item.name === 'business-service-card').length,
              ),
              before,
            )
            if (engine === 'chromium' && width !== 768) {
              await page.waitForTimeout(600)
              await page.screenshot({ path: resolve(output, `${id}-services-settled.png`) })
            }
            await page.locator('.business-inquiry__form').scrollIntoViewIfNeeded()
            await page.locator('.business-inquiry__form input').first().fill('Motion check')
            assert.equal(
              await page.locator('.business-inquiry__form input').first().inputValue(),
              'Motion check',
            )
            assert.equal(
              await page
                .locator('.business-inquiry__form')
                .evaluate((node) => node.getAnimations().length),
              0,
              'Focused form must stop moving',
            )
            assert.ok(
              await page.evaluate(() => window.motionLog.every((item) => item.ready === 'true')),
              'Entrances must wait for the logo intro',
            )
          }
          assert.ok((await overflow(page)) <= 1, `${id}: horizontal overflow`)
          await page.waitForTimeout(600)
          if (engine === 'chromium' && width !== 768)
            await page.screenshot({ path: resolve(output, `${id}-settled.png`) })
          checks.push({ id, passed: true })
          await page.close()
        }
      }
    for (const [path, target] of [
      ['services/spinning', '.business-service-heading'],
      ['wholesale', '.offer-card'],
      ['wholesale/offers/0000000000000000000001f6', '.offer-images'],
      ['request', '.service-picker'],
      ['track', '.tracking-access'],
      ['account/login', '.auth-art'],
      ['contact', '.business-contact__illustration'],
      ['about', '.business-information>section'],
    ]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 960 } })
      await page.addInitScript(record)
      page.on('pageerror', (error) => errors.push({ path, error: error.message }))
      await page.goto(`http://127.0.0.1:5284/ar/${path}`, { waitUntil: 'networkidle' })
      await page.locator(target).first().scrollIntoViewIfNeeded()
      await page.waitForFunction((selector) => {
        const node = document.querySelector(selector)
        return node && window.motionLog.some((item) => item.name === node.className)
      }, target)
      assert.ok((await overflow(page)) <= 1)
      await page.locator('.public-footer .brand-link').click()
      await page.waitForURL('**/ar')
      await page.locator('.business-service-card').first().scrollIntoViewIfNeeded()
      await page.waitForFunction(() =>
        window.motionLog.some((item) => item.name === 'business-service-card'),
      )
      checks.push({ id: `${engine}-route-${path}`, passed: true })
      await page.close()
    }
    const page = await browser.newPage({ viewport: { width: 768, height: 960 } })
    await page.goto('http://127.0.0.1:5284/en')
    await page.route('**/__page-motion.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: source }),
    )
    await page.evaluate(async () => {
      document.body.replaceChildren()
      const { startPageMotion } = await import('/__page-motion.js')
      const root = document.createElement('main')
      document.body.append(root)
      window.motionRoot = root
      window.stopMotion = startPageMotion(root)
      window.addMotionTarget = () => {
        const node = document.createElement('div')
        node.className = 'account-panel'
        node.style.cssText = 'height:100px;width:300px'
        node.innerHTML = '<input aria-label="Test input">'
        root.append(node)
        return node
      }
      window.addMotionTarget()
    })
    await page.waitForFunction(
      () => document.querySelector('.account-panel').getAnimations().length > 0,
    )
    await page.locator('.account-panel input').focus()
    assert.equal(
      await page.locator('.account-panel').evaluate((node) => node.getAnimations().length),
      0,
    )
    await page.evaluate(() => window.addMotionTarget())
    await page.waitForFunction(
      () => document.querySelectorAll('.account-panel')[1].getAnimations().length > 0,
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.account-panel')].every(
        (node) => node.getAnimations().length === 0,
      ),
    )
    await page.evaluate(() => window.addMotionTarget())
    await page.waitForTimeout(160)
    assert.equal(
      await page
        .locator('.account-panel')
        .last()
        .evaluate((node) => node.getAnimations().length),
      0,
    )
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.evaluate(() => window.addMotionTarget())
    await page.waitForFunction(
      () => document.querySelectorAll('.account-panel')[3].getAnimations().length > 0,
    )
    await page.evaluate(() => window.stopMotion())
    assert.equal(
      await page
        .locator('.account-panel')
        .last()
        .evaluate((node) => node.getAnimations().length),
      0,
    )
    await page.evaluate(() => window.addMotionTarget())
    await page.waitForTimeout(160)
    assert.equal(
      await page
        .locator('.account-panel')
        .last()
        .evaluate((node) => node.getAnimations().length),
      0,
    )
    checks.push({ id: `${engine}-dynamic-focus-reduced-cleanup`, passed: true })
    await page.close()
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({
        javaScriptEnabled: reducedMotion === 'reduce',
        reducedMotion,
      })
      await page.goto('http://127.0.0.1:5284/en/', { waitUntil: 'networkidle' })
      await page.locator('.business-service-card').first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      assert.equal(
        await page
          .locator('.business-service-card')
          .first()
          .evaluate((node) => getComputedStyle(node).opacity),
        '1',
      )
      assert.equal(
        await page
          .locator('.business-service-card')
          .first()
          .evaluate((node) => node.getAnimations().length),
        0,
      )
      checks.push({
        id: `${engine}-${reducedMotion === 'reduce' ? 'reduced' : 'no-js'}-visible`,
        passed: true,
      })
      await page.close()
    }
    console.log(`${engine}: completed page-motion checks`)
  } finally {
    await browser.close()
  }
}
assert.deepEqual(errors, [])
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2))
console.log(`${checks.length} page-motion checks passed; no page errors.`)
