import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../../shared/ui/Runtime.jsx'
import { ApiError } from '../../../../shared/lib/api.js'
import { useNotifications } from '../../../../shared/ui/Notifications.jsx'
import { useOrders } from '../orders/OrdersProvider.jsx'
import { useShop } from './ShopProvider.jsx'
import { addCartSelection } from './cart.js'

export function usePurchase(product, chosen, quantity) {
  const { api, refreshCart } = useShop(),
    { notify } = useNotifications(),
    { session, restoring } = useRuntime(),
    { user } = useSession(),
    { controller } = useOrders(),
    language = useLocale(),
    navigate = useNavigate(),
    lock = useRef(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  const disabled =
    busy || restoring || (user && user.role !== 'user') || !chosen || chosen.stock <= 0
  async function purchase(buyNow = false) {
    if (lock.current || disabled) return
    lock.current = true
    setBusy(true)
    setError(null)
    try {
      const checkout = controller.getSnapshot()
      if (buyNow && (checkout.busy || (checkout.pending && !checkout.orderId)))
        throw new ApiError('ORDER_REQUEST_CONFLICT', { status: 409 })
      const cart = await addCartSelection(api, session, product, chosen, Number(quantity), language)
      refreshCart(cart)
      notify(language === 'ar' ? 'تمت إضافة المنتج إلى السلة.' : 'Product added to your cart.')
      if (buyNow) {
        if (!controller.startNew()) throw new ApiError('ORDER_REQUEST_CONFLICT', { status: 409 })
        navigate(`/${language}/checkout`)
      }
      return true
    } catch (reason) {
      setError(reason)
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return { busy, disabled, error, purchase }
}
