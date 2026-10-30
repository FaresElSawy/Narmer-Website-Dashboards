import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrdersApi } from '../../B2C-Website/src/features/orders/api.js'
import {
  createRetailFixture,
  retailProducts,
} from '../../B2C-Website/src/features/shop/fixtures.js'

const fixtureSession = (user = null) => ({ getSnapshot: () => ({ user }) })

test('orders adapter uses documented routes, safe account reads, guest token header, and raw proof bytes', async () => {
  let user = { id: 'customer-1', role: 'user', store: 'b2c' }
  const calls = []
  const api = {
    request: async (path, options = {}) => {
      calls.push({ path, options })
      return options.binary ? new Blob(['proof'], { type: 'image/webp' }) : { ok: true }
    },
  }
  const session = {
    getSnapshot: () => ({ user }),
    read: async (_api, path, options) => {
      calls.push({ path, options: { ...options, authenticated: true, refreshRead: true } })
      return options?.binary ? new Blob(['proof'], { type: 'image/webp' }) : { items: [] }
    },
  }
  const orders = createOrdersApi({ config: { mode: 'live' }, api, session })
  await orders.shippingFees()
  await orders.shippingQuote('cairo')
  await orders.coupon({ code: 'X' }, user.id)
  await orders.preview({}, user.id)
  const file = new Blob(['image'], { type: 'image/png' })
  await orders.upload('checkout', file, user.id)
  await orders.place({ checkoutId: 'checkout' }, user.id)
  await orders.orders('page=2')
  await orders.order('a')
  assert.ok((await orders.proof('a')) instanceof Blob)
  user = { id: 'different-account', role: 'user', store: 'b2c' }
  await orders.order('guest-order', { token: 'secret' })
  await orders.proof('guest-order', { token: 'secret' })
  assert.deepEqual(
    calls.map(({ path }) => path),
    [
      '/shipping-fees?page=1&limit=100',
      '/shipping-fees/quote?governorateCode=cairo',
      '/cart/coupon-preview',
      '/cart/checkout',
      '/cart/checkout/checkout/proof',
      '/cart/checkout/orders',
      '/orders?page=2',
      '/orders/a',
      '/orders/a/proof',
      '/orders/tracking/guest-order',
      '/orders/tracking/guest-order/proof',
    ],
  )
  assert.equal(calls[2].options.authenticated, true)
  assert.equal(calls[4].options.body, file)
  assert.equal(calls[4].options.body.type, 'image/png')
  assert.equal(calls[4].options.method, 'POST')
  assert.equal(calls[4].options.headers.get('Content-Type'), 'image/png')
  assert.equal(calls[6].options.refreshRead, true)
  assert.equal(calls[9].options.headers.get('X-Order-Token'), 'secret')
  assert.equal(calls[9].options.headers.get('Authorization'), null)
  assert.equal(calls[9].options.authenticated, false)
  assert.equal(calls[10].options.binary, true)
  assert.equal(calls[10].options.headers.get('Authorization'), null)
})

test('checkout mutation rejects changed ownership after response and never retries placement', async () => {
  let user = { id: 'customer-1', role: 'user', store: 'b2c' },
    calls = 0
  const session = { getSnapshot: () => ({ user }) }
  const api = {
    request: async () => {
      calls++
      user = null
      throw Object.assign(new Error('conflict'), { code: 'CHECKOUT_CONFLICT', status: 409 })
    },
  }
  const orders = createOrdersApi({ config: { mode: 'live' }, api, session })
  await assert.rejects(
    orders.place({ checkoutId: 'one' }, 'customer-1'),
    (error) => error.code === 'CHECKOUT_IDENTITY_CHANGED',
  )
  assert.equal(calls, 1)
})

test('account order list discards a previous identity response and prevents refresh retry under a changed owner', async () => {
  let user = { id: 'customer-a', role: 'user', store: 'b2c' },
    finish
  const api = {
    request: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  }
  const session = {
    getSnapshot: () => ({ user }),
    read: (client, path, options) => client.request(path, options),
  }
  const orders = createOrdersApi({ config: { mode: 'live' }, api, session })
  const pending = orders.orders()
  user = { ...user, id: 'customer-b' }
  finish({ items: [{ id: 'private-a' }] })
  await assert.rejects(pending, (error) => error.code === 'CHECKOUT_IDENTITY_CHANGED')
})

test('review fixture safely replays placement and returns the same guest tracking credential', async () => {
  const session = fixtureSession()
  const retail = createRetailFixture(session)
  const product = retailProducts()[0]
  await retail.setQuantity({
    productId: product.id,
    variantId: product.variants[0].id,
    quantity: 1,
  })
  const orders = createOrdersApi({ config: { mode: 'fixtures' }, session, retail })
  const body = {
    customer: { name: 'Mona Saleh', email: 'mona@example.test', phone: '+201001234567' },
    address: {
      governorate: 'Cairo',
      governorateCode: 'cairo',
      district: 'Nasr City',
      building: '12',
      street: 'Example Street',
    },
    paymentMethod: 'cod',
  }
  const checkout = await orders.preview(body, 'guest')
  assert.equal(checkout.shipping.fee, 6000)
  assert.equal(checkout.receivingAccount, null)
  const request = { checkoutId: checkout.checkoutId }
  const first = await orders.place(request, 'guest')
  const replay = await orders.place(request, 'guest')
  assert.deepEqual(replay, first)
  assert.ok(first.trackingToken)
  assert.deepEqual(
    Object.keys(first.order).sort(),
    [
      'address',
      'coupon',
      'createdAt',
      'currency',
      'customer',
      'history',
      'id',
      'items',
      'orderNumber',
      'payment',
      'refund',
      'shipping',
      'status',
      'totals',
      'updatedAt',
    ].sort(),
  )
  assert.equal(first.order.payment.method, 'cod')
  assert.match(first.order.orderNumber, /^NRM-\d{8}-[A-Z0-9]{6}$/)
  assert.equal(replay.order.orderNumber, first.order.orderNumber)
  assert.equal(
    first.order.history.some((event) => 'actor' in event || 'actorId' in event),
    false,
  )
  assert.equal(first.order.payment.hasProof, false)
  assert.ok(await orders.order(first.order.id, { token: first.trackingToken }))
  await assert.rejects(
    orders.place({ ...request, proofId: '000000000000000000000001' }, 'guest'),
    (error) => error.code === 'ORDER_REQUEST_CONFLICT',
  )
  assert.equal((await retail.cart()).items.length, 0)
})

test('InstaPay fixture attaches raw proof, returns customer-safe order, and paginates owned orders', async () => {
  let user = null
  const session = { getSnapshot: () => ({ user }) }
  const retail = createRetailFixture(session)
  const product = retailProducts()[1]
  await retail.setQuantity({
    productId: product.id,
    variantId: product.variants[0].id,
    quantity: 2,
  })
  const orders = createOrdersApi({ config: { mode: 'fixtures' }, session, retail })
  const checkout = await orders.preview(
    {
      customer: { name: 'Mona', email: 'mona@example.test', phone: '+201001234567' },
      address: {
        governorate: 'Cairo',
        governorateCode: 'cairo',
        district: 'Nasr City',
        building: '12',
        street: 'Example',
      },
      paymentMethod: 'instapay',
      couponCode: 'WELCOME10',
    },
    'guest',
  )
  assert.equal(checkout.shipping.source, 'override')
  assert.equal(checkout.receivingAccount, 'SAMPLE ONLY - not a real receiving account')
  assert.ok(checkout.items[0].couponDiscount > 0)
  const proof = await orders.upload(
    checkout.checkoutId,
    new Blob(['proof'], { type: 'image/png' }),
    'guest',
  )
  const placed = await orders.place({ checkoutId: checkout.checkoutId, proofId: proof.id }, 'guest')
  assert.equal(placed.order.payment.hasProof, true)
  assert.equal('proofId' in placed.order, false)
  user = { id: 'review-customer', role: 'user', store: 'b2c' }
  await retail.setQuantity({
    productId: product.id,
    variantId: product.variants[0].id,
    quantity: 1,
  })
  const accountCheckout = await orders.preview(
    {
      customer: { name: 'Mariam', email: 'mariam@example.test', phone: '+201001234567' },
      address: {
        governorate: 'Cairo',
        governorateCode: 'cairo',
        district: 'Nasr City',
        building: '12',
        street: 'Example',
      },
      paymentMethod: 'cod',
    },
    user.id,
  )
  const accountOrder = await orders.place({ checkoutId: accountCheckout.checkoutId }, user.id)
  const listed = await orders.orders('page=1&limit=1&status=pending')
  assert.equal(listed.pagination.total, 1)
  assert.equal(listed.items[0].id, accountOrder.order.id)
  user = null
  assert.equal(
    (await orders.proof(placed.order.id, { token: placed.trackingToken })).type,
    'image/png',
  )
  await assert.rejects(
    orders.upload(checkout.checkoutId, new Blob(['x'], { type: 'text/plain' }), 'guest'),
    (error) => error.code === 'ORDER_PROOF_CONFLICT',
  )
})
