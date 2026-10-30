import test from 'node:test'
import assert from 'node:assert/strict'
import { imageUploadBody } from '../lib/image-upload.js'

test('Image upload preserves a supplied allowed MIME type and raw bytes', async () => {
  const file = new Blob(['png-body'], { type: 'image/png' })
  assert.equal(await imageUploadBody(file), file)
  await assert.rejects(
    imageUploadBody(new Blob(['svg'], { type: 'image/svg+xml' })),
    /IMAGE_TYPE_UNSUPPORTED/,
  )
})
test('Missing file-picker MIME is recovered only from JPEG, PNG or WebP signatures', async () => {
  for (const [signature, type] of [
    [[255, 216, 255, 1], 'image/jpeg'],
    [[137, 80, 78, 71, 13, 10, 26, 10], 'image/png'],
    [[82, 73, 70, 70, 8, 0, 0, 0, 87, 69, 66, 80], 'image/webp'],
  ]) {
    const file = new Blob([new Uint8Array(signature)]),
      body = await imageUploadBody(file)
    assert.equal(body.type, type)
    assert.deepEqual(await body.arrayBuffer(), await file.arrayBuffer())
  }
  await assert.rejects(imageUploadBody(new Blob(['fake.webp'])), /IMAGE_TYPE_UNSUPPORTED/)
  await assert.rejects(imageUploadBody(new Blob()), /BODY_TOO_LARGE/)
  await assert.rejects(
    imageUploadBody(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)])),
    /BODY_TOO_LARGE/,
  )
})
