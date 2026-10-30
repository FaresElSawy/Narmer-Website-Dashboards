import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { Button, Feedback } from '../../../../shared/ui/Primitives.jsx'
import { Metadata } from '../../../../shared/ui/Metadata.jsx'
import { formatMoney } from '../../../../shared/lib/money.js'
import { errorMessage } from '../../../../shared/lib/messages.js'
import { config } from '../../app/config.js'
import { CatalogImage, ShopHeading } from '../shop/components.jsx'
import { useShop } from '../shop/ShopProvider.jsx'
import { useShopRead } from '../shop/useShopRead.js'
import { statusLabel } from './model.js'
import { useOrders } from './OrdersProvider.jsx'

const copies = {
  COUPON_UNAVAILABLE: [
    'This promo code is unavailable. Remove it or use another code.',
    'كود الخصم غير متاح. احذفه أو استخدم كودًا آخر.',
  ],
  COUPON_PERSON_LIMIT_REACHED: [
    'This checkout phone has reached the promo code limit.',
    'وصل رقم هاتف الطلب إلى الحد المسموح لاستخدام كود الخصم.',
  ],
  COUPON_NO_ELIGIBLE_ITEMS: [
    'This code does not apply to the current eligible products.',
    'هذا الكود لا ينطبق على المنتجات المؤهلة في السلة الحالية.',
  ],
  COUPON_MINIMUM_SPEND: [
    'The eligible products do not meet this code’s minimum spend. Delivery and excluded items do not count.',
    'المنتجات المؤهلة لا تحقق الحد الأدنى لهذا الكود. لا تُحتسب رسوم التوصيل أو المنتجات المستثناة.',
  ],
  CART_COUPON_UNAVAILABLE: [
    'Review the unavailable items or quantities in your cart before applying a code.',
    'راجع المنتجات غير المتاحة أو الكميات في السلة قبل تطبيق الكود.',
  ],
  CHECKOUT_UNAVAILABLE: [
    'This checkout has expired or is unavailable. Review your cart and request a fresh quote.',
    'انتهت صلاحية إتمام الطلب أو لم يعد متاحًا. راجع السلة واطلب عرضًا جديدًا.',
  ],
  CHECKOUT_CART_CHANGED: [
    'Your cart changed. Review its selections before requesting a fresh quote.',
    'تغيرت السلة. راجع اختياراتك قبل طلب عرض جديد.',
  ],
  ORDER_CART_UNAVAILABLE: [
    'Some cart selections are no longer available. Review your cart.',
    'بعض اختيارات السلة لم تعد متاحة. راجع السلة.',
  ],
  ORDER_STOCK_UNAVAILABLE: [
    'Stock changed. Review your cart quantities before continuing.',
    'تغير المخزون. راجع الكميات في السلة قبل المتابعة.',
  ],
  ORDER_REQUEST_CONFLICT: [
    'This checkout needs reconciliation. Keep the original request and retry; do not place a new order.',
    'تحتاج نتيجة الطلب إلى التحقق. احتفظ بالطلب الأصلي وأعد المحاولة دون إنشاء طلب جديد.',
  ],
  ORDER_PROOF_CONFLICT: [
    'The screenshot cannot be attached to this checkout. Review the checkout and upload details.',
    'لا يمكن ربط الصورة بهذا الطلب. راجع تفاصيل الطلب والرفع.',
  ],
  ORDER_NOT_FOUND: [
    'This order is unavailable. Check the reference and private access key, or sign in to the account that placed it.',
    'الطلب غير متاح. راجع المرجع ومفتاح الوصول الخاص أو سجّل الدخول إلى الحساب الذي أرسل الطلب.',
  ],
  ORDER_PROOF_NOT_FOUND: ['The payment screenshot is unavailable.', 'صورة التحويل غير متاحة.'],
  INSTAPAY_NOT_CONFIGURED: [
    'InstaPay is temporarily unavailable. You can return to details and choose cash on delivery.',
    'إنستاباي غير متاح حاليًا. يمكنك العودة للتفاصيل واختيار الدفع عند الاستلام.',
  ],
  SHIPPING_NOT_CONFIGURED: [
    'Delivery pricing is temporarily unavailable. Your order has not been placed.',
    'أسعار التوصيل غير متاحة حاليًا. لم يتم إرسال الطلب.',
  ],
  PROOF_STORAGE_UNAVAILABLE: [
    'Private screenshot storage is temporarily unavailable. Your order has not been confirmed.',
    'حفظ صورة التحويل الخاصة غير متاح حاليًا. لم يتم تأكيد الطلب.',
  ],
  INVALID_ORDER: [
    'Check the required delivery and contact details and your payment choice.',
    'راجع بيانات التواصل والتوصيل المطلوبة وطريقة الدفع.',
  ],
  CHECKOUT_IDENTITY_CHANGED: [
    'The signed-in account changed. Return to the cart and review your selections.',
    'تغير الحساب المستخدم. عد إلى السلة وراجع اختياراتك.',
  ],
  BODY_TOO_LARGE: [
    'Choose a non-empty image of up to 5 MiB.',
    'اختر صورة غير فارغة بحجم أقصاه 5 ميبيبايت.',
  ],
  IMAGE_TYPE_UNSUPPORTED: ['Choose a JPEG, PNG or WebP image.', 'اختر صورة JPEG أو PNG أو WebP.'],
  INVALID_IMAGE: [
    'Choose a valid still image, up to 5 MiB and 20 million pixels.',
    'اختر صورة ثابتة صالحة، حتى 5 ميبيبايت و20 مليون بكسل.',
  ],
}
export function OrdersError({ error, retry }) {
  const language = useLocale(),
    ar = language === 'ar'
  if (!error) return null
  const title = copies[error.code]?.[ar ? 1 : 0] || errorMessage(error, language)
  return (
    <div className="order-error" role="alert">
      <p>{title}</p>
      {error.status === 429 && (
        <p>
          {ar
            ? `انتظر ${error.retryAfter ?? 30} ثانية قبل المحاولة مجددًا.`
            : `Wait ${error.retryAfter ?? 30} seconds before trying again.`}
        </p>
      )}
      {error.errors?.length > 0 && (
        <ul>
          {error.errors.map((item, i) => (
            <li key={i}>{item.message || item.field || item.path}</li>
          ))}
        </ul>
      )}
      {error.requestId && (
        <small>
          {ar ? 'مرجع الدعم: ' : 'Support reference: '}
          <bdi>{error.requestId}</bdi>
        </small>
      )}
      {retry && (
        <Button variant="secondary" onClick={retry}>
          {ar ? 'المحاولة مجددًا' : 'Try again'}
        </Button>
      )}
    </div>
  )
}
export function OrderPageHeading({ title, children, step }) {
  return (
    <>
      <Metadata config={config} title={`${title} | Narmer`} description="" />
      <ShopHeading title={title}>{children}</ShopHeading>
      {step && <CheckoutSteps step={step} />}
    </>
  )
}
export function CheckoutSteps({ step }) {
  const ar = useLocale() === 'ar'
  return (
    <ol className="checkout-steps" aria-label={ar ? 'خطوات إتمام الطلب' : 'Checkout steps'}>
      {(ar ? ['التفاصيل', 'المراجعة', 'الإيصال'] : ['Details', 'Review', 'Receipt']).map(
        (label, i) => (
          <li key={label} aria-current={i + 1 === step ? 'step' : undefined}>
            <span>{i + 1}.</span> {label}
          </li>
        ),
      )}
    </ol>
  )
}
export function OrderSummary({ quote, cart, shipping, coupon }) {
  const language = useLocale(),
    ar = language === 'ar'
  const items = quote?.items || cart?.items || []
  const totals = quote?.totals || {
    subtotal: cart?.subtotal ?? null,
    discountAmount: coupon?.discountAmount ?? 0,
    shippingFee: shipping?.fee ?? null,
    total: null,
  }
  return (
    <section className="order-summary order-panel" aria-label={ar ? 'ملخص الطلب' : 'Order summary'}>
      <h2>{ar ? 'ملخص الطلب' : 'Order summary'}</h2>
      <ul>
        {items.map((item) => (
          <li key={`${item.productId}:${item.variantId}`}>
            <span>
              {item.name || (ar ? 'منتج غير متاح' : 'Unavailable product')} × {item.quantity}
            </span>
          </li>
        ))}
      </ul>
      <dl>
        {[
          [ar ? 'المنتجات' : 'Items', totals.subtotal],
          [
            quote?.coupon?.code || coupon?.coupon?.code || (ar ? 'الخصم' : 'Discount'),
            totals.discountAmount,
          ],
          [ar ? 'التوصيل' : 'Delivery', totals.shippingFee],
          [ar ? 'الإجمالي' : 'Total', totals.total],
        ].map(([label, amount], i) => (
          <div key={i} className={i === 3 ? 'order-total' : ''}>
            <dt>{label}</dt>
            <dd>
              {amount == null
                ? ar
                  ? 'يُؤكد عند المراجعة'
                  : 'Confirmed at review'
                : `${i === 1 && amount ? '- ' : ''}${formatMoney(amount, language)}`}
            </dd>
          </div>
        ))}
      </dl>
      {!quote && (
        <p className="order-help">
          {ar
            ? 'يتم حساب الإجمالي النهائي من الخادم عند مراجعة الطلب.'
            : 'Your complete quote is calculated by the server when you review the order.'}
        </p>
      )}
    </section>
  )
}
export function DeliveryDetails({ customer, address }) {
  const ar = useLocale() === 'ar'
  return (
    <div className="order-delivery">
      <strong>{customer.name}</strong>
      <p>
        {[address.building, address.street, address.district, address.governorate]
          .filter(Boolean)
          .join(ar ? '، ' : ', ')}
      </p>
      {(address.floor || address.apartment) && (
        <p>
          {ar ? 'الطابق / الشقة: ' : 'Floor / apartment: '}
          {[address.floor, address.apartment].filter(Boolean).join(' / ')}
        </p>
      )}
      {address.details && <p>{address.details}</p>}
      <p>
        <bdi>{customer.email}</bdi>
      </p>
      <p>
        <bdi>{customer.phone}</bdi>
      </p>
    </div>
  )
}
export function PaymentDetails({ order }) {
  const ar = useLocale() === 'ar',
    payment = order.payment
  return (
    <div className="order-payment">
      <h2>{ar ? 'تفاصيل الدفع' : 'Payment details'}</h2>
      <p>
        {payment.method === 'cod' ? (ar ? 'الدفع عند الاستلام' : 'Cash on delivery') : 'InstaPay'}
      </p>
      {payment.receivingAccount && (
        <p>
          <bdi>{payment.receivingAccount}</bdi>
        </p>
      )}
      <p>
        {payment.method === 'instapay'
          ? payment.verifiedAt
            ? ar
              ? 'راجع الفريق التحويل وقبله.'
              : 'The team has reviewed and accepted the transfer.'
            : ar
              ? 'بانتظار المراجعة اليدوية للتحويل.'
              : 'Awaiting manual transfer review.'
          : payment.cashCollectedAt
            ? ar
              ? 'تم تسجيل تحصيل المبلغ.'
              : 'Cash collection has been recorded.'
            : ar
              ? 'لم يتم تسجيل تحصيل المبلغ بعد.'
              : 'Cash collection has not been recorded yet.'}
      </p>
      <p className="order-help">
        {ar
          ? 'هذا إيصال باستلام الطلب، وليس تأكيدًا بنكيًا أو فاتورة ضريبية.'
          : 'This receipt acknowledges your order. It is not a bank payment confirmation or a tax invoice.'}
      </p>
    </div>
  )
}
export function OrderItems({ order, images = false }) {
  const language = useLocale(),
    ar = language === 'ar'
  return (
    <section className="order-items">
      <h2>{ar ? 'المنتجات المطلوبة' : 'Items ordered'}</h2>
      <div className="receipt-item-head" aria-hidden="true">
        <span>{ar ? 'المنتج' : 'Product'}</span>
        <div>
          <span>{ar ? 'الكمية' : 'Quantity'}</span>
          <span>{ar ? 'سعر القطعة' : 'Unit price'}</span>
          <span>{ar ? 'الإجمالي' : 'Amount'}</span>
        </div>
      </div>
      <div className="order-item-list">
        {order.items.map((item) => (
          <article className="order-item" key={`${item.productId}:${item.variantId}`}>
            {images && <CurrentOrderImage item={item} />}
            <div>
              <h3>{item.name}</h3>
              {item.values && <p>{Object.values(item.values).join(' · ')}</p>}
              <dl>
                <div>
                  <dt>{ar ? 'الكمية' : 'Quantity'}</dt>
                  <dd>{item.quantity}</dd>
                </div>
                <div>
                  <dt>{ar ? 'سعر القطعة' : 'Unit price'}</dt>
                  <dd>{formatMoney(item.unitPrice, language)}</dd>
                </div>
                <div>
                  <dt>{ar ? 'إجمالي السطر' : 'Line total'}</dt>
                  <dd>{formatMoney(item.lineTotal, language)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
function CurrentOrderImage({ item }) {
  const { api } = useShop(),
    language = useLocale()
  const read = useShopRead(
    (signal) => api.product(item.productId, { signal, language }),
    `${item.productId}:${language}`,
  )
  const product = read.data,
    variant = product?.variants?.find((v) => v.id === item.variantId)
  return (
    <div className="order-current-image">
      <CatalogImage
        image={(variant?.images?.length ? variant.images : product?.images || [])[0]}
        alt={item.name}
      />
    </div>
  )
}
export function ProofViewer({ order, token }) {
  const { api } = useOrders(),
    language = useLocale(),
    ar = language === 'ar'
  const [open, setOpen] = useState(false),
    [state, setState] = useState({ url: null, error: null })
  useEffect(() => {
    if (!open) return
    let active = true,
      url
    const controller = new AbortController()
    api
      .proof(order.id, { token, language, signal: controller.signal })
      .then((blob) => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setState({ url, error: null })
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setState({ url: null, error })
      })
    return () => {
      active = false
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [open, order.id, token, language, api])
  if (!order.payment.hasProof) return null
  return (
    <div className="order-proof no-print">
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(!open)
          setState({ url: null, error: null })
        }}
      >
        {open
          ? ar
            ? 'إخفاء صورة التحويل'
            : 'Hide payment screenshot'
          : ar
            ? 'عرض صورة التحويل الخاصة'
            : 'View private payment screenshot'}
      </Button>
      {open &&
        (state.error ? (
          <OrdersError error={state.error} />
        ) : state.url ? (
          <img
            src={state.url}
            alt={
              ar ? 'صورة التحويل الخاصة بهذا الطلب' : 'Private payment screenshot for this order'
            }
          />
        ) : (
          <Feedback kind="loading" title={ar ? 'تحميل الصورة الخاصة' : 'Loading private image'} />
        ))}
    </div>
  )
}
export function OrderStatus({ order }) {
  const language = useLocale(),
    ar = language === 'ar'
  return (
    <section className="order-status">
      <h2>{statusLabel(order.status, language)}</h2>
      <ol>
        {order.history.map((entry, i) => (
          <li key={i}>
            <span>{statusLabel(entry.status, language)}</span>
            <time dateTime={entry.at}>
              {new Date(entry.at).toLocaleString(ar ? 'ar-EG' : 'en-GB', {
                timeZone: 'Africa/Cairo',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>
          </li>
        ))}
      </ol>
      {order.refund && (
        <p className="order-note">
          {ar ? 'تم تسجيل مبلغ مسترد للمراجعة: ' : 'Recorded refund amount for follow-up: '}
          {formatMoney(order.refund.amount, language)}.{' '}
          {ar
            ? 'هذا السجل لا يؤكد تنفيذ تحويل مالي. تواصل مع الفريق للتأكيد.'
            : 'This record does not confirm a money transfer. Contact the team for confirmation.'}
        </p>
      )}
    </section>
  )
}
export function OrderAccessHint() {
  const language = useLocale(),
    ar = language === 'ar'
  return (
    <p className="order-note">
      {ar
        ? 'طلبات الزائر منفصلة عن سجل الحساب. استخدم رابط التتبع الخاص الذي حفظته عند الطلب.'
        : 'Guest orders remain separate from account history. Use the private tracking link saved when you placed the order.'}{' '}
      <Link to={`/${language}/orders`}>{ar ? 'طلبات الحساب' : 'Account orders'}</Link>
    </p>
  )
}
