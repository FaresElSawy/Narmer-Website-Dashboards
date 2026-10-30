import { useEffect, useRef, useState } from 'react'
import { Button, Feedback } from '../../../../shared/ui/Primitives.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { StaffError } from './components.jsx'
import { samePatch, staffLabel } from './model.js'
import { useUnsavedChanges } from './hooks.js'

const comparisonLabels = {
  name: ['Name', 'الاسم'],
  title: ['Title', 'العنوان'],
  description: ['Description', 'الوصف'],
  helpText: ['Help text', 'النص المساعد'],
  fields: ['Questions', 'الأسئلة'],
  label: ['Label', 'التسمية'],
  key: ['Stable key / area', 'المفتاح الثابت / الموضع'],
  type: ['Widget type', 'نوع الحقل'],
  required: ['Required', 'مطلوب'],
  choices: ['Choices', 'الخيارات'],
  isActive: ['Published / active', 'منشور / متاح'],
  composition: ['Pouch composition', 'تكوين العبوة'],
  variantId: ['Variant reference', 'مرجع الخيار'],
  quantity: ['Pieces', 'القطع'],
  images: ['Images', 'الصور'],
  phone: ['Phone', 'الهاتف'],
  status: ['Status', 'الحالة'],
  role: ['Role', 'الدور'],
  address: ['Address', 'العنوان'],
  mapUrl: ['Map link', 'رابط الخريطة'],
  social: ['Social links', 'روابط التواصل'],
  seo: ['Search metadata', 'البيانات الوصفية'],
  keywords: ['Keywords', 'الكلمات المفتاحية'],
  slots: ['Homepage areas', 'مواضع الصفحة الرئيسية'],
  desktopImage: ['Desktop image', 'صورة سطح المكتب'],
  mobileImage: ['Mobile image', 'صورة الجوال'],
  alt: ['Alternative text', 'النص البديل'],
  instagramUrl: ['Instagram', 'إنستجرام'],
  whatsappUrl: ['WhatsApp', 'واتساب'],
  tiktokUrl: ['TikTok', 'تيك توك'],
  facebookUrl: ['Facebook', 'فيسبوك'],
}
function ComparisonValue({ value, language }) {
  const ar = language === 'ar'
  if (value == null || value === '') return <span>{ar ? 'غير محدد' : 'None'}</span>
  if (typeof value === 'boolean')
    return <span>{value ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No'}</span>
  if (typeof value !== 'object') return <span>{staffLabel(String(value), language)}</span>
  if (value.url)
    return (
      <img
        className="staff-compare-image"
        src={value.url}
        alt={ar ? 'الصورة للمقارنة' : 'Image for comparison'}
      />
    )
  if ('en' in value && 'ar' in value)
    return (
      <div>
        <p lang="en" dir="ltr">
          {value.en || '-'}
        </p>
        <p lang="ar" dir="rtl">
          {value.ar || '-'}
        </p>
      </div>
    )
  if (Array.isArray(value))
    return value.length ? (
      <ol>
        {value.map((item, index) => (
          <li key={index}>
            <ComparisonValue value={item} language={language} />
          </li>
        ))}
      </ol>
    ) : (
      <span>{ar ? 'لا توجد عناصر' : 'No items'}</span>
    )
  return (
    <dl>
      {Object.entries(value)
        .filter(([key]) => comparisonLabels[key])
        .map(([key, item]) => (
          <div key={key}>
            <dt>{comparisonLabels[key][ar ? 1 : 0]}</dt>
            <dd>
              <ComparisonValue value={item} language={language} />
            </dd>
          </div>
        ))}
    </dl>
  )
}

export function RecordEditor({
  initial,
  path,
  payload,
  children,
  onSaved,
  onUncertain,
  create = false,
  blocked = false,
  saveInChildren = false,
}) {
  const { request, language } = useDashboard(),
    ar = language === 'ar'
  const [baseline, setBaseline] = useState(initial),
    [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false)
  const [latest, setLatest] = useState(null),
    [uncertain, setUncertain] = useState(false),
    [retryAt, setRetryAt] = useState(0)
  const mounted = useRef(true),
    dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const clearLeaveGuard = useUnsavedChanges(dirty)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function save(event) {
    event.preventDefault()
    if (busy || blocked || uncertain || Date.now() < retryAt) return
    let body
    try {
      body = payload(draft, baseline)
    } catch (error) {
      setError(error)
      return
    }
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const result = await request(path, { method: create ? 'POST' : 'PATCH', body })
      if (!mounted.current) return
      setBaseline(result)
      setDraft(result)
      setSaved(true)
      setLatest(null)
      clearLeaveGuard()
      onSaved?.(result)
    } catch (error) {
      if (!mounted.current) return
      setError(error)
      if (error.status === 429) setRetryAt(Date.now() + (error.retryAfter ?? 30) * 1000)
      const unknown = !error.status || error.status >= 500
      if (unknown && create) {
        setUncertain(true)
        onUncertain?.()
        return
      }
      if (error.status === 409 || unknown) {
        setUncertain(unknown)
        try {
          const fresh = await request(path)
          if (!mounted.current) return
          if (unknown && samePatch(fresh, body)) {
            setBaseline(fresh)
            setDraft(fresh)
            setSaved(true)
            setError(null)
            setUncertain(false)
          } else {
            setLatest(fresh)
            setUncertain(true)
          }
        } catch {
          /* Keep the original error and input until a safe read succeeds. */
        }
      }
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  async function reconcile() {
    setBusy(true)
    try {
      const fresh = await request(path)
      if (mounted.current) setLatest(fresh)
    } catch (error) {
      if (mounted.current) setError(error)
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  const saveButton = (
    <Button type="submit" variant="accent" disabled={busy || blocked || uncertain || !!latest}>
      {busy ? (ar ? 'جارٍ الحفظ' : 'Saving…') : ar ? 'حفظ التغييرات' : 'Save changes'}
    </Button>
  )
  return (
    <form className="staff-editor" onSubmit={save}>
      <fieldset disabled={busy}>
        {children({ draft, setDraft, baseline, busy, saveButton, dirty })}
      </fieldset>
      <StaffError error={error} />
      {saved && <Feedback kind="success" title={ar ? 'تم الحفظ' : 'Changes saved'} />}
      {uncertain && !latest && (
        <Feedback
          title={ar ? 'يجب التحقق من نتيجة الحفظ' : 'Check the save outcome before continuing'}
        >
          {create
            ? ar
              ? 'ربما تم إنشاء السجل. راجع القائمة قبل إنشاء سجل آخر؛ لن نكرر الطلب تلقائيًا.'
              : 'The record may have been created. Check the list before creating another; this request will not be repeated automatically.'
            : ar
              ? 'احتُفظ بتعديلاتك. حمّل النسخة الحالية قبل المحاولة مجددًا.'
              : 'Your edits are retained. Read the current record before trying again.'}
        </Feedback>
      )}
      {uncertain && !latest && !create && (
        <Button disabled={busy} onClick={reconcile}>
          {ar ? 'قراءة النسخة الحالية' : 'Read current record'}
        </Button>
      )}
      {latest && (
        <section className="panel staff-conflict">
          <h2>{ar ? 'راجع تعارض التعديلات' : 'Review the changed record'}</h2>
          <p>
            {ar
              ? 'قارن النسخة الحالية بتعديلاتك. احتفظ بتعديلاتك فقط بعد مراجعة الفروق؛ سيستخدم الحفظ التالي الإصدار الحالي.'
              : 'Compare the current record with your edits. Keep your edits only after reviewing the differences; the next save will use the current version.'}
          </p>
          <div className="staff-compare">
            {[
              ['current', latest],
              ['yours', draft],
            ].map(([key, value]) => (
              <details key={key} open>
                <summary>
                  {key === 'current'
                    ? ar
                      ? 'النسخة الحالية'
                      : 'Current server record'
                    : ar
                      ? 'تعديلاتك'
                      : 'Your edits'}
                </summary>
                <ComparisonValue
                  value={Object.fromEntries(
                    Object.entries(value).filter(
                      ([field]) =>
                        comparisonLabels[field] &&
                        JSON.stringify(latest[field]) !== JSON.stringify(draft[field]),
                    ),
                  )}
                  language={language}
                />
              </details>
            ))}
          </div>
          <div className="staff-actions">
            <Button
              onClick={() => {
                setBaseline(latest)
                setDraft(latest)
                setLatest(null)
                setError(null)
                setUncertain(false)
              }}
            >
              {ar ? 'استخدام النسخة الحالية' : 'Use current record'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setBaseline(latest)
                setDraft({ ...draft, version: latest.version })
                setLatest(null)
                setError(null)
                setUncertain(false)
              }}
            >
              {ar ? 'راجعت الفروق؛ احتفظ بتعديلاتي' : 'I reviewed the differences; keep my edits'}
            </Button>
          </div>
        </section>
      )}
      <div className="staff-save-bar">
        {!saveInChildren && saveButton}
        {dirty && <span>{ar ? 'تغييرات غير محفوظة' : 'Unsaved changes'}</span>}
      </div>
    </form>
  )
}
