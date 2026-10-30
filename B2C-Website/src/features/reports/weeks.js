import { cairoDate, cairoStart, shiftDate } from './dates.js'
import { exactSum } from './model.js'

// The API's week is Monday-based. Narmer uses Sunday, so combine validated daily buckets.
export function sundayWeeks(days) {
  const weeks = new Map()
  const fields = [
    'ordersPlaced',
    'unitsPlaced',
    'placedOrderAmount',
    'instapayVerifiedAmount',
    'codCollectedAmount',
    'refundMarkerAmount',
  ].filter((key) => Object.hasOwn(days[0] || {}, key))
  for (const day of days) {
    const key = cairoDate(day.bucketStart)
    const sunday = shiftDate(key, -new Date(`${key}T12:00:00Z`).getUTCDay())
    if (!weeks.has(sunday)) weeks.set(sunday, [])
    weeks.get(sunday).push(day)
  }
  return [...weeks].map(([sunday, rows]) => ({
    bucketStart: cairoStart(sunday),
    bucketEnd: cairoStart(shiftDate(sunday, 7)),
    ...Object.fromEntries(fields.map((key) => [key, exactSum(rows, key)])),
  }))
}
