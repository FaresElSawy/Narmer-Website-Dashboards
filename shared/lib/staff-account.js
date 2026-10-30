import { ApiError } from './api.js'

export function createdAccount(value, store, submitted) {
  if (
    typeof value?.id !== 'string' ||
    !/^[a-f\d]{24}$/i.test(value?.id || '') ||
    value.store !== store ||
    ['name', 'email', 'phone', 'role'].some((key) => value[key] !== submitted[key]) ||
    value.status !== 'active' ||
    value.emailVerified !== true ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    value.deletedAt !== null
  )
    throw new ApiError('INVALID_RESPONSE', { status: 201 })
  return value
}

export function createAccountPayload(value) {
  const name = value.name.trim(),
    email = value.email.trim().toLowerCase(),
    phone = value.phone.trim().replace(/[\s()-]/g, '')
  if (
    !name ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\+?\d{6,15}$/.test(phone) ||
    typeof value.password !== 'string' ||
    value.password.length < 8 ||
    value.password.length > 72 ||
    new TextEncoder().encode(value.password).length > 72 ||
    !['admin', 'moderator', 'user'].includes(value.role)
  )
    throw new ApiError('VALIDATION_ERROR', { status: 422 })
  return { name, email, phone, password: value.password, role: value.role }
}
