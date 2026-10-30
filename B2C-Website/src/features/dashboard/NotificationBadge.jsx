import { useEffect, useMemo, useState } from 'react'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { createDashboardApi } from './api.js'
import { startNotificationPoll } from './notification-poll.js'

export function NotificationBadge({ user }) {
  const runtime = useRuntime(),
    language = useLocale(),
    [count, setCount] = useState(null)
  const request = useMemo(
    () => createDashboardApi(runtime, user, language),
    [runtime, user, language],
  )
  useEffect(() => {
    const poll = startNotificationPoll(
      (signal) => request('/notifications/unread-count', { signal }),
      (data) => setCount(data.unreadCount),
    )
    const update = (event) => {
      if (event.detail.userId === user.id) setCount(event.detail.count)
    }
    window.addEventListener('narmer:b2c:notification-count', update)
    return () => {
      poll.stop()
      window.removeEventListener('narmer:b2c:notification-count', update)
    }
  }, [request, user.id])
  return count > 0 ? (
    <span
      className="staff-badge"
      aria-label={`${count} ${language === 'ar' ? 'إشعار غير مقروء' : 'unread notifications'}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null
}
