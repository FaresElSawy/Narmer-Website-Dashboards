import { ApiError } from '../../../../shared/lib/api.js'
import { imageUploadBody } from '../../../../shared/lib/image-upload.js'
import { fixtureId } from '../shop/fixtures.js'

const states = new WeakMap()
const fail = (code, status = 409) => {
  throw new ApiError(code, { status })
}
const id = (n) => fixtureId(n)
const statuses = ['pending', 'accepted', 'shipped', 'delivered', 'canceled', 'returned']
const pageQuery = (query) =>
  new URLSearchParams(
    query instanceof URLSearchParams ? query : String(query || '').replace(/^\?/, ''),
  )

export function createOrdersFixture({ session, retail }) {
  if (states.has(session)) return states.get(session).api
  const state = { checkouts: new Map(), proofs: new Map(), orders: new Map(), next: 1 }
  const identity = () => session.getSnapshot().user
  const guard = (owner) => {
    const user = identity()
    if (
      owner === 'guest'
        ? user?.id
        : user?.id !== owner || user.role !== 'user' || user.store !== 'b2c'
    )
      fail('CHECKOUT_IDENTITY_CHANGED')
  }
  const lines = async (language = 'en') => (await retail.cart(false, { language })).items
  const total = (items, key) => items.reduce((sum, item) => sum + item[key], 0)
  const selections = (items) =>
    items
      .map(({ productId, variantId, quantity }) => ({
        productId,
        variantId: variantId || null,
        quantity,
      }))
      .sort((a, b) =>
        `${a.productId}:${a.variantId || ''}`.localeCompare(`${b.productId}:${b.variantId || ''}`),
      )
  const same = (a, b) => JSON.stringify(selections(a)) === JSON.stringify(selections(b))
  const cartSnapshot = async (language = 'en') => {
    const rows = await lines(language)
    if (!rows.length || rows.some((item) => item.status !== 'available'))
      fail('ORDER_CART_UNAVAILABLE')
    return rows.map(
      ({
        productId,
        variantId,
        quantity,
        name,
        slug,
        values,
        sku,
        price,
        discountedPrice,
        unitPrice,
        lineTotal,
        activeSale,
      }) => ({
        productId,
        variantId: variantId || null,
        name,
        slug,
        category: null,
        values,
        sku,
        quantity,
        price,
        discountedPrice,
        unitPrice,
        lineTotal,
        couponDiscount: 0,
        lineTotalAfterDiscount: lineTotal,
        activeSale,
      }),
    )
  }
  const shipping = (code, language = 'en') =>
    code.toLowerCase() === 'cairo'
      ? {
          id: id(4000),
          governorateCode: 'cairo',
          name: language === 'ar' ? 'القاهرة' : 'Cairo',
          fee: 6000,
          currency: 'EGP',
          source: 'override',
        }
      : {
          id: null,
          governorateCode: code.toLowerCase(),
          name: null,
          fee: 5000,
          currency: 'EGP',
          source: 'default',
        }
  const couponPreview = async (body, owner, { language = 'en' } = {}) => {
    guard(owner)
    if (String(body.code || '').toUpperCase() !== 'WELCOME10') fail('COUPON_UNAVAILABLE')
    const items = await cartSnapshot(language),
      eligible = items.filter((item) => !item.activeSale)
    if (!eligible.length) fail('COUPON_NO_ELIGIBLE_ITEMS')
    const base = total(eligible, 'lineTotal'),
      discount = Math.floor(base / 10)
    let assigned = 0
    eligible.forEach((item, index) => {
      item.couponDiscount =
        index === eligible.length - 1
          ? discount - assigned
          : Math.floor((discount * item.lineTotal) / base)
      assigned += item.couponDiscount
      item.lineTotalAfterDiscount -= item.couponDiscount
    })
    const subtotal = total(items, 'lineTotal')
    return {
      coupon: {
        id: id(800),
        code: 'WELCOME10',
        name: language === 'ar' ? 'خصم الترحيب' : 'Welcome discount',
        discountType: 'percentage',
        discountValue: 10,
      },
      currency: 'EGP',
      subtotal,
      eligibleSubtotal: base,
      discountAmount: discount,
      subtotalAfterDiscount: subtotal - discount,
      allocations: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        eligible: !item.activeSale,
        discountAmount: item.couponDiscount,
        lineTotalAfterDiscount: item.lineTotalAfterDiscount,
      })),
    }
  }
  const validGuestToken = (record, token) =>
    record.owner === 'guest' &&
    token === record.result.trackingToken &&
    Date.parse(record.result.trackingExpiresAt) > Date.now()
  const localizedOrder = (record, language) => {
    const order = structuredClone(record.result.order)
    for (const item of order.items)
      item.name = record.names?.[language]?.[item.productId] || item.name
    if (order.coupon) order.coupon.name = language === 'ar' ? 'خصم الترحيب' : 'Welcome discount'
    if (order.shipping.governorateCode === 'cairo')
      order.shipping.name = language === 'ar' ? 'القاهرة' : 'Cairo'
    return order
  }
  const api = {
    async shippingFees({ page = 1, limit = 100, language = 'en' } = {}) {
      const items = [
        {
          id: id(4000),
          governorateCode: 'cairo',
          name: language === 'ar' ? 'القاهرة' : 'Cairo',
          fee: 6000,
          currency: 'EGP',
          isActive: true,
        },
      ]
      return {
        items: items.slice((page - 1) * limit, page * limit),
        default: { configured: true, defaultFee: 5000, currency: 'EGP' },
        pagination: { page, limit, total: 1, pages: Math.ceil(1 / limit) },
      }
    },
    async shippingQuote(governorateCode, { language = 'en' } = {}) {
      return shipping(governorateCode, language)
    },
    coupon: couponPreview,
    async preview(body, owner, { language = 'en' } = {}) {
      guard(owner)
      const items = await cartSnapshot(language),
        subtotal = total(items, 'lineTotal'),
        coupon = body.couponCode
          ? await couponPreview({ code: body.couponCode, phone: body.customer.phone }, owner, {
              language,
            })
          : null
      if (coupon)
        for (const allocation of coupon.allocations) {
          const item = items.find(
            (line) =>
              line.productId === allocation.productId && line.variantId === allocation.variantId,
          )
          item.couponDiscount = allocation.discountAmount
          item.lineTotalAfterDiscount = allocation.lineTotalAfterDiscount
        }
      const quote = shipping(body.address.governorateCode, language),
        discountAmount = coupon?.discountAmount || 0
      const checkoutId = id(900 + state.next++),
        expiresAt = new Date(Date.now() + 86400000).toISOString()
      const checkout = {
        checkoutId,
        expiresAt,
        paymentMethod: body.paymentMethod,
        items,
        coupon: coupon?.coupon || null,
        shipping: quote,
        totals: {
          subtotal,
          discountAmount,
          shippingFee: quote.fee,
          total: subtotal - discountAmount + quote.fee,
        },
        currency: 'EGP',
        quotedAt: new Date().toISOString(),
        receivingAccount:
          body.paymentMethod === 'instapay' ? 'SAMPLE ONLY - not a real receiving account' : null,
      }
      const names = {}
      for (const locale of ['en', 'ar'])
        names[locale] = Object.fromEntries(
          (await lines(locale)).map((item) => [item.productId, item.name]),
        )
      state.checkouts.set(checkoutId, {
        owner,
        checkout,
        body: structuredClone(body),
        cart: await lines(),
        names,
      })
      guard(owner)
      return structuredClone(checkout)
    },
    async upload(checkoutId, file, owner) {
      guard(owner)
      const checkout = state.checkouts.get(checkoutId)
      if (
        !checkout ||
        checkout.owner !== owner ||
        Date.parse(checkout.checkout.expiresAt) <= Date.now()
      )
        fail('CHECKOUT_UNAVAILABLE')
      if (
        checkout.checkout.paymentMethod !== 'instapay' ||
        [...state.orders.values()].some((record) => record.checkoutId === checkoutId)
      )
        fail('ORDER_PROOF_CONFLICT')
      const body = await imageUploadBody(file)
      const proofId = id(2000 + state.next++)
      state.proofs.set(proofId, {
        owner,
        checkoutId,
        file: body,
        expiresAt: checkout.checkout.expiresAt,
        attached: false,
      })
      guard(owner)
      return { id: proofId, width: null, height: null, expiresAt: checkout.checkout.expiresAt }
    },
    async place(body, owner, { language = 'en' } = {}) {
      guard(owner)
      const checkout = state.checkouts.get(body.checkoutId)
      if (!checkout || checkout.owner !== owner) fail('CHECKOUT_UNAVAILABLE')
      const replayKey = `${owner}:${body.checkoutId}`,
        prior = state.orders.get(replayKey)
      if (prior) {
        if (prior.proofId !== (body.proofId || null)) fail('ORDER_REQUEST_CONFLICT')
        guard(owner)
        return { ...structuredClone(prior.result), order: localizedOrder(prior, language) }
      }
      if (Date.parse(checkout.checkout.expiresAt) <= Date.now()) fail('CHECKOUT_UNAVAILABLE')
      if (
        !Object.hasOwn(body, 'checkoutId') ||
        Object.keys(body).some((key) => !['checkoutId', 'proofId'].includes(key)) ||
        (checkout.checkout.paymentMethod === 'instapay') !== !!body.proofId
      )
        fail('INVALID_ORDER', 422)
      const proof = body.proofId ? state.proofs.get(body.proofId) : null
      if (
        body.proofId &&
        (!proof ||
          proof.owner !== owner ||
          proof.checkoutId !== body.checkoutId ||
          proof.attached ||
          Date.parse(proof.expiresAt) <= Date.now() ||
          checkout.checkout.paymentMethod !== 'instapay')
      )
        fail('ORDER_PROOF_CONFLICT')
      const current = await lines()
      if (!current.length || current.some((line) => line.status !== 'available'))
        fail('ORDER_CART_UNAVAILABLE')
      if (!same(current, checkout.cart)) fail('CHECKOUT_CART_CHANGED')
      const now = new Date().toISOString(),
        orderId = id(3000 + state.next++),
        dto = {
          id: orderId,
          orderNumber: 'NRM-20261030-74M9Y3',
          status: 'pending',
          customer: structuredClone(checkout.body.customer),
          address: {
            governorateCode: checkout.body.address.governorateCode.toLowerCase(),
            governorate: checkout.body.address.governorate,
            district: checkout.body.address.district,
            building: checkout.body.address.building,
            street: checkout.body.address.street,
            floor: checkout.body.address.floor || '',
            apartment: checkout.body.address.apartment || '',
            details: checkout.body.address.details || '',
          },
          items: structuredClone(checkout.checkout.items),
          coupon: structuredClone(checkout.checkout.coupon),
          shipping: structuredClone(checkout.checkout.shipping),
          totals: structuredClone(checkout.checkout.totals),
          currency: 'EGP',
          payment: {
            method: checkout.checkout.paymentMethod,
            receivingAccount: checkout.checkout.receivingAccount,
            hasProof: !!proof,
            verifiedAt: null,
            cashCollectedAt: null,
          },
          refund: null,
          history: [{ status: 'pending', at: now }],
          createdAt: now,
          updatedAt: now,
        }
      const result = {
        order: dto,
        trackingToken: owner === 'guest' ? `review-track-${body.checkoutId}` : null,
        trackingExpiresAt:
          owner === 'guest' ? new Date(Date.now() + 90 * 86400000).toISOString() : null,
      }
      if (proof) proof.attached = true
      for (const line of checkout.cart) await retail.setQuantity({ ...line, quantity: 0 })
      state.orders.set(replayKey, {
        checkoutId: body.checkoutId,
        owner,
        proofId: body.proofId || null,
        result,
        names: checkout.names,
      })
      guard(owner)
      return {
        ...structuredClone(result),
        order: localizedOrder(state.orders.get(replayKey), language),
      }
    },
    async orders(query = '', { language = 'en' } = {}) {
      const user = identity()
      if (user?.role !== 'user' || user.store !== 'b2c') fail('FORBIDDEN', 403)
      const params = pageQuery(query),
        page = Number(params.get('page') || 1),
        limit = Number(params.get('limit') || 20),
        status = params.get('status')
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > 100000 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        (status && !statuses.includes(status))
      )
        fail('VALIDATION_ERROR', 422)
      const all = [...state.orders.values()]
        .filter(
          (record) =>
            record.owner === user.id && (!status || record.result.order.status === status),
        )
        .map((record) => localizedOrder(record, language))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      const total = all.length
      return {
        items: all.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }
    },
    async order(orderId, { token, language = 'en' } = {}) {
      const record = [...state.orders.values()].find(
        (item) =>
          item.result.order.id === orderId &&
          (token ? validGuestToken(item, token) : item.owner === identity()?.id),
      )
      if (!record) fail('ORDER_NOT_FOUND', 404)
      return localizedOrder(record, language)
    },
    async proof(orderId, { token } = {}) {
      const record = [...state.orders.values()].find(
        (item) =>
          item.result.order.id === orderId &&
          (token ? validGuestToken(item, token) : item.owner === identity()?.id),
      )
      const proof = record?.proofId && state.proofs.get(record.proofId)
      if (!proof) fail('ORDER_PROOF_NOT_FOUND', 404)
      return proof.file
    },
  }
  state.api = api
  states.set(session, state)
  return api
}
