import { ApiError } from '../../../../shared/lib/api.js'

export const fieldTypes = ['text', 'textarea', 'number', 'select', 'multiselect', 'boolean']
export function whatsappContactUrl(phone) {
  let number = String(phone ?? '')
    .trim()
    .replace(/[\s()-]/g, '')
  if (/^01[0125]\d{8}$/.test(number)) number = `20${number.slice(1)}`
  else if (number.startsWith('00')) number = number.slice(2)
  else if (number.startsWith('+')) number = number.slice(1)
  return /^[1-9]\d{5,14}$/.test(number) ? `https://wa.me/${number}` : null
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
    simple: ['Simple', 'بسيط'],
    variant: ['Variants', 'خيارات متعددة'],
    text: ['Text', 'نص'],
    textarea: ['Long text', 'نص طويل'],
    number: ['Number', 'رقم'],
    select: ['Single choice', 'اختيار واحد'],
    multiselect: ['Multiple choice', 'اختيارات متعددة'],
    boolean: ['Yes / No', 'نعم / لا'],
  }
  return labels[value]?.[language === 'ar' ? 1 : 0] || value
}
const reserved = [
  'name',
  'phone',
  'email',
  'governorate',
  'district',
  'constructor',
  'prototype',
  '__proto__',
]
const safeKey = (key, fixed = false) =>
  /^[a-z][a-z0-9_-]{0,39}$/.test(key) && !(fixed ? reserved : reserved.slice(5)).includes(key)
const pairValid = (value, max, empty = false) =>
  ['en', 'ar'].every(
    (lang) =>
      typeof value?.[lang] === 'string' &&
      value[lang].trim().length <= max &&
      (empty || value[lang].trim().length > 0),
  )
export function formPayload(value) {
  const { version, title, helpText, isActive, fields } = value
  if (
    !Number.isSafeInteger(version) ||
    version < 0 ||
    !pairValid(title, 150) ||
    !pairValid(helpText, 2000, true) ||
    typeof isActive !== 'boolean' ||
    !Array.isArray(fields) ||
    fields.length > 40
  )
    throw new ApiError('INVALID_FORM', { status: 422 })
  const keys = new Set()
  const cleanFields = fields.map(({ key, type, label, required, choices = [] }) => {
    if (
      !safeKey(key, true) ||
      keys.has(key) ||
      !fieldTypes.includes(type) ||
      !pairValid(label, 150) ||
      typeof required !== 'boolean'
    )
      throw new ApiError('INVALID_FORM', { status: 422 })
    keys.add(key)
    const selection = ['select', 'multiselect'].includes(type),
      seen = new Set()
    if ((selection && (!choices.length || choices.length > 50)) || (!selection && choices.length))
      throw new ApiError('INVALID_FORM', { status: 422 })
    const cleanChoices = choices.map(({ key: choiceKey, label: choiceLabel }) => {
      if (!safeKey(choiceKey) || seen.has(choiceKey) || !pairValid(choiceLabel, 150))
        throw new ApiError('INVALID_FORM', { status: 422 })
      seen.add(choiceKey)
      return { key: choiceKey, label: choiceLabel }
    })
    return { key, type, label, required, choices: cleanChoices }
  })
  return { version, title, helpText, isActive, fields: cleanFields }
}
export function samePatch(current, intended) {
  const equal = (a, b) => {
    if (a === b) return true
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
    if (Array.isArray(a) !== Array.isArray(b)) return false
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
          current.images.map((image) => image.id),
          value,
        )
      if (key === 'fields') return equal(formPayload(current).fields, value)
      if (key === 'slots')
        return value.every((slot) => {
          const actual = current.slots.find((item) => item.key === slot.key)
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
export function staffAccess(role, path, method = 'GET') {
  if (!['admin', 'superAdmin', 'moderator'].includes(role)) return false
  if (path === '/users' && method === 'POST') return role === 'superAdmin'
  if (path === '/auth/change-password') return method === 'POST'
  if (path === '/auth/super-admin/handover') return role === 'superAdmin'
  if (method === 'DELETE') return role === 'superAdmin'
  return (
    role !== 'moderator' || /^\/(leads(?:\/|\?|$)|notifications(?:\/|\?|$)|users\/me$)/.test(path)
  )
}
export function accountPayload(value, baseline, profile = false) {
  const body = Object.fromEntries(
    (profile ? ['name', 'phone'] : ['name', 'phone', 'role', 'status'])
      .filter((key) => value[key] !== baseline[key])
      .map((key) => [key, value[key]]),
  )
  if (
    !Object.keys(body).length ||
    ('name' in body && (!body.name.trim() || body.name.trim().length > 100)) ||
    ('phone' in body && !/^\+?\d{6,15}$/.test(body.phone.replace(/[\s()-]/g, ''))) ||
    ('role' in body && !['user', 'moderator', 'admin'].includes(body.role)) ||
    ('status' in body && !['active', 'blocked'].includes(body.status))
  )
    throw new ApiError('VALIDATION_ERROR', { status: 422 })
  return body
}
export function pageQuery(search) {
  const page = Number(search.get('page') || 1)
  return Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1
}
export function nativePayload(value) {
  const { name, description, isActive, version, images = [] } = value
  if (
    !pairValid(name, 200) ||
    !pairValid(description, 10000, true) ||
    typeof isActive !== 'boolean' ||
    images.length > 10 ||
    new Set(images.map((image) => image.id)).size !== images.length
  )
    throw new ApiError('INVALID_WHOLESALE', { status: 422 })
  return {
    name,
    description,
    isActive,
    ...(value.id && { version, imageIds: images.map((image) => image.id) }),
  }
}
export function offerPayload(value) {
  const { name, description, isActive, version, composition, sourceStore, productId, product } =
    value
  if (
    !pairValid(name, 200) ||
    !pairValid(description, 10000, true) ||
    typeof isActive !== 'boolean'
  )
    throw new ApiError('INVALID_WHOLESALE', { status: 422 })
  if (product) {
    const seen = new Set()
    if (!composition.length || composition.length > 100)
      throw new ApiError('INVALID_WHOLESALE', { status: 422 })
    for (const row of composition) {
      if (
        !Number.isSafeInteger(row.quantity) ||
        row.quantity < 1 ||
        row.quantity > 10000 ||
        seen.has(row.variantId) ||
        (product.type === 'simple'
          ? row.variantId !== null || composition.length !== 1
          : !product.variants.some((variant) => variant.id === row.variantId))
      )
        throw new ApiError('INVALID_WHOLESALE', { status: 422 })
      seen.add(row.variantId)
    }
  } else if (!value.id || isActive)
    throw new ApiError('WHOLESALE_SOURCE_UNAVAILABLE', { status: 409 })
  return {
    name,
    description,
    isActive,
    ...(value.id ? { version } : { sourceStore, productId }),
    ...(product && {
      composition: composition.map(({ variantId, quantity }) => ({ variantId, quantity })),
    }),
  }
}
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
  const value = input.trim()
  let url
  try {
    url = new URL(value)
  } catch {
    throw new ApiError('INVALID_SETTINGS_URL', { status: 422 })
  }
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
      !['/maps'].includes(url.pathname) &&
      !url.pathname.startsWith('/maps/'))
  )
    throw new ApiError('INVALID_SETTINGS_URL', { status: 422 })
  return url.href
}
export function settingsPayload(value) {
  if (
    !pairValid(value.address, 1000, true) ||
    !pairValid(value.seo.title, 200) ||
    !pairValid(value.seo.description, 500, true) ||
    value.seo.keywords.length > 1000
  )
    throw new ApiError('VALIDATION_ERROR', { status: 422 })
  const phone = value.phone?.trim() || null,
    email = value.email?.trim().toLowerCase() || null
  if (
    (phone && (phone.length > 100 || !/^\+?\d{6,15}$/.test(phone.replace(/[\s()-]/g, '')))) ||
    (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  )
    throw new ApiError('VALIDATION_ERROR', { status: 422 })
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
  return {
    version: value.version,
    slots: value.slots.map((slot) => ({
      key: slot.key,
      desktopImageId: slot.desktopImage?.id || null,
      mobileImageId: slot.mobileImage?.id || null,
      alt: slot.alt,
    })),
  }
}
