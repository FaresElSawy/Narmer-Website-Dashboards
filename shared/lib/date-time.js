export function localDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function explicitDateTime(local) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local || '')) return null
  const date = new Date(local)
  return Number.isFinite(date.getTime()) && localDateTime(date.toISOString()) === local
    ? date.toISOString()
    : null
}

export function calendarDays(year, month) {
  const first = new Date(0)
  first.setUTCFullYear(year, month, 1)
  first.setUTCHours(12, 0, 0, 0)
  const offset = first.getUTCDay()
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first)
    date.setUTCDate(index - offset + 1)
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      month: date.getUTCMonth(),
    }
  })
}
