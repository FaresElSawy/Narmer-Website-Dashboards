import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartSelection } from '../../B2C-Website/src/features/shop/cart.js'

const product = { id: 'product', type: 'variant' },
  chosen = { id: 'size-m', stock: 10 }
function setup() {
  let user = null,
    written = null
  const items = [
    { productId: 'other', variantId: 'other-size', quantity: 3 },
    { productId: 'product', variantId: 'size-m', quantity: 2 },
  ]
  return {
    session: { getSnapshot: () => ({ user }) },
    change: () => {
      user = { id: 'customer' }
    },
    items,
    get written() {
      return written
    },
    api: {
      cart: async () => ({ items }),
      setQuantity: async (body) => {
        written = body
        return { items }
      },
    },
  }
}
test('quick add increments only the selected line and preserves the other selections', async () => {
  const s = setup()
  await addCartSelection(s.api, s.session, product, chosen, 2, 'en')
  assert.deepEqual(s.written, { productId: 'product', variantId: 'size-m', quantity: 4 })
  assert.equal(s.items[0].quantity, 3)
})
test('quick add rejects invalid or excessive quantities before a cart write', async () => {
  for (const quantity of [0, -1, 1.5, NaN, 9]) {
    const s = setup()
    await assert.rejects(addCartSelection(s.api, s.session, product, chosen, quantity, 'en'))
    assert.equal(s.written, null)
  }
})
test('quick add stops when the owner changes during the cart read', async () => {
  const s = setup()
  s.api.cart = async () => {
    s.change()
    return { items: s.items }
  }
  await assert.rejects(addCartSelection(s.api, s.session, product, chosen, 1, 'en'), {
    code: 'CHECKOUT_IDENTITY_CHANGED',
  })
  assert.equal(s.written, null)
})
test('quick add discards a late write result after an identity change', async () => {
  const s = setup()
  s.api.setQuantity = async () => {
    s.change()
    return { items: s.items }
  }
  await assert.rejects(addCartSelection(s.api, s.session, product, chosen, 1, 'en'), {
    code: 'CHECKOUT_IDENTITY_CHANGED',
  })
})
