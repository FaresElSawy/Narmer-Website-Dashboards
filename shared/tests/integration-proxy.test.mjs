import test from 'node:test'
import assert from 'node:assert/strict'
import { integrationProxy } from '../scripts/integration-proxy.mjs'
import { readConfig } from '../lib/config.js'

const env = { VITE_API_ORIGIN: 'https://api.example.test', VITE_DATA_MODE: 'live' }
test('local proxy exists only in integration mode and restricts each store to its own routes', () => {
  for (const mode of ['production', 'review', 'development'])
    assert.deepEqual(integrationProxy(mode, env, 'b2b'), {})
  for (const store of ['b2b', 'b2c']) {
    const proxy = integrationProxy('integration', env, store),
      matching = (path) => Object.entries(proxy).find(([key]) => new RegExp(key).test(path))?.[1]
    for (const path of [`/api/v1/${store}/auth/refresh`, `/api/v1/admin/${store}/users`]) {
      assert.equal(matching(path).target, env.VITE_API_ORIGIN)
      assert.equal(matching(path).secure, true)
      assert.equal(matching(path).cookieDomainRewrite, undefined)
    }
    const other = store === 'b2b' ? 'b2c' : 'b2b'
    assert.equal(matching(`/api/v1/${other}/auth/refresh`), undefined)
    assert.equal(matching(`/api/v1/admin/${other}/users`), undefined)
    assert.equal(matching('/api/v1/b2bc/auth/refresh'), undefined)
    assert.equal(matching('/anything'), undefined)
    if (store === 'b2b') assert.ok(matching('/api/v1/b2c/products/000000000000000000000001'))
  }
})
test('only a loopback integration browser uses the local origin; server renders and production keep the configured API', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location')
  try {
    for (const hostname of ['127.0.0.1', 'localhost', 'shop.example.test']) {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: { hostname, origin: 'http://' + hostname + ':5294' },
      })
      for (const SSR of [true, false]) {
        for (const MODE of ['integration', 'production', 'review']) {
          const expected =
            hostname !== 'shop.example.test' && !SSR && MODE === 'integration'
              ? globalThis.location.origin
              : env.VITE_API_ORIGIN
          assert.equal(readConfig({ ...env, MODE, SSR }, 'b2b').apiOrigin, expected)
        }
      }
    }
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor)
    else delete globalThis.location
  }
})
