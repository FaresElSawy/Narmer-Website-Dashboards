import test from 'node:test'
import assert from 'node:assert/strict'
import { vercelRoutes } from '../scripts/vercel-output.mjs'
import { readConfig } from '../lib/config.js'

const origin = 'https://api.example.test'
const map = {
  pages: [],
  rewrites: { '/': '/index.html', '/en': '/index.html', '/ar': '/ar/index.html' },
  redirects: { '/en/wholesale/offers/000000000000000000000001': '/en/wholesale/offers/hoodie' },
}
const resolveRoute = (routes, path, method = 'GET') =>
  routes.find(
    (route) =>
      route.src &&
      !route.continue &&
      (!route.methods || route.methods.includes(method)) &&
      new RegExp(route.src).test(path),
  )

test('Vercel proxies only its own store, disables API caching and preserves private route entry', () => {
  for (const store of ['b2b', 'b2c']) {
    const routes = vercelRoutes(map, store, origin),
      other = store === 'b2c' ? 'b2b' : 'b2c'
    for (const path of [`/api/v1/${store}/auth/refresh`, `/api/v1/admin/${store}/users`]) {
      const route = resolveRoute(routes, path, 'POST')
      assert.ok(route.dest.startsWith(origin))
      assert.equal(route.headers['Cache-Control'], 'no-store')
      assert.equal(route.headers['x-vercel-enable-rewrite-caching'], '0')
    }
    for (const path of [`/api/v1/${other}/auth/refresh`, `/api/v1/admin/${other}/users`])
      assert.equal(resolveRoute(routes, path, 'POST').status, 404)
    assert.equal(resolveRoute(routes, '/en/dashboard/products').dest, '/app.html')
    assert.equal(resolveRoute(routes, '/ar/account/reset-password').dest, '/app.html')
    assert.equal(resolveRoute(routes, '/en/unknown-page').status, 404)
    assert.equal(resolveRoute(routes, '/assets/missing.js').status, 404)
    assert.equal(routes[0].headers['X-Robots-Tag'], 'noindex, nofollow')
    assert.equal(resolveRoute(routes, '/ar/').dest, '/ar/index.html')
  }
})

test('B2B permits only read-only B2C product detail and generated aliases keep their saved destination', () => {
  const routes = vercelRoutes(map, 'b2b', origin),
    path = '/api/v1/b2c/products/000000000000000000000001'
  assert.ok(resolveRoute(routes, path).dest.startsWith(origin))
  assert.equal(resolveRoute(routes, path, 'PATCH').status, 404)
  assert.equal(resolveRoute(routes, '/api/v1/b2c/products/not-an-id').status, 404)
  const redirect = resolveRoute(routes, '/en/wholesale/offers/000000000000000000000001/')
  assert.equal(redirect.status, 308)
  assert.equal(redirect.headers.Location, '/en/wholesale/offers/hoodie')
  assert.throws(() => vercelRoutes(map, 'b2c', 'http://api.example.test'))
  assert.throws(() => vercelRoutes(map, 'another-store', origin))
})

test('explicit deployed same-origin API transport changes only browser requests, never build-time reads', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location')
  try {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'shop.example.test', origin: 'https://shop.example.test' },
    })
    const env = {
      VITE_DATA_MODE: 'live',
      VITE_API_ORIGIN: origin,
      VITE_API_SAME_ORIGIN: 'true',
      MODE: 'staging',
    }
    assert.equal(readConfig({ ...env, SSR: false }, 'b2c').apiOrigin, 'https://shop.example.test')
    assert.equal(readConfig({ ...env, SSR: true }, 'b2c').apiOrigin, origin)
    assert.equal(
      readConfig({ ...env, SSR: false, VITE_API_SAME_ORIGIN: '' }, 'b2c').apiOrigin,
      origin,
    )
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor)
    else delete globalThis.location
  }
})
