import test from 'node:test'
import assert from 'node:assert/strict'
import { cartItemCount } from '../../B2C-Website/src/features/shop/cart-count.js'

test('cart badge counts quantities rather than distinct lines', () => {
  assert.equal(cartItemCount([{ quantity: 2 }, { quantity: 3 }]), 5)
  assert.equal(cartItemCount([]), 0)
})
