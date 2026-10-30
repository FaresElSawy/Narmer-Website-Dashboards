import test from 'node:test'
import assert from 'node:assert/strict'
import { cartLineKey, orderedCartItems } from '../../B2C-Website/src/features/shop/cart.js'

test('quantity responses retain all three displayed cart positions without changing server data', () => {
  const original = [
    { productId: 'a', variantId: 'small', quantity: 1 },
    { productId: 'b', variantId: null, quantity: 2 },
    { productId: 'a', variantId: 'large', quantity: 3 },
  ]
  const order = original.map(cartLineKey)
  const response = [original[1], original[2], { ...original[0], quantity: 4 }]
  assert.deepEqual(orderedCartItems(response, order).map(cartLineKey), order)
  assert.equal(orderedCartItems(response, order)[0].quantity, 4)
  assert.equal(response[0], original[1])
  const middleChanged = [response[1], response[2], { ...original[1], quantity: 5 }]
  assert.deepEqual(orderedCartItems(middleChanged, order).map(cartLineKey), order)
  const removedAndAdded = [
    middleChanged[0],
    { productId: 'c', variantId: null, quantity: 1 },
    middleChanged[2],
  ]
  assert.deepEqual(orderedCartItems(removedAndAdded, order).map(cartLineKey), [
    'b:',
    'a:large',
    'c:',
  ])
})
