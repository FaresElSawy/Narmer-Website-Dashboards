import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocale } from './Locale.jsx'
import './notifications.css'

const NotificationsContext = createContext({ notify: () => {} })

export function NotificationsProvider({ children }) {
  const language = useLocale()
  const [messages, setMessages] = useState([])
  const nextId = useRef(0)
  const timers = useRef(new Map())
  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setMessages((items) => items.filter((item) => item.id !== id))
  }, [])
  const notify = useCallback(
    (message) => {
      if (typeof message !== 'string' || !message.trim()) return
      const id = ++nextId.current
      timers.current.forEach(clearTimeout)
      timers.current.clear()
      setMessages([{ id, message }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 7000),
      )
    },
    [dismiss],
  )
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <div className="notifications" aria-live="polite" aria-atomic="false">
        {messages.map(({ id, message }) => (
          <div className="notification" role="status" key={id}>
            <span>{message}</span>
            <button
              type="button"
              aria-label={language === 'ar' ? 'إغلاق الإشعار' : 'Dismiss notification'}
              onClick={() => dismiss(id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export const useNotifications = () => useContext(NotificationsContext)
