import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardAccess } from '../../B2C-Website/src/features/dashboard/model.js'
import {
  orderTransitions,
  currentOrderImage,
} from '../../B2C-Website/src/features/dashboard/orders.js'
import { createStaffOrdersFixture } from '../../B2C-Website/src/features/dashboard/order-fixtures.js'

test('current catalog thumbnails prefer the exact variant and never replace order snapshots', () => {
  const item = { name: 'Saved name', unitPrice: 500, variantId: 'ordered' },
    product = {
      name: 'Renamed product',
      price: 900,
      images: [{ url: '/main' }],
      variants: [
        { id: 'ordered', images: [{ url: '/variant' }] },
        { id: 'other', images: [{ url: '/other' }] },
      ],
    }
  assert.equal(currentOrderImage(product, item).url, '/variant')
  assert.equal(currentOrderImage(product, { ...item, variantId: 'removed' }).url, '/main')
  assert.equal(currentOrderImage(null, item), null)
  assert.equal(
    currentOrderImage(
      { images: [], variants: [{ id: 'other', images: [{ url: '/other' }] }] },
      item,
    ),
    null,
  )
  assert.deepEqual(item, { name: 'Saved name', unitPrice: 500, variantId: 'ordered' })
})

test('Phase 6 role guard preserves operational access and shipping delete exception', () => {
  const id = '000000000000000000002ee0'
  assert.equal(dashboardAccess('moderator', `/orders/${id}/status`, 'PATCH'), true)
  assert.equal(dashboardAccess('moderator', `/orders/${id}/proof`), true)
  for (const [path, method] of [
    ['/orders/settings', 'GET'],
    ['/products', 'GET'],
    ['/users', 'POST'],
    ['/orders', 'POST'],
    [`/orders/${id}`, 'DELETE'],
  ])
    assert.equal(dashboardAccess('moderator', path, method), false)
  assert.equal(dashboardAccess('admin', `/shipping-fees/${id}`, 'DELETE'), true)
  assert.equal(dashboardAccess('admin', `/products/${id}`, 'DELETE'), false)
  assert.equal(dashboardAccess('admin', '/users', 'POST'), false)
  assert.equal(dashboardAccess('superAdmin', '/users', 'POST'), true)
  assert.equal(dashboardAccess('user', '/orders'), false)
})
test('Order transitions reject stale changes and preserve once-only stock/refund markers', async () => {
  const request = createStaffOrdersFixture(),
    user = { id: 'review-admin' },
    list = await request('/orders'),
    pending = list.items[0],
    path = `/orders/${pending.id}/status`
  assert.deepEqual(orderTransitions('pending'), ['accepted', 'canceled'])
  await assert.rejects(
    request(path, {
      method: 'PATCH',
      user,
      body: { status: 'shipped', expectedStatus: 'pending' },
    }),
    { code: 'ORDER_STATUS_INVALID' },
  )
  const accepted = await request(path, {
    method: 'PATCH',
    user,
    body: { status: 'accepted', expectedStatus: 'pending' },
  })
  assert.equal(accepted.payment.verifiedBy, user.id)
  await assert.rejects(
    request(path, {
      method: 'PATCH',
      user,
      body: { status: 'canceled', expectedStatus: 'pending' },
    }),
    { code: 'ORDER_STATUS_CONFLICT' },
  )
  const canceled = await request(path, {
    method: 'PATCH',
    user,
    body: { status: 'canceled', expectedStatus: 'accepted' },
  })
  const repeated = await request(path, {
    method: 'PATCH',
    user,
    body: { status: 'canceled', expectedStatus: 'accepted' },
  })
  assert.equal(canceled.stockRestored, true)
  assert.equal(canceled.refund.amount, canceled.totals.total)
  assert.equal(repeated.history.length, canceled.history.length)
  assert.deepEqual(orderTransitions(canceled.status), [])
})
