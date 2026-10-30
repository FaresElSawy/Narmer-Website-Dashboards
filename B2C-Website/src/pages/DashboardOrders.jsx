import { useSearchParams } from 'react-router'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  ReadState,
  StaffTable,
  StaffLink,
  SelectField,
  Pagination,
} from '../features/dashboard/components.jsx'
import { orderStatuses, orderStatusLabel } from '../features/dashboard/orders.js'
import { pageQuery } from '../features/dashboard/model.js'
import { formatMoney } from '../../../shared/lib/money.js'

export function DashboardOrders() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [params, setParams] = useSearchParams(),
    page = pageQuery(params),
    status = orderStatuses.includes(params.get('status')) ? params.get('status') : ''
  const query = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(status ? { status } : {}),
    }),
    read = useStaffRead(`/orders?${query}`)
  const columns = [
    {
      key: 'customer',
      label: ar ? 'الطلب / العميل' : 'Order / customer',
      render: (row) => (
        <>
          <strong>{row.customer.name}</strong>
          <span className="staff-help staff-reference" dir="ltr">
            {row.orderNumber ?? row.id}
          </span>
        </>
      ),
    },
    {
      key: 'amount',
      label: ar ? 'القيمة / الدفع' : 'Amount / payment',
      render: (row) => (
        <>
          <bdi>{formatMoney(row.totals.total, language)}</bdi>
          <p className="staff-help">
            {row.payment.method === 'cod'
              ? ar
                ? 'الدفع عند الاستلام'
                : 'Cash on delivery'
              : 'InstaPay'}
          </p>
        </>
      ),
    },
    {
      key: 'status',
      label: ar ? 'الحالة' : 'Status',
      render: (row) => (
        <span className={`staff-status staff-status--${row.status}`}>
          {orderStatusLabel(row.status, language)}
        </span>
      ),
    },
    {
      key: 'action',
      label: ar ? 'الإجراء' : 'Action',
      render: (row) => (
        <StaffLink section="orders" id={row.id}>
          {ar ? 'مراجعة الطلب' : 'Review order'}
        </StaffLink>
      ),
    },
  ]
  return (
    <>
      <StaffHeading
        title={ar ? 'الطلبات' : 'Orders'}
        description={
          ar
            ? 'راجع الدفع وتابع تجهيز الطلبات وتسليمها.'
            : 'Review payments and keep fulfillment moving.'
        }
      />
      <div className="staff-filters">
        <SelectField
          label={ar ? 'حالة الطلب' : 'Order status'}
          value={status}
          onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}
        >
          <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabel(value, language)}
            </option>
          ))}
        </SelectField>
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <StaffTable
              columns={columns}
              rows={read.data.items}
              empty={ar ? 'لا توجد طلبات مطابقة' : 'No matching orders'}
            />
            <Pagination
              pagination={read.data.pagination}
              onPage={(value) => setParams({ ...Object.fromEntries(params), page: String(value) })}
            />
          </>
        )}
      </ReadState>
    </>
  )
}
