import { ApiError } from '../../../../shared/lib/api.js'
import { orderStatuses, orderTransitions } from './orders.js'

export function staffOrderFixtureRows() {
  return orderStatuses.map((status, index) => {
    const now = new Date(Date.now() - index * 86400000).toISOString()
    const item = {
      productId: (104).toString(16).padStart(24, '0'),
      variantId: (1040).toString(16).padStart(24, '0'),
      name: 'Maison sweatshirt - Black',
      slug: 'maison-sweatshirt-black',
      category: null,
      values: { color: 'black', size: 's' },
      sku: null,
      quantity: 1,
      price: 79900,
      discountedPrice: null,
      unitPrice: 79900,
      lineTotal: 79900,
      couponDiscount: 0,
      lineTotalAfterDiscount: 79900,
      activeSale: null,
    }
    const totals = { subtotal: 79900, discountAmount: 0, shippingFee: 5000, total: 84900 },
      shipping = {
        id: null,
        governorateCode: 'cairo',
        name: null,
        fee: 5000,
        currency: 'EGP',
        source: 'default',
      }
    return {
      id: (12000 + index).toString(16).padStart(24, '0'),
      userId: null,
      status,
      customer: { name: 'Review customer', email: 'customer@example.test', phone: '+201001234567' },
      address: {
        governorateCode: 'cairo',
        governorate: 'Cairo',
        district: 'Nasr City',
        building: '12',
        street: 'Review street',
        floor: '',
        apartment: '',
        details: '',
      },
      items: [item],
      coupon: null,
      shipping,
      totals,
      currency: 'EGP',
      payment: {
        method: index % 2 ? 'cod' : 'instapay',
        receivingAccount: index % 2 ? null : 'DEMO ONLY - no payment account',
        hasProof: false,
        proofId: null,
        verifiedAt: index > 0 && index % 2 === 0 ? now : null,
        verifiedBy: null,
        cashCollectedAt: status === 'delivered' ? now : null,
        cashCollectedBy: null,
      },
      refund: ['canceled', 'returned'].includes(status)
        ? { amount: 84900, at: now, actorId: null }
        : null,
      stockRestored: ['canceled', 'returned'].includes(status),
      history: [
        { status: 'pending', at: now, actorId: null },
        ...(status !== 'pending' ? [{ status, at: now, actorId: null }] : []),
      ],
      quotedPreview: {
        items: [item],
        coupon: null,
        shipping,
        totals,
        currency: 'EGP',
        quotedAt: now,
        receivingAccount: null,
      },
      createdAt: now,
      updatedAt: now,
    }
  })
}
export function createStaffOrdersFixture(rows = staffOrderFixtureRows()) {
  return async (path, { method = 'GET', body, user, language = 'en' } = {}) => {
    const url = new URL(path, 'http://fixture.local'),
      parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] !== 'orders' || parts[1] === 'settings') return undefined
    if (parts.length === 1 && method === 'GET') {
      const page = Number(url.searchParams.get('page') || 1),
        limit = Number(url.searchParams.get('limit') || 20),
        status = url.searchParams.get('status')
      const items = rows.filter((row) => !status || row.status === status)
      return structuredClone({
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
      })
    }
    const row = rows.find((row) => row.id === parts[1])
    if (!row) throw new ApiError('ORDER_NOT_FOUND', { status: 404 })
    if (parts[2] === 'proof') throw new ApiError('ORDER_PROOF_NOT_FOUND', { status: 404 })
    if (parts[2] === 'status' && method === 'PATCH') {
      if (body.status !== row.status) {
        if (body.expectedStatus !== row.status)
          throw new ApiError('ORDER_STATUS_CONFLICT', { status: 409 })
        if (!orderTransitions(row.status).includes(body.status))
          throw new ApiError('ORDER_STATUS_INVALID', { status: 409 })
        row.status = body.status
        row.updatedAt = new Date().toISOString()
        row.history.push({ status: row.status, at: row.updatedAt, actorId: user.id })
        if (row.status === 'accepted' && row.payment.method === 'instapay') {
          row.payment.verifiedAt = row.updatedAt
          row.payment.verifiedBy = user.id
        }
        if (row.status === 'delivered' && row.payment.method === 'cod') {
          row.payment.cashCollectedAt = row.updatedAt
          row.payment.cashCollectedBy = user.id
        }
        if (['canceled', 'returned'].includes(row.status)) {
          row.stockRestored = true
          row.refund = { amount: row.totals.total, at: row.updatedAt, actorId: user.id }
        }
      }
    }
    const result = structuredClone(row)
    if (language === 'ar') {
      result.customer.name = 'عميل للمراجعة'
      result.address.governorate = 'القاهرة'
      result.items[0].name = 'سويت شيرت ميزون - أسود'
    }
    return result
  }
}
