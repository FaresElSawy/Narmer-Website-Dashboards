import { useLayoutEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Button, Feedback, Field } from '../../../shared/ui/Primitives.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useSession } from '../../../shared/ui/Runtime.jsx'
import { Brand } from '../../../shared/ui/Brand.jsx'
import { ApiError } from '../../../shared/lib/api.js'
import { useOrders } from '../features/orders/OrdersProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { orderIdValid, statusLabel, trackingTokenValid } from '../features/orders/model.js'
import {
  CheckoutSteps,
  DeliveryDetails,
  OrderAccessHint,
  OrderItems,
  OrderPageHeading,
  OrderStatus,
  OrderSummary,
  OrdersError,
  PaymentDetails,
  ProofViewer,
} from '../features/orders/components.jsx'
import { PrivateTrackingLink } from './OrderReceived.jsx'

export default function OrderDetail({ guest = false, receipt = false }) {
  const { orderId } = useParams(),
    location = useLocation(),
    language = useLocale(),
    ar = language === 'ar'
  const { user } = useSession(),
    { ready, controller, state } = useOrders()
  const access = controller.access(orderId)
  const key = `${location.key}:${orderId}:${guest}`
  useLayoutEffect(() => {
    if (!guest || !ready) return
    controller.visitTracking(key, window.location, window.history, orderId)
  }, [key, orderId, guest, ready, controller, state.owner])
  if (!ready || (guest && state.trackingRoute !== key))
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل الطلب' : 'Loading order'} />
      </div>
    )
  if (guest && (!orderIdValid(orderId) || !access?.token))
    return <TrackingAccess initialId={orderId} />
  if (!guest && !user)
    return (
      <Navigate
        to={`/${language}/account/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  if (!guest && user.role !== 'user')
    return (
      <div className="shop-page">
        <Feedback
          title={
            ar ? 'سجل الطلبات مخصص لحسابات العملاء.' : 'Order history is for customer accounts.'
          }
        />
      </div>
    )
  if (!orderIdValid(orderId))
    return (
      <div className="shop-page">
        <OrdersError error={new ApiError('ORDER_NOT_FOUND', { status: 404 })} />
      </div>
    )
  return (
    <AuthorizedOrder
      key={`${orderId}:${access?.token || user?.id}:${language}`}
      id={orderId}
      token={guest ? access?.token : null}
      receipt={receipt}
      guest={guest}
    />
  )
}
function TrackingAccess({ initialId = '' }) {
  const language = useLocale(),
    ar = language === 'ar',
    { controller } = useOrders(),
    navigate = useNavigate()
  const [id, setId] = useState(initialId || ''),
    [token, setToken] = useState(''),
    [error, setError] = useState(null)
  return (
    <div className="shop-page">
      <OrderPageHeading title={ar ? 'تتبع طلبك' : 'Track your order'}>
        {ar
          ? 'استخدم الرابط الخاص الذي حفظته عند الطلب، أو أدخل معرّف الطلب من الرابط ومفتاح الوصول الخاص. لا يمكن البحث برقم الطلب المعروض.'
          : 'Use your saved private tracking link, or enter the order ID from that link and your private access key. The displayed order number cannot be used for lookup.'}
      </OrderPageHeading>
      <form
        className="order-access-form order-panel"
        onSubmit={(event) => {
          event.preventDefault()
          if (!orderIdValid(id.trim()) || !trackingTokenValid(token.trim())) {
            setError(new ApiError('ORDER_NOT_FOUND', { status: 404 }))
            return
          }
          controller.rememberAccess(id.trim(), token.trim())
          navigate(`/${language}/track/${id.trim()}`)
        }}
      >
        <Field
          label={ar ? 'معرّف الطلب من الرابط الخاص' : 'Order ID from private link'}
          name="orderId"
          required
          maxLength={24}
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="off"
        />
        <Field
          label={ar ? 'مفتاح الوصول الخاص' : 'Private access key'}
          name="trackingToken"
          type="password"
          required
          maxLength={2048}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        <Button type="submit" variant="accent">
          {ar ? 'عرض الطلب' : 'View order'}
        </Button>
        <OrdersError error={error} />
      </form>
      <OrderAccessHint />
    </div>
  )
}
function AuthorizedOrder({ id, token, receipt, guest }) {
  const language = useLocale(),
    ar = language === 'ar',
    { api, state } = useOrders()
  const read = useShopRead(
    (signal) => api.order(id, { token, signal, language }),
    `${id}:${token || 'account'}:${language}`,
    state.orderId === id ? state.receipt : null,
  )
  if (!read.data && read.loading)
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل الطلب' : 'Loading order'} />
      </div>
    )
  if (read.error)
    return (
      <div className="shop-page">
        <OrderPageHeading title={ar ? 'الطلب غير متاح' : 'Order unavailable'} />
        <OrdersError error={read.error} retry={read.reload} />
        {guest && (
          <Button variant="secondary" to={`/${language}/track`}>
            {ar ? 'استخدام مفتاح وصول آخر' : 'Use another access key'}
          </Button>
        )}
        <OrderAccessHint />
      </div>
    )
  const order = read.data
  if (!order) return null
  const base = `/${language}/${guest ? 'track' : 'orders'}/${id}`
  const date = new Date(order.createdAt).toLocaleString(ar ? 'ar-EG' : 'en-GB', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return (
    <div className={`shop-page order-page${receipt ? ' receipt-page' : ''}`}>
      <div className="order-page-header no-print">
        <OrderPageHeading
          title={
            receipt
              ? ar
                ? 'إيصال طلبك'
                : 'Your order receipt'
              : ar
                ? 'تفاصيل طلبك'
                : 'Your order details'
          }
        >
          {receipt
            ? ar
              ? 'تم استلام طلبك. احتفظ بهذه النسخة لسجلاتك.'
              : 'Your order is received. Keep this copy for your records.'
            : date}
        </OrderPageHeading>
        {receipt && (
          <Button variant="secondary" onClick={() => window.print()}>
            {ar ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
          </Button>
        )}
      </div>
      {receipt && (
        <div className="no-print">
          <CheckoutSteps step={3} />
        </div>
      )}
      <article className={receipt ? 'order-receipt' : 'order-record'}>
        {receipt && (
          <div className="receipt-masthead">
            <Brand />
            <div>
              <p>{ar ? 'مصنع نارمر للملابس' : 'NARMER CLOTHING FACTORY'}</p>
              <h1>{ar ? 'إيصال الطلب' : 'Order receipt'}</h1>
              <span>
                {ar ? 'ملابس لكل يوم. من صنع نارمر.' : 'Everyday clothing. Made by Narmer.'}
              </span>
            </div>
          </div>
        )}
        <header className="order-record-heading">
          <div>
            <p className="eyebrow">{ar ? 'نارمر / إيصال الطلب' : 'NARMER / ORDER RECEIPT'}</p>
            <h2>{ar ? 'مرجع الطلب' : 'Order reference'}</h2>
            <p className="order-reference">
              <bdi>{order.orderNumber ?? order.id}</bdi>
            </p>
            <p className="order-help">
              <time dateTime={order.createdAt}>{date}</time>
            </p>
          </div>
          <strong className="order-status-badge">{statusLabel(order.status, language)}</strong>
        </header>
        <div className="order-details-grid">
          <section>
            <h2>{ar ? 'بيانات التوصيل' : 'Delivery details'}</h2>
            <DeliveryDetails customer={order.customer} address={order.address} />
          </section>
          <section>
            <PaymentDetails order={order} />
            <ProofViewer key={`${id}:${language}`} order={order} token={token} />
          </section>
        </div>
        <div className={receipt ? 'receipt-body' : 'checkout-columns'}>
          <div>
            <OrderItems order={order} images={!receipt} />
            {!receipt && <OrderStatus order={order} />}
          </div>
          <OrderSummary quote={order} />
        </div>
        <p className="order-help receipt-disclaimer">
          {receipt && (
            <strong className="receipt-thanks">
              {ar ? 'شكرًا لاختيارك نارمر.' : 'Thank you for choosing Narmer.'}
            </strong>
          )}
          {ar
            ? 'إيصال باستلام الطلب، وليس فاتورة ضريبية. جميع المبالغ بالجنيه المصري.'
            : 'Order acknowledgement, not a tax invoice. All amounts are in Egyptian pounds.'}
        </p>
      </article>
      <div className="order-actions no-print">
        <Button variant="accent" to={receipt ? base : `${base}/receipt`}>
          {receipt ? (ar ? 'تتبع طلبك' : 'Track your order') : ar ? 'عرض الإيصال' : 'View receipt'}
        </Button>
        <Button variant="secondary" to={`/${language}/products`}>
          {ar ? 'متابعة التسوق' : 'Continue shopping'}
        </Button>
      </div>
      {guest && <PrivateTrackingLink orderId={id} />}
    </div>
  )
}
