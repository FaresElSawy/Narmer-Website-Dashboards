import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useSession } from '../../../shared/ui/Runtime.jsx'
import { Button, Feedback, Field } from '../../../shared/ui/Primitives.jsx'
import { useOrders } from '../features/orders/OrdersProvider.jsx'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { orderIdValid } from '../features/orders/model.js'
import {
  CheckoutSteps,
  OrderPageHeading,
  OrdersError,
  OrderSummary,
} from '../features/orders/components.jsx'

export function PrivateTrackingLink({ orderId }) {
  const language = useLocale(),
    ar = language === 'ar',
    { controller } = useOrders()
  const access = controller.access(orderId),
    [link, setLink] = useState(''),
    [notice, setNotice] = useState('')
  if (!access) return null
  return (
    <div className="order-private-link no-print">
      <h3>{ar ? 'احتفظ برابط التتبع الخاص' : 'Keep your private tracking link'}</h3>
      <p>
        {ar
          ? 'أي شخص لديه هذا الرابط يستطيع عرض الطلب وصورة التحويل الخاصة به. احفظه في مكان آمن.'
          : 'Anyone with this link can view the order and its payment screenshot. Keep it somewhere safe.'}
      </p>
      {access.expiresAt && (
        <p>
          {ar ? 'متاح حتى: ' : 'Available until: '}
          {new Date(access.expiresAt).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', {
            timeZone: 'Africa/Cairo',
          })}
        </p>
      )}
      <Button
        variant="secondary"
        onClick={async () => {
          const value = `${window.location.origin}/${language}/track/${orderId}#token=${encodeURIComponent(access.token)}`
          setLink(value)
          try {
            await navigator.clipboard.writeText(value)
            setNotice(ar ? 'تم نسخ الرابط الخاص.' : 'Private link copied.')
          } catch {
            setNotice(
              ar
                ? 'حدد الرابط أدناه وانسخه للاحتفاظ به.'
                : 'Select and copy the link below to keep it.',
            )
          }
        }}
      >
        {ar ? 'نسخ رابط التتبع الخاص' : 'Copy private tracking link'}
      </Button>
      {link && (
        <Field
          label={ar ? 'رابط التتبع الخاص' : 'Private tracking link'}
          value={link}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      )}
      {notice && <p role="status">{notice}</p>}
    </div>
  )
}
export default function OrderReceived() {
  const language = useLocale(),
    ar = language === 'ar',
    { orderId } = useParams(),
    { user } = useSession()
  const { ready, api, state, controller } = useOrders(),
    { refreshCart } = useShop()
  const access = controller.access(orderId)
  const initial = state.orderId === orderId ? state.receipt : null
  const read = useShopRead(
    (signal) =>
      ready && orderIdValid(orderId) && (access || user?.role === 'user')
        ? api.order(orderId, { token: access?.token, signal, language })
        : Promise.resolve(null),
    `${ready}:${orderId}:${language}:${user?.id || 'guest'}`,
    initial,
  )
  const receivedId = read.data?.id
  useEffect(() => {
    if (ready && receivedId) refreshCart()
  }, [ready, receivedId, refreshCart])
  if (!ready || (!read.data && read.loading))
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل تأكيد الطلب' : 'Loading order confirmation'} />
      </div>
    )
  if (read.error)
    return (
      <div className="shop-page">
        <OrdersError error={read.error} retry={read.reload} />
      </div>
    )
  const order = read.data
  if (!order)
    return (
      <div className="shop-page">
        <Feedback
          title={
            ar
              ? 'تفاصيل الطلب غير متاحة في هذا التبويب.'
              : 'Order details are unavailable in this tab.'
          }
          action={
            <Button to={`/${language}/track`}>{ar ? 'تتبع الطلب' : 'Track your order'}</Button>
          }
        />
      </div>
    )
  const base = `/${language}/${access ? 'track' : 'orders'}/${order.id}`
  return (
    <div className="shop-page order-received">
      <OrderPageHeading title={ar ? 'تم استلام الطلب' : 'Order received'} />
      <CheckoutSteps step={3} />
      <section className="order-acknowledgement order-note">
        <p className="eyebrow">{ar ? 'تم استلام الطلب' : 'ORDER RECEIVED'}</p>
        <h2>{ar ? 'شكرًا لتسوقك مع نارمر.' : 'Thank you for shopping with Narmer.'}</h2>
        <p>{ar ? 'طلبك بانتظار مراجعة الفريق.' : 'Your order is pending review.'}</p>
        <p>
          {order.payment.method === 'instapay'
            ? ar
              ? 'تم استلام الطلب، وليس تأكيدًا بوصول التحويل البنكي.'
              : 'We received your order. This is not a bank payment confirmation.'
            : ar
              ? 'سيتم الدفع عند الاستلام. لم يتم تحصيل أي مبلغ عبر الموقع.'
              : 'Payment is due on delivery. No money has been collected online.'}
        </p>
        <p className="order-reference">
          {ar ? 'مرجع الطلب: ' : 'Order reference: '}
          <bdi>{order.orderNumber ?? order.id}</bdi>
        </p>
        <Button variant="accent" to={`${base}/receipt`}>
          {ar ? 'عرض إيصال الطلب' : 'View order receipt'}
        </Button>
        {access ? (
          <PrivateTrackingLink orderId={order.id} />
        ) : (
          <p>
            {ar
              ? 'يمكنك متابعة هذا الطلب من سجل طلبات حسابك.'
              : 'You can follow this order from your account order history.'}
          </p>
        )}
        <Button variant="secondary" to={`/${language}/products`}>
          {ar ? 'متابعة التسوق' : 'Continue shopping'}
        </Button>
      </section>
      <div className="order-received-summary">
        <OrderSummary quote={order} />
      </div>
    </div>
  )
}
