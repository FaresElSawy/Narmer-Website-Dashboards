import test from 'node:test'
import assert from 'node:assert/strict'
import { readConfig } from '../lib/config.js'
import { formatMoney, parseMoney } from '../lib/money.js'
import { ApiError, createApi, latestRead, retryDelay } from '../lib/api.js'
import { canUseDashboard, createSession, staffLanding } from '../lib/session.js'
import { consumeTrackingFragment, createPrivateState } from '../lib/private-state.js'
import { errorMessage } from '../lib/messages.js'

const configured = { store: 'b2c', mode: 'live', apiOrigin: 'https://api.example.test' }
const data = (store = 'b2c', role = 'admin', token = 'test-only-opaque-token') => ({
  user: { id: 'sample-user', store, role, name: 'Example' },
  accessToken: token,
  expiresIn: 900,
})
const success = (value) =>
  Response.json({
    success: true,
    code: 'OK',
    message: 'OK',
    data: value,
    requestId: 'test-request',
  })

test('profile updates preserve the token and reject another account or role', () => {
  const session = createSession('b2c')
  session.accept(data())
  const before = session.getSnapshot()
  session.updateUser({ ...before.user, name: 'Updated name' })
  assert.equal(session.getSnapshot().accessToken, before.accessToken)
  assert.equal(session.getSnapshot().user.name, 'Updated name')
  assert.throws(() => session.updateUser({ ...before.user, id: 'another' }), {
    code: 'SESSION_CHANGED',
  })
  assert.throws(() => session.updateUser({ ...before.user, role: 'superAdmin' }), {
    code: 'SESSION_CHANGED',
  })
})

test('configuration has no origin fallback and rejects path or credential injection', () => {
  assert.equal(readConfig({}, 'b2b').apiOrigin, '')
  for (const value of [
    'https://api.example.test/api/v1',
    'javascript:alert(1)',
    'https://user:pass@example.test',
  ])
    assert.throws(() => readConfig({ VITE_API_ORIGIN: value }, 'b2b'))
  assert.throws(() => readConfig({ VITE_DATA_MODE: 'guess' }, 'b2c'))
})

test('money preserves zero and null, parses decimal text without float rounding', () => {
  assert.equal(parseMoney('0'), 0)
  assert.equal(parseMoney('12.10'), 1210)
  assert.equal(parseMoney('0.29'), 29)
  assert.notEqual(formatMoney(0), formatMoney(null))
  for (const value of [null, '-1', '1.001', '1e3', 'NaN', '9007199254740992'])
    assert.throws(() => parseMoney(value))
})

test('store prefix, language, credentials, authorization and null success follow contracts', async () => {
  let captured
  const api = createApi(configured, {
    getLanguage: () => 'ar',
    getToken: () => 'test-access',
    fetcher: async (...args) => {
      captured = args
      return success(null)
    },
  })
  assert.equal(await api.request('/users/me', { authenticated: true, admin: true }), null)
  assert.equal(captured[0], 'https://api.example.test/api/v1/admin/b2c/users/me')
  assert.equal(captured[1].headers.get('X-Language'), 'ar')
  assert.equal(captured[1].headers.get('Authorization'), 'Bearer test-access')
  assert.equal(captured[1].credentials, 'include')
  assert.equal(captured[1].cache, 'no-store')
  await assert.rejects(
    createApi(configured, {
      fetcher: () => {
        throw new Error('Should not send a guest request')
      },
    }).request('/cart', { authenticated: true }),
    { code: 'UNAUTHORIZED', status: 401 },
  )
  await assert.rejects(api.request('//evil.test/path'), TypeError)
  let calls = 0
  const offline = createApi(
    { ...configured, mode: 'fixtures' },
    {
      fetcher: () => {
        calls++
      },
    },
  )
  await assert.rejects(offline.request('/products'), { code: 'API_UNCONFIGURED' })
  assert.equal(calls, 0)
})

test('validation, malformed envelopes, network failures and Retry-After stay distinguishable', async () => {
  assert.match(errorMessage({ code: 'NETWORK_ERROR' }, 'en'), /connect/)
  assert.match(errorMessage({ code: 'NETWORK_ERROR' }, 'ar'), /الاتصال/)
  assert.equal(
    errorMessage({ code: 'BUSINESS_CONFLICT', status: 409, message: 'Localized business message' }),
    'Localized business message',
  )
  const api = createApi(configured, {
    fetcher: async () =>
      Response.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Check input',
          errors: [{ field: 'quantity', code: 'INVALID_FIELD' }],
        },
        { status: 422 },
      ),
  })
  await assert.rejects(
    api.request('/cart'),
    (error) => error.status === 422 && error.errors[0].field === 'quantity',
  )
  for (const envelope of [null, [], {}, { success: true, code: 'OK' }]) {
    await assert.rejects(
      createApi(configured, { fetcher: async () => Response.json(envelope) }).request('/products'),
      { code: 'INVALID_RESPONSE' },
    )
  }
  await assert.rejects(
    createApi(configured, {
      fetcher: async () => {
        throw new TypeError('Failed fetch')
      },
    }).request('/products'),
    { code: 'NETWORK_ERROR' },
  )
  assert.equal(retryDelay('60'), 60)
  assert.equal(retryDelay('Wed, 01 Jan 2025 00:01:00 GMT', Date.UTC(2025, 0, 1)), 60)
  assert.equal(retryDelay('invalid'), null)
})

test('raw private binary transport never JSON encodes a file and rejects non-image success', async () => {
  const file = new Blob(['test-image'], { type: 'image/png' })
  let captured
  const api = createApi(configured, {
    fetcher: async (url, options) => {
      captured = options
      return success({ id: 'image' })
    },
  })
  await api.request('/orders/proof', {
    method: 'POST',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  assert.equal(captured.body, file)
  assert.equal(captured.headers.get('Content-Type'), 'image/png')
  const binary = createApi(configured, {
    fetcher: async () => new Response('image', { headers: { 'Content-Type': 'image/webp' } }),
  })
  assert.ok((await binary.request('/orders/image', { binary: true })) instanceof Blob)
  await assert.rejects(
    createApi(configured, { fetcher: async () => new Response('<html>') }).request(
      '/orders/image',
      { binary: true },
    ),
    { code: 'INVALID_BINARY' },
  )
})

test('stale reads cannot overwrite the latest data even if abort is ignored', async () => {
  const reader = latestRead(),
    values = []
  let resolveFirst, signal
  const first = reader.run(
    (s) => {
      signal = s
      return new Promise((resolve) => {
        resolveFirst = resolve
      })
    },
    (value) => values.push(value),
  )
  await reader.run(
    async () => 'new',
    (value) => values.push(value),
  )
  resolveFirst('old')
  await first
  assert.equal(signal.aborted, true)
  assert.deepEqual(values, ['new'])
})

test('session refresh is single-flight per store and different stores never share tokens', async () => {
  const session = createSession('b2c'),
    business = createSession('b2b')
  let count = 0,
    resolve
  const api = {
    request: () => {
      count++
      return new Promise((done) => {
        resolve = done
      })
    },
  }
  const first = session.refresh(api),
    second = session.refresh(api)
  assert.equal(first, second)
  resolve(data())
  await first
  assert.equal(count, 1)
  assert.equal(business.getSnapshot().accessToken, null)
  assert.throws(() => business.accept(data()), { code: 'INVALID_SESSION' })
  assert.throws(() => session.accept({ ...data(), expiresIn: Infinity }), {
    code: 'INVALID_SESSION',
  })
  assert.throws(() => session.accept({ ...data(), user: { ...data().user, name: null } }), {
    code: 'INVALID_SESSION',
  })
  assert.equal(canUseDashboard(data('b2c', 'user').user, 'b2c'), false)
  assert.equal(canUseDashboard(data('b2b').user, 'b2c'), false)
  assert.equal(staffLanding('b2c', 'moderator'), 'orders')
  assert.equal(staffLanding('b2b', 'admin'), 'requests')
})

test('same-origin Web Lock names are scoped by store', async () => {
  const names = []
  const locks = {
    request: async (name, run) => {
      names.push(name)
      return run()
    },
  }
  await createSession('b2b', { locks }).refresh({ request: async () => data('b2b') })
  await createSession('b2c', { locks }).refresh({ request: async () => data('b2c') })
  assert.deepEqual(names, ['narmer:b2b:refresh', 'narmer:b2c:refresh'])
})

test('logout or a new login during refresh prevents the old identity from being restored', async () => {
  const session = createSession('b2c')
  let resolve
  const pending = session.refresh({
    request: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  session.clear()
  resolve(data())
  await assert.rejects(pending, { code: 'SESSION_CHANGED' })
  assert.equal(session.getSnapshot().user, null)
  const second = session.refresh({
    request: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  session.accept(data('b2c', 'moderator', 'new-login'))
  resolve(data())
  await assert.rejects(second, { code: 'SESSION_CHANGED' })
  assert.equal(session.getSnapshot().accessToken, 'new-login')
})

test('only a protected read refreshes and retries once; logout failure remains recoverable', async () => {
  const session = createSession('b2c')
  let reads = 0,
    refreshes = 0
  const api = {
    request: async (path) => {
      if (path === '/auth/refresh') {
        refreshes++
        return data()
      }
      if (path === '/auth/logout') throw new ApiError('NETWORK_ERROR')
      if (++reads === 1) throw new ApiError('UNAUTHORIZED', { status: 401 })
      return 'result'
    },
  }
  assert.equal(await session.read(api, '/users/me'), 'result')
  assert.equal(reads, 2)
  assert.equal(refreshes, 1)
  await assert.rejects(session.read(api, '/orders', { method: 'POST' }), TypeError)
  await assert.rejects(session.logout(api), { code: 'NETWORK_ERROR' })
  assert.equal(session.getSnapshot().status, 'authenticated')
  await session.logout({
    request: async () => {
      throw new ApiError('UNAUTHORIZED', { status: 401 })
    },
  })
  assert.equal(session.getSnapshot().status, 'anonymous')
})

test('private recovery expires, forgets, clears only this store, and strips tracking fragments', () => {
  const map = new Map(),
    storage = {
      get length() {
        return map.size
      },
      key: (i) => [...map.keys()][i],
      getItem: (key) => map.get(key) || null,
      setItem: (key, value) => map.set(key, value),
      removeItem: (key) => map.delete(key),
    }
  let now = 10
  const business = createPrivateState(storage, 'b2b', () => now),
    retail = createPrivateState(storage, 'b2c', () => now)
  for (const value of [
    new Blob(['private file']),
    new Uint8Array([1]),
    'blob:private-image',
    'data:image/png;base64,example',
  ])
    assert.throws(() => retail.save('file', { value }, 30), TypeError)
  business.save('draft', { id: 'draft' }, 20)
  retail.save('checkout', { id: 'checkout' }, 30)
  assert.equal(business.load('draft').id, 'draft')
  now = 21
  assert.equal(business.load('draft'), null)
  business.clear()
  assert.equal(retail.load('checkout').id, 'checkout')
  retail.forget('checkout')
  assert.equal(retail.load('checkout'), null)
  let replaced
  assert.equal(
    consumeTrackingFragment(
      { hash: '#token=private-example', pathname: '/en/track', search: '' },
      {
        state: null,
        replaceState: (...args) => {
          replaced = args
        },
      },
    ),
    'private-example',
  )
  assert.equal(replaced[2], '/en/track')
})

test('a delayed logout response cannot erase a newer login', async () => {
  const session = createSession('b2c')
  session.accept(data())
  let resolve
  const logout = session.logout({
    request: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  session.accept(data('b2c', 'moderator', 'new-login'))
  resolve(null)
  await logout
  assert.equal(session.getSnapshot().accessToken, 'new-login')
})

test('private binary error responses preserve JSON error codes and request IDs', async () => {
  const api = createApi(configured, {
    fetcher: async () =>
      Response.json(
        { success: false, code: 'FORBIDDEN', message: 'Denied', requestId: 'support-id' },
        { status: 403 },
      ),
  })
  await assert.rejects(
    api.request('/orders/image', { binary: true }),
    (error) =>
      error.code === 'FORBIDDEN' && error.requestId === 'support-id' && error.status === 403,
  )
})
