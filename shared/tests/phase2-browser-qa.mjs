import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
async function choose(page, id, value) {
  const control = page.locator(`#${id}`),
    text = await control.locator('..').locator(`select option[value="${value}"]`).innerText()
  await control.click()
  await page.getByRole('listbox').getByRole('option', { name: text, exact: true }).click()
}
const output = resolve(process.env.NARMER_QA_OUTPUT || 'output/playwright/phase-2')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  runtimeErrors = []
const routes = [
  '',
  '/services/spinning',
  '/services/weaving',
  '/services/fabric',
  '/services/school-uniforms',
  '/services/wholesale',
  '/wholesale',
  '/wholesale/offers/0000000000000000000001f6',
  '/contact',
  '/about',
  '/privacy',
  '/terms',
  '/request',
  '/request/review',
  '/track',
  '/requests',
  '/account/login',
  '/account/register',
  '/account/verify',
  '/account/forgot-password',
  '/account/reset-password',
]
async function audit(page, id, language, screenshot = false) {
  await page.locator('h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  const data = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    dir: document.documentElement.dir,
    font: getComputedStyle(document.querySelector('h1')).fontFamily,
    broken: [...document.images]
      .filter((image) => image.getClientRects().length && image.complete && !image.naturalWidth)
      .map((image) => image.src),
    clipped: [...document.querySelectorAll('h1,h2,.button,.labelled-rows dd,input,select,textarea')]
      .filter(
        (node) =>
          node.getClientRects().length &&
          node.scrollWidth > node.clientWidth + 3 &&
          !node.matches('input,textarea,select'),
      )
      .map((node) => node.textContent),
    robots: document.querySelector('meta[name=robots]')?.content,
  }))
  assert.ok(data.scroll <= data.width + 1, `${id}: overflow ${data.scroll}/${data.width}`)
  assert.equal(data.dir, language === 'ar' ? 'rtl' : 'ltr')
  assert.match(data.font, language === 'ar' ? /Cairo/ : /Poppins/)
  assert.equal(data.robots, 'noindex, nofollow')
  assert.deepEqual(data.broken, [], `${id}: broken images`)
  assert.deepEqual(data.clipped, [], `${id}: clipped text`)
  if (screenshot) {
    await page.evaluate(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    )
    await page.screenshot({ path: resolve(output, `${id}.png`), fullPage: true })
  }
  checks.push({ id, ...data })
}
async function details(page, language) {
  await page
    .locator('#question-contact-name')
    .fill(language === 'ar' ? 'مريم أحمد' : 'Mariam Hassan')
  await page.locator('#question-contact-phone').fill('+20 (100) 123-4567')
  assert.equal(await page.locator('#question-contact-phone').inputValue(), '+20 (100) 123-4567')
  await page.locator('#question-contact-governorate').fill(language === 'ar' ? 'القاهرة' : 'Cairo')
  await page
    .locator('#question-contact-district')
    .fill(language === 'ar' ? 'مدينة نصر' : 'Nasr City')
  await page
    .locator('#question-answer-project-name')
    .fill(language === 'ar' ? 'ملابس فريق المدرسة' : 'School team clothing')
  await page.locator('#question-answer-quantity').fill('0')
  await page
    .locator('#question-answer-description')
    .fill(
      language === 'ar'
        ? 'نرغب في مناقشة الخامات والتصميم والموعد المناسب.'
        : 'We would like to discuss the material, design and suitable timing.',
    )
  await choose(page, 'question-answer-material-source', 'discuss')
  await page.getByLabel(language === 'ar' ? 'عينات' : 'Samples', { exact: true }).check()
  await choose(page, 'question-answer-has-design', 'no')
}
for (const engine of (process.env.NARMER_ENGINES || 'chromium,firefox,webkit').split(',')) {
  let browser
  try {
    browser = await engines[engine].launch({ headless: true })
  } catch (error) {
    failures.push({ id: `${engine}-launch`, error: error.message })
    continue
  }
  try {
    for (const language of ['en', 'ar']) {
      for (const width of [1440, 1024, 768, 390, 320]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          hasTouch: width < 768,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        page.setDefaultTimeout(6000)
        page.setDefaultNavigationTimeout(10000)
        page.on('pageerror', (error) =>
          runtimeErrors.push({ engine, language, width, error: error.message }),
        )
        page.on('console', (message) => {
          if (
            message.type() === 'error' &&
            /hydration|Minified React|ReferenceError|TypeError/.test(message.text())
          )
            runtimeErrors.push({ engine, language, width, error: message.text() })
        })
        for (const route of process.env.NARMER_ROUTES
          ? process.env.NARMER_ROUTES.split(',')
          : routes) {
          const id = `${engine}-${language}-${width}-${route.replaceAll('/', '-').slice(1) || 'home'}`
          try {
            await page.goto(`http://127.0.0.1:5284/${language}${route}`, {
              waitUntil: 'networkidle',
            })
            await audit(
              page,
              id,
              language,
              engine === 'chromium' &&
                [1440, 390].includes(width) &&
                [
                  '',
                  '/services/weaving',
                  '/wholesale',
                  '/wholesale/offers/0000000000000000000001f6',
                  '/request',
                  '/account/login',
                ].includes(route),
            )
          } catch (error) {
            failures.push({ id, error: error.message })
          }
        }
        await context.close()
        console.log(`${engine} ${language} ${width}: layout group checked`)
      }
      const width = language === 'ar' ? 390 : 1440
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: width < 768,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      page.setDefaultTimeout(6000)
      page.on('pageerror', (error) =>
        runtimeErrors.push({ engine, language, flow: true, error: error.message }),
      )
      try {
        await page.goto(
          `http://127.0.0.1:5284/${language}/wholesale/offers/0000000000000000000001f6`,
        )
        await page.locator('#offer-quantity').fill('2')
        await page
          .getByRole('button', {
            name: language === 'ar' ? 'إضافة إلى الطلب' : 'Add to request',
            exact: true,
          })
          .click()
        await page.waitForURL(`**/${language}/request`)
        assert.equal(
          await page.locator('#request-service').locator('..').locator('select').inputValue(),
          'wholesale',
        )
        await details(page, language)
        const upload = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
          'base64',
        )
        await page
          .locator('input[type=file]')
          .setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: upload })
        await page
          .getByText(language === 'ar' ? 'إرفاق الصورة 1' : 'Include reference 1', { exact: false })
          .waitFor()
        await page
          .getByRole('button', {
            name: language === 'ar' ? 'مراجعة الطلب' : 'Review your request',
            exact: true,
          })
          .click()
        await page.waitForURL(`**/${language}/request/review`)
        await audit(page, `${engine}-${language}-populated-review`, language, engine === 'chromium')
        await page
          .getByRole('button', {
            name: language === 'ar' ? 'إرسال الطلب' : 'Submit request',
            exact: true,
          })
          .click()
        await page.waitForURL('**/request/received/*')
        await audit(page, `${engine}-${language}-receipt`, language, engine === 'chromium')
        await page
          .getByRole('link', {
            name: language === 'ar' ? 'عرض حالة الطلب' : 'View request status',
            exact: true,
          })
          .click()
        await page.locator('.request-snapshot').waitFor()
        await audit(page, `${engine}-${language}-tracking`, language, engine === 'chromium')
        assert.equal(new URL(page.url()).hash, '')
        assert.equal(
          await page.locator('.request-snapshot').getByText('0', { exact: true }).count(),
          1,
        )
        checks.push({ id: `${engine}-${language}-whole-pouch-guest-flow`, passed: true })
      } catch (error) {
        failures.push({ id: `${engine}-${language}-guest-flow`, error: error.message })
        await page.screenshot({
          path: resolve(output, `${engine}-${language}-flow-failure.png`),
          fullPage: true,
        })
      }
      try {
        await page.goto(`http://127.0.0.1:5284/${language}/account/login`)
        await page.locator('input[name=password]').fill('NarmerDemo123')
        await page.locator('.auth-submit').click()
        await page.waitForURL(`**/${language}/account`)
        await page.locator('.account-links a[href$="profile"]').click()
        await page
          .locator('input[name=name]')
          .fill(language === 'ar' ? 'مريم حسن' : 'Mariam Hassan')
        await page.locator('.profile-form button[type=submit]').click()
        await page.locator('.feedback--success').waitFor()
        await audit(page, `${engine}-${language}-profile`, language, engine === 'chromium')
        await page.locator('.profile-sidebar a[href$="addresses"]').click()
        for (const [name, value] of Object.entries({
          label: 'Office',
          governorate: 'Cairo',
          building: '12A',
          street: 'Main Street',
        })) {
          await page.locator(`.address-form input[name=${name}]`).fill(value)
          assert.equal(await page.locator(`.address-form input[name=${name}]`).inputValue(), value)
        }
        await page.locator('.address-form button[type=submit]').click()
        await page.locator('.address-item').filter({ hasText: 'Office' }).waitFor()
        await audit(page, `${engine}-${language}-addresses`, language, engine === 'chromium')
        checks.push({ id: `${engine}-${language}-account-flow`, passed: true })
      } catch (error) {
        failures.push({ id: `${engine}-${language}-account-flow`, error: error.message })
        await page.screenshot({
          path: resolve(output, `${engine}-${language}-account-failure.png`),
          fullPage: true,
        })
      }
      await context.close()
    }
  } finally {
    await browser.close()
    await writeFile(
      resolve(output, 'results.json'),
      JSON.stringify(
        {
          checks,
          failures,
          runtimeErrors,
          note: 'Windows browser engines and virtual viewports/touch only. Actual Safari, iPhone and Android devices were not tested.',
        },
        null,
        2,
      ),
    )
  }
}
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify(
    {
      checks,
      failures,
      runtimeErrors,
      note: 'Windows browser engines and virtual viewports/touch only. Actual Safari, iPhone and Android devices were not tested.',
    },
    null,
    2,
  ),
)
console.log(JSON.stringify({ passed: checks.length, failures, runtimeErrors }, null, 2))
assert.equal(
  failures.length + runtimeErrors.length,
  0,
  'Phase 2 browser checks found failures; see results.json',
)
