import { useSearchParams } from 'react-router'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { flattenCategories } from '../features/dashboard/catalog.js'
import {
  StaffHeading,
  StaffTable,
  StaffLink,
  ReadState,
  Pagination,
  SelectField,
} from '../features/dashboard/components.jsx'

export function DashboardProducts() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams()
  const page = Math.max(1, Number(search.get('page')) || 1)
  const query = new URLSearchParams({
    page,
    limit: 20,
    ...(search.get('isActive') ? { isActive: search.get('isActive') } : {}),
  })
  const read = useStaffRead(`/products?${query}`)
  const tree = useStaffRead('/categories/tree')
  const categories = flattenCategories(tree.data)
  const filter = (value) => setSearch(value ? { isActive: value } : {})
  return (
    <>
      <StaffHeading
        title={ar ? 'منتجات المتجر' : 'Store products'}
        action={
          <Button variant="accent" to={`/${language}/dashboard/products/new`}>
            {ar ? 'إضافة منتج' : 'Add product'}
          </Button>
        }
      />
      <div className="staff-filters">
        <SelectField
          label={ar ? 'الإتاحة' : 'Availability'}
          value={search.get('isActive') || ''}
          onChange={(event) => filter(event.target.value)}
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
              empty={ar ? 'لا توجد منتجات' : 'No products'}
              columns={[
                {
                  key: 'name',
                  label: ar ? 'المنتج' : 'Product',
                  render: (row) => (
                    <div className="staff-product-name">
                      {row.images?.[0] && (
                        <img src={row.images[0].url} width="48" height="48" alt="" />
                      )}
                      <span>{row.name?.[language] || row.name?.en}</span>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  label: ar ? 'النوع' : 'Type',
                  render: (row) =>
                    row.type === 'variant'
                      ? ar
                        ? 'متعدد الخيارات'
                        : 'Variants'
                      : ar
                        ? 'بسيط'
                        : 'Simple',
                },
                {
                  key: 'categoryId',
                  label: ar ? 'التصنيف' : 'Category',
                  render: (row) =>
                    categories.find((category) => category.id === row.categoryId)?.name?.[
                      language
                    ] || '-',
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
                    <StaffLink section="products" id={row.id} edit>
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
