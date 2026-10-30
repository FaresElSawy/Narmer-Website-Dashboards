import { useSearchParams, useParams, useNavigate } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { FileField } from '../../../shared/ui/FileField.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { MediaPicker } from '../features/dashboard/MediaPicker.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import {
  StaffHeading,
  StaffTable,
  StaffLink,
  ReadState,
  Pagination,
  BilingualFields,
  SelectField,
} from '../features/dashboard/components.jsx'
import { sizeChartPayload } from '../features/dashboard/catalog.js'

export function DashboardSizeCharts() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams(),
    page = Math.max(1, Number(search.get('page')) || 1)
  const query = new URLSearchParams({
      page,
      limit: 20,
      ...(search.get('isActive') ? { isActive: search.get('isActive') } : {}),
    }),
    read = useStaffRead(`/size-charts?${query}`)
  return (
    <>
      <StaffHeading
        title={ar ? 'جداول المقاسات' : 'Size charts'}
        action={
          <Button variant="accent" to={`/${language}/dashboard/size-charts/new`}>
            {ar ? 'إضافة جدول' : 'Add chart'}
          </Button>
        }
      />
      <div className="staff-filters">
        <SelectField
          label={ar ? 'الإتاحة' : 'Availability'}
          value={search.get('isActive') || ''}
          onChange={(e) => setSearch(e.target.value ? { isActive: e.target.value } : {})}
        >
          <option value="">{ar ? 'الكل' : 'All'}</option>
          <option value="true">{ar ? 'متاح' : 'Active'}</option>
          <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
        </SelectField>
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <StaffTable
              rows={read.data.items}
              empty={ar ? 'لا توجد جداول' : 'No size charts'}
              columns={[
                {
                  key: 'name',
                  label: ar ? 'الجدول' : 'Chart',
                  render: (row) => row.name[language],
                },
                {
                  key: 'measurements',
                  label: ar ? 'القياسات' : 'Measurements',
                  render: (row) => row.measurements?.rows.length ?? 0,
                },
                {
                  key: 'assignedProductCount',
                  label: ar ? 'المنتجات المرتبطة' : 'Assigned products',
                },
                {
                  key: 'isActive',
                  label: ar ? 'الإتاحة' : 'Availability',
                  render: (row) =>
                    row.isActive ? (ar ? 'متاح' : 'Active') : ar ? 'غير متاح' : 'Inactive',
                },
                {
                  key: 'edit',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <div className="staff-actions">
                      <StaffLink section="size-charts" id={row.id} edit>
                        {ar ? 'تعديل' : 'Edit'}
                      </StaffLink>
                      <DeleteRecord
                        iconOnly
                        path={`/size-charts/${row.id}`}
                        back="size-charts"
                        label={row.name[language]}
                        onDeleted={read.reload}
                      />
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              pagination={read.data.pagination}
              onPage={(next) =>
                setSearch({
                  ...(search.get('isActive') ? { isActive: search.get('isActive') } : {}),
                  page: next,
                })
              }
            />
          </>
        )}
      </ReadState>
    </>
  )
}

function ChartEditor({ initial, create }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate(),
    [search] = useSearchParams(),
    imageSection = useRef(null),
    [uploading, setUploading] = useState(false)
  useEffect(() => {
    if (!create && search.get('step') === 'images') {
      imageSection.current?.scrollIntoView({ block: 'start' })
      imageSection.current?.focus({ preventScroll: true })
    }
  }, [create, search])
  const base = initial || {
    name: { en: '', ar: '' },
    alt: { en: '', ar: '' },
    images: { en: null, ar: null },
    isActive: false,
    measurements: null,
  }
  return (
    <RecordEditor
      initial={base}
      path={`/size-charts${create ? '' : `/${initial.id}`}`}
      payload={(draft) => sizeChartPayload(draft, create ? null : initial)}
      create={create}
      saveInChildren
      saveLabel={
        create ? (ar ? 'حفظ ومتابعة لإضافة الصور' : 'Save and continue to images') : undefined
      }
      blocked={uploading}
      onSaved={
        create
          ? (item) =>
              navigate(`/${language}/dashboard/size-charts/${item.id}?step=images`, {
                replace: true,
              })
          : undefined
      }
    >
      {({ draft, setDraft, saveButton }) => (
        <div className="staff-detail-grid">
          <div>
            {(create || search.get('step') === 'images') && (
              <ol
                className="staff-image-steps"
                aria-label={ar ? 'خطوات إعداد جدول المقاسات' : 'Size chart setup steps'}
              >
                <li aria-current={create ? 'step' : undefined}>
                  <strong>1</strong>
                  {ar ? 'حفظ الاسم والقياسات' : 'Save name and measurements'}
                </li>
                <li aria-current={!create ? 'step' : undefined}>
                  <strong>2</strong>
                  {ar ? 'إضافة الصور الاختيارية وحفظها' : 'Add optional images and save'}
                </li>
              </ol>
            )}
            <section className="panel staff-panel">
              <h2>{ar ? 'اسم الدليل' : 'Chart name'}</h2>
              <BilingualFields
                label={ar ? 'الاسم *' : 'Name *'}
                required
                value={draft.name}
                onChange={(name) => setDraft({ ...draft, name })}
              />
            </section>
            <section className="panel staff-panel">
              <h2>{ar ? 'جدول القياسات بالسنتيمتر' : 'Measurements in centimetres'}</h2>
              <p>
                {ar
                  ? 'القيم تعرض كما أدخلت؛ لا تحدد إن كانت قياسات مسطحة أو محيطًا.'
                  : 'Values display as entered; their flat-width or circumference meaning is not inferred.'}
              </p>
              {draft.measurements?.rows.map((row, index) => (
                <div className="staff-field-pair" key={index}>
                  {['size', 'chest', 'length', 'sleeve'].map((field) => (
                    <label className="field" key={field}>
                      <span>
                        {field === 'size'
                          ? ar
                            ? 'المقاس'
                            : 'Size'
                          : {
                              chest: ar ? 'الصدر (سم)' : 'Chest (cm)',
                              length: ar ? 'الطول (سم)' : 'Length (cm)',
                              sleeve: ar ? 'الكم (سم)' : 'Sleeve (cm)',
                            }[field]}
                      </span>
                      <input
                        type={field === 'size' ? 'text' : 'number'}
                        min={field === 'size' ? undefined : '0.01'}
                        max={field === 'size' ? undefined : '1000'}
                        step={field === 'size' ? undefined : '0.01'}
                        value={row[field]}
                        onChange={(e) => {
                          const measurements = structuredClone(draft.measurements)
                          measurements.rows[index][field] =
                            field === 'size' ? e.target.value : e.target.value
                          setDraft({ ...draft, measurements })
                        }}
                      />
                    </label>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const rows = draft.measurements.rows.filter((_, i) => i !== index)
                      setDraft({
                        ...draft,
                        measurements: rows.length ? { unit: 'cm', rows } : null,
                      })
                    }}
                  >
                    {ar ? 'إزالة الصف' : 'Remove row'}
                  </Button>
                </div>
              ))}
              <div className="staff-actions">
                <Button
                  variant="secondary"
                  disabled={(draft.measurements?.rows.length || 0) >= 50}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      measurements: {
                        unit: 'cm',
                        rows: [
                          ...(draft.measurements?.rows || []),
                          { size: '', chest: '', length: '', sleeve: '' },
                        ],
                      },
                    })
                  }
                >
                  {ar ? 'إضافة صف' : 'Add row'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!draft.measurements}
                  onClick={() => setDraft({ ...draft, measurements: null })}
                >
                  {ar ? 'مسح الجدول' : 'Clear table'}
                </Button>
              </div>
            </section>
            <section
              className="panel staff-panel staff-chart-images"
              ref={imageSection}
              tabIndex={-1}
            >
              <h2>{ar ? 'صور بديلة أو مساعدة' : 'Optional guide images'}</h2>
              <fieldset disabled={create}>
                <BilingualFields
                  label={ar ? 'النص البديل' : 'Alt text'}
                  multiline
                  maxLength={500}
                  value={draft.alt}
                  onChange={(alt) => setDraft({ ...draft, alt })}
                />
              </fieldset>
              <p>
                {ar
                  ? 'الجدول الرقمي هو العرض الأساسي؛ يمكن إضافة صور للغة كبديل أو مرجع.'
                  : 'Numeric measurements take priority; images can provide a language-specific fallback/reference.'}
              </p>
              {create && (
                <p>
                  {ar
                    ? 'الخطوة 2 - احفظ الاسم والقياسات أولًا لتفعيل رفع الصور. الصور اختيارية ويمكن إضافتها لاحقًا.'
                    : 'Step 2 - save the name and measurements first to enable uploads. Images are optional and can be added later.'}
                </p>
              )}
              {['en', 'ar'].map((locale) => (
                <div key={locale}>
                  <h3>{locale === 'en' ? 'English' : 'العربية'}</h3>
                  {draft.images[locale] && (
                    <div className="staff-gallery-editor">
                      <img
                        src={draft.images[locale].url}
                        width={draft.images[locale].width}
                        height={draft.images[locale].height}
                        alt={draft.alt?.[locale] || ''}
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDraft({ ...draft, images: { ...draft.images, [locale]: null } })
                        }
                      >
                        {ar ? 'إزالة' : 'Remove'}
                      </Button>
                    </div>
                  )}
                  {create ? (
                    <FileField
                      label={ar ? 'رفع صورة' : 'Upload image'}
                      disabled
                      hint={
                        ar
                          ? 'متاح بعد حفظ التفاصيل في الخطوة 1.'
                          : 'Available after saving the details in step 1.'
                      }
                    />
                  ) : (
                    <MediaPicker
                      path={`/size-charts/${draft.id}/images/${locale}`}
                      onBusy={setUploading}
                      label={ar ? 'رفع صورة' : 'Upload image'}
                      onUploaded={(image) =>
                        setDraft({ ...draft, images: { ...draft.images, [locale]: image } })
                      }
                    />
                  )}
                </div>
              ))}
            </section>
          </div>
          <aside>
            <section className="panel staff-panel">
              <h2>{ar ? 'النشر' : 'Publication'}</h2>
              <SelectField
                label={ar ? 'إتاحة الدليل للعملاء' : 'Available to customers'}
                value={String(draft.isActive)}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.value === 'true' })}
              >
                <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
                <option value="true">{ar ? 'متاح' : 'Active'}</option>
              </SelectField>
              <p>
                {ar
                  ? `المنتجات المرتبطة: ${initial?.assignedProductCount ?? 0}. الإسناد يدار من محرر المنتج.`
                  : `Assigned products: ${initial?.assignedProductCount ?? 0}. Manage assignments in each product editor.`}
              </p>
            </section>
            {saveButton}
            {!create && (
              <DeleteRecord
                path={`/size-charts/${draft.id}`}
                back="size-charts"
                label={ar ? 'جدول المقاس' : 'size chart'}
              />
            )}
          </aside>
        </div>
      )}
    </RecordEditor>
  )
}

export function DashboardSizeChartEditor() {
  const { chartId } = useParams(),
    { language } = useDashboard(),
    ar = language === 'ar',
    create = chartId === 'new',
    read = useStaffRead(create ? null : `/size-charts/${chartId}`)
  return (
    <>
      <StaffHeading
        title={
          create
            ? ar
              ? 'جدول مقاسات جديد'
              : 'New size chart'
            : ar
              ? 'تعديل جدول المقاسات'
              : 'Edit size chart'
        }
      />
      {create ? (
        <ChartEditor create />
      ) : (
        <ReadState read={read}>
          {read.data && <ChartEditor key={read.data.id} initial={read.data} />}
        </ReadState>
      )}
    </>
  )
}
