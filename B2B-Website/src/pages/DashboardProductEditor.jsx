import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { nativePayload } from '../features/dashboard/model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { MediaPicker } from '../features/dashboard/MediaPicker.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import {
  StaffHeading,
  ReadState,
  StaffLink,
  SelectField,
  BilingualFields,
  StaffTable,
} from '../features/dashboard/components.jsx'
import { localText } from '../features/inquiry/model.js'

function ProductEditor({ initial, create }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate(),
    [uploading, setUploading] = useState(false)
  return (
    <RecordEditor
      initial={initial}
      path={`/wholesale/products${create ? '' : `/${initial.id}`}`}
      payload={nativePayload}
      create={create}
      blocked={uploading}
      saveInChildren
      onSaved={
        create
          ? (result) => navigate(`/${language}/dashboard/products/${result.id}`, { replace: true })
          : undefined
      }
    >
      {({ draft, setDraft, saveButton }) => (
        <div className="staff-detail-grid">
          <div>
            <section className="panel staff-panel">
              <h2>{ar ? 'محتوى المنتج' : 'Product content'}</h2>
              <BilingualFields
                label={ar ? 'الاسم *' : 'Name *'}
                required
                value={draft.name}
                onChange={(name) => setDraft({ ...draft, name })}
              />
              <BilingualFields
                label={ar ? 'الوصف' : 'Description'}
                multiline
                maxLength={10000}
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
              />
            </section>
            <section className="panel staff-panel">
              <h2>{ar ? 'صور المنتج' : 'Product images'}</h2>
              {create ? (
                <p>
                  {ar
                    ? 'احفظ المنتج أولًا ثم ارفع الصور.'
                    : 'Save the product first, then upload images.'}
                </p>
              ) : (
                <>
                  <div className="staff-gallery-editor">
                    {draft.images.map((image, index) => (
                      <div key={image.id}>
                        <img
                          src={image.url}
                          width={image.width}
                          height={image.height}
                          alt={`${localText(draft.name, language)} ${index + 1}`}
                        />
                        <div className="staff-actions">
                          <Button
                            variant="secondary"
                            disabled={!index || uploading}
                            onClick={() => {
                              const images = [...draft.images]
                              ;[images[index - 1], images[index]] = [
                                images[index],
                                images[index - 1],
                              ]
                              setDraft({ ...draft, images })
                            }}
                          >
                            {ar ? 'نقل للأمام' : 'Move earlier'}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={uploading}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                images: draft.images.filter((item) => item.id !== image.id),
                              })
                            }
                          >
                            {ar ? 'إزالة' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <MediaPicker
                    path={`/media/product/${draft.id}`}
                    disabled={draft.images.length >= 10}
                    onBusy={setUploading}
                    onUploaded={(image) =>
                      setDraft((current) => ({ ...current, images: [...current.images, image] }))
                    }
                  />
                  <p>
                    {ar
                      ? 'الصورة الأولى هي الصورة الرئيسية. حتى 10 صور.'
                      : 'The first image is the main image. Maximum 10 images.'}
                  </p>
                </>
              )}
            </section>
          </div>
          <aside>
            <section className="panel staff-panel">
              <h2>{ar ? 'الإتاحة' : 'Publication'}</h2>
              <SelectField
                label={ar ? 'إتاحة المصدر' : 'Source availability'}
                value={String(draft.isActive)}
                onChange={(event) =>
                  setDraft({ ...draft, isActive: event.target.value === 'true' })
                }
              >
                <option value="true">{ar ? 'متاح' : 'Active'}</option>
                <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
              </SelectField>
            </section>
            {saveButton}
            <p className="staff-help">
              {ar
                ? 'منتجات B2B بسيطة وبدون أسعار. تظهر عبر عروض الجملة المنشورة.'
                : 'Native B2B products are simple, price-free records. They appear through published wholesale offers.'}
            </p>
            {!create && (
              <DeleteRecord
                path={`/wholesale/products/${draft.id}`}
                back="products"
                label={ar ? 'المنتج' : 'product'}
              />
            )}
          </aside>
        </div>
      )}
    </RecordEditor>
  )
}
function ExistingProduct({ source }) {
  const { productId } = useParams(),
    { language } = useDashboard(),
    ar = language === 'ar'
  const read = useStaffRead(`/wholesale/${source ? 'b2c-products' : 'products'}/${productId}`)
  return (
    <ReadState read={read}>
      {read.data &&
        (source ? (
          <section className="panel staff-panel">
            <h2>{localText(read.data.name, language)}</h2>
            <Feedback title={ar ? 'مصدر B2C · قراءة فقط' : 'B2C source · read only'}>
              {ar ? 'تُدار الصور والخيارات في متجر B2C.' : 'Images and options are managed in B2C.'}
            </Feedback>
            <p>{localText(read.data.description, language)}</p>
            <div className="staff-gallery-editor">
              {read.data.images.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={localText(read.data.name, language)}
                />
              ))}
            </div>
            <StaffTable
              columns={[
                { key: 'id', label: ar ? 'المعرّف' : 'Variant ID' },
                {
                  key: 'values',
                  label: ar ? 'الخيارات' : 'Options',
                  render: (row) =>
                    read.data.options
                      .map(
                        (option) =>
                          `${localText(option.name, language)}: ${localText(option.values.find((value) => value.key === row.values[option.key])?.name, language)}`,
                      )
                      .join(' · '),
                },
              ]}
              rows={read.data.variants}
              empty={ar ? 'منتج بسيط بدون خيارات' : 'Simple product without variants'}
            />
          </section>
        ) : (
          <ProductEditor key={productId} initial={read.data} />
        ))}
    </ReadState>
  )
}
export function DashboardProductEditor({ create = false, source = false }) {
  const { language } = useDashboard(),
    ar = language === 'ar'
  const initial = {
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    images: [],
    isActive: true,
  }
  return (
    <>
      <StaffLink section="products">{ar ? 'العودة للمنتجات' : 'Back to products'}</StaffLink>
      <StaffHeading
        title={
          source ? (ar ? 'مصدر B2C' : 'B2C source') : ar ? 'محرر منتج B2B' : 'B2B product editor'
        }
      />
      {create ? <ProductEditor initial={initial} create /> : <ExistingProduct source={source} />}
    </>
  )
}
