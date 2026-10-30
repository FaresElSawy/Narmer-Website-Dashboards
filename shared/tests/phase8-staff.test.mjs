import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

registerHooks({
  load(url, context, next) {
    if (/\.(?:webp|png|jpg|svg)$/.test(url))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)}`,
        shortCircuit: true,
      }
    return next(url, context)
  },
})
const { createDashboardApi: factory } =
    await import('../../B2B-Website/src/features/dashboard/api.js'),
  store = 'b2b'

test(`${store}: account creation and own password retain role, store and transport boundaries`, async () => {
  for (const role of ['moderator', 'admin', 'superAdmin']) {
    const user = { id: 'test-staff', store, role },
      calls = [],
      runtime = {
        config: { mode: 'live', store },
        session: { getSnapshot: () => ({ user }) },
        api: {
          request: async (path, options) => {
            calls.push({ path, options })
            return null
          },
        },
      },
      request = factory(runtime, user, 'ar')
    await request('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: 'OldLocalTest9', newPassword: 'NewLocalTest9' },
    })
    assert.equal(calls[0].options.admin, false)
    assert.equal(calls[0].options.authenticated, true)
    assert.equal(calls[0].options.language, 'ar')
    if (role === 'superAdmin') {
      await request('/users', { method: 'POST', body: {} })
      assert.equal(calls[1].options.admin, true)
    } else
      await assert.rejects(request('/users', { method: 'POST', body: {} }), { code: 'FORBIDDEN' })
    const before = calls.length
    runtime.session.getSnapshot = () => ({
      user: { ...user, store: store === 'b2b' ? 'b2c' : 'b2b' },
    })
    await assert.rejects(request('/auth/change-password', { method: 'POST' }), {
      code: 'SESSION_CHANGED',
    })
    assert.equal(calls.length, before)
  }
})
test(`${store}: uncertain writes are sent once; no automatic password or creation replay`, async () => {
  const user = { id: 'test-staff', store, role: 'superAdmin' }
  let count = 0
  const request = factory(
    {
      config: { mode: 'live', store },
      session: { getSnapshot: () => ({ user }) },
      api: {
        request: async () => {
          count++
          throw new TypeError('Simulated lost response')
        },
      },
    },
    user,
    'en',
  )
  for (const path of ['/users', '/auth/change-password'])
    await assert.rejects(request(path, { method: 'POST', body: {} }), TypeError)
  assert.equal(count, 2)
})
