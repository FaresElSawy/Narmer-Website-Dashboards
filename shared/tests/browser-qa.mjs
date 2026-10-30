import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

// Use the host's installed browser runtime; no Playwright production dependency.
if (!process.env.NARMER_PLAYWRIGHT_PATH)
  throw new Error('Set NARMER_PLAYWRIGHT_PATH to the installed Playwright package')
const { chromium } = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase-1')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const checks = [],
  errors = [],
  failures = []
try {
  for (const [store, port] of [
    ['b2c', 5283],
    ['b2b', 5284],
  ]) {
    for (const language of ['en', 'ar']) {
      for (const width of [1440, 1024, 768, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } })
        page.on('pageerror', (error) =>
          errors.push({ store, language, width, message: error.message }),
        )
        page.on('console', (message) => {
          if (message.type() === 'error')
            errors.push({ store, language, width, message: message.text() })
        })
        const requests = []
        page.on('request', (request) => requests.push(request.url()))
        for (const route of ['public', 'dashboard']) {
          const suffix = route === 'dashboard' ? '/dashboard' : ''
          await page.goto(`http://127.0.0.1:${port}/${language}${suffix}`, {
            waitUntil: 'networkidle',
          })
          await page.evaluate(() => document.fonts.ready)
          await page.locator('h1').waitFor()
          const geometry = await page.evaluate(() => ({
            viewport: innerWidth,
            scroll: document.documentElement.scrollWidth,
            dir: document.documentElement.dir,
            language: document.documentElement.lang,
            font: getComputedStyle(document.querySelector('h1')).fontFamily,
            loadedFonts: [...document.fonts]
              .filter((font) => font.status === 'loaded')
              .map((font) => font.family),
            brokenImages: [...document.images]
              .filter((image) => !image.complete || !image.naturalWidth)
              .map((image) => image.src),
            clipped: [
              ...document.querySelectorAll('h1,h2,.button,.workspace-user,.labelled-rows dd'),
            ]
              .filter(
                (node) => node.getClientRects().length && node.scrollWidth > node.clientWidth + 2,
              )
              .map((node) => node.textContent),
          }))
          const id = `${store}-${language}-${width}-${route}`
          try {
            assert.ok(geometry.scroll <= width + 1, `${id}: horizontal overflow ${geometry.scroll}`)
            assert.equal(geometry.dir, language === 'ar' ? 'rtl' : 'ltr')
            assert.equal(geometry.language, language)
            assert.match(geometry.font, language === 'ar' ? /Cairo/ : /Poppins/)
            assert.ok(
              geometry.loadedFonts.some((font) =>
                font.includes(language === 'ar' ? 'Cairo' : 'Poppins'),
              ),
              'Expected local font did not load',
            )
            assert.deepEqual(geometry.brokenImages, [])
            assert.deepEqual(geometry.clipped, [])
            if (route === 'public') {
              assert.equal(
                await page.locator('meta[name="robots"]').getAttribute('content'),
                'noindex, nofollow',
              )
              assert.equal(
                requests.some((url) =>
                  /\/features\/dashboard\/|Dashboard-.*\.js|\/api\/v1\//.test(url),
                ),
                false,
                'Public route loaded dashboard or contacted API',
              )
              assert.equal(
                requests.some((url) => /fonts\.(googleapis|gstatic)\.com|Brice-/.test(url)),
                false,
                'Unexpected external or retired English font request',
              )
              if (width < 1024) {
                const trigger = page.getByRole('button', {
                  name: language === 'ar' ? 'القائمة' : 'Menu',
                  exact: true,
                })
                if (store === 'b2c') {
                  const group = await page.locator('.header-actions').evaluate((node) => ({
                    gap: getComputedStyle(node).gap,
                    width: node.getBoundingClientRect().width,
                    targets: [...node.children].map((child) => [
                      child.getBoundingClientRect().width,
                      child.getBoundingClientRect().height,
                    ]),
                  }))
                  assert.equal(group.gap, '6px')
                  assert.equal(group.width, 194)
                  assert.ok(group.targets.every(([w, h]) => w === 44 && h === 44))
                }
                await trigger.click()
                await page.locator('.navigation-drawer[open]').waitFor()
                await page.keyboard.press('Escape')
                await page.locator('.navigation-drawer[open]').waitFor({ state: 'hidden' })
                assert.equal(
                  await trigger.evaluate((node) => node === document.activeElement),
                  true,
                  'Menu did not restore focus',
                )
              } else if (store === 'b2c') {
                const men = page.getByRole('button', {
                  name: language === 'ar' ? 'رجالي' : 'Men',
                  exact: true,
                })
                const arrow = men.locator('.dropdown-chevron')
                const closedArrow = await arrow.evaluate((node) => ({
                  width: getComputedStyle(node).width,
                  height: getComputedStyle(node).height,
                  transform: getComputedStyle(node).transform,
                }))
                assert.equal(await arrow.getAttribute('aria-hidden'), 'true')
                assert.equal(closedArrow.width, '12px')
                assert.equal(closedArrow.height, '12px')
                await men.click()
                assert.equal(await men.getAttribute('aria-expanded'), 'true')
                await arrow.evaluate(async (node) => {
                  await Promise.all(node.getAnimations().map((animation) => animation.finished))
                })
                assert.notEqual(
                  await arrow.evaluate((node) => getComputedStyle(node).transform),
                  closedArrow.transform,
                )
                await page.keyboard.press('Escape')
                assert.equal(await men.getAttribute('aria-expanded'), 'false')
              }
            } else {
              const open = page.getByRole('button', {
                name: language === 'ar' ? 'عرض النافذة' : 'Open dialog',
                exact: true,
              })
              await open.click()
              await page
                .getByRole('dialog', {
                  name: language === 'ar' ? 'مراجعة النافذة' : 'Dialog review',
                })
                .waitFor()
              for (let i = 0; i < 5; i++) {
                await page.keyboard.press('Tab')
                assert.equal(
                  await page.evaluate(() =>
                    Boolean(document.activeElement.closest('dialog[open]')),
                  ),
                  true,
                  'Dialog focus escaped',
                )
              }
              await page.keyboard.press('Escape')
              assert.equal(await open.evaluate((node) => node === document.activeElement), true)
              await page
                .getByRole('button', { name: language === 'ar' ? 'تحقق من الحقل' : 'Check field' })
                .click()
              assert.equal(await page.locator('input[aria-invalid="true"]').count(), 1)
              await page
                .getByRole('tab', { name: language === 'ar' ? 'فارغ' : 'Empty', exact: true })
                .focus()
              await page.keyboard.press(language === 'ar' ? 'ArrowLeft' : 'ArrowRight')
              assert.equal(
                await page
                  .getByRole('tab', {
                    name: language === 'ar' ? 'جارٍ التحميل' : 'Loading',
                    exact: true,
                  })
                  .getAttribute('aria-selected'),
                'true',
              )
              await page
                .getByRole('tab', { name: language === 'ar' ? 'فارغ' : 'Empty', exact: true })
                .click()
              if (width < 1024) {
                const menu = page.getByRole('button', {
                  name: language === 'ar' ? 'القائمة' : 'Menu',
                  exact: true,
                })
                await menu.click()
                await page.locator('.dashboard-drawer[open]').waitFor()
                await page.keyboard.press('Escape')
                assert.equal(await menu.evaluate((node) => node === document.activeElement), true)
              }
              if (width === 1440) {
                await page.getByRole('combobox').selectOption('moderator')
                assert.equal(
                  await page.locator('.dashboard-sidebar a[href$="/accounts"]').count(),
                  0,
                )
                assert.equal(
                  await page.locator('.dashboard-sidebar a[href$="/products"]').count(),
                  0,
                )
                if (store === 'b2c')
                  assert.equal(
                    await page.locator('.dashboard-sidebar a[href$="/finance"]').count(),
                    0,
                  )
                await page.getByRole('combobox').selectOption('admin')
              }
            }
            checks.push({ id, status: 'passed', geometry })
          } catch (error) {
            failures.push({ id, message: error.message, geometry })
          }
          if ([1440, 390].includes(width))
            await page.screenshot({ path: resolve(output, `${id}.png`), fullPage: true })
        }
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}
await writeFile(
  resolve(output, 'browser-results.json'),
  JSON.stringify({ checks, errors, failures }, null, 2),
)
console.log(JSON.stringify({ passed: checks.length, errors, failures }, null, 2))
assert.equal(errors.length, 0, 'Browser console/page errors')
assert.equal(failures.length, 0, 'Browser behavior or layout failures')
