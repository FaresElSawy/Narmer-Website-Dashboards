import { useEffect, useState } from 'react'
import { useDashboard } from '../dashboard/DashboardContext.jsx'
import { readReport } from './model.js'

export function useReport(path) {
  const { request, reportStore, language } = useDashboard(),
    [revision, setRevision] = useState(0),
    [state, setState] = useState(null)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    readReport(reportStore, request, path, {
      signal: controller.signal,
      fresh: revision > 0,
      language,
    })
      .then((data) => {
        if (!controller.signal.aborted) setState({ path, revision, language, data })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            path,
            revision,
            language,
            error,
            retryAt: error.status === 429 ? Date.now() + (error.retryAfter ?? 30) * 1000 : 0,
          })
      })
    return () => controller.abort()
  }, [path, request, reportStore, revision, language])
  return {
    ...(state?.path === path && state?.revision === revision && state?.language === language
      ? state
      : { loading: !!path }),
    reload: () => setRevision((value) => value + 1),
  }
}
