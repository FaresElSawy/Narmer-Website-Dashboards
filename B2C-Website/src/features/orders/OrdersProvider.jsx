import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { useShop } from '../shop/ShopProvider.jsx'
import { createOrdersApi } from './api.js'
import { createCheckoutState } from './state.js'

const OrdersContext = createContext(null)
export function OrdersProvider({ children }) {
  const { config, api: transport, session, restoring } = useRuntime()
  const { api: retail } = useShop()
  const api = useMemo(
    () => createOrdersApi({ config, api: transport, session, retail }),
    [config, transport, session, retail],
  )
  const [controller] = useState(() => {
    let storage = null
    try {
      storage = globalThis.sessionStorage || null
    } catch {
      /* Checkout remains usable in memory. */
    }
    return createCheckoutState({ api, session, storage })
  })
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
  useEffect(() => {
    if (restoring) return
    controller.restore()
    return controller.connect()
  }, [controller, restoring])
  return (
    <OrdersContext.Provider value={{ api, controller, state, ready: state.ready && !restoring }}>
      {children}
    </OrdersContext.Provider>
  )
}
// eslint-disable-next-line react/only-export-components
export const useOrders = () => useContext(OrdersContext)
