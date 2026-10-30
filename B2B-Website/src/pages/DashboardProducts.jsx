import { useSearchParams } from 'react-router'
import { Button, Field } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { pageQuery, staffLabel } from '../features/dashboard/model.js'
import {
  StaffHeading,
  StaffTable,
  StaffLink,
  SelectField,
  ReadState,
  Pagination,
} from '../features/dashboard/components.jsx'
import { localText } from '../features/inquiry/model.js'

export function DashboardProducts() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams()
  const source = search.get('source') === 'b2c',
    q = (search.get('q') || '').slice(0, 100)
  const active = ['true', 'false'].includes(search.get('isActive')) ? search.get('isActive') : ''
  const query = new URLSearchParams({
    page: pageQuery(search),
    limit: 20,
    ...(q && { q }),
    ...(!source && active && { isActive: active }),
  })
  const read = useStaffRead(`/wholesale/${source ? 'b2c-products' : 'products'}?${query}`)
  function update(key, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }
  return (
    <>
      <StaffHeading
        title={ar ? 'المنتجات' : 'Products'}
        action={
          !source && (
            <Button variant="accent" to={`/${language}/dashboard/products/new`}>
              {ar ? 'إضافة منتج B2B' : 'Add B2B product'}
            </Button>
          )
        }
      />
      <div className="staff-actions staff-tabs">
        <Button variant={source ? 'outline' : 'primary'} onClick={() => setSearch({})}>
          {ar ? 'منتجات B2B' : 'Native B2B products'}
        </Button>
        <Button
          variant={source ? 'primary' : 'outline'}
          onClick={() => setSearch({ source: 'b2c' })}
        >
          {ar ? 'منتجات B2C · قراءة فقط' : 'B2C sources · read only'}
        </Button>
      </div>
      <div className="staff-filters">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            update('q', new FormData(event.currentTarget).get('q').trim())
          }}
        >
          <Field
            key={q}
            name="q"
            label={ar ? 'بحث بالاسم' : 'Search by name'}
            defaultValue={q}
            maxLength={100}
          />
          <Button type="submit" variant="secondary">
            {ar ? 'بحث' : 'Search'}
          </Button>
        </form>
        {!source && (
          <SelectField
            label={ar ? 'الإتاحة' : 'Availability'}
            value={active}
            onChange={(event) => update('isActive', event.target.value)}
          >
            <option value="">{ar ? 'الكل' : 'All'}</option>
            <option value="true">{ar ? 'متاح' : 'Active'}</option>
            <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
          </SelectField>
        )}
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <StaffTable
              columns={[
                {
                  key: 'name',
                  label: ar ? 'المنتج' : 'Product',
                  render: (row) => (
                    <div className="staff-product-name">
                      {row.images[0] && (
                        <img src={row.images[0].url} width="48" height="48" alt="" />
                      )}
                      <span>{localText(row.name, language)}</span>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  label: ar ? 'النوع' : 'Type',
                  render: (row) => staffLabel(row.type, language),
                },
                {
                  key: 'isActive',
                  label: ar ? 'الإتاحة' : 'Availability',
                  render: (row) =>
                    source
                      ? ar
                        ? 'مصدر مرئي · قراءة فقط'
                        : 'Visible source · read only'
                      : row.isActive
                        ? ar
                          ? 'متاح'
                          : 'Active'
                        : ar
                          ? 'غير متاح'
                          : 'Inactive',
                },
                {
                  key: 'action',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <StaffLink section={`products/${source ? 'source/' : ''}${row.id}`}>
                      {source
                        ? ar
                          ? 'عرض المصدر'
                          : 'View source'
                        : ar
                          ? 'تعديل المنتج'
                          : 'Edit product'}
                    </StaffLink>
                  ),
                },
              ]}
              rows={read.data.items}
              empty={ar ? 'لا توجد منتجات مطابقة' : 'No matching products'}
            />
            <Pagination pagination={read.data.pagination} onPage={(page) => update('page', page)} />
          </>
        )}
      </ReadState>
    </>
  )
}
