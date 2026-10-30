import { useState } from 'react'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { homepagePayload } from '../features/dashboard/staff-model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { MediaPicker } from '../features/dashboard/MediaPicker.jsx'
import { StaffHeading, ReadState, BilingualFields } from '../features/dashboard/components.jsx'
import { SelectField } from '../features/dashboard/components.jsx'
import men from '../../../shared/assets/images/campaign-men.webp'
import women from '../assets/images/brown.webp'
import fabric from '../../../shared/assets/images/fabric.webp'
import { retailImages } from '../features/shop/images.js'

const defaults = {
  'hero-left': men,
  'hero-right': women,
  'collection-men': retailImages.logo.url,
  'collection-women': women,
  'sale-feature': retailImages.pink.url,
  'factory-story': fabric,
}

const slotLabels = {
  'hero-left': ['Hero: left image', 'الصورة اليسرى للبنر الرئيسي'],
  'hero-right': ['Hero: right image', 'الصورة اليمنى للبنر الرئيسي'],
  'collection-men': ['Men collection', 'مجموعة الرجال'],
  'collection-women': ['Women collection', 'مجموعة النساء'],
  'sale-feature': ['Sale feature', 'صورة قسم التخفيضات'],
  'factory-story': ['Factory story', 'صورة قصة المصنع'],
}
const sections = { newArrivals: ['New arrivals', 'وصل حديثًا'], sale: ['Sale', 'التخفيضات'] }
function Curation({ name, data, products, ar, onChange }) {
  const ids = data.productIds
  const chosen = ids.map((id) => products.find((item) => item.id === id)).filter(Boolean)
  const move = (index, delta) => {
    const next = [...ids],
      target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  return (
    <section className="panel staff-panel">
      <h2>{ar ? sections[name][1] : sections[name][0]}</h2>
      <p className="staff-help">
        {ar
          ? 'رتّب حتى 20 منتجًا. السعر والمخزون يأتيان من المنتج ولا يمكن تعديلهما هنا.'
          : 'Order up to 20 products. Price and stock come from the product and cannot be changed here.'}
      </p>
      <div className="staff-curation-list">
        {ids.map((id, index) => {
          const item = products.find((product) => product.id === id)
          return (
            <div className="staff-curation-row" key={id}>
              <span>{index + 1}.</span>
              <span>{item?.name?.[ar ? 'ar' : 'en'] || item?.name?.en || id}</span>
              {!data.visibleProductIds.includes(id) && (
                <strong>{ar ? 'غير ظاهر حاليًا' : 'Not currently visible'}</strong>
              )}
              <Button
                variant="secondary"
                className="staff-reorder"
                disabled={!index}
                onClick={() => move(index, -1)}
                aria-label={ar ? 'تحريك للأعلى' : 'Move up'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 19V5m-6 6 6-6 6 6" />
                </svg>
              </Button>
              <Button
                variant="secondary"
                className="staff-reorder"
                disabled={index === ids.length - 1}
                onClick={() => move(index, 1)}
                aria-label={ar ? 'تحريك للأسفل' : 'Move down'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14m-6-6 6 6 6-6" />
                </svg>
              </Button>
              <Button
                variant="secondary"
                onClick={() => onChange(ids.filter((value) => value !== id))}
              >
                {ar ? 'إزالة' : 'Remove'}
              </Button>
            </div>
          )
        })}
      </div>
      <SelectField
        label={ar ? 'إضافة منتج' : 'Add product'}
        value=""
        disabled={ids.length >= 20}
        onChange={(event) => event.target.value && onChange([...ids, event.target.value])}
      >
        <option value="">{ar ? 'اختر منتجًا' : 'Choose a product'}</option>
        {products
          .filter((item) => !ids.includes(item.id))
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name?.[ar ? 'ar' : 'en'] || item.name?.en || item.id}
              {!item.isActive ? (ar ? ' · مخفي' : ' · Hidden') : ''}
            </option>
          ))}
      </SelectField>
      {chosen.length < ids.length && (
        <p role="status">
          {ar
            ? 'تتضمن القائمة منتجًا غير موجود؛ سيظهر تحذير حتى تحديث الاختيار.'
            : 'A selected product is unavailable; it stays selected and flagged until the selection is updated.'}
        </p>
      )}
    </section>
  )
}
export function DashboardHomepage() {
  // shortcut: curation reads the first 100 products; paginate the picker before the catalog exceeds that size.
  const { language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead('/homepage'),
    productsRead = useStaffRead('/products?page=1&limit=100'),
    [uploading, setUploading] = useState(false)
  const products = productsRead.data?.items || []
  return (
    <>
      <StaffHeading
        title={ar ? 'محتوى الرئيسية' : 'Homepage content'}
        description={
          ar
            ? 'إدارة الصور وترتيب المنتجات في مواضع الصفحة المعتمدة.'
            : 'Manage images and product order in the approved homepage areas.'
        }
      />
      {productsRead.error && (
        <p role="alert">
          {productsRead.error.message || (ar ? 'تعذر تحميل المنتجات.' : 'Could not load products.')}
        </p>
      )}
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
                  if (!slot) return null
                  const update = (patch) =>
                    setDraft((current) => ({
                      ...current,
                      slots: current.slots.map((item) =>
                        item.key === slot.key ? { ...item, ...patch } : item,
                      ),
                    }))
                  return (
                    <section className="panel staff-panel" key={slot.key}>
                      <h2>
                        {slotLabels[slot.key]?.[ar ? 1 : 0] ||
                          definition.label?.[language] ||
                          definition.key}
                      </h2>
                      <div className="staff-home-images">
                        {['desktop', ...(definition.supportsMobileImage ? ['mobile'] : [])].map(
                          (device) => {
                            const image = slot[`${device}Image`],
                              preview = image || (device === 'mobile' && slot.desktopImage)
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
                                {preview ? (
                                  <img
                                    src={preview.url}
                                    width={preview.width}
                                    height={preview.height}
                                    alt=""
                                  />
                                ) : (
                                  <>
                                    <img
                                      src={defaults[slot.key]}
                                      width={1200}
                                      height={800}
                                      alt=""
                                    />
                                    <p className="staff-help">
                                      {ar ? 'الصورة الافتراضية' : 'Default image'}
                                    </p>
                                  </>
                                )}
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
                                  onUploaded={(uploaded) =>
                                    update({ [`${device}Image`]: uploaded })
                                  }
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
                        label={ar ? 'النص البديل' : 'Alt text'}
                        maxLength={500}
                        value={slot.alt}
                        onChange={(alt) => update({ alt })}
                      />
                    </section>
                  )
                })}
                {['newArrivals', 'sale'].map((key) => (
                  <Curation
                    key={key}
                    name={key}
                    data={draft[key]}
                    products={products}
                    ar={ar}
                    onChange={(productIds) =>
                      setDraft((current) => ({
                        ...current,
                        [key]: { ...current[key], productIds },
                      }))
                    }
                  />
                ))}
                <p className="staff-help">
                  {ar
                    ? 'الحفظ ينشر التغييرات فورًا. الأقسام وترتيبها والنصوص الثابتة لا تتغير.'
                    : 'Saving publishes changes immediately. Sections, their page order, and fixed copy stay unchanged.'}
                </p>
              </>
            )}
          </RecordEditor>
        )}
      </ReadState>
    </>
  )
}
