import { createContext, useContext, useEffect, useMemo, useRef, useCallback } from 'react'
import { useBlocker } from 'react-router'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { createDashboardApi } from './api.js'

const Context = createContext(null)
export function DashboardProvider({ user, children, registerExitGuard }) {
  const runtime = useRuntime(),
    language = useLocale()
  const leaveGuards = useRef(new Set()),
    blocker = useBlocker(() => leaveGuards.current.size > 0)
  const confirmUnsaved = useCallback(
    () =>
      !leaveGuards.current.size ||
      window.confirm(
        language === 'ar'
          ? 'لديك تعديلات غير محفوظة. هل تريد مغادرة الصفحة؟'
          : 'You have unsaved changes. Leave this page?',
      ),
    [language],
  )
  useEffect(() => {
    if (!registerExitGuard) return
    registerExitGuard({ confirm: confirmUnsaved, clear: () => leaveGuards.current.clear() })
    return () => registerExitGuard(null)
  }, [confirmUnsaved, registerExitGuard])
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (confirmUnsaved()) blocker.proceed()
    else blocker.reset()
  }, [blocker, confirmUnsaved])
  useEffect(() => {
    function unload(event) {
      if (!leaveGuards.current.size) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', unload)
    return () => window.removeEventListener('beforeunload', unload)
  }, [])
  const value = useMemo(
    () => ({
      user,
      language,
      leaveGuards,
      confirmUnsaved,
      request: createDashboardApi(runtime, user, language),
    }),
    [runtime, user, language, confirmUnsaved],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
// eslint-disable-next-line react/only-export-components
export function useDashboard() {
  return useContext(Context)
}
