import { ApiError } from '../../../../shared/lib/api.js'

const fail = () => {
  throw new ApiError('VALIDATION_ERROR', { status: 422 })
}
export const pageQuery = (search) => {
  const page = Number(search.get('page') || 1)
  return Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1
}
export function staffLabel(value, language) {
  const labels = {
    user: ['Customer', 'عميل'],
    moderator: ['Moderator', 'مشرف'],
    admin: ['Admin', 'مسؤول'],
    superAdmin: ['Super admin', 'المسؤول الرئيسي'],
    active: ['Active', 'نشط'],
    blocked: ['Blocked', 'محظور'],
    deleted: ['Deleted', 'محذوف'],
  }
  return labels[value]?.[language === 'ar' ? 1 : 0] || value
}
const pairValid = (value, max, empty = false) =>
  ['en', 'ar'].every(
    (lang) =>
      typeof value?.[lang] === 'string' &&
      value[lang].trim().length <= max &&
      (empty || value[lang].trim().length > 0),
  )
const hosts = {
  instagramUrl: ['instagram.com', 'www.instagram.com'],
  whatsappUrl: [
    'wa.me',
    'whatsapp.com',
    'www.whatsapp.com',
    'api.whatsapp.com',
    'chat.whatsapp.com',
  ],
  tiktokUrl: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  facebookUrl: [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'fb.com',
    'www.fb.com',
    'fb.me',
  ],
  mapUrl: [
    'maps.google.com',
    'maps.app.goo.gl',
    'maps.apple.com',
    'google.com',
    'www.google.com',
    'google.com.eg',
    'www.google.com.eg',
    'goo.gl',
  ],
}
export function settingsUrl(key, input) {
  if (!input?.trim()) return null
  let url
  try {
    url = new URL(input.trim())
  } catch {
    return fail()
  }
  const value = input.trim()
  if (
    value.length > 2048 ||
    url.href.length > 2048 ||
    !/^https:\/\//i.test(value) ||
    /[\s\\]/.test(value) ||
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    url.username ||
    url.password ||
    url.port ||
    !hosts[key]?.includes(url.hostname) ||
    (key === 'mapUrl' &&
      !url.hostname.startsWith('maps.') &&
      url.pathname !== '/maps' &&
      !url.pathname.startsWith('/maps/'))
  )
    return fail()
  return url.href
}
export function settingsPayload(value) {
  if (
    !Number.isSafeInteger(value.version) ||
    value.version < 0 ||
    !pairValid(value.address, 1000, true) ||
    !pairValid(value.seo.title, 200) ||
    !pairValid(value.seo.description, 500, true) ||
    typeof value.seo.keywords !== 'string' ||
    value.seo.keywords.length > 1000
  )
    return fail()
  const phone = value.phone?.trim() || null,
    email = value.email?.trim().toLowerCase() || null
  if (
    (phone && (phone.length > 100 || !/^\+?\d{6,15}$/.test(phone.replace(/[\s()-]/g, '')))) ||
    (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  )
    return fail()
  return {
    version: value.version,
    phone: phone?.replace(/[\s()-]/g, '') || null,
    email,
    address: value.address,
    mapUrl: settingsUrl('mapUrl', value.mapUrl),
    social: Object.fromEntries(
      Object.entries(value.social).map(([key, url]) => [key, settingsUrl(key, url)]),
    ),
    seo: value.seo,
  }
}
export function homepagePayload(value) {
  const body = { version: value.version }
  const slots = value.slots.map((slot) => ({
    key: slot.key,
    desktopImageId: slot.desktopImage?.id || null,
    mobileImageId: slot.mobileImage?.id || null,
    alt: slot.alt,
  }))
  if (slots.length) body.slots = slots
  for (const section of ['newArrivals', 'sale'])
    if (value[section]?.productIds) body[section] = { productIds: value[section].productIds }
  return body
}
export function accountPayload(value, baseline, profile = false) {
  const keys = profile ? ['name', 'phone'] : ['name', 'phone', 'role', 'status']
  const body = Object.fromEntries(
    keys.filter((key) => value[key] !== baseline[key]).map((key) => [key, value[key]]),
  )
  if (
    !Object.keys(body).length ||
    ('name' in body && (!body.name.trim() || body.name.trim().length > 100)) ||
    ('phone' in body && !/^\+?\d{6,15}$/.test(body.phone.replace(/[\s()-]/g, ''))) ||
    ('role' in body && !['admin', 'moderator', 'user'].includes(body.role)) ||
    ('status' in body && !['active', 'blocked'].includes(body.status))
  )
    return fail()
  return body
}
export { createAccountPayload } from '../../../../shared/lib/staff-account.js'
