import { ApiError } from '../../../../shared/lib/api.js'
import { unknownWrite } from './model.js'

export async function readPromotion(request, path) {
  const record = await request(path)
  return checkRecord(record, path)
}
function checkRecord(record, path) {
  if (
    record?.id !== path.split('/').at(-1) ||
    typeof record.isEnabled !== 'boolean' ||
    typeof record.name?.en !== 'string' ||
    typeof record.name?.ar !== 'string'
  )
    throw new ApiError('INVALID_RESPONSE')
  return record
}
export async function changePromotionEnabled(request, path, enabled) {
  try {
    return {
      record: checkRecord(
        await request(path, { method: 'PATCH', body: { isEnabled: enabled } }),
        path,
      ),
    }
  } catch (error) {
    if (!unknownWrite(error) && error.status !== 409) return { error }
    try {
      const record = await readPromotion(request, path)
      return { record, error: record.isEnabled === enabled ? null : error }
    } catch {
      return { error, locked: true }
    }
  }
}
