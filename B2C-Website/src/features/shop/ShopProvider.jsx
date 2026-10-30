import { useCallback, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../../shared/ui/Runtime.jsx'
import { createRetailApi } from './api.js'
import { retailImages } from './images.js'
import { retailCategories, retailHomepage } from './fixtures.js'
import { cartItemCount } from './cart-count.js'

const ShopContext = createContext(null)
export function ShopProvider({ children, publicData }) {
  const { api: transport, config, session, restoring } = useRuntime(),
    language = useLocale(),
    auth = useSession()
  const api = useMemo(
    () => createRetailApi({ api: transport, config, session, images: retailImages }),
    [transport, config, session],
  )
  const [content, setContent] = useState(() => publicData || null)
  const [contentError, setContentError] = useState(null)
  const [revision, setRevision] = useState(0)
  const [merge, setMerge] = useState(null)
  const identity = auth.user?.role === 'user' && auth.user.store === 'b2c' ? auth.user.id : null
  const [cartState, setCartState] = useState({ identity: null, count: null })
  const cartRevision = useRef(0)
  const refreshCart = useCallback(
    async (cartData) => {
      const request = ++cartRevision.current
      const user = session.getSnapshot().user
      const currentIdentity = user?.role === 'user' && user.store === 'b2c' ? user.id : null
      if (user && !currentIdentity) return
      const owner = user ? `${user.id}:${user.role}:${user.store}` : 'guest'
      try {
        const cart = cartData || (await api.cart(false, { language }))
        const latest = session.getSnapshot().user
        if (
          request === cartRevision.current &&
          (latest ? `${latest.id}:${latest.role}:${latest.store}` : 'guest') === owner
        ) {
          setCartState({
            identity: currentIdentity,
            count: cartItemCount(cart.items),
          })
        }
      } catch {
        const latest = session.getSnapshot().user
        if (
          request === cartRevision.current &&
          (latest ? `${latest.id}:${latest.role}:${latest.store}` : 'guest') === owner
        )
          setCartState({ identity: currentIdentity, count: null })
      }
    },
    [api, session, language],
  )
  useEffect(() => {
    const request = ++cartRevision.current
    if (restoring) return
    let active = true
    const user = auth.user
    if (!user || (user.role === 'user' && user.store === 'b2c'))
      api
        .cart(false, { language })
        .then((cart) => {
          if (active && request === cartRevision.current)
            setCartState({ identity, count: cartItemCount(cart.items) })
        })
        .catch(() => {})
    return () => {
      active = false
    }
  }, [identity, auth.user, api, language, restoring])
  useEffect(() => {
    if (config.mode === 'fixtures') return
    const controller = new AbortController()
    let active = true
    Promise.allSettled([
      api.categories({ language, signal: controller.signal }),
      api.homepage({ language, signal: controller.signal }),
      api.settings({ language, signal: controller.signal }),
    ]).then(([categories, homepage, settings]) => {
      if (!active) return
      setContent({
        language,
        categories: categories.status === 'fulfilled' ? categories.value : [],
        homepage: homepage.status === 'fulfilled' ? homepage.value : null,
        settings: settings.status === 'fulfilled' ? settings.value : null,
      })
      setContentError(
        [categories, homepage, settings].find((result) => result.status === 'rejected')?.reason ||
          null,
      )
    })
    return () => {
      active = false
      controller.abort()
    }
  }, [api, language, config.mode, revision])
  const afterLogin = async (user) => {
    if (user.role !== 'user' || user.store !== 'b2c') return
    try {
      await api.merge()
      if (session.getSnapshot().user?.id === user.id) {
        setMerge(null)
        await refreshCart()
      }
      return true
    } catch (error) {
      if (session.getSnapshot().user?.id === user.id) setMerge({ identity: user.id, error })
      return false
    }
  }
  const fixture = config.mode === 'fixtures'
  const resolved = fixture
    ? {
        language,
        categories: retailCategories(language),
        homepage: retailHomepage(language, retailImages),
        settings: null,
      }
    : content?.language === language
      ? content
      : null
  return (
    <ShopContext.Provider
      value={{
        api,
        cartCount:
          !restoring && (!auth.user || identity) && cartState.identity === identity
            ? cartState.count
            : null,
        refreshCart,
        content: resolved,
        contentError,
        reloadContent: () => setRevision((value) => value + 1),
        publicData,
        merge: merge?.identity === identity ? merge : null,
        afterLogin,
        clearMerge: () => setMerge(null),
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}
// eslint-disable-next-line react/only-export-components
export const useShop = () => useContext(ShopContext)
