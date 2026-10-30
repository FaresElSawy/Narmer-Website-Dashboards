import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH),
  results = []
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const [store, port, publicPath] of [
      ['b2c', 5295, '/products?limit=1'],
      ['b2b', 5294, '/wholesale/offers?limit=1'],
    ]) {
      const context = await browser.newContext(),
        page = await context.newPage(),
        origin = 'http://127.0.0.1:' + port
      await page.goto(origin + '/en/dashboard/login', { waitUntil: 'networkidle' })
      const publicRead = await page.evaluate(
        async ({ store, publicPath }) => {
          const response = await fetch('/api/v1/' + store + publicPath, { credentials: 'include' })
          const body = await response.json()
          return { status: response.status, code: body.code, total: body.data?.pagination?.total }
        },
        { store, publicPath },
      )
      assert.equal(publicRead.status, 200)
      assert.equal(publicRead.code, 'OK')
      const cookie = 'phase8_local_cookie_' + store,
        path = '/api/v1/' + store + '/auth'
      await context.route(origin + path + '/phase8-cookie-check', async (route) => {
        if (route.request().method() === 'POST')
          return route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie':
                cookie + '=local-test-only; Path=' + path + '; HttpOnly; Secure; SameSite=Lax',
            },
            body: '{}',
          })
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            received: (route.request().headers().cookie || '').includes(cookie + '='),
          }),
        })
      })
      const accepted = await page.evaluate(async (path) => {
        await fetch(path + '/phase8-cookie-check', { method: 'POST', credentials: 'include' })
        return (await fetch(path + '/phase8-cookie-check', { credentials: 'include' })).json()
      }, path)
      const metadata = (await context.cookies()).find((item) => item.name === cookie)
      if (engine === 'chromium') {
        assert.equal(accepted.received, true)
        assert.equal(metadata.httpOnly, true)
        assert.equal(metadata.secure, true)
        assert.equal(metadata.sameSite, 'Lax')
      }
      assert.equal(await page.evaluate((cookie) => document.cookie.includes(cookie), cookie), false)
      results.push({
        engine,
        store,
        publicRead,
        secureHttpOnlyLaxLoopbackCookie: accepted.received === true && metadata?.sameSite === 'Lax',
        limitation: accepted.received
          ? null
          : 'Secure cookie was not sent over HTTP loopback in this engine. HTTPS-host acceptance remains required.',
      })
      await context.close()
    }
  } finally {
    await browser.close()
  }
}
await writeFile('output/phase8/integration-proxy-browser.json', JSON.stringify(results, null, 2))
console.log(
  results.length +
    ' public proxy reads passed; ' +
    results.filter((result) => result.secureHttpOnlyLaxLoopbackCookie).length +
    ' Secure HttpOnly Lax loopback-cookie checks passed; remaining engine limitations recorded. No real login or business write.',
)
