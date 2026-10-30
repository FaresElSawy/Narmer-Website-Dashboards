import { ApiError } from '../../../../shared/lib/api.js'

export const unknownWrite = (error) =>
  !error.status || error.status >= 500 || error.code === 'INVALID_RESPONSE'

export function staffLabel(value, language) {
  const labels = {
    user: ['Customer', 'عميل'],
    admin: ['Admin', 'مسؤول'],
    moderator: ['Moderator', 'مشرف'],
    superAdmin: ['Super admin', 'المسؤول الرئيسي'],
    active: ['Active', 'نشط'],
    blocked: ['Blocked', 'محظور'],
    deleted: ['Deleted', 'محذوف'],
  }
  return labels[value]?.[language === 'ar' ? 1 : 0] || value
}
export function samePatch(current, intended) {
  const equal = (a, b) => {
    if (a === b) return true
    if (
      !a ||
      !b ||
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b)
    )
      return false
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
    )
  }
  return Object.entries(intended)
    .filter(([key]) => key !== 'version')
    .every(([key, value]) => {
      if (key === 'imageIds')
        return equal(
          Array.isArray(value)
            ? (current.images || []).map((i) => i.id)
            : { en: current.images?.en?.id || null, ar: current.images?.ar?.id || null },
          value,
        )
      if (key === 'slots')
        return value.every((slot) => {
          const actual = current.slots?.find((i) => i.key === slot.key)
          return (
            actual &&
            equal(
              {
                key: actual.key,
                desktopImageId: actual.desktopImage?.id || null,
                mobileImageId: actual.mobileImage?.id || null,
                alt: actual.alt,
              },
              slot,
            )
          )
        })
      return equal(current[key], value)
    })
}
export function pageQuery(params) {
  const page = Number(params.get('page') || 1)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}
export function dashboardAccess(role, path, method = 'GET') {
  if (!['admin', 'superAdmin', 'moderator'].includes(role)) return false
  const route = path.split('?')[0]
  if (/^\/reports(?:\/|$)/.test(route))
    return (
      role !== 'moderator' &&
      method === 'GET' &&
      /^\/reports\/(overview|finance|sales-performance)$/.test(route)
    )
  if (role === 'moderator')
    return (
      (route === '/users/me' && ['GET', 'PATCH'].includes(method)) ||
      (route === '/auth/change-password' && method === 'POST') ||
      (method === 'GET' && /^\/notifications(?:\/unread-count)?$/.test(route)) ||
      (method === 'PATCH' && /^\/notifications\/[a-f0-9]{24}\/read$/.test(route)) ||
      (method === 'GET' && /^\/orders(?:\/[a-f0-9]{24}(?:\/proof)?)?$/.test(route)) ||
      (method === 'PATCH' && /^\/orders\/[a-f0-9]{24}\/status$/.test(route))
    )
  if (route === '/users' && method === 'POST') return role === 'superAdmin'
  if (route === '/auth/super-admin/handover') return role === 'superAdmin'
  if (method === 'DELETE')
    return role === 'superAdmin' || /^\/shipping-fees\/[a-f0-9]{24}$/.test(route)
  return true
}
export function assertVersion(current, incoming) {
  if (current.version !== incoming.version) throw new ApiError('VERSION_CONFLICT', { status: 409 })
}
