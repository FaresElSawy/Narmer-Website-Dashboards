export const orderStatuses = ['pending', 'accepted', 'shipped', 'delivered', 'canceled', 'returned']
const transitions = {
  pending: ['accepted', 'canceled'],
  accepted: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  canceled: [],
  returned: [],
}
export const orderTransitions = (status) => transitions[status] || []
export function currentOrderImage(product, item) {
  return (
    product?.variants?.find((variant) => variant.id === item.variantId)?.images?.[0] ||
    product?.images?.[0] ||
    null
  )
}
export function orderStatusLabel(status, language) {
  const labels = {
    pending: ['Pending review', 'بانتظار المراجعة'],
    accepted: ['Accepted', 'مقبول'],
    shipped: ['Shipped', 'تم الشحن'],
    delivered: ['Delivered', 'تم التسليم'],
    canceled: ['Canceled', 'ملغي'],
    returned: ['Returned', 'مرتجع'],
  }
  return labels[status]?.[language === 'ar' ? 1 : 0] || status
}
