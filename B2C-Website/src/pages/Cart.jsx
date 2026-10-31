import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../shared/ui/Runtime.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../shared/ui/Brand.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { config } from '../app/config.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { CatalogImage, Quantity, ShopError, ShopHeading } from '../features/shop/components.jsx'
import { cartLineKey, orderedCartItems } from '../features/shop/cart.js'
import { useOrders } from '../features/orders/OrdersProvider.jsx'
import { useNotifications } from '../../../shared/ui/Notifications.jsx'

export default function Cart() {
  const language = useLocale(),
    ar = language === 'ar',
    { user } = useSession(),
    { restoring } = useRuntime()
  return (
    <div className="shop-page cart-page">
      <Metadata
        config={config}
        title={`${ar ? 'سلة التسوق' : 'Your shopping cart'} | Narmer`}
        description=""
        path="/cart"
      />
      <ShopHeading title={ar ? 'سلة التسوق' : 'Your shopping cart'}>
        {ar ? 'راجع اختياراتك قبل إتمام الطلب.' : 'Review your selection before checkout.'}
      </ShopHeading>
      {restoring ? (
        <Feedback kind="loading" title={ar ? 'جارٍ تحميل السلة' : 'Loading cart'} />
      ) : user && user.role !== 'user' ? (
        <Feedback
          title={
            ar
              ? 'السلة متاحة للزوار وحسابات العملاء.'
              : 'Cart is available to guests and customer accounts.'
          }
        />
      ) : (
        <CartContents key={`${user?.id || 'guest'}:${language}`} />
      )}
    </div>
  )
}
function CartContents() {
  const { controller } = useOrders()
  const language = useLocale(),
    ar = language === 'ar',
    auth = useSession(),
    { session } = useRuntime(),
    { api, merge, afterLogin, clearMerge, refreshCart } = useShop(),
    { notify } = useNotifications()
  const [guest, setGuest] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [order, setOrder] = useState({ account: [], guest: [] })
  const mutation = useRef(false)
  const state = useShopRead(
    (signal) => api.cart(guest, { language, signal }),
    `${language}:${guest}`,
  )
  async function update(line, quantity) {
    if (mutation.current) return
    mutation.current = true
    setBusy(true)
    setError(null)
    try {
      const data = await api.setQuantity(
        { productId: line.productId, variantId: line.variantId, quantity },
        guest,
        { language },
      )
      state.replace(data)
      await refreshCart(guest && auth.user ? undefined : data)
      notify(ar ? 'تم تحديث سلتك.' : 'Your cart was updated.')
      return true
    } catch (reason) {
      setError(reason)
      if (reason.status !== 429) state.reload()
      return false
    } finally {
      mutation.current = false
      setBusy(false)
    }
  }
  async function retryMerge() {
    if (mutation.current) return
    mutation.current = true
    setBusy(true)
    setError(null)
    try {
      const guestCart = await api.cart(true, { language })
      if (session.getSnapshot().user?.id !== auth.user?.id) return
      if (!guestCart.items.length) {
        clearMerge()
        setGuest(false)
      } else if (await afterLogin(auth.user)) {
        notify(
          ar
            ? 'أُضيفت اختياراتك المحفوظة إلى سلتك.'
            : 'Your saved items have been added to your cart.',
        )
        setGuest(false)
      }
      state.reload()
    } catch (reason) {
      setError(reason)
    } finally {
      mutation.current = false
      setBusy(false)
    }
  }
  const data = state.data
  const view = guest ? 'guest' : 'account'
  const items = data ? orderedCartItems(data.items, order[view]) : []
  const nextOrder = items.map(cartLineKey)
  if (
    data &&
    (nextOrder.length !== order[view].length ||
      nextOrder.some((key, index) => key !== order[view][index]))
  ) {
    setOrder({ ...order, [view]: nextOrder })
  }
  return (
    <>
      {auth.user?.role === 'user' && merge && (
        <div className="cart-merge">
          <p>
            {ar
              ? 'تعذر إضافة بعض الاختيارات المحفوظة قبل تسجيل الدخول. اختياراتك محفوظة؛ راجعها وحاول مجددًا.'
              : 'Some items saved before sign-in could not be added. Your items are safe; review them and try again.'}
          </p>
          <div className="cart-merge-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setGuest(!guest)}>
              {guest
                ? ar
                  ? 'العودة إلى سلتك'
                  : 'Back to your cart'
                : ar
                  ? 'مراجعة الاختيارات المحفوظة'
                  : 'Review saved items'}
            </Button>
            <Button variant="secondary" onClick={retryMerge} disabled={busy}>
              {busy
                ? ar
                  ? 'جارٍ تحديث السلة...'
                  : 'Updating your cart...'
                : ar
                  ? 'حاول مرة أخرى'
                  : 'Try again'}
            </Button>
          </div>
          <ShopError error={merge.error} />
        </div>
      )}
      {error && <ShopError error={error} />}
      {state.error ? (
        <ShopError error={state.error} retry={state.reload} />
      ) : !data ? (
        <Feedback kind="loading" title={ar ? 'جارٍ تحميل السلة' : 'Loading cart'} />
      ) : !data.items.length ? (
        <Feedback
          title={ar ? 'سلتك فارغة.' : 'Your cart is empty.'}
          action={
            <Button variant="accent" to={`/${language}/products`}>
              {ar ? 'اكتشف المنتجات' : 'Explore products'}
            </Button>
          }
        />
      ) : (
        <div className="cart-layout" aria-busy={busy || state.loading}>
          <div className="cart-items">
            {items.map((line) => (
              <CartLine
                key={`${line.productId}:${line.variantId}`}
                line={line}
                disabled={busy || state.loading}
                update={update}
              />
            ))}
            <Button variant="secondary" to={`/${language}/products`}>
              {ar ? 'متابعة التسوق' : 'Continue shopping'}
            </Button>
          </div>
          <aside className="cart-summary">
            <h2>{ar ? 'ملخص الطلب' : 'Order summary'}</h2>
            {items.map((line) => (
              <p key={`${line.productId}:${line.variantId}`}>
                {line.name || (ar ? 'منتج غير متاح' : 'Unavailable product')} × {line.quantity}
              </p>
            ))}
            <dl>
              <div>
                <dt>{ar ? 'القطع' : 'Items'}</dt>
                <dd>{data.itemCount}</dd>
              </div>
              <div>
                <dt>{ar ? 'الإجمالي الفرعي' : 'Subtotal'}</dt>
                <dd>
                  <bdi>{formatMoney(data.subtotal, language)}</bdi>
                </dd>
              </div>
            </dl>
            {!data.canCheckout && (
              <p className="field-error">
                {ar
                  ? 'راجع المنتجات غير المتاحة والكميات قبل المتابعة.'
                  : 'Review unavailable products and quantities before continuing.'}
              </p>
            )}
            <p>
              {ar
                ? 'يتم تأكيد الشحن والخصومات عند إتمام الطلب.'
                : 'Shipping and coupon discounts are confirmed at checkout.'}
            </p>
            <Button
              variant="accent"
              disabled={busy || !data.canCheckout || (guest && !!auth.user)}
              to={
                !busy && data.canCheckout && !(guest && auth.user)
                  ? `/${language}/checkout`
                  : undefined
              }
              onClick={() => controller.startNew()}
            >
              {ar ? 'المتابعة لإتمام الطلب' : 'Continue to checkout'}
            </Button>
            {guest && auth.user && (
              <p className="order-help">
                {ar
                  ? 'راجع اختياراتك المحفوظة وحاول مجددًا قبل إتمام الطلب.'
                  : 'Review your saved items and try again before checkout.'}
              </p>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
function CartLine({ line, update, disabled }) {
  const language = useLocale(),
    ar = language === 'ar',
    { api } = useShop(),
    [quantity, setQuantity] = useState(null),
    [quantityError, setQuantityError] = useState('')
  const max = Math.min(10000, Math.max(1, line.stock ?? 10000))
  async function commit(value) {
    if (disabled) return
    const next = Number(value)
    if (value === '' || !Number.isSafeInteger(next) || next < 1 || next > max) {
      setQuantityError(
        ar ? `أدخل عددًا صحيحًا من 1 إلى ${max}.` : `Enter a whole number from 1 to ${max}.`,
      )
      return
    }
    setQuantityError('')
    if (next === line.quantity) {
      setQuantity(null)
      return
    }
    const saved = await update(line, next)
    if (saved !== undefined) setQuantity(null)
  }
  const detail = useShopRead(
    (signal) =>
      line.values && line.status !== 'unavailable'
        ? api.product(line.productId, { language, signal })
        : Promise.resolve(null),
    `${language}:${line.productId}:${line.status}`,
  )
  const selectedLabels = detail.data?.options
    ?.map((option) => option.values.find((value) => value.key === line.values?.[option.key])?.name)
    .filter(Boolean)
  return (
    <article className="cart-line">
      <div className="cart-line-image">
        <CatalogImage image={line.images[0]} alt={line.name || ''} />
      </div>
      <div className="cart-line-copy">
        <h2>
          {line.slug ? (
            <Link to={`/${language}/products/${line.slug}`} state={{ productId: line.productId }}>
              {line.name}
            </Link>
          ) : ar ? (
            'منتج غير متاح'
          ) : (
            'Unavailable product'
          )}
        </h2>
        <div className="cart-line-meta">
          {line.values && (
            <p>
              {selectedLabels?.length
                ? selectedLabels.join(' · ')
                : ar
                  ? 'الخيار المحدد'
                  : 'Selected variant'}
            </p>
          )}
          <p>
            <bdi>{formatMoney(line.unitPrice, language)}</bdi> {ar ? 'للقطعة' : 'each'}
          </p>
        </div>
        {line.status !== 'available' && (
          <p className="field-error">
            {line.status === 'insufficient_stock'
              ? ar
                ? `المتاح الآن: ${line.stock}`
                : `Available now: ${line.stock}`
              : ar
                ? 'هذا المنتج لم يعد متاحًا. يمكنك إزالته.'
                : 'This selection is no longer available. You can remove it.'}
          </p>
        )}
        <div className="cart-line-footer">
          <Quantity
            value={quantity ?? line.quantity}
            onChange={(value) => {
              setQuantity(value)
              setQuantityError('')
            }}
            onCommit={commit}
            error={quantityError}
            max={max}
            disabled={disabled || line.status === 'unavailable'}
          />
          <p className="cart-line-total">
            <bdi>{formatMoney(line.lineTotal, language)}</bdi>
          </p>
        </div>
      </div>
      <Button
        className="cart-line-remove"
        variant="secondary"
        aria-label={ar ? 'إزالة المنتج' : 'Remove item'}
        title={ar ? 'إزالة المنتج' : 'Remove item'}
        onClick={() => update(line, 0)}
        disabled={disabled}
      >
        <Icon name="trash" />
      </Button>
    </article>
  )
}
