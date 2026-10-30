import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { createApi } from '../lib/api.js'
import { createSession } from '../lib/session.js'
import { createPrivateState } from '../lib/private-state.js'
import { useLocale } from './Locale.jsx'
import { NotificationsProvider } from './Notifications.jsx'

const RuntimeContext = createContext(null)

export function RuntimeProvider({ config, children }) {
  const language = useLocale()
  const [runtime] = useState(() => {
    const session = createSession(config.store)
    let currentLanguage = language
    let publicContentChanged = false
    const current = {
      session,
      config,
      invalidatePublicContent() {
        publicContentChanged = true
      },
      hasPublicContentChanges() {
        return publicContentChanged
      },
      setLanguage(value) {
        currentLanguage = value
      },
    }
    current.api = createApi(config, {
      getToken: () => session.getSnapshot().accessToken,
      getLanguage: () => currentLanguage,
    })
    return current
  })
  useEffect(() => {
    runtime.setLanguage(language)
  }, [language, runtime])
  const [restoring, setRestoring] = useState(config.mode === 'live' && Boolean(config.apiOrigin))
  const [restoreError, setRestoreError] = useState(null)
  useEffect(() => {
    let mounted = true
    const channel =
      typeof BroadcastChannel === 'function'
        ? new BroadcastChannel(`narmer:${config.store}:session`)
        : null
    const onMessage = (event) => {
      if (event.data?.type === 'clear') runtime.session.clear(false)
    }
    channel?.addEventListener('message', onMessage)
    const identity = (user) => (user ? `${user.id}:${user.role}` : null)
    let previousUser = identity(runtime.session.getSnapshot().user)
    let initialRefresh = config.mode === 'live' && Boolean(config.apiOrigin)
    const unsubscribe = runtime.session.subscribe(() => {
      const user = runtime.session.getSnapshot().user
      if (identity(user) !== previousUser && !initialRefresh) {
        try {
          createPrivateState(sessionStorage, config.store).clear()
        } catch {
          /* Storage can be unavailable on restricted devices. */
        }
        if (!user) channel?.postMessage({ type: 'clear' })
      }
      previousUser = identity(user)
    })
    if (initialRefresh)
      runtime.session
        .refresh(runtime.api)
        .catch((error) => {
          if (mounted && error.status !== 401) setRestoreError(error)
        })
        .finally(() => {
          initialRefresh = false
          if (mounted) setRestoring(false)
        })
    return () => {
      mounted = false
      unsubscribe()
      channel?.removeEventListener('message', onMessage)
      channel?.close()
    }
  }, [config, runtime])
  return (
    <RuntimeContext.Provider value={{ ...runtime, restoring, restoreError }}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </RuntimeContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useRuntime() {
  return useContext(RuntimeContext)
}
// eslint-disable-next-line react/only-export-components
export function useSession() {
  const { session } = useRuntime()
  return useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot)
}
