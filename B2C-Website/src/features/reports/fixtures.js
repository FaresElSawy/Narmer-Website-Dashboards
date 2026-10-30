import { ApiError } from '../../../../shared/lib/api.js'
import { fixtureBuckets } from './dates.js'
import { exactSum, reportLimitations } from './model.js'
import { orderStatuses } from '../dashboard/orders.js'

// Review-only aggregation over the same mutable order snapshots used by the Orders fixture.
export function createReportsFixture(orders, products) {
  return async (path, { method = 'GET', language = 'en' } = {}) => {
    const url = new URL(path, 'https://fixture.local')
    if (!url.pathname.startsWith('/reports/')) return undefined
    const kind = url.pathname.split('/').at(-1),
      p = url.searchParams
    if (method !== 'GET' || !['overview', 'finance', 'sales-performance'].includes(kind))
      throw new ApiError('NOT_FOUND', { status: 404 })
    const from = p.get('from'),
      to = p.get('to'),
      interval = p.get('interval') || 'day',
      rankBy = p.get('rankBy') || 'units',
      page = Number(p.get('page') || 1),
      limit = Number(p.get('limit') || 20)
    if (
      !Number.isFinite(Date.parse(from)) ||
      !Number.isFinite(Date.parse(to)) ||
      from >= to ||
      +new Date(to) - +new Date(from) > 366 * 86400000 ||
      !['day', 'week', 'month'].includes(interval) ||
      !['units', 'merchandiseAmount'].includes(rankBy) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 100000 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new ApiError('VALIDATION_ERROR', { status: 422 })
    const within = (at, start = from, end = to) =>
      at && +new Date(at) >= +new Date(start) && +new Date(at) < +new Date(end)
    const placed = orders
      .filter((row) => within(row.createdAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    const meta = {
      from,
      to,
      interval,
      timezone: 'Africa/Cairo',
      currency: 'EGP',
      generatedAt: new Date().toISOString(),
      definitionsVersion: 'v1',
      limitations: reportLimitations,
    }
    const sumOrders = (rows) =>
      exactSum(
        rows.map((row) => ({ amount: row.totals.total })),
        'amount',
      )
    const markerOrders = (method, start = from, end = to) =>
      orders.filter(
        (row) =>
          row.payment.method === method &&
          within(
            method === 'cod' ? row.payment.cashCollectedAt : row.payment.verifiedAt,
            start,
            end,
          ),
      )
    const refunds = (start = from, end = to) =>
      orders.filter((row) => within(row.refund?.at, start, end))
    const refundAmount = (rows) =>
      exactSum(
        rows.map((row) => ({ amount: row.refund.amount })),
        'amount',
      )
    const ranked = new Map(),
      categories = new Map()
    for (const order of placed.filter((row) => row.status === 'delivered'))
      for (const item of order.items) {
        const catalog = products.find((row) => row.id === item.productId)
        if (!ranked.has(item.productId))
          ranked.set(item.productId, {
            productId: item.productId,
            name:
              language === 'ar' && item.productId === (104).toString(16).padStart(24, '0')
                ? 'سويت شيرت ميزون - أسود'
                : typeof item.name === 'string'
                  ? item.name
                  : item.name[language] || item.name.en,
            slug: catalog?.slug || null,
            image: catalog?.images?.[0] || null,
            quantity: 0,
            orderCount: 0,
            merchandiseAmount: 0,
            orders: new Set(),
          })
        const row = ranked.get(item.productId)
        row.quantity += item.quantity
        row.merchandiseAmount += item.lineTotalAfterDiscount
        row.orders.add(order.id)
        row.orderCount = row.orders.size
        const id = item.category?.id || null
        if (!categories.has(id))
          categories.set(id, {
            categoryId: id,
            name: id
              ? typeof item.category.name === 'string'
                ? item.category.name
                : item.category.name[language] || item.category.name.en
              : null,
            quantity: 0,
            merchandiseAmount: 0,
          })
        const category = categories.get(id)
        category.quantity += item.quantity
        category.merchandiseAmount += item.lineTotalAfterDiscount
      }
    const sorted = (rows) =>
      [...rows].sort(
        (a, b) =>
          b[rankBy === 'units' ? 'quantity' : 'merchandiseAmount'] -
            a[rankBy === 'units' ? 'quantity' : 'merchandiseAmount'] ||
          String(a.productId || a.categoryId).localeCompare(String(b.productId || b.categoryId)),
      )
    const productRows = sorted(ranked.values()).map(({ orders: _orders, ...row }) => row)
    if (kind === 'sales-performance')
      return structuredClone({
        meta,
        rankingBasis: { dateField: 'createdAt', includedStatuses: ['delivered'], rankBy },
        items: productRows.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: productRows.length,
          pages: Math.ceil(productRows.length / limit),
        },
        categories: sorted(categories.values()),
      })
    const trend = fixtureBuckets(from, to, interval).map((bucket) => {
      const rows = placed.filter((row) =>
        within(row.createdAt, bucket.bucketStart, bucket.bucketEnd),
      )
      return {
        ...bucket,
        placedOrderAmount: sumOrders(rows),
        ...(kind === 'overview'
          ? {
              ordersPlaced: rows.length,
              unitsPlaced: exactSum(
                rows.flatMap((row) => row.items),
                'quantity',
              ),
            }
          : {
              instapayVerifiedAmount: sumOrders(
                markerOrders('instapay').filter((row) =>
                  within(row.payment.verifiedAt, bucket.bucketStart, bucket.bucketEnd),
                ),
              ),
              codCollectedAmount: sumOrders(
                markerOrders('cod').filter((row) =>
                  within(row.payment.cashCollectedAt, bucket.bucketStart, bucket.bucketEnd),
                ),
              ),
              refundMarkerAmount: refundAmount(
                refunds().filter((row) =>
                  within(row.refund.at, bucket.bucketStart, bucket.bucketEnd),
                ),
              ),
            }),
      }
    })
    if (kind === 'overview') {
      const amount = sumOrders(placed)
      return structuredClone({
        meta,
        metrics: {
          ordersPlaced: placed.length,
          unitsPlaced: exactSum(
            placed.flatMap((row) => row.items),
            'quantity',
          ),
          placedOrderAmount: amount,
          pendingOrders: placed.filter((row) => row.status === 'pending').length,
          averagePlacedOrderAmount: placed.length
            ? Number((BigInt(amount) * 2n + BigInt(placed.length)) / (2n * BigInt(placed.length)))
            : null,
        },
        trend,
        topProducts: productRows.slice(0, 5),
        recentOrders: placed
          .slice(0, 5)
          .map((row) =>
            language === 'ar'
              ? { ...row, customer: { ...row.customer, name: 'عميل للمراجعة' } }
              : row,
          ),
      })
    }
    const instapayVerifiedAmount = sumOrders(markerOrders('instapay')),
      codCollectedAmount = sumOrders(markerOrders('cod'))
    return structuredClone({
      meta,
      orderAmounts: {
        subtotal: exactSum(
          placed.map((row) => row.totals),
          'subtotal',
        ),
        couponDiscountAmount: exactSum(
          placed.map((row) => row.totals),
          'discountAmount',
        ),
        shippingFee: exactSum(
          placed.map((row) => row.totals),
          'shippingFee',
        ),
        total: sumOrders(placed),
      },
      collectionMarkers: {
        instapayVerifiedAmount,
        codCollectedAmount,
        totalRecordedAmount: exactSum(
          [{ amount: instapayVerifiedAmount }, { amount: codCollectedAmount }],
          'amount',
        ),
      },
      refundMarkers: { amount: refundAmount(refunds()), orderCount: refunds().length },
      byStatus: orderStatuses.map((status) => {
        const rows = placed.filter((row) => row.status === status)
        return { status, count: rows.length, orderAmount: sumOrders(rows) }
      }),
      byPaymentMethod: ['cod', 'instapay'].map((method) => {
        const rows = placed.filter((row) => row.payment.method === method)
        return {
          method,
          orderCount: rows.length,
          orderAmount: sumOrders(rows),
          recordedCollectionAmount: sumOrders(markerOrders(method)),
        }
      }),
      trend,
    })
  }
}
