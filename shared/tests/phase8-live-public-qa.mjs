import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const engines = createRequire(import.meta.url)(process.env.NARMER_PLAYWRIGHT_PATH)
const api = 'https://narmer-ecommerce.vercel.app',
  results = {
    at: new Date().toISOString(),
    health: [],
    browsers: [],
    preflights: [],
    firefox: null,
  }
for (const path of ['/health/live', '/health/ready']) {
  try {
    const response = await fetch(api + path, { signal: AbortSignal.timeout(15000) })
    const body = await response.json()
    results.health.push({ path, status: response.status, code: body.code, success: body.success })
  } catch (error) {
    results.health.push({ path, error: error.message })
  }
}
try {
  const browser = await engines.firefox.launch({ headless: true, timeout: 10000 })
  results.firefox = { available: true }
  await browser.close()
} catch (error) {
  results.firefox = { available: false, error: error.message.slice(0, 1600) }
}
for (const engine of ['chromium', 'webkit']) {
  const browser = await engines[engine].launch({ headless: true })
  try {
    for (const [store, port, paths] of [
      [
        'b2c',
        Number(process.env.NARMER_B2C_PORT || 5283),
        ['/homepage', '/site-settings', '/products?limit=1'],
      ],
      [
        'b2b',
        Number(process.env.NARMER_B2B_PORT || 5284),
        [
          '/homepage',
          '/site-settings',
          '/forms',
          '/wholesale/offers?limit=1',
          '/wholesale/offers/resolve/phase8-absent-779f34b6-339d-4c10',
        ],
      ],
    ]) {
      const origin = `http://127.0.0.1:${port}`,
        context = await browser.newContext(),
        page = await context.newPage()
      await page.goto(`${origin}/en`, { waitUntil: 'networkidle' })
      for (const path of paths) {
        const evidence = await page.evaluate(
          async ({ api, store, path }) => {
            try {
              const response = await fetch(`${api}/api/v1/${store}${path}`, {
                  credentials: 'include',
                  headers: { 'X-Language': 'en' },
                  signal: AbortSignal.timeout(15000),
                }),
                body = await response.json()
              return {
                status: response.status,
                success: body.success,
                code: body.code,
                count: Array.isArray(body.data?.items) ? body.data.items.length : undefined,
                total: body.data?.pagination?.total,
                requestIdReadable: !!response.headers.get('X-Request-Id'),
              }
            } catch (error) {
              return { error: error.message }
            }
          },
          { api, store, path },
        )
        results.browsers.push({ engine, store, origin, path, ...evidence })
      }
      await context.close()
      if (engine === 'chromium') {
        const response = await fetch(`${api}/api/v1/${store}/auth/login`, {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type,x-language',
          },
          signal: AbortSignal.timeout(15000),
        })
        results.preflights.push({
          store,
          origin,
          status: response.status,
          allowedOrigin: response.headers.get('Access-Control-Allow-Origin'),
          credentials: response.headers.get('Access-Control-Allow-Credentials'),
          allowedHeaders: response.headers.get('Access-Control-Allow-Headers'),
        })
      }
    }
  } finally {
    await browser.close()
  }
}
await writeFile(
  process.env.NARMER_QA_OUTPUT || 'output/phase8/live-public-baseline.json',
  JSON.stringify(results, null, 2),
)
console.log(JSON.stringify(results, null, 2))
