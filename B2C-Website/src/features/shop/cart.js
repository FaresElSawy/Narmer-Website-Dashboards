import { ApiError } from '../../../../shared/lib/api.js'

export const cartLineKey = (line) => `${line.productId}:${line.variantId || ''}`

export async function addCartSelection(api, session, product, chosen, quantity, language) {
  if (!chosen || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000)
    throw new ApiError('INVALID_CART_QUANTITY', { status: 422 })
  const owner = session.getSnapshot().user?.id || null
  const checkOwner = () => {
    if ((session.getSnapshot().user?.id || null) !== owner)
      throw new ApiError('CHECKOUT_IDENTITY_CHANGED', { status: 409 })
  }
  const selection = {
    productId: product.id,
    ...(product.type === 'variant' ? { variantId: chosen.id } : {}),
  }
  const cart = await api.cart(false, { language })
  checkOwner()
  const existing = cart.items.find((item) => cartLineKey(item) === cartLineKey(selection))
  const next = (existing?.quantity || 0) + quantity
  if (!Number.isSafeInteger(next) || next > Math.min(10000, chosen.stock))
    throw new ApiError('CART_INSUFFICIENT_STOCK', { status: 409 })
  const result = await api.setQuantity({ ...selection, quantity: next }, false, { language })
  checkOwner()
  return result
}

export function orderedCartItems(items, order) {
  // Edited selections move to the end of backend responses; keep the visible row order stable.
  const positions = new Map(order.map((key, index) => [key, index]))
  return [...items].sort(
    (a, b) =>
      (positions.get(cartLineKey(a)) ?? order.length) -
      (positions.get(cartLineKey(b)) ?? order.length),
  )
}
