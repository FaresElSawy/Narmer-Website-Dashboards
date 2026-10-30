import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve('output/playwright/phase-2-feedback')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  runtimeErrors = []
const filter = process.env.NARMER_FEEDBACK_FILTER
const servicePaths = [
  '/services/spinning',
  '/services/weaving',
  '/services/fabric',
  '/services/school-uniforms',
  '/wholesale',
]
async function layout(page) {
  await page.locator('h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  const result = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    broken: [...document.images]
      .filter((img) => img.getClientRects().length && img.complete && !img.naturalWidth)
      .map((img) => img.src),
    clipped: [...document.querySelectorAll('h1,h2,h3,.button')]
      .filter((node) => node.getClientRects().length && node.scrollWidth > node.clientWidth + 3)
      .map((node) => node.textContent),
  }))
  assert.ok(result.scroll <= result.width + 1, JSON.stringify(result))
  assert.deepEqual(result.broken, [])
  assert.deepEqual(result.clipped, [])
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 1024, 768, 390, 320]) {
        for (const [store, port] of [
          ['b2b', 5284],
          ['b2c', 5283],
        ]) {
          const id = `${engine}-${store}-${language}-${width}`
          if (filter && !new RegExp(filter).test(id)) continue
          let stage = 'initial layout'
          const context = await browser.newContext({
            viewport: { width, height: 1000 },
            hasTouch: width < 768,
            reducedMotion: 'reduce',
          })
          const page = await context.newPage()
          page.setDefaultTimeout(5000)
          page.on('pageerror', (error) => runtimeErrors.push({ id, error: error.message }))
          page.on('console', (msg) => {
            if (msg.type() === 'error' && /hydration|Minified React|TypeError/.test(msg.text()))
              runtimeErrors.push({ id, error: msg.text() })
          })
          try {
            await page.goto(`http://127.0.0.1:${port}/${language}`, { waitUntil: 'networkidle' })
            await layout(page)
            const home = language === 'ar' ? 'الرئيسية' : 'Home'
            const menuName =
              store === 'b2b'
                ? language === 'ar'
                  ? 'الخدمات'
                  : 'Services'
                : language === 'ar'
                  ? 'رجالي'
                  : 'Men'
            let links
            if (width >= 1024) {
              const nav = page.locator('.desktop-navigation')
              assert.equal(await nav.locator(':scope > a').first().textContent(), home)
              assert.equal(await nav.getByRole('link', { name: home, exact: true }).count(), 1)
              const trigger = nav.getByRole('button', { name: menuName, exact: true })
              stage = 'desktop hover open'
              await trigger.hover()
              await page.waitForFunction(
                () => document.querySelector('#category-navigation').dataset.open === 'true',
              )
              links = await page
                .locator('#category-navigation a')
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))
              if (store === 'b2b') {
                const geometry = await page.locator('#category-navigation').boundingBox(),
                  button = await trigger.boundingBox()
                assert.equal(geometry.width, 260)
                assert.ok(
                  Math.abs(geometry.y - button.y - button.height) < 1,
                  'Menu must sit directly below Services',
                )
                assert.ok(geometry.x >= 0 && geometry.x + geometry.width <= width)
                if (engine === 'chromium' && width === 1440)
                  await page.screenshot({ path: resolve(output, `${id}-menu.png`) })
              }
              await page.mouse.move(2, 950)
              stage = 'desktop pointer leave'
              await page.waitForFunction(
                () => document.querySelector('#category-navigation').dataset.open === 'false',
              )
              await trigger.focus()
              await page.keyboard.press('ArrowDown')
              stage = 'ArrowDown focuses first link'
              await page.waitForFunction(
                () => document.querySelector('#category-navigation a') === document.activeElement,
              )
              await page.keyboard.press('Escape')
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
              assert.equal(await trigger.evaluate((node) => node === document.activeElement), true)
            } else {
              await page.locator('.mobile-menu-button').click()
              const drawer = page.locator('.navigation-drawer[open]')
              assert.equal(await drawer.getByRole('link', { name: home, exact: true }).count(), 1)
              const toggle = drawer.getByRole('button', { name: menuName, exact: true })
              await toggle.click()
              assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
              const selector = `#mobile-category-${store === 'b2b' ? 'services' : 'men'}`
              links = await drawer
                .locator(`${selector} a`)
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))
              await toggle.click()
              assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
              await drawer.getByRole('link', { name: home, exact: true }).click()
              await drawer.waitFor({ state: 'hidden' })
            }
            if (store === 'b2b') {
              const paths = servicePaths.map((path) => `/${language}${path}`)
              assert.deepEqual(links, paths)
              assert.deepEqual(
                await page
                  .locator('.business-service-card')
                  .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
                paths,
              )
              assert.deepEqual(
                await page
                  .locator('.public-footer nav')
                  .first()
                  .locator('a')
                  .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
                paths,
              )
              const geometry = await page.evaluate(() => {
                const rect = (selector) =>
                  document.querySelector(selector).getBoundingClientRect().toJSON()
                return {
                  card: rect('.business-inquiry__form'),
                  contact: rect('.inquiry-contact-fields'),
                  project: rect('.inquiry-project-column'),
                  upload: rect('.reference-upload'),
                  firstContact: rect('.inquiry-contact-fields .field'),
                  firstProject: rect('.inquiry-project-column .field'),
                  steps: [...document.querySelectorAll('.business-step')].map((node) => {
                    const box = node.getBoundingClientRect(),
                      label = node.querySelector('.business-step__label').getBoundingClientRect()
                    return {
                      centerDifference: Math.abs(
                        box.x + box.width / 2 - (label.x + label.width / 2),
                      ),
                      divider: getComputedStyle(node, '::after').height,
                    }
                  }),
                }
              })
              if (width >= 640) {
                assert.ok(Math.abs(geometry.contact.y - geometry.project.y) < 1)
                assert.ok(Math.abs(geometry.firstContact.y - geometry.firstProject.y) < 1)
                assert.ok(geometry.upload.y >= geometry.contact.bottom)
                assert.ok(Math.abs(geometry.upload.x - geometry.contact.x) < 1)
              }
              for (const step of geometry.steps) assert.ok(step.centerDifference < 1)
              assert.equal(geometry.steps[0].divider, '1px')
              if (engine === 'chromium' && [1440, 390].includes(width)) {
                await page.locator('#main').focus()
                await page
                  .locator('.business-inquiry')
                  .screenshot({ path: resolve(output, `${id}-form.png`) })
                await page
                  .locator('.business-steps')
                  .screenshot({ path: resolve(output, `${id}-steps.png`) })
              }
              checks.push({ id: `${id}-form-navigation`, formHeight: geometry.card.height })
              for (const path of servicePaths) {
                await page.goto(`http://127.0.0.1:${port}/${language}${path}`, {
                  waitUntil: 'networkidle',
                })
                await layout(page)
                if (path !== '/wholesale') {
                  assert.equal(await page.locator('.business-service-family tbody tr').count(), 3)
                  const image = await page
                    .locator('.business-service-illustration img')
                    .evaluate((node) => ({
                      width: node.clientWidth,
                      height: node.clientHeight,
                      radius: getComputedStyle(node).borderRadius,
                    }))
                  assert.equal(image.radius, '20px')
                  assert.ok(
                    Math.abs(image.width / image.height - (width < 640 ? 342 / 260 : 1280 / 440)) <
                      0.02,
                  )
                  const spacing = await page.evaluate(() => ({
                    imageBottom: document
                      .querySelector('.business-service-illustration')
                      .getBoundingClientRect().bottom,
                    introductionTop: document
                      .querySelector('.business-service-columns')
                      .getBoundingClientRect().top,
                  }))
                  assert.ok(
                    spacing.introductionTop - spacing.imageBottom >= 31,
                    'Image overlaps the service introduction',
                  )
                  const request = await page.locator('.business-service-cta a').getAttribute('href')
                  assert.equal(request, `/${language}/request?service=${path.split('/').at(-1)}`)
                }
                if (
                  engine === 'chromium' &&
                  [1440, 390].includes(width) &&
                  ['/services/fabric', '/wholesale'].includes(path)
                )
                  await page.screenshot({
                    path: resolve(output, `${id}-${path.split('/').at(-1)}.png`),
                    fullPage: true,
                  })
                checks.push({ id: `${id}${path}` })
              }
            } else checks.push({ id: `${id}-navigation` })
          } catch (error) {
            failures.push({
              id,
              stage,
              error: error.message,
              active: await page.evaluate(() => document.activeElement?.outerHTML),
            })
            await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true })
          }
          await context.close()
        }
        if (
          !filter ||
          new RegExp(filter).test(`${engine}-b2b-${language}-${width}`) ||
          new RegExp(filter).test(`${engine}-b2c-${language}-${width}`)
        )
          console.log(`${engine} ${language} ${width}: navigation, forms and services checked`)
      }
    if (engine === 'chromium' && !filter)
      for (const language of ['en', 'ar']) {
        const context = await browser.newContext({
          viewport: { width: language === 'en' ? 1440 : 390, height: 1000 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        const id = `${language}-embedded-form-upload-review-and-old-route`
        try {
          await page.goto(`http://127.0.0.1:5284/${language}`)
          for (const [key, value] of Object.entries({
            name: 'Mariam Hassan',
            phone: '01001234567',
            governorate: 'Cairo',
            district: 'Nasr City',
          }))
            await page.locator(`#question-contact-${key}`).fill(value)
          await page
            .locator('#question-answer-description')
            .fill('Discuss fabric and production requirements.')
          await page.locator('#question-answer-has-design').selectOption('no')
          await page.locator('input[type=file]').setInputFiles({
            name: 'reference.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
              'base64',
            ),
          })
          await page
            .getByText(language === 'ar' ? 'إرفاق الصورة 1' : 'Include reference 1', {
              exact: false,
            })
            .waitFor()
          await page
            .getByRole('button', {
              name: language === 'ar' ? 'مراجعة الطلب' : 'Review your request',
              exact: true,
            })
            .click()
          await page.waitForURL(`**/${language}/request/review`)
          await layout(page)
          await page.goto(`http://127.0.0.1:5284/${language}/services/wholesale`)
          await page.waitForURL(`**/${language}/wholesale`)
          assert.equal(await page.locator('.business-service-page').count(), 0)
          checks.push({ id })
        } catch (error) {
          failures.push({ id, error: error.message })
        }
        await context.close()
      }
  } finally {
    await browser.close()
  }
}
await writeFile(
  resolve(output, filter ? 'targeted-results.json' : 'results.json'),
  JSON.stringify({ passed: checks.length, checks, failures, runtimeErrors }, null, 2),
)
console.log(JSON.stringify({ passed: checks.length, failures, runtimeErrors }, null, 2))
if (failures.length || runtimeErrors.length) process.exitCode = 1
