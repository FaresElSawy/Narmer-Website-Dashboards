import test from 'node:test'
import assert from 'node:assert/strict'
import { createCheckoutState } from '../../B2C-Website/src/features/orders/state.js'
import { checkoutInput, savedAddress } from '../../B2C-Website/src/features/orders/model.js'
import { ApiError } from '../lib/api.js'
import { createSession } from '../lib/session.js'
import { governorates } from '../../B2C-Website/src/features/orders/governorates.js'

const id = (value) => value.toString(16).padStart(24, '0')
const token = 'a'.repeat(43)
test('all 27 governorates have unique codes and use matching configured shipping codes', () => {
  const choices = governorates('en', [{ governorateCode: 'alex', name: 'Alexandria' }])
  assert.equal(choices.length, 27)
  assert.equal(new Set(choices.map((choice) => choice.code)).size, 27)
  assert.equal(choices.find((choice) => choice.name === 'Alexandria').code, 'alex')
  assert.equal(governorates('ar').find((choice) => choice.code === 'cairo').name, 'القاهرة')
})
const form = {
  customer: { name: ' Mona ', email: ' MONA@example.test ', phone: '+20 (100) 123-4567' },
  address: {
    governorate: 'Cairo',
    governorateCode: 'cairo',
    district: 'Nasr City',
    building: '12',
    street: 'Main Street',
    floor: '',
    apartment: '',
    details: '',
  },
  paymentMethod: 'cod',
  couponCode: '',
}
function setup() {
  let time = Date.now()
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  const session = createSession('b2c')
  const calls = []
  const api = {
    preview: async () => ({
      checkoutId: id(1),
      expiresAt: new Date(time + 10000).toISOString(),
      items: [],
      totals: { total: 0 },
      paymentMethod: form.paymentMethod,
    }),
    upload: async () => ({ id: id(2) }),
    place: async (body, owner) => {
      calls.push({ body: structuredClone(body), owner })
      return {
        order: { id: id(3) },
        trackingToken: token,
        trackingExpiresAt: new Date(time + 864000).toISOString(),
      }
    },
  }
  const make = () => createCheckoutState({ api, session, storage, now: () => time })
  const state = make()
  state.update(structuredClone(form))
  return { state, api, calls, storage, session, make, advance: () => (time += 20000) }
}
test('checkout input normalizes contact without accepting money or replacing an unconfirmed saved governorate', () => {
  const input = checkoutInput(form)
  assert.equal(input.customer.email, 'mona@example.test')
  assert.equal(input.customer.phone, '+201001234567')
  assert.ok(!('couponCode' in input))
  assert.equal(
    savedAddress(form, { governorate: 'Cairo', district: '' }).address.governorateCode,
    '',
  )
  assert.throws(
    () => checkoutInput({ ...form, address: { ...form.address, district: '' } }),
    /INVALID_ORDER/,
  )
})
test('uncertain placement locks details and replays the exact original COD request even after quote expiry', async () => {
  const { state, api, calls, advance, make } = setup()
  await state.preview()
  api.place = async (body, owner) => {
    calls.push({ body: structuredClone(body), owner })
    throw new ApiError('NETWORK_ERROR')
  }
  await state.place()
  assert.equal(state.getSnapshot().uncertain, true)
  assert.equal(state.edit(), false)
  assert.equal(state.startNew(), false)
  assert.equal(state.update(form), false)
  advance()
  const restored = make()
  restored.restore()
  assert.deepEqual(restored.getSnapshot().pending, { checkoutId: id(1) })
  api.place = async (body, owner) => {
    calls.push({ body, owner })
    return {
      order: { id: id(3) },
      trackingToken: token,
      trackingExpiresAt: new Date(Date.now() + 864000).toISOString(),
    }
  }
  await restored.place()
  assert.deepEqual(calls[0], calls[1])
  assert.equal(restored.getSnapshot().orderId, id(3))
})
test('InstaPay retains proof ID, does not replay uploads and preserves first tracking credential on null-token replay', async () => {
  const { state, api } = setup()
  state.update({ ...form, paymentMethod: 'instapay' })
  api.preview = async () => ({
    checkoutId: id(1),
    expiresAt: new Date(Date.now() + 10000).toISOString(),
    items: [],
    totals: { total: 0 },
    paymentMethod: 'instapay',
  })
  await state.preview()
  await state.place()
  assert.equal(state.getSnapshot().error.code, 'INVALID_ORDER')
  let uploaded = 0
  api.upload = async () => {
    uploaded++
    throw new ApiError('NETWORK_ERROR')
  }
  await state.upload(new Blob(['image']))
  assert.equal(uploaded, 1)
  assert.equal(state.getSnapshot().uploadUncertain, true)
  api.upload = async () => ({ id: id(2) })
  await state.upload(new Blob(['image']))
  await state.place()
  assert.deepEqual(state.getSnapshot().pending, { checkoutId: id(1), proofId: id(2) })
  api.place = async () => ({ order: { id: id(3) }, trackingToken: null, trackingExpiresAt: null })
  await state.place()
  assert.equal(state.access(id(3)).token, token)
})
test('confirmed stock failure allows a new preview, while 429 preserves exact placement for later retry', async () => {
  const { state, api } = setup()
  await state.preview()
  api.place = async () => {
    throw new ApiError('ORDER_STOCK_UNAVAILABLE', { status: 409 })
  }
  await state.place()
  assert.equal(state.getSnapshot().pending, null)
  assert.equal(state.edit(), true)
  await state.preview()
  api.place = async () => {
    throw new ApiError('TOO_MANY_REQUESTS', { status: 429, retryAfter: 10 })
  }
  await state.place()
  assert.deepEqual(state.getSnapshot().pending, { checkoutId: id(1) })
  assert.equal(state.getSnapshot().uncertain, false)
})
test('identity switching clears private memory and discards a late placement result', async () => {
  const { state, api, session } = setup()
  const unsubscribe = state.connect()
  await state.preview()
  let finish
  api.place = () => new Promise((resolve) => (finish = resolve))
  const pending = state.place()
  session.accept({
    user: { id: id(10), name: 'Other user', role: 'user', store: 'b2c' },
    accessToken: 'demo',
    expiresIn: 3600,
  })
  finish({
    order: { id: id(3) },
    trackingToken: token,
    trackingExpiresAt: new Date(Date.now() + 864000).toISOString(),
  })
  await pending
  assert.equal(state.getSnapshot().owner, id(10))
  assert.equal(state.getSnapshot().orderId, null)
  assert.equal(state.access(id(3)), null)
  unsubscribe()
})

test('initial authenticated restoration starts checkout under the restored owner and ignores another identity tracking cache', () => {
  const { state, session, make } = setup()
  state.rememberAccess(id(3), token, new Date(Date.now() + 864000).toISOString())
  session.accept({
    user: { id: id(10), name: 'Restored customer', role: 'user', store: 'b2c' },
    accessToken: 'demo',
    expiresIn: 3600,
  })
  state.restore()
  assert.equal(state.getSnapshot().owner, id(10))
  assert.equal(state.getSnapshot().ready, true)
  assert.equal(make().access(id(3)), null)
})
test('storage failure does not prevent placement or break clearing the current identity', async () => {
  const { api, session } = setup()
  const storage = {
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('blocked')
    },
    removeItem() {
      throw new Error('blocked')
    },
  }
  const state = createCheckoutState({ api, session, storage })
  const unsubscribe = state.connect()
  state.update(form)
  await state.preview()
  await state.place()
  assert.equal(state.getSnapshot().orderId, id(3))
  assert.equal(state.getSnapshot().storageWarning, true)
  session.accept({
    user: { id: id(10), name: 'Customer', role: 'user', store: 'b2c' },
    accessToken: 'demo',
    expiresIn: 3600,
  })
  assert.equal(state.getSnapshot().orderId, null)
  unsubscribe()
  const memoryOnly = createCheckoutState({ api, session, storage: null })
  memoryOnly.update(form)
  assert.equal(memoryOnly.getSnapshot().storageWarning, true)
})
