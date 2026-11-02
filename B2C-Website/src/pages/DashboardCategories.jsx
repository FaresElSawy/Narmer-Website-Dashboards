import { useSearchParams, useParams, useNavigate } from 'react-router'
import { useState } from 'react'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  StaffTable,
  StaffLink,
  ReadState,
  Pagination,
  SelectField,
} from '../features/dashboard/components.jsx'
import { useDashboard as dashboardContext } from '../features/dashboard/DashboardContext.jsx'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { MediaPicker } from '../features/dashboard/MediaPicker.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import { BilingualFields } from '../features/dashboard/components.jsx'
import {
  categoryPayload,
  flattenCategories,
  updateCatalogName,
} from '../features/dashboard/catalog.js'

function categoryOptions(nodes = [], excludedId, depth = 0) {
  return nodes.flatMap((node) =>
    node.id === excludedId
      ? []
      : [{ ...node, depth }, ...categoryOptions(node.children || [], excludedId, depth + 1)],
  )
}

export function DashboardCategories() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams()
  const page = Math.max(1, Number(search.get('page')) || 1),
    query = new URLSearchParams({
      page,
      limit: 20,
      ...(search.get('isActive') ? { isActive: search.get('isActive') } : {}),
    })
  const read = useStaffRead(`/categories?${query}`)
  const tree = useStaffRead('/categories/tree')
  const categories = flattenCategories(tree.data)
  return (
    <>
      <StaffHeading
        title={ar ? 'التصنيفات' : 'Categories'}
        action={
          <Button variant="accent" to={`/${language}/dashboard/categories/new`}>
            {ar ? 'إضافة تصنيف' : 'Add category'}
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
              empty={ar ? 'لا توجد تصنيفات' : 'No categories'}
              columns={[
                {
                  key: 'name',
                  label: ar ? 'التصنيف' : 'Category',
                  render: (row) => row.name?.[language] || row.name?.en,
                },
                { key: 'slug', label: 'Slug' },
                { key: 'position', label: ar ? 'الترتيب' : 'Position' },
                {
                  key: 'parentId',
                  label: ar ? 'التصنيف الأصل' : 'Parent category',
                  render: (row) =>
                    row.parentId
                      ? categories.find((category) => category.id === row.parentId)?.name?.[
                          language
                        ] || '-'
                      : ar
                        ? 'جذر'
                        : 'Root',
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
                    <StaffLink section="categories" id={row.id} edit>
                      {ar ? 'تعديل' : 'Edit'}
                    </StaffLink>
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

function CategoryEditor({ initial, create }) {
  const { language } = dashboardContext(),
    ar = language === 'ar',
    navigate = useNavigate(),
    [uploading, setUploading] = useState(false)
  const tree = useStaffRead('/categories/tree')
  const empty = {
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    slug: '',
    parentId: null,
    position: 0,
    isActive: false,
    image: null,
  }
  return (
    <RecordEditor
      initial={initial || empty}
      path={`/categories${create ? '' : `/${initial.id}`}`}
      payload={(draft) => categoryPayload(draft, create ? null : initial)}
      create={create}
      saveInChildren
      blocked={uploading}
      onSaved={
        create
          ? (item) => navigate(`/${language}/dashboard/categories/${item.id}`, { replace: true })
          : undefined
      }
    >
      {({ draft, setDraft, saveButton }) => (
        <div className="staff-detail-grid">
          <div>
            <section className="panel staff-panel">
              <h2>{ar ? 'بيانات التصنيف' : 'Category details'}</h2>
              <BilingualFields
                label={ar ? 'الاسم *' : 'Name *'}
                required
                value={draft.name}
                onChange={(name) => setDraft(updateCatalogName(draft, name, create))}
              />
              <BilingualFields
                label={ar ? 'الوصف' : 'Description'}
                multiline
                maxLength={2000}
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
              />
              <label className="field">
                <span>Slug</span>
                <input
                  required
                  aria-label="Slug"
                  aria-describedby={create ? 'category-slug-help' : undefined}
                  lang="en"
                  dir="ltr"
                  maxLength={150}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
                {create && (
                  <small id="category-slug-help">
                    {ar
                      ? 'يُنشأ تلقائيًا من الاسم الإنجليزي، ويمكنك تعديله.'
                      : 'Generated from the English name. You can edit it.'}
                  </small>
                )}
              </label>
              <SelectField
                label={ar ? 'التصنيف الأصل' : 'Parent category'}
                value={draft.parentId || ''}
                onChange={(e) => setDraft({ ...draft, parentId: e.target.value || null })}
              >
                <option value="">{ar ? 'تصنيف رئيسي' : 'Root category'}</option>
                {categoryOptions(tree.data || [], draft.id).map((category) => (
                  <option key={category.id} value={category.id}>
                    {'· '.repeat(category.depth)}
                    {category.name[language]}
                  </option>
                ))}
              </SelectField>
              {tree.error && <ReadState read={tree} />}
              {draft.parentId && (
                <label className="field">
                  <span>{ar ? 'الترتيب' : 'Position'}</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={draft.position}
                    onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
                  />
                </label>
              )}
              <SelectField
                label={ar ? 'الإتاحة' : 'Availability'}
                value={String(draft.isActive)}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.value === 'true' })}
              >
                <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
                <option value="true">{ar ? 'متاح' : 'Active'}</option>
              </SelectField>
            </section>
            {!create && !draft.parentId && (
              <section className="panel staff-panel">
                <h2>{ar ? 'صورة التصنيف' : 'Category image'}</h2>
                <p className="staff-help">
                  {ar
                    ? 'تُعرض في قائمة التصنيف الرئيسية أسفل شريط التنقل.'
                    : 'Shown in the root category dropdown below the navigation bar.'}
                </p>
                {draft.image && (
                  <div className="staff-gallery-editor">
                    <img
                      src={draft.image.url}
                      width={draft.image.width}
                      height={draft.image.height}
                      alt=""
                    />
                    <Button
                      variant="secondary"
                      onClick={() => setDraft({ ...draft, image: null, imageId: null })}
                    >
                      {ar ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                )}
                <MediaPicker
                  path={`/media/category/${draft.id}`}
                  onBusy={setUploading}
                  onUploaded={(image) => setDraft({ ...draft, image, imageId: image.id })}
                />
              </section>
            )}
          </div>
          <aside>
            {saveButton}
            {!create && (
              <DeleteRecord
                path={`/categories/${draft.id}`}
                back="categories"
                label={ar ? 'التصنيف' : 'category'}
              />
            )}
          </aside>
        </div>
      )}
    </RecordEditor>
  )
}

export function DashboardCategoryEditor() {
  const { categoryId } = useParams(),
    { language } = dashboardContext(),
    ar = language === 'ar',
    create = categoryId === 'new'
  const read = useStaffRead(create ? null : `/categories/${categoryId}`)
  return (
    <>
      <StaffHeading
        title={
          create ? (ar ? 'تصنيف جديد' : 'New category') : ar ? 'تعديل التصنيف' : 'Edit category'
        }
      />
      {create ? (
        <CategoryEditor create />
      ) : (
        <ReadState read={read}>
          {read.data && <CategoryEditor key={read.data.id} initial={read.data} />}
        </ReadState>
      )}
    </>
  )
}
