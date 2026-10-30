import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { nextSaleExpiry } from './catalog.js'

export function useShopRead(read, key, initial = null) {
  const [state, setState] = useState({
    data: initial,
    error: null,
    loading: !initial,
    key,
    revision: 0,
  })
  const [revision, setRevision] = useState(0)
  const cooldown = useRef(null)
  const readLatest = useEffectEvent(read)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener('focus', refresh)
    const expiresAt = nextSaleExpiry(state.data)
    const timer = expiresAt
      ? setTimeout(refresh, Math.min(2147483647, expiresAt - Date.now() + 100))
      : null
    return () => {
      window.removeEventListener('focus', refresh)
      clearTimeout(timer)
    }
  }, [state.data])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    Promise.resolve()
      .then(() => {
        if (cooldown.current?.until > Date.now()) throw cooldown.current.error
        return readLatest(controller.signal)
      })
      .then(
        (data) => {
          if (active) setState({ data, error: null, loading: false, key, revision })
        },
        (error) => {
          if (error.status === 429 && error.retryAfter && cooldown.current?.error !== error)
            cooldown.current = { error, until: Date.now() + error.retryAfter * 1000 }
          if (active && error.name !== 'AbortError')
            setState({ data: null, error, loading: false, key, revision })
        },
      )
    return () => {
      active = false
      controller.abort()
    }
  }, [key, revision])
  const matches = key === state.key
  return {
    ...(matches
      ? { ...state, loading: state.revision !== revision || state.loading }
      : { data: null, error: null, loading: true }),
    reload: () => setRevision((value) => value + 1),
    replace: (data) => setState({ data, error: null, loading: false, key, revision }),
  }
}
