import { ApiError } from './api.js'

export async function imageUploadBody(file) {
  if (!file?.size || file.size > 5 * 1024 * 1024)
    throw new ApiError('BODY_TOO_LARGE', { status: 413 })
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file
  if (file.type) throw new ApiError('IMAGE_TYPE_UNSUPPORTED', { status: 415 })
  // Some file pickers omit WebP's MIME type; use its bytes, never its filename.
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const starts = (signature, offset = 0) =>
    signature.every((value, index) => bytes[offset + index] === value)
  const type = starts([255, 216, 255])
    ? 'image/jpeg'
    : starts([137, 80, 78, 71, 13, 10, 26, 10])
      ? 'image/png'
      : starts([82, 73, 70, 70]) && starts([87, 69, 66, 80], 8)
        ? 'image/webp'
        : null
  if (!type) throw new ApiError('IMAGE_TYPE_UNSUPPORTED', { status: 415 })
  return file.slice(0, file.size, type)
}
