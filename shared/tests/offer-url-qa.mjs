import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { createReviewInquiry } from '../../B2B-Website/src/features/inquiry/fixtures.js'

const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const output = resolve(process.env.NARMER_QA_OUTPUT || 'output/playwright/offer-urls')
await mkdir(output, { recursive: true })
const checks = [],
  errors = [],
  calls = []
const id = '0000000000000000000001f4'
const routes = JSON.parse(await readFile('B2B-Website/dist/routes.json', 'utf8'))
for (const language of ['en', 'ar']) {
  const legacy = `/${language}/wholesale/offers/${id}`,
    canonical = `/${language}/wholesale/offers/logo-hoodie`
  const response = await fetch(`http://127.0.0.1:5284${legacy}?source=test`, { redirect: 'manual' })
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), `${canonical}?source=test`)
  const alias = await fetch(
    `http://127.0.0.1:5284/${language}/wholesale/offers/classic-logo-hoodie?source=alias`,
    { redirect: 'manual' },
  )
  assert.equal(alias.status, 308)
  assert.equal(alias.headers.get('location'), `${canonical}?source=alias`)
  const html = await (await fetch(`http://127.0.0.1:5284${canonical}`)).text()
  assert.ok(html.includes(`"narmer-page-route">"${canonical}"`))
  assert.ok(routes.pages.some((page) => page.url === canonical))
  assert.ok(!routes.pages.some((page) => page.url === legacy))
  checks.push({ id: `${language}-redirect-and-public-html`, passed: true })
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const language of ['en', 'ar'])
      for (const width of [1440, 390]) {
        const page = await browser.newPage({
          viewport: { width, height: 960 },
          reducedMotion: 'reduce',
        })
        page.setDefaultTimeout(7000)
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        await page.goto(`http://127.0.0.1:5284/${language}/wholesale`, { waitUntil: 'networkidle' })
        const card = page.locator('.offer-card').first()
        assert.equal(await card.getAttribute('href'), `/${language}/wholesale/offers/logo-hoodie`)
        await card.click()
        await page.waitForURL(`**/${language}/wholesale/offers/logo-hoodie`)
        await page.reload({ waitUntil: 'networkidle' })
        assert.equal(
          await page.locator('.offer-details h1').innerText(),
          language === 'ar' ? 'هودي بشعار' : 'Logo hoodie',
        )
        const other = language === 'ar' ? 'en' : 'ar'
        let languageLink = page.locator('.public-header .language-link:visible').first()
        if (!(await languageLink.count())) {
          await page
            .getByRole('button', { name: language === 'ar' ? 'القائمة' : 'Menu', exact: true })
            .click()
          languageLink = page.locator('.navigation-drawer[open] .language-link')
        }
        await languageLink.click()
        await page.waitForURL(`**/${other}/wholesale/offers/logo-hoodie`)
        await page.goto(
          `http://127.0.0.1:5284/${language}/wholesale/offers/${id}?source=old#reference`,
          { waitUntil: 'networkidle' },
        )
        assert.equal(new URL(page.url()).pathname, `/${language}/wholesale/offers/logo-hoodie`)
        assert.equal(new URL(page.url()).search, '?source=old')
        assert.equal(new URL(page.url()).hash, '#reference')
        if (engine === 'chromium')
          await page.screenshot({
            path: resolve(output, `${language}-${width}-readable-offer.png`),
          })
        await page.locator('#offer-quantity').fill('3')
        await page
          .getByRole('button', {
            name: language === 'ar' ? 'إضافة إلى الطلب' : 'Add to request',
            exact: true,
          })
          .click()
        await page.waitForURL(`**/${language}/request`)
        assert.equal(
          await page.locator('.selected-offer-heading h3').innerText(),
          language === 'ar' ? 'هودي بشعار' : 'Logo hoodie',
        )
        assert.equal(await page.locator('.pouch-summary input').inputValue(), '3')
        checks.push({
          id: `${engine}-${language}-${width}-card-refresh-language-legacy-request`,
          passed: true,
        })
        await page.close()
      }
    const page = await browser.newPage({ reducedMotion: 'reduce' })
    const callStart = calls.length
    page.on('pageerror', (error) => errors.push(error.message))
    const review = createReviewInquiry({
      images: { logo: 'http://127.0.0.1:5284/assets/images/offer-logo-DNj3S-E9.webp' },
    })
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        path = url.pathname.replace('/api/v1/b2b', ''),
        language = request.headers()['x-language'] || 'en'
      calls.push({ path, query: url.search, language, method: request.method() })
      let data,
        status = 200,
        code = 'OK'
      if (path === '/auth/refresh') {
        status = 401
        code = 'UNAUTHORIZED'
      } else if (path === '/homepage' || path === '/site-settings') data = null
      else if (path === '/forms') data = await review.forms(language)
      else if (path === '/wholesale/offers')
        data = await review.offers(Object.fromEntries(url.searchParams), language)
      else if (path.startsWith('/wholesale/offers/resolve/')) {
        try {
          data = await review.resolveOffer(path.split('/').at(-1), language)
        } catch (error) {
          status = error.status
          code = error.code
        }
      } else if (path.startsWith('/wholesale/offers/')) {
        const value = path.split('/').at(-1)
        assert.match(value, /^[a-f0-9]{24}$/)
        data = await review.offer(value, language)
      } else {
        status = 404
        code = 'NOT_FOUND'
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: status === 200, code, data }),
      })
    })
    await page.goto('http://127.0.0.1:5294/ar/wholesale/offers/logo-hoodie', {
      waitUntil: 'networkidle',
    })
    await page.locator('.offer-details h1').waitFor()
    assert.equal(await page.locator('.offer-details h1').innerText(), 'هودي بشعار')
    assert.ok(!calls.slice(callStart).some((call) => call.path === '/wholesale/offers'))
    assert.ok(
      calls.some(
        (call) => call.path === '/wholesale/offers/resolve/logo-hoodie' && call.language === 'ar',
      ),
    )
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.offer-details h1').waitFor()
    await page.goto(`http://127.0.0.1:5294/en/wholesale/offers/${id}`, { waitUntil: 'networkidle' })
    await page.waitForURL('**/en/wholesale/offers/logo-hoodie')
    await page.goto('http://127.0.0.1:5294/en/wholesale/offers/not-a-real-product', {
      waitUntil: 'networkidle',
    })
    await page.locator('.inquiry-alert').waitFor()
    await page.goto('http://127.0.0.1:5294/en/services/wholesale', { waitUntil: 'networkidle' })
    await page.locator('.offer-card').first().waitFor()
    assert.ok((await page.locator('h1').innerText()).includes('Wholesale'))
    assert.ok(
      calls
        .filter((call) => call.path.startsWith('/wholesale/offers/'))
        .every((call) => call.path.startsWith('/wholesale/offers/resolve/')),
    )
    assert.ok(calls.every((call) => call.method === 'GET' || call.path === '/auth/refresh'))
    checks.push({
      id: `${engine}-intercepted-api-unseeded-slug-refresh-legacy-missing`,
      passed: true,
    })
    await page.close()
  } finally {
    await browser.close()
  }
  console.log(`${engine}: readable offer URLs checked`)
}
await writeFile(resolve(output, 'results.json'), JSON.stringify({ checks, errors, calls }, null, 2))
assert.deepEqual(errors, [])
console.log(
  `${checks.length} saved URL checks passed; public pages use the resolver and inquiry selections retain IDs.`,
)
