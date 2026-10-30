import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  reportRange,
  cairoDate,
  cairoStart,
  fixtureBuckets,
} from '../../B2C-Website/src/features/reports/dates.js'
import {
  reportMoney,
  exactSum,
  validateReport,
  createReportStore,
  readReport,
} from '../../B2C-Website/src/features/reports/model.js'
import { createReportsFixture } from '../../B2C-Website/src/features/reports/fixtures.js'
import {
  staffOrderFixtureRows,
  createStaffOrdersFixture,
} from '../../B2C-Website/src/features/dashboard/order-fixtures.js'
import { dashboardAccess } from '../../B2C-Website/src/features/dashboard/model.js'
import { ApiError } from '../lib/api.js'
import { sundayWeeks } from '../../B2C-Website/src/features/reports/weeks.js'
const path = (kind = 'overview', extra = {}) =>
  `/reports/${kind}?${new URLSearchParams({ ...reportRange('2026-10-01', '2026-10-31'), interval: 'day', ...(kind === 'sales-performance' ? { rankBy: 'units', page: '1', limit: '20' } : {}), ...extra })}`
const seed = () => {
  const rows = staffOrderFixtureRows()
  rows.forEach((row, index) => {
    row.createdAt = `2026-10-${20 + index}T12:00:00.000Z`
    if (row.payment.verifiedAt) row.payment.verifiedAt = row.createdAt
    if (row.payment.cashCollectedAt) row.payment.cashCollectedAt = row.createdAt
    if (row.refund) row.refund.at = row.createdAt
  })
  return rows
}
test('Narmer Sunday weeks aggregate only returned daily values, including partial and DST weeks', () => {
  for (const [from, through] of [
    ['2026-04-23', '2026-04-28'],
    ['2026-10-27', '2026-11-02'],
  ]) {
    const range = reportRange(from, through)
    const days = fixtureBuckets(range.from, range.to, 'day').map((row, index) => ({
      ...row,
      placedOrderAmount: index + 1,
      instapayVerifiedAmount: 0,
      codCollectedAmount: index,
      refundMarkerAmount: 1,
    }))
    const weeks = sundayWeeks(days)
    assert.equal(exactSum(weeks, 'placedOrderAmount'), exactSum(days, 'placedOrderAmount'))
    assert.equal(exactSum(weeks, 'codCollectedAmount'), exactSum(days, 'codCollectedAmount'))
    assert.equal(exactSum(weeks, 'refundMarkerAmount'), days.length)
    for (const week of weeks)
      assert.equal(new Date(`${cairoDate(week.bucketStart)}T12:00Z`).getUTCDay(), 0)
    for (let index = 1; index < weeks.length; index++)
      assert.equal(weeks[index - 1].bucketEnd, weeks[index].bucketStart)
  }
  const amounts = [
    {
      bucketStart: cairoStart('2026-10-27'),
      bucketEnd: cairoStart('2026-10-28'),
      placedOrderAmount: Number.MAX_SAFE_INTEGER - 1,
    },
    {
      bucketStart: cairoStart('2026-10-28'),
      bucketEnd: cairoStart('2026-10-29'),
      placedOrderAmount: 1,
    },
  ]
  assert.equal(sundayWeeks(amounts)[0].bucketStart, cairoStart('2026-10-25'))
  assert.equal(sundayWeeks(amounts)[0].placedOrderAmount, Number.MAX_SAFE_INTEGER)
  amounts[1].placedOrderAmount = 2
  assert.throws(() => sundayWeeks(amounts), { code: 'REPORT_TOTAL_UNAVAILABLE' })
})
test('Cairo calendar boundaries cover skipped midnight and 23/25 hour dates', () => {
  assert.equal(cairoStart('2026-04-24'), '2026-04-23T22:00:00.000Z')
  assert.equal(cairoDate(cairoStart('2026-04-24')), '2026-04-24')
  for (const [key, hours] of [
    ['2026-04-24', 23],
    ['2026-10-29', 25],
    ['2026-10-30', 24],
  ]) {
    const r = reportRange(key, key)
    assert.equal((Date.parse(r.to) - Date.parse(r.from)) / 3600000, hours)
  }
  assert.deepEqual(reportRange('2026-01-01', '2026-01-31'), {
    from: '2025-12-31T22:00:00.000Z',
    to: '2026-01-31T22:00:00.000Z',
    timezone: 'Africa/Cairo',
  })
})
test('calendar conversion is independent of the device timezone', () => {
  for (const zone of ['America/Los_Angeles', 'Asia/Tokyo', 'UTC']) {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import {reportRange} from './B2C-Website/src/features/reports/dates.js'; console.log(JSON.stringify(reportRange('2026-10-29','2026-10-29')))",
      ],
      {
        cwd: new URL('../../', import.meta.url),
        env: { ...process.env, TZ: zone },
        encoding: 'utf8',
      },
    )
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), reportRange('2026-10-29', '2026-10-29'))
  }
})
test('invalid dates, unsafe years and elapsed ranges are rejected', () => {
  for (const [from, through] of [
    ['2026-02-30', '2026-03-01'],
    ['2026-02-01', '2026-01-31'],
    ['2000-01-01', '2000-01-01'],
    ['2101-01-01', '2101-01-01'],
    ['2025-01-01', '2026-01-02'],
    ['', '2026-01-01'],
  ])
    assert.throws(() => reportRange(from, through))
  assert.doesNotThrow(() => reportRange('2026-01-01', '2027-01-01'))
})
test('review bucket boundaries use Cairo Monday weeks, calendar months and natural partial buckets', () => {
  const weeks = fixtureBuckets('2026-04-23T22:00:00.000Z', '2026-04-28T21:00:00.000Z', 'week')
  assert.equal(weeks[0].bucketStart, '2026-04-19T22:00:00.000Z')
  assert.equal(weeks[0].bucketEnd, weeks[1].bucketStart)
  const months = fixtureBuckets('2026-01-15T22:00:00.000Z', '2026-02-05T22:00:00.000Z', 'month')
  assert.equal(months[0].bucketStart, '2025-12-31T22:00:00.000Z')
  assert.equal(months[1].bucketEnd, '2026-02-28T22:00:00.000Z')
})
test('safe money is exact to the last piastre, including localized largest safe value', () => {
  assert.equal(reportMoney(Number.MAX_SAFE_INTEGER, 'en'), 'EGP 90,071,992,547,409.91')
  assert.equal(reportMoney(0, 'en'), 'EGP 0.00')
  assert.equal(reportMoney(null, 'en'), '—')
  assert.match(reportMoney(Number.MAX_SAFE_INTEGER, 'ar'), /٩١/)
  assert.equal(
    exactSum([{ amount: Number.MAX_SAFE_INTEGER - 1 }, { amount: 1 }], 'amount'),
    Number.MAX_SAFE_INTEGER,
  )
  assert.throws(() => exactSum([{ amount: Number.MAX_SAFE_INTEGER }, { amount: 1 }], 'amount'), {
    code: 'REPORT_TOTAL_UNAVAILABLE',
  })
  assert.throws(() => reportMoney(1.5, 'en'))
  assert.throws(() => exactSum([{ amount: -1 }], 'amount'))
})
test('report routes are B2C admin/superAdmin GET only, with exact known endpoints', () => {
  for (const role of ['superAdmin', 'admin'])
    for (const kind of ['overview', 'finance', 'sales-performance'])
      assert.equal(dashboardAccess(role, path(kind)), true)
  for (const role of ['moderator', 'user']) assert.equal(dashboardAccess(role, path()), false)
  for (const method of ['POST', 'PATCH', 'DELETE'])
    assert.equal(dashboardAccess('superAdmin', path(), method), false)
  for (const route of ['/reports', '/reports/unknown', '/reports/overview/extra'])
    assert.equal(dashboardAccess('admin', route), false)
})
test('review reports reconcile placement totals and maintain separate marker cohorts', async () => {
  const rows = seed()
  rows[2].createdAt = '2026-09-20T12:00:00.000Z'
  rows[2].payment.verifiedAt = '2026-10-25T12:00:00.000Z'
  const serve = createReportsFixture(rows, []),
    overview = validateReport(await serve(path()), path()),
    finance = validateReport(await serve(path('finance')), path('finance'))
  assert.equal(overview.metrics.ordersPlaced, 5)
  assert.equal(overview.metrics.placedOrderAmount, 5 * 84900)
  assert.equal(
    finance.orderAmounts.total,
    finance.orderAmounts.subtotal -
      finance.orderAmounts.couponDiscountAmount +
      finance.orderAmounts.shippingFee,
  )
  assert.equal(finance.collectionMarkers.instapayVerifiedAmount, 2 * 84900)
  assert.equal(finance.refundMarkers.amount, 2 * 84900)
  assert.equal(exactSum(finance.byStatus, 'orderAmount'), finance.orderAmounts.total)
  assert.equal(
    exactSum(finance.trend, 'instapayVerifiedAmount'),
    finance.collectionMarkers.instapayVerifiedAmount,
  )
})
test('returns remove historical delivered rankings and preserve collection markers', async () => {
  const rows = seed(),
    serve = createReportsFixture(rows, []),
    mutate = createStaffOrdersFixture(rows)
  const before = validateReport(await serve(path('sales-performance')), path('sales-performance'))
  assert.equal(before.items.length, 1)
  assert.equal(before.items[0].quantity, 1)
  assert.equal(before.categories[0].categoryId, null)
  const delivered = rows.find((row) => row.status === 'delivered'),
    marker = delivered.payment.cashCollectedAt
  await mutate(`/orders/${delivered.id}/status`, {
    method: 'PATCH',
    body: { status: 'returned', expectedStatus: 'delivered' },
    user: { id: 'staff' },
  })
  const after = await serve(path('sales-performance'))
  assert.equal(after.pagination.total, 0)
  assert.deepEqual(after.categories, [])
  assert.equal(delivered.payment.cashCollectedAt, marker)
})
test('performance counts distinct orders per product and keeps category totals beyond page end', async () => {
  const rows = seed(),
    delivered = rows.find((row) => row.status === 'delivered')
  delivered.items.push({ ...delivered.items[0], variantId: '0'.repeat(24) })
  const serve = createReportsFixture(rows, []),
    report = await serve(path('sales-performance'))
  assert.equal(report.items[0].quantity, 2)
  assert.equal(report.items[0].orderCount, 1)
  const last = await serve(path('sales-performance', { page: '2' }))
  assert.deepEqual(last.items, [])
  assert.deepEqual(last.categories, report.categories)
})
test('empty reports retain zero buckets and null average; malformed totals and stale metadata fail closed', async () => {
  const serve = createReportsFixture([], []),
    response = await serve(path())
  validateReport(response, path())
  assert.equal(response.metrics.averagePlacedOrderAmount, null)
  assert.equal(response.trend.length, 31)
  assert.equal(exactSum(response.trend, 'placedOrderAmount'), 0)
  assert.throws(
    () =>
      validateReport(
        {
          ...response,
          metrics: { ...response.metrics, placedOrderAmount: Number.MAX_SAFE_INTEGER + 1 },
        },
        path(),
      ),
    { code: 'INVALID_REPORT' },
  )
  assert.throws(
    () => validateReport(response, path('overview', { from: '2026-10-02T00:00:00.000Z' })),
    { code: 'INVALID_REPORT' },
  )
})
test('cache is short-lived, keyed by endpoint/range/language and supports explicit refresh', async () => {
  const serve = createReportsFixture(seed(), []),
    store = createReportStore()
  let calls = 0
  const request = async (p) => {
    calls++
    return serve(p)
  }
  await readReport(store, request, path())
  await readReport(store, request, path())
  assert.equal(calls, 1)
  await readReport(store, request, path(), { fresh: true })
  assert.equal(calls, 2)
  await readReport(store, request, path(), { language: 'ar' })
  assert.equal(calls, 3)
  store.cache.get(`en:/reports/overview`).at -= 15001
  await readReport(store, request, path())
  assert.equal(calls, 4)
})
test('requests share a thirty-per-minute budget, honor Retry-After and never auto retry', async () => {
  const serve = createReportsFixture([], []),
    store = createReportStore()
  let calls = 0
  const request = async (p) => {
    calls++
    return serve(p)
  }
  for (let index = 0; index < 30; index++) await readReport(store, request, path(), { fresh: true })
  await assert.rejects(readReport(store, request, path('finance')), { status: 429 })
  assert.equal(calls, 30)
  const paused = createReportStore()
  let failures = 0
  const fail = async () => {
    failures++
    throw new ApiError('TOO_MANY_REQUESTS', { status: 429, retryAfter: 4 })
  }
  await assert.rejects(readReport(paused, fail, path()), { status: 429 })
  await assert.rejects(readReport(paused, fail, path('finance')), { status: 429 })
  assert.equal(failures, 1)
})
test('aborted and invalidated in-flight reports never populate the private cache', async () => {
  const serve = createReportsFixture([], []),
    response = await serve(path()),
    store = createReportStore()
  let finish
  const reading = readReport(
    store,
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
    path(),
  )
  store.epoch++
  finish(response)
  await assert.rejects(reading, { code: 'REPORT_CHANGED' })
  assert.equal(store.cache.size, 0)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    readReport(store, async () => response, path(), { signal: controller.signal }),
    { name: 'AbortError' },
  )
  assert.equal(store.cache.size, 0)
})
