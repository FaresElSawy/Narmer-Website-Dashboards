import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError } from '../lib/api.js'
import {
  changePromotionEnabled,
  readPromotion,
} from '../../B2C-Website/src/features/dashboard/promotion-state.js'
const path = '/sales/sale-id',
  record = (enabled) => ({ id: 'sale-id', name: { en: 'Sale', ar: 'حملة' }, isEnabled: enabled })

test('promotion switches send only the enable flag and accept the canonical response', async () => {
  const calls = []
  const result = await changePromotionEnabled(
    async (url, options) => {
      calls.push({ url, ...options })
      return record(false)
    },
    path,
    false,
  )
  assert.deepEqual(calls, [{ url: path, method: 'PATCH', body: { isEnabled: false } }])
  assert.equal(result.record.isEnabled, false)
})
test('a lost promotion response is read once and never replays its write', async () => {
  const calls = []
  const result = await changePromotionEnabled(
    async (url, options) => {
      calls.push(options?.method || 'GET')
      if (options) throw new ApiError('NETWORK_ERROR')
      return record(false)
    },
    path,
    false,
  )
  assert.deepEqual(calls, ['PATCH', 'GET'])
  assert.equal(result.record.isEnabled, false)
  assert.equal(result.error, null)
})
test('missing success fields and failed reconciliation lock the switch until a safe read succeeds', async () => {
  const calls = []
  const result = await changePromotionEnabled(
    async (url, options) => {
      calls.push(options?.method || 'GET')
      if (options) return { id: 'sale-id' }
      throw new ApiError('NETWORK_ERROR')
    },
    path,
    true,
  )
  assert.deepEqual(calls, ['PATCH', 'GET'])
  assert.equal(result.locked, true)
  assert.equal(result.error.code, 'INVALID_RESPONSE')
  assert.equal((await readPromotion(async () => record(false), path)).isEnabled, false)
})
test('known overlap failures retain the actual state, and rate limits do not cause reads or retries', async () => {
  for (const status of [409, 429]) {
    const calls = [],
      failure = new ApiError(status === 409 ? 'SALE_OVERLAP' : 'TOO_MANY_REQUESTS', { status })
    const result = await changePromotionEnabled(
      async (url, options) => {
        calls.push(options?.method || 'GET')
        if (options) throw failure
        return record(false)
      },
      path,
      true,
    )
    assert.deepEqual(calls, status === 409 ? ['PATCH', 'GET'] : ['PATCH'])
    assert.equal(result.error, failure)
    assert.ok(!result.locked)
  }
})
