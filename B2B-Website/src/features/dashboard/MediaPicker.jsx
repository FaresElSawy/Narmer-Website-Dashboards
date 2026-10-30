import { useRef, useState } from 'react'
import { imageUploadBody } from '../../../../shared/lib/image-upload.js'
import { Button } from '../../../../shared/ui/Primitives.jsx'
import { FileField } from '../../../../shared/ui/FileField.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { StaffError } from './components.jsx'

export function MediaPicker({ path, onUploaded, onBusy, disabled = false, label }) {
  const { request, language } = useDashboard(),
    ar = language === 'ar'
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [retryAt, setRetryAt] = useState(0),
    [selectedFile, setSelectedFile] = useState(null)
  const input = useRef(null)
  async function upload(file) {
    if (!file || busy || disabled || Date.now() < retryAt) return
    setError(null)
    setBusy(true)
    onBusy?.(true)
    try {
      const body = await imageUploadBody(file)
      const image = await request(path, {
        method: 'POST',
        body,
        headers: { 'Content-Type': body.type },
      })
      onUploaded(image)
      if (input.current) input.current.value = ''
      setSelectedFile(null)
    } catch (error) {
      setError(error)
      if (error.status === 429) setRetryAt(Date.now() + (error.retryAfter ?? 30) * 1000)
    } finally {
      setBusy(false)
      onBusy?.(false)
    }
  }
  return (
    <div className="staff-upload">
      <FileField
        ref={input}
        label={
          busy ? (ar ? 'جارٍ الرفع…' : 'Uploading…') : label || (ar ? 'رفع صورة' : 'Upload image')
        }
        accept="image/jpeg,image/png,image/webp"
        disabled={busy || disabled}
        onChange={(event) => {
          const file = event.target.files[0]
          setSelectedFile(file)
          upload(file)
        }}
        hint={
          ar
            ? 'صورة ثابتة، حتى 5 ميبيبايت و20 مليون بكسل. احفظ لربط الصورة؛ تنتهي صلاحية الرفع غير المرتبط بعد 24 ساعة.'
            : 'Still images, up to 5 MiB and 20 million pixels. Save to attach; unattached uploads expire after 24 hours.'
        }
      />
      <StaffError error={error} />
      {error && selectedFile && (
        <Button
          variant="secondary"
          disabled={busy || disabled}
          onClick={() => upload(selectedFile)}
        >
          {ar ? 'إعادة رفع الصورة المختارة' : 'Retry selected image'}
        </Button>
      )}
      {error && !error.status && (
        <p>
          {ar
            ? 'قد يكون الرفع قد نجح. لا توجد قائمة للصور غير المرتبطة؛ لن نكرر الرفع تلقائيًا.'
            : 'The upload may have succeeded. Unattached images cannot be listed; this upload will not be repeated automatically.'}
        </p>
      )}
    </div>
  )
}
