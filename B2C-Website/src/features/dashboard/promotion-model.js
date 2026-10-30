import { ApiError } from '../../../../shared/lib/api.js'
export { localDateTime, explicitDateTime } from '../../../../shared/lib/date-time.js'

const fail = () => {
  throw new ApiError('INVALID_PROMOTION', { status: 422 })
}
const pair = (name) =>
  ['en', 'ar'].every(
    (key) =>
      typeof name?.[key] === 'string' &&
      name[key].trim().length > 0 &&
      name[key].trim().length <= 150,
  )
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max
const date = (value, optional = false) =>
  (value === null && optional) ||
  (typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value)))

export function salePayload(value) {
  if (
    !pair(value.name) ||
    !['products', 'category'].includes(value.targetType) ||
    !['percentage', 'fixed'].includes(value.discountType) ||
    !integer(value.discountValue, 1, value.discountType === 'percentage' ? 100 : 1_000_000_000) ||
    !date(value.startsAt) ||
    !date(value.endsAt) ||
    Date.parse(value.endsAt) <= Date.parse(value.startsAt) ||
    typeof value.isEnabled !== 'boolean'
  )
    fail()
  if (
    value.targetType === 'products'
      ? !Array.isArray(value.productIds) ||
        !value.productIds.length ||
        value.productIds.length > 100 ||
        new Set(value.productIds).size !== value.productIds.length ||
        value.categoryId != null
      : !value.categoryId || value.productIds?.length
  )
    fail()
  return {
    name: value.name,
    targetType: value.targetType,
    ...(value.targetType === 'products'
      ? { productIds: value.productIds }
      : { categoryId: value.categoryId }),
    discountType: value.discountType,
    discountValue: value.discountValue,
    startsAt: new Date(value.startsAt).toISOString(),
    endsAt: new Date(value.endsAt).toISOString(),
    isEnabled: value.isEnabled,
  }
}

export function couponPayload(value) {
  if (
    !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(
      String(value.code || '')
        .trim()
        .toUpperCase(),
    ) ||
    !pair(value.name) ||
    !['all', 'products', 'category'].includes(value.targetType) ||
    !['percentage', 'fixed'].includes(value.discountType) ||
    !integer(value.discountValue, 1, value.discountType === 'percentage' ? 100 : 1_000_000_000) ||
    !integer(value.minimumSpend, 0, 1_000_000_000_000_000) ||
    (![null, undefined].includes(value.maxUses) && !integer(value.maxUses, 1, 1_000_000_000)) ||
    (![null, undefined].includes(value.maxUsesPerPerson) &&
      !integer(value.maxUsesPerPerson, 1, 1_000_000_000)) ||
    !date(value.startsAt, true) ||
    !date(value.endsAt, true) ||
    (value.startsAt && value.endsAt && Date.parse(value.endsAt) <= Date.parse(value.startsAt)) ||
    typeof value.isEnabled !== 'boolean'
  )
    fail()
  if (
    value.targetType === 'products'
      ? !Array.isArray(value.productIds) ||
        !value.productIds.length ||
        value.productIds.length > 100 ||
        new Set(value.productIds).size !== value.productIds.length ||
        value.categoryId != null
      : value.targetType === 'category'
        ? !value.categoryId || value.productIds?.length
        : value.categoryId != null || value.productIds?.length
  )
    fail()
  return {
    code: value.code.trim().toUpperCase(),
    name: value.name,
    targetType: value.targetType,
    ...(value.targetType === 'products'
      ? { productIds: value.productIds }
      : {
          categoryId: value.targetType === 'category' ? value.categoryId : null,
          ...(value.targetType === 'all' ? { productIds: [] } : {}),
        }),
    discountType: value.discountType,
    discountValue: value.discountValue,
    minimumSpend: value.minimumSpend,
    maxUses: value.maxUses ?? null,
    maxUsesPerPerson: value.maxUsesPerPerson ?? null,
    startsAt: value.startsAt ? new Date(value.startsAt).toISOString() : null,
    endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
    isEnabled: value.isEnabled,
  }
}
