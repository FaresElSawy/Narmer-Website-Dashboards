import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button, Field, Feedback } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { offerPayload, pageQuery } from '../features/dashboard/model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import {
  StaffHeading,
  ReadState,
  StaffTable,
  StaffLink,
  SelectField,
  BilingualFields,
  Pagination,
} from '../features/dashboard/components.jsx'
import { localText } from '../features/inquiry/model.js'

function SourceSelector({ draft, setDraft }) {
  const { language } = useDashboard(),
    ar = language === 'ar'
  const [query, setQuery] = useState(''),
    [page, setPage] = useState(1)
  const read = useStaffRead(
    `/wholesale/${draft.sourceStore === 'b2b' ? 'products' : 'b2c-products'}?page=${page}&limit=20${draft.sourceStore === 'b2b' ? '&isActive=true' : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`,
  )
  return (
    <>
      <SelectField
        label={ar ? 'متجر المصدر · ثابت بعد الإنشاء' : 'Source store · fixed after creation'}
        value={draft.sourceStore}
        onChange={(event) => {
          setPage(1)
          setDraft({
            ...draft,
            sourceStore: event.target.value,
            productId: '',
            product: null,
            composition: [],
          })
        }}
      >
        <option value="b2b">{ar ? 'منتج B2B' : 'Native B2B'}</option>
        <option value="b2c">{ar ? 'مصدر B2C · قراءة فقط' : 'B2C read-only source'}</option>
      </SelectField>
      <div className="staff-inline-search">
        <Field
          label={ar ? 'بحث عن مصدر' : 'Find a source'}
          value={query}
          maxLength={100}
          onChange={(event) => {
            setPage(1)
            setQuery(event.target.value)
          }}
        />
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <SelectField
              required
              label={ar ? 'المنتج المصدر' : 'Source product'}
              value={draft.productId}
              onChange={(event) => {
                const product = read.data.items.find((item) => item.id === event.target.value)
                if (product)
                  setDraft({
                    ...draft,
                    productId: product.id,
                    product,
                    composition: [
                      {
                        variantId: product.type === 'simple' ? null : product.variants[0].id,
                        quantity: 30,
                      },
                    ],
                  })
              }}
            >
              <option value="">{ar ? 'اختر المنتج' : 'Choose a product'}</option>
              {draft.product && !read.data.items.some((item) => item.id === draft.productId) && (
                <option value={draft.productId}>{localText(draft.product.name, language)}</option>
              )}
              {read.data.items.map((product) => (
                <option key={product.id} value={product.id}>
                  {localText(product.name, language)}
                </option>
              ))}
            </SelectField>
            <Pagination pagination={read.data.pagination} onPage={setPage} />
          </>
        )}
      </ReadState>
    </>
  )
}
function OfferEditor({ initial, create }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate()
  return (
    <RecordEditor
      initial={initial}
      path={`/wholesale/offers${create ? '' : `/${initial.id}`}`}
      create={create}
      payload={offerPayload}
      onSaved={(result) => {
        if (create) navigate(`/${language}/dashboard/wholesale/${result.id}`, { replace: true })
      }}
    >
      {({ draft, setDraft }) => {
        const product = draft.product,
          variantLabel = (variant) =>
            product.options
              .map(
                (option) =>
                  `${localText(option.name, language)}: ${localText(option.values.find((value) => value.key === variant.values[option.key])?.name, language)}`,
              )
              .join(' · ')
        return (
          <>
            <section className="panel staff-panel">
              <h2>{ar ? 'عرض الجملة' : 'Wholesale offer'}</h2>
              {create ? (
                <SourceSelector draft={draft} setDraft={setDraft} />
              ) : (
                <div className="staff-field-pair">
                  <Field
                    label={ar ? 'متجر المصدر · ثابت' : 'Source store · fixed'}
                    value={draft.sourceStore.toUpperCase()}
                    readOnly
                  />
                  <Field
                    label={ar ? 'المنتج المصدر · ثابت' : 'Source product · fixed'}
                    value={product ? localText(product.name, language) : draft.productId}
                    readOnly
                  />
                </div>
              )}
              <BilingualFields
                required
                label={ar ? 'العنوان *' : 'Title *'}
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
            <section className="panel staff-panel staff-offer-composition">
              <h2>{ar ? 'تكوين العبوة الثابت' : 'Fixed pouch composition'}</h2>
              {!product && (
                <Feedback
                  title={
                    create
                      ? ar
                        ? 'اختر مصدرًا لتحديد التكوين'
                        : 'Choose a source to configure the pouch'
                      : ar
                        ? 'المصدر غير متاح'
                        : 'Source unavailable'
                  }
                >
                  {!create &&
                    (ar
                      ? 'يمكن تعديل النص أو إلغاء النشر. لا يمكن تغيير التكوين أو تفعيل العرض.'
                      : 'You can edit text or unpublish. Composition changes and publication require an eligible source.')}
                </Feedback>
              )}
              <div className="staff-composition">
                {draft.composition.map((row, index) => (
                  <div className="staff-composition-row" key={index}>
                    {product?.type === 'variant' ? (
                      <SelectField
                        label={`${ar ? 'الخيار' : 'Variant'} ${index + 1}`}
                        value={row.variantId}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            composition: draft.composition.map((item, i) =>
                              i === index ? { ...item, variantId: event.target.value } : item,
                            ),
                          })
                        }
                      >
                        {product.variants.map((variant) => (
                          <option
                            key={variant.id}
                            value={variant.id}
                            disabled={draft.composition.some(
                              (item, i) => i !== index && item.variantId === variant.id,
                            )}
                          >
                            {variantLabel(variant)}
                          </option>
                        ))}
                      </SelectField>
                    ) : (
                      <Field
                        label={ar ? 'المصدر' : 'Source'}
                        value={
                          product
                            ? localText(product.name, language)
                            : row.variantId || draft.productId
                        }
                        readOnly
                      />
                    )}
                    <Field
                      label={ar ? 'قطع في العبوة' : 'Pieces per pouch'}
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      required
                      value={row.quantity}
                      disabled={!product}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          composition: draft.composition.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  quantity:
                                    event.target.value === '' ? '' : Number(event.target.value),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                    {product?.type === 'variant' && (
                      <Button
                        variant="secondary"
                        disabled={draft.composition.length === 1}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            composition: draft.composition.filter((_, i) => i !== index),
                          })
                        }
                      >
                        {ar ? 'إزالة الصف' : 'Remove row'} {index + 1}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {product?.type === 'variant' && (
                <Button
                  variant="secondary"
                  disabled={draft.composition.length >= Math.min(100, product.variants.length)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      composition: [
                        ...draft.composition,
                        {
                          variantId: product.variants.find(
                            (variant) =>
                              !draft.composition.some((row) => row.variantId === variant.id),
                          ).id,
                          quantity: 1,
                        },
                      ],
                    })
                  }
                >
                  {ar ? 'إضافة خيار منتج إلى العبوة' : 'Add product variant to pouch'}
                </Button>
              )}
              {product?.type === 'variant' && (
                <p className="staff-help">
                  {draft.composition.length === product.variants.length
                    ? ar
                      ? `تم تضمين جميع خيارات المنتج المتاحة (${product.variants.length}). `
                      : `All ${product.variants.length} available product variants are included. `
                    : ''}
                  {ar
                    ? 'اختر من خيارات المنتج الموجودة. تُضاف المقاسات والألوان الجديدة في محرر منتج B2C ثم تظهر هنا. يمكن أن تضم العبوة حتى 100 خيار مختلف.'
                    : 'Choose from existing product variants. Add new sizes or colors in the B2C product editor; they will then appear here. A pouch can contain up to 100 distinct variants.'}
                </p>
              )}
              <h3>
                {ar ? 'الإجمالي المحسوب' : 'Derived total'}:{' '}
                {draft.composition.reduce((sum, row) => sum + Number(row.quantity || 0), 0)}{' '}
                {ar ? 'قطعة في العبوة' : 'pieces per pouch'}
              </h3>
            </section>
            <section className="panel staff-panel">
              <SelectField
                label={ar ? 'حالة النشر' : 'Publication state'}
                value={String(draft.isActive)}
                onChange={(event) =>
                  setDraft({ ...draft, isActive: event.target.value === 'true' })
                }
              >
                <option value="false">{ar ? 'غير منشور' : 'Unpublished'}</option>
                <option value="true" disabled={!product}>
                  {ar ? 'منشور' : 'Published'}
                </option>
              </SelectField>
              <p className="staff-help">
                {ar
                  ? 'العرض الجديد غير منشور افتراضيًا. الصور تأتي من المنتج المصدر. لا توجد أسعار أو صور مستقلة للعرض.'
                  : 'New offers start unpublished. Images come from the source product. Offers have no independent gallery or pricing.'}
              </p>
            </section>
            {!create && (
              <DeleteRecord
                path={`/wholesale/offers/${draft.id}`}
                back="wholesale"
                label={ar ? 'العرض' : 'offer'}
              />
            )}
          </>
        )
      }}
    </RecordEditor>
  )
}
function ExistingOffer({ offerId }) {
  const read = useStaffRead(`/wholesale/offers/${offerId}`)
  return (
    <ReadState read={read}>
      {read.data && <OfferEditor key={offerId} initial={read.data} />}
    </ReadState>
  )
}
function WholesaleOffersList() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams()
  const active = ['true', 'false'].includes(search.get('isActive')) ? search.get('isActive') : '',
    q = (search.get('q') || '').slice(0, 100)
  const query = new URLSearchParams({
    page: pageQuery(search),
    limit: 20,
    ...(active && { isActive: active }),
    ...(q && { q }),
  })
  const read = useStaffRead(`/wholesale/offers?${query}`)
  function filter(key, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }
  return (
    <>
      <StaffHeading
        title={ar ? 'عروض الجملة' : 'Wholesale offers'}
        action={
          <Button variant="accent" to={`/${language}/dashboard/wholesale/new`}>
            {ar ? 'إضافة عرض' : 'Add offer'}
          </Button>
        }
      />
      <div className="staff-filters">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            filter('q', new FormData(event.currentTarget).get('q').trim())
          }}
        >
          <Field
            name="q"
            label={ar ? 'بحث بالاسم' : 'Search by name'}
            key={q}
            defaultValue={q}
            maxLength={100}
          />
          <Button type="submit" variant="secondary">
            {ar ? 'بحث' : 'Search'}
          </Button>
        </form>
        <SelectField
          label={ar ? 'النشر' : 'Publication'}
          value={active}
          onChange={(event) => filter('isActive', event.target.value)}
        >
          <option value="">{ar ? 'الكل' : 'All'}</option>
          <option value="true">{ar ? 'منشور' : 'Published'}</option>
          <option value="false">{ar ? 'غير منشور' : 'Unpublished'}</option>
        </SelectField>
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <StaffTable
              columns={[
                {
                  key: 'name',
                  label: ar ? 'العرض' : 'Offer',
                  render: (row) =>
                    `${localText(row.name, language)} · ${row.piecesPerPouch} ${ar ? 'قطعة' : 'pieces'}`,
                },
                {
                  key: 'sourceStore',
                  label: ar ? 'المصدر' : 'Source',
                  render: (row) =>
                    row.sourceStore === 'b2c'
                      ? ar
                        ? 'B2C · قراءة فقط'
                        : 'B2C · read only'
                      : 'B2B',
                },
                {
                  key: 'isActive',
                  label: ar ? 'النشر والإتاحة' : 'Publication / availability',
                  render: (row) =>
                    !row.isActive
                      ? ar
                        ? 'غير منشور'
                        : 'Unpublished'
                      : row.isAvailable
                        ? ar
                          ? 'منشور · متاح'
                          : 'Published · available'
                        : ar
                          ? 'منشور · مصدر غير متاح'
                          : 'Published · source unavailable',
                },
                {
                  key: 'action',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <StaffLink section="wholesale" id={row.id}>
                      {ar ? 'تعديل العرض' : 'Edit offer'}
                    </StaffLink>
                  ),
                },
              ]}
              rows={read.data.items}
              empty={ar ? 'لا توجد عروض مطابقة' : 'No matching offers'}
            />
            <Pagination pagination={read.data.pagination} onPage={(page) => filter('page', page)} />
          </>
        )}
      </ReadState>
    </>
  )
}

function WholesaleOfferPage({ offerId }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    create = offerId === 'new',
    heading = useRef(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [])
  return (
    <>
      <StaffLink section="wholesale">
        {ar ? 'العودة إلى عروض الجملة' : 'Back to wholesale offers'}
      </StaffLink>
      <StaffHeading
        headingRef={heading}
        title={
          create
            ? ar
              ? 'إضافة عرض جملة'
              : 'Add wholesale offer'
            : ar
              ? 'تعديل عرض الجملة'
              : 'Edit wholesale offer'
        }
      />
      {create ? (
        <OfferEditor
          create
          initial={{
            name: { en: '', ar: '' },
            description: { en: '', ar: '' },
            sourceStore: 'b2b',
            productId: '',
            product: null,
            composition: [],
            isActive: false,
          }}
        />
      ) : (
        <ExistingOffer offerId={offerId} />
      )}
    </>
  )
}

export function DashboardWholesale() {
  const { offerId } = useParams()
  return offerId ? <WholesaleOfferPage key={offerId} offerId={offerId} /> : <WholesaleOffersList />
}
