import { useSearchParams } from 'react-router'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { formTypes, localText } from '../features/inquiry/model.js'
import { serviceLinks } from '../app/config.js'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { pageQuery } from '../features/dashboard/model.js'
import {
  StaffHeading,
  StaffTable,
  ReadState,
  StaffLink,
  SelectField,
  Pagination,
  StaffDate,
} from '../features/dashboard/components.jsx'

export function DashboardRequests() {
  const language = useLocale(),
    ar = language === 'ar'
  const [search, setSearch] = useSearchParams(),
    page = pageQuery(search)
  const formType = formTypes.includes(search.get('formType')) ? search.get('formType') : ''
  const status = ['submitted', 'contacted'].includes(search.get('status'))
    ? search.get('status')
    : ''
  const query = new URLSearchParams({
    page,
    limit: 20,
    ...(formType && { formType }),
    ...(status && { status }),
  })
  const read = useStaffRead(`/leads?${query}`)
  const total = useStaffRead('/leads?limit=1'),
    submitted = useStaffRead('/leads?limit=1&status=submitted'),
    contacted = useStaffRead('/leads?limit=1&status=contacted')
  function filter(key, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }
  const columns = [
    { key: 'contact', label: ar ? 'التواصل' : 'Contact', render: (row) => row.contact.name },
    {
      key: 'formType',
      label: ar ? 'الخدمة' : 'Service',
      render: (row) => localText(row.form.title, language),
    },
    {
      key: 'governorate',
      label: ar ? 'المحافظة' : 'Governorate',
      render: (row) => row.contact.governorate,
    },
    {
      key: 'createdAt',
      label: ar ? 'الاستلام' : 'Received',
      render: (row) => <StaffDate value={row.createdAt} />,
    },
    {
      key: 'status',
      label: ar ? 'الحالة' : 'Status',
      render: (row) => (
        <span className={`staff-status staff-status--${row.status}`}>
          {row.status === 'submitted'
            ? ar
              ? 'تم الإرسال'
              : 'Submitted'
            : ar
              ? 'تم التواصل'
              : 'Contacted'}
        </span>
      ),
    },
    {
      key: 'action',
      label: ar ? 'الإجراء' : 'Action',
      render: (row) => (
        <StaffLink section="requests" id={row.id}>
          {ar ? 'عرض الطلب' : 'View request'}
        </StaffLink>
      ),
    },
  ]
  return (
    <>
      <StaffHeading
        title={ar ? 'الطلبات' : 'Requests'}
        description={
          ar
            ? 'راجع احتياجات العملاء وتابع التواصل.'
            : 'Review customer needs. Keep follow-up moving.'
        }
      />
      <div className="staff-metrics">
        {[
          [
            total,
            ar ? 'إجمالي الطلبات' : 'Total requests',
            ar ? 'جميع الخدمات' : 'Across all services',
          ],
          [
            submitted,
            ar ? 'بانتظار التواصل' : 'Awaiting follow-up',
            ar ? 'تم الإرسال' : 'Status: Submitted',
          ],
          [contacted, ar ? 'تم التواصل' : 'Contacted', ar ? 'بواسطة فريقك' : 'Marked by your team'],
        ].map(([metric, label, caption]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <strong>{metric.data?.pagination.total ?? (metric.error ? '-' : '…')}</strong>
            <small>{caption}</small>
          </div>
        ))}
      </div>
      <aside className="staff-priority">
        <div>
          <h2>{ar ? 'متابعة الطلبات الجديدة' : 'Keep new requests moving'}</h2>
          <p>
            {ar
              ? 'تواصل مع العميل ثم سجّل إتمام التواصل.'
              : 'Contact the customer, then mark the request as contacted.'}
          </p>
        </div>
        <Button variant="accent" onClick={() => filter('status', 'submitted')}>
          {ar ? 'عرض المرسلة' : 'View submitted'}
        </Button>
      </aside>
      <section className="panel staff-panel">
        <h2>{ar ? 'كل الطلبات' : 'All requests'}</h2>
        <div className="staff-filters">
          <SelectField
            label={ar ? 'الخدمة' : 'Service'}
            value={formType}
            onChange={(event) => filter('formType', event.target.value)}
          >
            <option value="">{ar ? 'كل الخدمات' : 'All services'}</option>
            {serviceLinks(language).map((service) => (
              <option key={service.key} value={service.key}>
                {service.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={ar ? 'الحالة' : 'Status'}
            value={status}
            onChange={(event) => filter('status', event.target.value)}
          >
            <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
            <option value="submitted">{ar ? 'تم الإرسال' : 'Submitted'}</option>
            <option value="contacted">{ar ? 'تم التواصل' : 'Contacted'}</option>
          </SelectField>
        </div>
        <ReadState read={read}>
          {read.data && (
            <>
              <StaffTable
                columns={columns}
                rows={read.data.items}
                empty={ar ? 'لا توجد طلبات بهذه الفلاتر' : 'No requests match these filters'}
              />
              <Pagination
                pagination={read.data.pagination}
                onPage={(next) => setSearch({ ...Object.fromEntries(search), page: next })}
              />
            </>
          )}
        </ReadState>
      </section>
    </>
  )
}
