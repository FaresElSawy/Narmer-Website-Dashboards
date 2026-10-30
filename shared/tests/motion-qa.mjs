import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const browser = await chromium.launch({ headless: true })
const output = resolve('output/playwright/phase-1/motion')
await mkdir(output, { recursive: true })
const checks = [],
  errors = []
const observe = (page) => {
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
}
const closed = (page) =>
  page.waitForFunction(
    () => document.querySelector('.category-navigation')?.dataset.open === 'false',
  )
const sampleArrowTransition = async (node) => {
  const animations = node.getAnimations()
  const duration = getComputedStyle(node).transitionDuration
  for (const item of animations) {
    item.pause()
    item.currentTime = 100
  }
  const middle = getComputedStyle(node).transform
  await Promise.all(
    animations.map((item) => {
      item.play()
      return item.finished.catch(() => {})
    }),
  )
  return { duration, middle, end: getComputedStyle(node).transform, count: animations.length }
}
try {
  for (const [store, port] of [
    ['b2c', 5283],
    ['b2b', 5284],
  ]) {
    for (const language of ['en', 'ar']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
      observe(page)
      await page.route('**/*.webp', async (route) => {
        if (/campaign-|spinning-|fabric-/.test(route.request().url()))
          await new Promise((resolve) => setTimeout(resolve, 1800))
        await route.continue()
      })
      const start = Date.now()
      await page.goto(`http://127.0.0.1:${port}/${language}/`, { waitUntil: 'domcontentloaded' })
      await page.locator('.site-loader').waitFor({ state: 'visible' })
      await page.locator('.site-loader img').evaluate((image) => image.decode())
      await page.locator('.site-loader-brand').evaluate((node) =>
        node.getAnimations().forEach((animation) => {
          animation.pause()
          animation.currentTime = 600
        }),
      )
      await page.screenshot({ path: resolve(output, `${store}-${language}-logo-intro.png`) })
      await page.locator('.site-loader').waitFor({ state: 'hidden', timeout: 1600 })
      assert.equal(await page.locator('.site-loader').count(), 0)
      checks.push({
        name: `${store}-${language}-intro-deadline`,
        passed: true,
        elapsedMs: Date.now() - start,
      })
      await page.close()
    }
  }

  for (const language of ['en', 'ar']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    observe(page)
    await page.goto(`http://127.0.0.1:5283/${language}/`, { waitUntil: 'networkidle' })
    await page.locator('.site-loader').waitFor({ state: 'hidden' })
    const trigger = page.getByRole('button', {
      name: language === 'ar' ? 'رجالي' : 'Men',
      exact: true,
    })
    const mainTop = await page.locator('#main').evaluate((node) => node.getBoundingClientRect().top)
    await trigger.hover()
    await page.waitForFunction(
      () => document.querySelector('.category-navigation')?.dataset.open === 'true',
    )
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true')
    assert.equal(
      await page.locator('#main').evaluate((node) => node.getBoundingClientRect().top),
      mainTop,
      'Dropdown shifted page layout',
    )
    const arrow = trigger.locator('.dropdown-chevron')
    const animation = await arrow.evaluate(sampleArrowTransition)
    assert.equal(animation.duration, '0.2s')
    assert.ok(animation.count > 0, 'No smooth arrow transition started')
    assert.notEqual(animation.middle, animation.end)
    await page.locator('.category-navigation').hover()
    await page.waitForTimeout(170)
    assert.equal(
      await trigger.getAttribute('aria-expanded'),
      'true',
      'Menu closed while moving into its panel',
    )
    await page.screenshot({ path: resolve(output, `${language}-desktop-hover.png`) })
    await page.mouse.move(8, 900)
    await closed(page)
    const closingAnimation = await arrow.evaluate(sampleArrowTransition)
    assert.ok(closingAnimation.count > 0, 'No smooth closing arrow transition started')
    assert.notEqual(closingAnimation.middle, closingAnimation.end)
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await page.waitForFunction(
      () => document.querySelector('.category-navigation a') === document.activeElement,
    )
    assert.equal(await arrow.evaluate((node) => getComputedStyle(node).transitionDuration), '0s')
    await page.keyboard.press('Escape')
    assert.equal(await trigger.evaluate((node) => node === document.activeElement), true)
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
    checks.push({
      name: `${language}-desktop-hover-arrow-keyboard`,
      passed: true,
      animation,
      closingAnimation,
    })
    await page.close()

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const mobile = await context.newPage()
    observe(mobile)
    await mobile.goto(`http://127.0.0.1:5283/${language}/`, { waitUntil: 'networkidle' })
    await mobile
      .getByRole('button', { name: language === 'ar' ? 'القائمة' : 'Menu', exact: true })
      .tap()
    const drawer = mobile.locator('.navigation-drawer[open]')
    const toggle = drawer.getByRole('button', {
      name: language === 'ar' ? 'رجالي' : 'Men',
      exact: true,
    })
    await toggle.tap()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
    await mobile
      .locator('#mobile-category-men')
      .getByRole('link', { name: language === 'ar' ? 'كل الملابس' : 'All clothing' })
      .waitFor({ state: 'visible' })
    await mobile.waitForFunction(
      () => document.querySelector('#mobile-category-men').getBoundingClientRect().height >= 96,
    )
    await mobile.screenshot({ path: resolve(output, `${language}-mobile-tap.png`) })
    await toggle.tap()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(await mobile.locator('#mobile-category-men').getAttribute('aria-hidden'), 'true')
    await mobile.waitForFunction(
      () => document.querySelector('#mobile-category-men').getBoundingClientRect().height === 0,
    )
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    )
    checks.push({ name: `${language}-mobile-touch-accordion`, passed: true })
    await context.close()
  }

  for (const [store, port] of [
    ['b2c', 5283],
    ['b2b', 5284],
  ]) {
    for (const language of ['en', 'ar']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' })
      const page = await context.newPage()
      observe(page)
      await page.goto(`http://127.0.0.1:${port}/${language}/`, { waitUntil: 'networkidle' })
      assert.equal(await page.locator('.site-loader').count(), 0)
      assert.equal(
        await page
          .locator('.campaign-copy h1')
          .evaluate((node) => getComputedStyle(node).animationName),
        'none',
      )
      if (store === 'b2c')
        assert.equal(
          await page
            .locator('.desktop-navigation .dropdown-chevron')
            .first()
            .evaluate((node) => getComputedStyle(node).transitionProperty),
          'none',
        )
      checks.push({ name: `${store}-${language}-reduced-motion`, passed: true })
      await context.close()
    }
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:${port}/en/`, { waitUntil: 'domcontentloaded' })
    await page.locator('.site-loader').waitFor({ state: 'hidden', timeout: 2000 })
    assert.ok((await page.locator('h1').innerText()).length > 0)
    checks.push({ name: `${store}-no-js-loader-fail-open`, passed: true })
    await context.close()
  }
} finally {
  await browser.close()
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2))
}
console.log(JSON.stringify({ passed: checks.length, errors }, null, 2))
assert.equal(errors.length, 0)
