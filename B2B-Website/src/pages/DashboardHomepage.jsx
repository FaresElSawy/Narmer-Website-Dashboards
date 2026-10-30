import { useState } from 'react'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { homepagePayload } from '../features/dashboard/model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { MediaPicker } from '../features/dashboard/MediaPicker.jsx'
import { StaffHeading, ReadState, BilingualFields } from '../features/dashboard/components.jsx'
import { localText } from '../features/inquiry/model.js'
import { serviceImages } from '../content/services.js'
import heroFallback from '../../../shared/assets/images/spinning.webp'

const fallbackKeys = {
  hero: 'hero',
  'service-spinning': 'spinning',
  'service-weaving': 'weaving',
  'service-fabric': 'fabric',
  'service-school-uniforms': 'school-uniforms',
  'service-wholesale': 'wholesale',
  'wholesale-overview': 'wholesale',
}
export function DashboardHomepage() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead('/homepage'),
    [uploading, setUploading] = useState(false)
  return (
    <>
      <StaffHeading
        title={ar ? 'محتوى الرئيسية' : 'Homepage content'}
        description={
          ar
            ? 'إدارة الصور والنص البديل في مواضع الصفحة المعتمدة.'
            : 'Manage images and alternative text in the approved page areas.'
        }
      />
      <p className="staff-help">
        {ar
          ? 'التخطيط والترتيب والنصوص الثابتة محفوظة. صور المنتجات تُدار في محرر المنتج.'
          : 'Layout, section order and fixed copy stay consistent. Product galleries are managed in the Product editor.'}
      </p>
      <ReadState read={read}>
        {read.data && (
          <RecordEditor
            initial={read.data}
            path="/homepage"
            payload={homepagePayload}
            blocked={uploading}
          >
            {({ draft, setDraft }) => (
              <>
                {draft.allowedSlots.map((definition) => {
                  const slot = draft.slots.find((item) => item.key === definition.key)
                  const update = (patch) =>
                    setDraft((current) => ({
                      ...current,
                      slots: current.slots.map((item) =>
                        item.key === slot.key ? { ...item, ...patch } : item,
                      ),
                    }))
                  return (
                    <section className="panel staff-panel" key={slot.key}>
                      <h2>{localText(definition.label, language)}</h2>
                      <div className="staff-home-images">
                        {['desktop', ...(definition.supportsMobileImage ? ['mobile'] : [])].map(
                          (device) => {
                            const image = slot[`${device}Image`],
                              preview = image || (device === 'mobile' && slot.desktopImage)
                            const fallback =
                                slot.key === 'hero'
                                  ? heroFallback
                                  : serviceImages[fallbackKeys[slot.key]],
                              fallbackUrl =
                                typeof fallback === 'string' ? fallback : fallback?.desktop
                            return (
                              <div key={device}>
                                <h3>
                                  {device === 'desktop'
                                    ? ar
                                      ? 'سطح المكتب'
                                      : 'Desktop'
                                    : ar
                                      ? 'الجوال · اختياري'
                                      : 'Mobile · optional'}
                                </h3>
                                {preview || fallbackUrl ? (
                                  <img
                                    src={preview?.url || fallbackUrl}
                                    width={preview?.width || 1200}
                                    height={preview?.height || 700}
                                    alt={localText(slot.alt, language)}
                                  />
                                ) : (
                                  <div className="staff-image-placeholder">
                                    {ar ? 'الصورة الافتراضية' : 'Bundled default image'}
                                  </div>
                                )}
                                <p className="muted">
                                  {image
                                    ? ar
                                      ? 'صورة مخصصة'
                                      : 'Custom override'
                                    : device === 'mobile' && slot.desktopImage
                                      ? ar
                                        ? 'يستخدم صورة سطح المكتب'
                                        : 'Uses desktop image'
                                      : ar
                                        ? 'يستخدم الصورة الافتراضية'
                                        : 'Uses bundled default'}
                                </p>
                                <MediaPicker
                                  path={`/homepage/media/${slot.key}/${device}`}
                                  disabled={uploading}
                                  onBusy={setUploading}
                                  label={
                                    device === 'desktop'
                                      ? ar
                                        ? 'رفع صورة سطح المكتب'
                                        : 'Upload desktop image'
                                      : ar
                                        ? 'رفع صورة الجوال'
                                        : 'Upload mobile image'
                                  }
                                  onUploaded={(image) => update({ [`${device}Image`]: image })}
                                />
                                <Button
                                  variant="secondary"
                                  disabled={!image || uploading}
                                  onClick={() => update({ [`${device}Image`]: null })}
                                >
                                  {ar ? 'إزالة الصورة المخصصة' : 'Clear override'}
                                </Button>
                              </div>
                            )
                          },
                        )}
                      </div>
                      <BilingualFields
                        label={ar ? 'النص البديل (Alt text)' : 'Alt text'}
                        maxLength={500}
                        value={slot.alt}
                        onChange={(alt) => update({ alt })}
                      />
                    </section>
                  )
                })}
                <p className="staff-help">
                  {ar
                    ? 'الحفظ ينشر الصور والنص البديل فورًا. إزالة الصورة تعيد استخدام الصورة الافتراضية ولا تحذف القسم.'
                    : 'Saving publishes images and alternative text immediately. Clearing an override restores the fallback and keeps the section.'}
                </p>
              </>
            )}
          </RecordEditor>
        )}
      </ReadState>
    </>
  )
}
