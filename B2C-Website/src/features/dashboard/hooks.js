import { useEffect, useId, useState } from 'react'
import { useDashboard } from './DashboardContext.jsx'

export function useUnsavedChanges(dirty) {
  const { leaveGuards } = useDashboard(),
    id = useId()
  useEffect(() => {
    const guards = leaveGuards.current
    if (dirty) guards.add(id)
    else guards.delete(id)
    return () => guards.delete(id)
  }, [dirty, id, leaveGuards])
  return () => leaveGuards.current.delete(id)
}

export function useStaffRead(path) {
  const { request } = useDashboard()
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, error: null, loading: false, path, revision })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, error, loading: false, path, revision })
      })
    return () => controller.abort()
  }, [path, request, revision])
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { data: null, error: null, loading: true }),
    reload: () => setRevision((value) => value + 1),
    setData: (update) =>
      setState((current) => ({
        data: typeof update === 'function' ? update(current.data) : update,
        loading: false,
        error: null,
        path,
        revision,
      })),
  }
}
