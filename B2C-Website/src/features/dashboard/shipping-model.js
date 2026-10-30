import { ApiError } from '../../../../shared/lib/api.js'

const fail = () => {
  throw new ApiError('INVALID_SHIPPING_FEE', { status: 422 })
}
const fee = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000

export function shippingPayload(value, isDefault = false) {
  if (isDefault) {
    if (!fee(value.defaultFee)) fail()
    return { defaultFee: value.defaultFee }
  }
  if (
    typeof value.governorateCode !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.governorateCode.trim().toLowerCase()) ||
    !['en', 'ar'].every(
      (key) =>
        typeof value.name?.[key] === 'string' &&
        value.name[key].trim().length > 0 &&
        value.name[key].trim().length <= 150,
    ) ||
    !fee(value.fee)
  )
    fail()
  return {
    governorateCode: value.governorateCode.trim().toLowerCase(),
    name: { en: value.name.en.trim(), ar: value.name.ar.trim() },
    fee: value.fee,
  }
}
