import { useEffect, useRef, useState } from 'react'
import { Button, Modal } from '../../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../../shared/ui/Brand.jsx'
import { FileField } from '../../../../shared/ui/FileField.jsx'
import { MediaPicker } from './MediaPicker.jsx'
import { SelectField } from './components.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { useUnsavedChanges } from './hooks.js'
import {
  assignProductImage,
  moveProductImage,
  productImages,
  removeProductImage,
  variantImages,
  variantLabel,
} from './product-images.js'

const variantKey = (variant, index) => variant.id || variant.editorKey || index

function ImageTargets({ product, selected, onChange, language }) {
  const ar = language === 'ar',
    groupOptions = product.options.filter((option) => option.key !== 'size'),
    groups = [
      ...new Map(
        product.variants.map((variant) => {
          const key = JSON.stringify(groupOptions.map((option) => variant.values[option.key]))
          return [
            key,
            {
              key,
              label: groupOptions
                .map(
                  (option) =>
                    option.values.find((value) => value.key === variant.values[option.key])?.name?.[
                      language
                    ] || variant.values[option.key],
                )
                .join(' / '),
            },
          ]
        }),
      ).values(),
    ],
    [group, setGroup] = useState(groups[0]?.key || ''),
    current = groups.some((item) => item.key === group) ? group : groups[0]?.key,
    visible = product.variants
      .map((variant, index) => ({ variant, index: variantKey(variant, index) }))
      .filter(
        ({ variant }) =>
          JSON.stringify(groupOptions.map((option) => variant.values[option.key])) === current,
      ),
    all = visible.length > 0 && visible.every(({ index }) => selected.includes(index))
  return (
    <div className="product-image-targets">
      {groups.length > 1 && (
        <SelectField
          label={groupOptions.map((option) => option.name?.[language] || option.key).join(' / ')}
          value={current}
          onChange={(event) => setGroup(event.target.value)}
        >
          {groups.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </SelectField>
      )}
      <label className="staff-check">
        <input
          type="checkbox"
          checked={all}
          onChange={() =>
            onChange(
              all
                ? selected.filter((index) => !visible.some((item) => item.index === index))
                : [...new Set([...selected, ...visible.map((item) => item.index)])],
            )
          }
        />
        {ar ? 'كل المقاسات في هذه المجموعة' : 'All sizes in this group'}
      </label>
      <div className="product-size-choices">
        {visible.map(({ variant, index }) => (
          <label className="staff-check" key={variant.id || index}>
            <input
              type="checkbox"
              checked={selected.includes(index)}
              onChange={() =>
                onChange(
                  selected.includes(index)
                    ? selected.filter((item) => item !== index)
                    : [...selected, index],
                )
              }
            />
            {variantLabel(product, variant, language)}
          </label>
        ))}
      </div>
      <small>
        {ar ? `تم اختيار ${selected.length} تركيبة` : `${selected.length} variants selected`}
      </small>
    </div>
  )
}

export function ProductImages({ draft, setDraft, onBusy, onPending, create }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [editing, setEditing] = useState(null),
    [gallery, setGallery] = useState(draft.type === 'simple' ? 'main' : 'all'),
    [preview, setPreview] = useState(null),
    [main, setMain] = useState(draft.type === 'simple'),
    [targets, setTargets] = useState(() => {
      const first = draft.variants?.[0],
        other = draft.options?.filter((option) => option.key !== 'size') || []
      return (draft.variants || []).flatMap((variant, index) =>
        other.every((option) => variant.values[option.key] === first?.values[option.key])
          ? [variantKey(variant, index)]
          : [],
      )
    }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    assignment = useRef(null),
    allImages = productImages(draft),
    images =
      gallery === 'main'
        ? draft.images
        : gallery === 'all'
          ? allImages
          : variantImages(draft, draft.variants[Number(gallery)] || { images: [] }),
    variantProduct = draft.type === 'variant',
    selectedTargets = (draft.variants || []).flatMap((variant, index) =>
      targets.includes(variantKey(variant, index)) ? [index] : [],
    ),
    pending =
      !!editing &&
      (main !== draft.images.some((image) => image.id === editing.id) ||
        (draft.variants || []).some(
          (variant, index) =>
            selectedTargets.includes(index) !==
            variantImages(draft, variant).some((image) => image.id === editing.id),
        ))
  useUnsavedChanges(pending)
  useEffect(() => {
    onPending(pending)
    return () => onPending(false)
  }, [pending, onPending])
  function begin(image) {
    setEditing(image)
    setMain(image ? draft.images.some((item) => item.id === image.id) : !variantProduct)
    setTargets(
      image
        ? (draft.variants || []).flatMap((variant, index) =>
            variantImages(draft, variant).some((item) => item.id === image.id)
              ? [variantKey(variant, index)]
              : [],
          )
        : [],
    )
    setError('')
    requestAnimationFrame(() =>
      assignment.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
    )
  }
  function assign(image) {
    try {
      setDraft(assignProductImage(draft, image, { main, targets: selectedTargets }, language))
      setError('')
      setEditing(null)
    } catch (error) {
      setError(error.message)
    }
  }
  let limitError = ''
  if (!editing) {
    try {
      assignProductImage(
        draft,
        { id: 'pending-upload' },
        { main, targets: selectedTargets },
        language,
      )
    } catch (error) {
      limitError = error.message
    }
  }
  const ready = main || selectedTargets.length > 0
  if (create)
    return (
      <section className="panel staff-panel">
        <h2>{ar ? 'الصور' : 'Images'}</h2>
        <p>
          {ar
            ? 'احفظ المنتج أولًا، ثم ارفع الصور واختر المقاسات التي تستخدمها.'
            : 'Save the product first, then upload photos and choose which sizes use them.'}
        </p>
        <FileField
          label={ar ? 'رفع صورة' : 'Upload image'}
          disabled
          hint={
            ar
              ? 'الخطوة 2 - ارفع الصور بعد حفظ التفاصيل في الخطوة 1.'
              : 'Step 2 - upload images after saving the details in step 1.'
          }
        />
      </section>
    )
  return (
    <section className="panel staff-panel product-images-panel">
      <div className="product-section-heading">
        <h2>
          {ar ? 'صور المنتج' : 'Product images'}{' '}
          <span className="product-count">{allImages.length}</span>
        </h2>
        {variantProduct && (
          <Button variant="secondary" disabled={busy} onClick={() => begin(null)}>
            {ar ? 'إضافة صورة لمقاسات محددة' : 'Add image for specific sizes'}
          </Button>
        )}
      </div>
      <p className="muted">
        {ar
          ? 'ارفع الصورة مرة واحدة واختر أين تظهر. اختر معرضًا لتغيير ترتيب صوره؛ الصورة الأولى هي الرئيسية.'
          : 'Upload once and choose where each photo appears. Choose a gallery to change its photo order; the first photo is the cover.'}
      </p>
      {variantProduct && (
        <SelectField
          label={ar ? 'عرض الصور' : 'View gallery'}
          value={gallery}
          onChange={(event) => setGallery(event.target.value)}
        >
          <option value="all">{ar ? 'كل الصور' : 'All images'}</option>
          <option value="main">{ar ? 'المعرض الرئيسي' : 'Main product gallery'}</option>
          {draft.variants.map((variant, index) => (
            <option key={variant.id || index} value={index}>
              {variantLabel(draft, variant, language)}
            </option>
          ))}
        </SelectField>
      )}
      {variantProduct && gallery === 'all' && (
        <small className="muted">
          {ar
            ? 'اختر المعرض الرئيسي أو مقاسًا من القائمة لتغيير ترتيب الصور والصورة الرئيسية.'
            : 'Choose the main gallery or a size above to change its photo order and cover.'}
        </small>
      )}
      <div className="product-image-library">
        {images.map((image, index) => {
          const used = (draft.variants || []).filter((variant) =>
              variantImages(draft, variant).some((item) => item.id === image.id),
            ),
            inMain = draft.images.some((item) => item.id === image.id)
          return (
            <article className="product-image-card" key={image.id}>
              <button
                type="button"
                className="product-image-preview"
                onClick={() => setPreview(image)}
                aria-label={ar ? `تكبير الصورة ${index + 1}` : `Enlarge image ${index + 1}`}
              >
                <img src={image.url} alt="" loading="lazy" />
              </button>
              <div className="product-image-meta">
                <strong>{ar ? `صورة ${index + 1}` : `Image ${index + 1}`}</strong>
                <span>
                  {[
                    inMain && (ar ? 'المعرض الرئيسي' : 'Main gallery'),
                    used.length === draft.variants?.length && used.length
                      ? ar
                        ? 'كل المقاسات'
                        : 'All sizes'
                      : used.map((variant) => variantLabel(draft, variant, language)).join(' · '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <div className="product-image-actions">
                {gallery !== 'all' && (
                  <>
                    <Button
                      variant="secondary"
                      disabled={busy || gallery === 'all' || index === 0}
                      onClick={() => setDraft(moveProductImage(draft, image.id, -1, gallery))}
                      aria-label={
                        ar ? `نقل الصورة ${index + 1} للأمام` : `Move image ${index + 1} earlier`
                      }
                    >
                      <Icon name="arrow" />
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || gallery === 'all' || index === images.length - 1}
                      onClick={() => setDraft(moveProductImage(draft, image.id, 1, gallery))}
                      aria-label={
                        ar ? `نقل الصورة ${index + 1} للخلف` : `Move image ${index + 1} later`
                      }
                    >
                      <Icon name="arrow" />
                    </Button>
                  </>
                )}
                {variantProduct && (
                  <Button variant="secondary" disabled={busy} onClick={() => begin(image)}>
                    {ar ? 'اختيار المقاسات' : 'Edit visibility'}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setDraft(removeProductImage(draft, image.id))
                    if (editing?.id === image.id) setEditing(null)
                  }}
                >
                  {variantProduct
                    ? ar
                      ? 'إزالة من الكل'
                      : 'Remove everywhere'
                    : ar
                      ? 'إزالة'
                      : 'Remove'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="product-image-assignment" ref={assignment}>
        <h3>
          {editing
            ? ar
              ? 'أين تظهر هذه الصورة؟'
              : 'Where should this photo appear?'
            : ar
              ? 'إضافة صورة'
              : 'Add an image'}
        </h3>
        {editing && <img className="product-assignment-preview" src={editing.url} alt="" />}
        <fieldset disabled={busy}>
          {variantProduct && (
            <>
              <ImageTargets
                product={draft}
                selected={selectedTargets.map((index) => variantKey(draft.variants[index], index))}
                onChange={setTargets}
                language={language}
              />
              <label className="staff-check">
                <input
                  type="checkbox"
                  checked={main}
                  onChange={(event) => setMain(event.target.checked)}
                />
                {ar ? 'إظهار في المعرض الرئيسي أيضًا' : 'Also show in the main gallery'}
              </label>
              <small>
                {ar
                  ? 'المقاسات التي لا تملك صورًا خاصة تستخدم المعرض الرئيسي.'
                  : 'Sizes without their own photos use the main gallery.'}
              </small>
            </>
          )}
          {editing ? (
            <div className="staff-actions">
              <Button disabled={!ready} onClick={() => assign(editing)}>
                {ar ? 'تطبيق الاختيار' : 'Apply visibility'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null)
                  setError('')
                }}
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          ) : (
            <>
              {!ready && (
                <p>
                  {ar
                    ? 'اختر مقاسًا واحدًا على الأقل أو المعرض الرئيسي قبل الرفع.'
                    : 'Choose at least one size or the main gallery before uploading.'}
                </p>
              )}
              {limitError && <p role="alert">{limitError}</p>}
              <MediaPicker
                path={`/media/product/${draft.id}`}
                disabled={!ready || !!limitError}
                onBusy={(value) => {
                  setBusy(value)
                  onBusy(value)
                }}
                onUploaded={assign}
              />
            </>
          )}
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {pending && (
          <p role="status">
            {ar
              ? 'طبّق اختيار المقاسات أو ألغِه قبل حفظ المنتج.'
              : 'Apply or cancel the visibility changes before saving the product.'}
          </p>
        )}
      </div>
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={ar ? 'معاينة الصورة' : 'Image preview'}
      >
        <img className="product-large-preview" src={preview?.url} alt="" />
      </Modal>
    </section>
  )
}
