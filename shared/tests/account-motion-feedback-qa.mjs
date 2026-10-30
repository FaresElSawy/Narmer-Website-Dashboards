import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const b2b = process.argv.includes('--b2b')
const origin = `http://127.0.0.1:${b2b ? 5284 : 5283}`
const browser = await chromium.launch({ headless: true })

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.tabAnimations = 0
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      if (this.classList.contains('account-content')) window.tabAnimations++
      return animate.apply(this, args)
    }
  })
  const language = 'en'
  page.setDefaultTimeout(12000)

  async function checkFeedback(path, expectsAction = false) {
    if (path) await page.goto(`${origin}/${language}/${path}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const feedback = page
      .locator('.feedback:not(.feedback--loading)')
      .filter({ has: page.locator('.button') })
      .first()
    if (expectsAction) await feedback.waitFor()
    if (expectsAction)
      assert.equal(await feedback.count(), 1, `${path}: expected an actionable empty state`)
    if (await feedback.count()) {
      const message = await feedback.locator('p,strong').last().boundingBox()
      const action = await feedback.locator('.button').boundingBox()
      if (message && action) {
        assert.ok(action.y - (message.y + message.height) >= 15, `${path}: CTA gap is below 16px`)
        const panel = await feedback.boundingBox()
        assert.ok(
          panel && Math.abs(action.x + action.width / 2 - (panel.x + panel.width / 2)) <= 2,
          `${path}: CTA is not centered`,
        )
      }
    }
  }

  if (!b2b) {
    await checkFeedback('cart', true)
    await checkFeedback('wishlist', true)
    await page.goto(`${origin}/${language}/account/register`)
    await page.locator('input[name="name"]').fill('Motion Review')
    await page.locator('input[name="email"]').fill(`motion-${Date.now()}@example.test`)
    await page.locator('input[name="phone"]').fill('+201001234567')
    await page.locator('input[name="password"]').fill('NarmerDemo123')
    await page.locator('.auth-panel form button[type="submit"]').click()
    await page.waitForURL(`**/${language}/account/verify`)
    await page.locator('input[name="otp"]').fill('012345')
    await page.locator('.auth-panel form button[type="submit"]').click()
    await page.waitForURL(`**/${language}/account/login`)
    await page.locator('input[name="password"]').fill('NarmerDemo123')
    await page.locator('.auth-panel form button[type="submit"]').click()
    await page.waitForURL(`**/${language}/account`)
    await page.locator('.account-nav a[href$="/orders"]').click()
    await checkFeedback(null, true)

    for (const path of ['/account', '/account/profile', '/account/addresses', '/orders']) {
      {
        await page.locator(`.account-nav a[href="/${language}${path}"]`).click()
        await page.waitForURL(`**/${language}${path}`)
      }
      assert.equal(await page.locator('h1:visible').count(), 1, `${path}: expected one visible h1`)
    }
    await page.locator(`.account-nav a[href="/${language}/account"]`).click()
    await page.evaluate(() => window.scrollTo(0, 200))
    const before = await page.evaluate(() => scrollY)
    await page.locator(`.account-nav a[href="/${language}/account/profile"]`).click()
    await page.waitForURL(`**/${language}/account/profile`)
    assert.equal(
      await page.evaluate(() => scrollY),
      before,
      'internal account tab changed scroll position',
    )
    assert.ok(
      await page.evaluate(() => window.tabAnimations > 0),
      'account content transition was not started',
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const animationsBefore = await page.evaluate(() => window.tabAnimations)
    await page.locator(`.account-nav a[href="/${language}/account/addresses"]`).click()
    await page.locator('.address-form').waitFor()
    assert.equal(await page.evaluate(() => window.tabAnimations), animationsBefore)
    await context.close()
  } else {
    await checkFeedback('missing-route', true)
  }
  console.log(`${b2b ? 'B2B' : 'B2C'} feedback and account motion checks passed.`)
} finally {
  await browser.close()
}
