import { ApiError } from '../../../../shared/lib/api.js'
import { normalizeEmail, normalizePhone } from '../../../../shared/features/account/api.js'

export const orderIdValid = (id) => /^[a-f0-9]{24}$/i.test(id || '')
export const trackingTokenValid = (token) => /^[A-Za-z0-9_-]{16,2048}$/.test(token || '')
export const checkoutOwner = (user) =>
  !user ? 'guest' : user.role === 'user' && user.store === 'b2c' ? user.id : null
export const orderStatuses = ['pending', 'accepted', 'shipped', 'delivered', 'canceled', 'returned']
export const statusLabels = {
  en: ['Pending review', 'Accepted', 'Shipped', 'Delivered', 'Canceled', 'Returned'],
  ar: ['بانتظار المراجعة', 'تم القبول', 'تم الشحن', 'تم التسليم', 'ملغي', 'مرتجع'],
}
export const statusLabel = (status, language) =>
  statusLabels[language][orderStatuses.indexOf(status)] ||
  (language === 'ar' ? 'غير متاح' : 'Unavailable')
export const emptyCheckout = () => ({
  customer: { name: '', email: '', phone: '' },
  address: {
    governorate: '',
    governorateCode: '',
    district: '',
    building: '',
    street: '',
    floor: '',
    apartment: '',
    details: '',
  },
  paymentMethod: 'cod',
  couponCode: '',
})
export function checkoutInput(form) {
  const body = {
    customer: {
      name: form.customer.name.trim(),
      email: normalizeEmail(form.customer.email),
      phone: normalizePhone(form.customer.phone),
    },
    address: Object.fromEntries(
      Object.entries(form.address).map(([key, value]) => [key, value.trim()]),
    ),
    paymentMethod: form.paymentMethod,
    ...(form.couponCode?.trim() && { couponCode: form.couponCode.trim().toUpperCase() }),
  }
  body.address.governorateCode = body.address.governorateCode.toLowerCase()
  if (
    !body.customer.name ||
    body.customer.name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer.email) ||
    body.customer.email.length > 254 ||
    !/^\+?\d{6,15}$/.test(body.customer.phone) ||
    !['cod', 'instapay'].includes(body.paymentMethod) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.address.governorateCode) ||
    ['governorate', 'governorateCode', 'district'].some(
      (key) => !body.address[key] || body.address[key].length > 100,
    ) ||
    ['building', 'street'].some((key) => !body.address[key] || body.address[key].length > 200) ||
    ['floor', 'apartment'].some((key) => body.address[key].length > 50) ||
    body.address.details.length > 1000 ||
    (body.couponCode && !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(body.couponCode))
  ) {
    throw new ApiError('INVALID_ORDER', { status: 422 })
  }
  return body
}
export function savedAddress(form, address) {
  const next = { ...form.address }
  for (const key of Object.keys(next)) if (key !== 'governorateCode') next[key] = address[key] || ''
  // Saved addresses contain labels, not Shipping codes; the buyer must confirm the destination.
  next.governorateCode = ''
  return {
    ...form,
    address: next,
    customer: { ...form.customer, phone: address.contactPhone || form.customer.phone },
  }
}
export const uncertainWrite = (error) =>
  !error.status || error.status >= 500 || error.code === 'INVALID_RESPONSE'
export function placementBody(quote, proof) {
  if (!orderIdValid(quote?.checkoutId)) throw new ApiError('CHECKOUT_UNAVAILABLE', { status: 409 })
  if (quote.paymentMethod === 'instapay' && !orderIdValid(proof?.id))
    throw new ApiError('INVALID_ORDER', { status: 422 })
  return {
    checkoutId: quote.checkoutId,
    ...(quote.paymentMethod === 'instapay' && { proofId: proof.id }),
  }
}
