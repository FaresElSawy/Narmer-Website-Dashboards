import { ApiError } from '../../../../shared/lib/api.js'

export const reportLimitations = [
  'offline-payment-refund-markers-only',
  'current-order-status',
  'legacy-category-unknown',
  'direct-category-snapshots-only',
]
export function exactSum(rows, key) {
  const total = rows.reduce((sum, row) => {
    if (!Number.isSafeInteger(row[key]) || row[key] < 0) throw new ApiError('INVALID_REPORT')
    return sum + BigInt(row[key])
  }, 0n)
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new ApiError('REPORT_TOTAL_UNAVAILABLE')
  return Number(total)
}
// Format the integer and fraction separately so even the largest safe piastre amount stays exact.
export function reportMoney(value, language) {
  if (value === null) return '—'
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiError('INVALID_REPORT')
  const locale = language === 'ar' ? 'ar-EG' : 'en-GB',
    amount = BigInt(value)
  const integer = new Intl.NumberFormat(locale).format(amount / 100n)
  const fraction = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(Number(amount % 100n))
  const decimal = new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((part) => part.type === 'decimal').value
  return language === 'ar'
    ? `${integer}${decimal}${fraction} ج.م.`
    : `EGP ${integer}${decimal}${fraction}`
}
export function validateReport(data, path) {
  const url = new URL(path, 'https://report.local'),
    kind = url.pathname.split('/').at(-1)
  const fail = () => {
      throw new ApiError('INVALID_REPORT')
    },
    number = (v) => {
      if (!Number.isSafeInteger(v) || v < 0) fail()
    }
  if (
    !data ||
    !data.meta ||
    data.meta.from !== url.searchParams.get('from') ||
    data.meta.to !== url.searchParams.get('to') ||
    data.meta.timezone !== 'Africa/Cairo' ||
    data.meta.interval !== url.searchParams.get('interval') ||
    data.meta.currency !== 'EGP' ||
    data.meta.definitionsVersion !== 'v1' ||
    !Number.isFinite(Date.parse(data.meta.generatedAt)) ||
    !Array.isArray(data.meta.limitations) ||
    reportLimitations.some((v) => !data.meta.limitations.includes(v))
  )
    fail()
  const fields = (row, keys) => {
    if (!row) fail()
    keys.forEach((key) => number(row[key]))
  }
  const array = (rows) => {
    if (!Array.isArray(rows)) fail()
    return rows
  }
  const products = (rows) =>
    array(rows).forEach((row) => {
      if (!/^[a-f0-9]{24}$/.test(row.productId) || typeof row.name !== 'string') fail()
      fields(row, ['quantity', 'orderCount', 'merchandiseAmount'])
    })
  if (kind === 'overview') {
    fields(data.metrics, ['ordersPlaced', 'unitsPlaced', 'placedOrderAmount', 'pendingOrders'])
    if (data.metrics.averagePlacedOrderAmount !== null)
      number(data.metrics.averagePlacedOrderAmount)
    products(data.topProducts)
    array(data.recentOrders).forEach((row) => {
      if (
        !/^[a-f0-9]{24}$/.test(row.id) ||
        typeof row.customer?.name !== 'string' ||
        !['cod', 'instapay'].includes(row.payment?.method) ||
        !['pending', 'accepted', 'shipped', 'delivered', 'canceled', 'returned'].includes(
          row.status,
        ) ||
        !Number.isFinite(Date.parse(row.createdAt))
      )
        fail()
      fields(row.totals, ['total'])
    })
  } else if (kind === 'finance') {
    fields(data.orderAmounts, ['subtotal', 'couponDiscountAmount', 'shippingFee', 'total'])
    fields(data.collectionMarkers, [
      'instapayVerifiedAmount',
      'codCollectedAmount',
      'totalRecordedAmount',
    ])
    fields(data.refundMarkers, ['amount', 'orderCount'])
    if (
      data.byStatus?.map((row) => row.status).join() !==
        'pending,accepted,shipped,delivered,canceled,returned' ||
      data.byPaymentMethod?.map((row) => row.method).join() !== 'cod,instapay'
    )
      fail()
    array(data.byStatus).forEach((row) => fields(row, ['count', 'orderAmount']))
    array(data.byPaymentMethod).forEach((row) =>
      fields(row, ['orderCount', 'orderAmount', 'recordedCollectionAmount']),
    )
    const amounts = data.orderAmounts,
      markers = data.collectionMarkers
    if (
      BigInt(amounts.total) !==
        BigInt(amounts.subtotal) -
          BigInt(amounts.couponDiscountAmount) +
          BigInt(amounts.shippingFee) ||
      BigInt(markers.totalRecordedAmount) !==
        BigInt(markers.instapayVerifiedAmount) + BigInt(markers.codCollectedAmount) ||
      exactSum(data.byStatus, 'orderAmount') !== amounts.total ||
      exactSum(data.byPaymentMethod, 'orderAmount') !== amounts.total ||
      exactSum(data.byPaymentMethod, 'recordedCollectionAmount') !== markers.totalRecordedAmount
    )
      fail()
  } else {
    if (
      data.rankingBasis?.dateField !== 'createdAt' ||
      data.rankingBasis?.includedStatuses?.join() !== 'delivered' ||
      data.rankingBasis?.rankBy !== url.searchParams.get('rankBy')
    )
      fail()
    products(data.items)
    fields(data.pagination, ['page', 'limit', 'total', 'pages'])
    if (
      data.pagination.page !== Number(url.searchParams.get('page')) ||
      data.pagination.limit !== Number(url.searchParams.get('limit'))
    )
      fail()
    array(data.categories).forEach((row) => {
      fields(row, ['quantity', 'merchandiseAmount'])
      if (
        row.categoryId !== null &&
        (!/^[a-f0-9]{24}$/.test(row.categoryId) || typeof row.name !== 'string')
      )
        fail()
    })
    exactSum(data.categories, 'quantity')
    exactSum(data.categories, 'merchandiseAmount')
  }
  if (kind !== 'sales-performance') {
    let previous
    array(data.trend).forEach((row) => {
      if (
        !Number.isFinite(Date.parse(row.bucketStart)) ||
        !Number.isFinite(Date.parse(row.bucketEnd)) ||
        row.bucketStart >= row.bucketEnd ||
        (previous && previous !== row.bucketStart)
      )
        fail()
      previous = row.bucketEnd
      fields(
        row,
        kind === 'overview'
          ? ['ordersPlaced', 'unitsPlaced', 'placedOrderAmount']
          : [
              'placedOrderAmount',
              'instapayVerifiedAmount',
              'codCollectedAmount',
              'refundMarkerAmount',
            ],
      )
    })
    if (
      !data.trend.length ||
      data.trend[0].bucketStart > data.meta.from ||
      data.trend.at(-1).bucketEnd < data.meta.to
    )
      fail()
    if (kind === 'overview') {
      if (
        exactSum(data.trend, 'ordersPlaced') !== data.metrics.ordersPlaced ||
        exactSum(data.trend, 'unitsPlaced') !== data.metrics.unitsPlaced ||
        exactSum(data.trend, 'placedOrderAmount') !== data.metrics.placedOrderAmount
      )
        fail()
    } else if (
      exactSum(data.trend, 'placedOrderAmount') !== data.orderAmounts.total ||
      exactSum(data.trend, 'instapayVerifiedAmount') !==
        data.collectionMarkers.instapayVerifiedAmount ||
      exactSum(data.trend, 'codCollectedAmount') !== data.collectionMarkers.codCollectedAmount ||
      exactSum(data.trend, 'refundMarkerAmount') !== data.refundMarkers.amount
    )
      fail()
  }
  return data
}
export function createReportStore() {
  return { cache: new Map(), epoch: 0, requests: [], pausedUntil: 0 }
}
export async function readReport(
  store,
  request,
  path,
  { signal, fresh = false, language = 'en' } = {},
) {
  const kind = `${language}:${path.split('?')[0]}`,
    cached = store.cache.get(kind),
    now = Date.now(),
    epoch = store.epoch
  if (!fresh && cached?.path === path && now - cached.at < 15000) return cached.data
  store.requests = store.requests.filter((at) => now - at < 60000)
  const remaining = Math.max(
    store.pausedUntil - now,
    store.requests.length >= 30 ? store.requests[0] + 60000 - now : 0,
  )
  if (remaining > 0)
    throw new ApiError('TOO_MANY_REQUESTS', {
      status: 429,
      retryAfter: Math.ceil(remaining / 1000),
    })
  store.requests.push(now)
  try {
    const data = validateReport(await request(path, { signal }), path)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    if (epoch !== store.epoch) throw new ApiError('REPORT_CHANGED')
    store.cache.set(kind, { path, data, at: Date.now() })
    return data
  } catch (error) {
    if (error.status === 429) store.pausedUntil = Date.now() + (error.retryAfter ?? 30) * 1000
    throw error
  }
}
