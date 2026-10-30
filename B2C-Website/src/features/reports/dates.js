import { TZDateMini } from '@date-fns/tz'

export const reportZone = 'Africa/Cairo'
export function calendarDate(value) {
  if (!/^\d{4}-\d\d-\d\d$/.test(value || '')) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value
}
export function shiftDate(value, days) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export function cairoDate(value = new Date()) {
  const date = new TZDateMini(value, reportZone)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function cairoStart(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new TZDateMini(year, month - 1, day, reportZone).toISOString()
}
export function reportRange(from, through) {
  if (!calendarDate(from) || !calendarDate(through)) throw new RangeError('INVALID_DATE')
  const start = cairoStart(from),
    end = cairoStart(shiftDate(through, 1))
  if (
    new Date(start).getUTCFullYear() < 2000 ||
    new Date(end).getUTCFullYear() > 2100 ||
    +new Date(end) <= +new Date(start)
  )
    throw new RangeError('INVALID_RANGE')
  if (+new Date(end) - +new Date(start) > 366 * 86400000) throw new RangeError('RANGE_TOO_LONG')
  return { from: start, to: end, timezone: reportZone }
}
export function defaultReportDates() {
  const through = cairoDate()
  return { from: `${through.slice(0, 7)}-01`, through }
}
export function reportDate(value, language, time = false) {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    timeZone: reportZone,
    dateStyle: 'medium',
    ...(time ? { timeStyle: 'short' } : {}),
  }).format(new Date(value))
}
// Only review fixtures generate buckets. Live charts always use returned boundaries.
export function fixtureBuckets(from, to, interval) {
  let key = cairoDate(from)
  if (interval === 'month') key = `${key.slice(0, 7)}-01`
  if (interval === 'week') key = shiftDate(key, -(new Date(`${key}T12:00Z`).getUTCDay() + 6) % 7)
  const buckets = []
  while (+new Date(cairoStart(key)) < +new Date(to)) {
    let next
    if (interval === 'month') {
      const date = new Date(`${key}T12:00Z`)
      date.setUTCMonth(date.getUTCMonth() + 1)
      next = date.toISOString().slice(0, 10)
    } else next = shiftDate(key, interval === 'week' ? 7 : 1)
    buckets.push({ bucketStart: cairoStart(key), bucketEnd: cairoStart(next) })
    key = next
  }
  return buckets
}
