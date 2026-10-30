import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { pageQuery } from '../features/dashboard/model.js'
import {
  StaffHeading,
  ReadState,
  StaffTable,
  StaffLink,
  StaffError,
  StaffDate,
  Pagination,
} from '../features/dashboard/components.jsx'

export function DashboardNotifications() {
  const { user, request, language } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams()
  const unreadOnly = search.get('unreadOnly') === 'true',
    read = useStaffRead(
      `/notifications?page=${pageQuery(search)}&limit=20&unreadOnly=${unreadOnly}`,
    )
  const [busy, setBusy] = useState(null),
    [error, setError] = useState(null),
    [retryAt, setRetryAt] = useState(0)
  async function acknowledge(item) {
    if (busy || Date.now() < retryAt) return
    setBusy(item.id)
    setError(null)
    try {
      await request(`/notifications/${item.id}/read`, { method: 'PATCH' })
      const current = await request('/notifications/unread-count')
      window.dispatchEvent(
        new CustomEvent('narmer:b2b:notification-count', {
          detail: { userId: user.id, count: current.unreadCount },
        }),
      )
      read.reload()
    } catch (error) {
      setError(error)
      if (error.status === 429) setRetryAt(Date.now() + (error.retryAfter ?? 30) * 1000)
    } finally {
      setBusy(null)
    }
  }
  return (
    <>
      <StaffHeading
        title={ar ? 'الإشعارات' : 'Notifications'}
        action={
          <Button variant="secondary" onClick={read.reload}>
            {ar ? 'تحديث' : 'Refresh'}
          </Button>
        }
      />
      <label className="staff-check">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(event) => setSearch(event.target.checked ? { unreadOnly: 'true' } : {})}
        />
        {ar ? 'غير المقروء فقط' : 'Unread only'}
      </label>
      <StaffError error={error} />
      <ReadState read={read}>
        {read.data && (
          <>
            <p>
              {read.data.unreadCount} {ar ? 'إشعار غير مقروء' : 'unread notifications'}
            </p>
            <StaffTable
              columns={[
                { key: 'title', label: ar ? 'الحدث' : 'Event' },
                {
                  key: 'occurredAt',
                  label: ar ? 'الاستلام' : 'Received',
                  render: (row) => <StaffDate value={row.occurredAt} />,
                },
                {
                  key: 'isRead',
                  label: ar ? 'حالة القراءة' : 'Read state',
                  render: (row) =>
                    row.isRead ? (ar ? 'مقروء' : 'Read') : ar ? 'غير مقروء' : 'Unread',
                },
                {
                  key: 'action',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <div className="staff-actions">
                      <StaffLink section="requests" id={row.resource.id}>
                        {ar ? 'فتح الطلب' : 'Open request'}
                      </StaffLink>
                      {!row.isRead && (
                        <Button
                          variant="secondary"
                          disabled={!!busy}
                          onClick={() => acknowledge(row)}
                        >
                          {ar ? 'تعليم كمقروء' : 'Mark read'}
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              rows={read.data.items}
              empty={ar ? 'لا توجد إشعارات مطابقة' : 'No matching notifications'}
            />
            <Pagination
              pagination={read.data.pagination}
              onPage={(page) => setSearch({ unreadOnly, page })}
            />
          </>
        )}
      </ReadState>
      <p className="staff-help">
        {ar
          ? 'القراءة خاصة بحسابك. تعليم الإشعار كمقروء لا يغيّر حالة الطلب أو قراءة زملائك.'
          : 'Read state belongs to your account. Marking a notification read does not mark the request contacted or change another staff member’s read state.'}
      </p>
    </>
  )
}
