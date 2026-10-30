import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Button, Feedback, Field } from '../../../shared/ui/Primitives.jsx'
import { SelectField } from '../../../shared/ui/SelectField.jsx'
import { FileField } from '../../../shared/ui/FileField.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../shared/ui/Runtime.jsx'
import { ApiError } from '../../../shared/lib/api.js'
import { formatMoney } from '../../../shared/lib/money.js'
import { createAccountApi, normalizePhone } from '../../../shared/features/account/api.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { useOrders } from '../features/orders/OrdersProvider.jsx'
import { checkoutOwner, savedAddress } from '../features/orders/model.js'
import { governorates } from '../features/orders/governorates.js'
import {
  DeliveryDetails,
  OrderPageHeading,
  OrderSummary,
  OrdersError,
} from '../features/orders/components.jsx'

export default function Checkout({ review = false }) {
  const language = useLocale(),
    ar = language === 'ar',
    { user } = useSession()
  const { ready, state } = useOrders()
  if (!ready)
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل إتمام الطلب' : 'Loading checkout'} />
      </div>
    )
  if (!checkoutOwner(user))
    return (
      <div className="shop-page">
        <Feedback
          title={
            ar
              ? 'إتمام الطلب متاح للزوار وحسابات العملاء.'
              : 'Checkout is available to guests and customer accounts.'
          }
        />
      </div>
    )
  if (state.orderId)
    return <Navigate to={`/${language}/checkout/received/${state.orderId}`} replace />
  if (review && !state.quote) return <Navigate to={`/${language}/checkout`} replace />
  if (!review && state.quote) return <Navigate to={`/${language}/checkout/review`} replace />
  return review ? <CheckoutReview /> : <CheckoutDetails key={state.owner} />
}
function CheckoutDetails() {
  const language = useLocale(),
    ar = language === 'ar',
    runtime = useRuntime(),
    { user } = useSession()
  const { api, controller, state } = useOrders(),
    { api: retail } = useShop(),
    navigate = useNavigate()
  const { config, api: accountTransport, session } = runtime
  const account = useMemo(
    () => createAccountApi({ config, api: accountTransport, session }),
    [config, accountTransport, session],
  )
  const form = state.form,
    owner = state.owner
  const cart = useShopRead(
    (signal) => retail.cart(false, { signal, language }),
    `${owner}:${language}`,
  )
  const fees = useShopRead((signal) => api.shippingFees({ signal, language }), language)
  const addresses = useShopRead(
    () => (user?.role === 'user' ? account.addresses() : Promise.resolve([])),
    owner,
  )
  const choices = governorates(language, fees.data?.items || [])
  const shipping = useShopRead(
    (signal) =>
      form.address.governorateCode
        ? api.shippingQuote(form.address.governorateCode, { signal, language })
        : Promise.resolve(null),
    `${form.address.governorateCode}:${language}`,
  )
  const [coupon, setCoupon] = useState(null),
    [couponError, setCouponError] = useState(null),
    [couponBusy, setCouponBusy] = useState(false)
  const couponLock = useRef(false),
    [prefilled, setPrefilled] = useState(false)
  const cartSignature = JSON.stringify(
    cart.data?.items.map((item) => [
      item.productId,
      item.variantId,
      item.quantity,
      item.unitPrice,
      item.activeSale?.id,
    ]) || [],
  )
  function update(section, key, value) {
    setCoupon(null)
    setCouponError(null)
    controller.update(
      section
        ? { ...form, [section]: { ...form[section], [key]: value } }
        : { ...form, [key]: value },
    )
  }
  async function applyCoupon() {
    if (couponLock.current) return
    const phone = normalizePhone(form.customer.phone),
      code = form.couponCode.trim().toUpperCase()
    if (!/^\+?\d{6,15}$/.test(phone) || !/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) {
      setCouponError(new ApiError('INVALID_ORDER', { status: 422 }))
      return
    }
    couponLock.current = true
    setCouponBusy(true)
    setCouponError(null)
    try {
      const result = await api.coupon({ code, phone }, owner, { language })
      if (checkoutOwner(runtime.session.getSnapshot().user) === owner)
        setCoupon({ ...result, phone, code, cartSignature })
    } catch (error) {
      setCouponError(error)
    } finally {
      couponLock.current = false
      setCouponBusy(false)
    }
  }
  const currentCoupon =
    coupon?.phone === normalizePhone(form.customer.phone) &&
    coupon?.cartSignature === cartSignature &&
    coupon?.code === form.couponCode.trim().toUpperCase()
      ? coupon
      : null
  if (!cart.data && !cart.error)
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل السلة' : 'Loading cart'} />
      </div>
    )
  if (cart.error)
    return (
      <div className="shop-page">
        <OrdersError error={cart.error} retry={cart.reload} />
      </div>
    )
  if (!cart.data.canCheckout)
    return (
      <div className="shop-page">
        <OrderPageHeading title={ar ? 'إتمام الطلب' : 'Checkout'} />
        <Feedback
          title={ar ? 'راجع السلة قبل المتابعة.' : 'Review your cart before continuing.'}
          action={<Button to={`/${language}/cart`}>{ar ? 'العودة للسلة' : 'Back to cart'}</Button>}
        />
      </div>
    )
  const disabled = state.busy || couponBusy
  return (
    <div className="shop-page checkout-page">
      <OrderPageHeading title={ar ? 'إتمام الطلب' : 'Checkout'} step={1}>
        {ar
          ? 'تابع كزائر، أو سجّل الدخول لاستخدام بياناتك المحفوظة.'
          : 'Continue as a guest, or sign in to use your saved details.'}
      </OrderPageHeading>
      {!user && (
        <p className="checkout-signin">
          <Link
            to={`/${language}/account/login?returnTo=${encodeURIComponent(`/${language}/checkout`)}`}
          >
            {ar ? 'تسجيل الدخول' : 'Sign in'}
          </Link>{' '}
          ·{' '}
          {ar
            ? 'إنشاء حساب ليس مطلوبًا لإرسال الطلب.'
            : 'An account is not required to place an order.'}
        </p>
      )}
      <OrdersError error={state.error} />
      <div className="checkout-columns">
        <form
          className="checkout-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const quote = await controller.preview({ language })
            if (quote) navigate(`/${language}/checkout/review`)
          }}
        >
          <fieldset className="order-panel" disabled={disabled}>
            <legend>{ar ? 'بيانات التواصل' : 'Contact details'}</legend>
            {user && !prefilled && (
              <Button
                variant="secondary"
                onClick={() => {
                  controller.update({
                    ...form,
                    customer: {
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phone || '',
                    },
                  })
                  setPrefilled(true)
                }}
              >
                {ar ? 'استخدام بيانات حسابي' : 'Use my account details'}
              </Button>
            )}
            <div className="checkout-fields">
              <Field
                label={ar ? 'الاسم *' : 'Name *'}
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                value={form.customer.name}
                onChange={(e) => update('customer', 'name', e.target.value)}
              />
              <Field
                label={ar ? 'البريد الإلكتروني *' : 'Email *'}
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.customer.email}
                onChange={(e) => update('customer', 'email', e.target.value)}
              />
              <Field
                label={ar ? 'رقم الهاتف *' : 'Phone *'}
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                value={form.customer.phone}
                onChange={(e) => update('customer', 'phone', e.target.value)}
              />
            </div>
          </fieldset>
          <fieldset className="order-panel" disabled={disabled}>
            <legend>{ar ? 'عنوان التوصيل' : 'Delivery address'}</legend>
            {addresses.error && <OrdersError error={addresses.error} retry={addresses.reload} />}
            {addresses.data?.length > 0 && (
              <SelectField
                label={ar ? 'استخدام عنوان محفوظ' : 'Use a saved address'}
                value=""
                onChange={(e) => {
                  const address = addresses.data.find((item) => item.id === e.target.value)
                  if (address) {
                    controller.update(savedAddress(form, address))
                    setCoupon(null)
                  }
                }}
              >
                <option value="">{ar ? 'اختر عنوانًا محفوظًا' : 'Choose a saved address'}</option>
                {addresses.data.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} · {address.governorate}
                  </option>
                ))}
              </SelectField>
            )}
            <div className="checkout-fields">
              <SelectField
                label={ar ? 'المحافظة *' : 'Governorate *'}
                required
                value={form.address.governorateCode}
                onChange={(event) => {
                  const choice = choices.find((item) => item.code === event.target.value)
                  if (choice) {
                    controller.update({
                      ...form,
                      address: {
                        ...form.address,
                        governorateCode: choice.code,
                        governorate: choice.name,
                      },
                    })
                    setCoupon(null)
                  }
                }}
              >
                <option value="">
                  {ar ? 'اختر المحافظة للتأكيد' : 'Choose governorate to confirm'}
                </option>
                {choices.map((choice) => (
                  <option key={choice.code} value={choice.code}>
                    {choice.name}
                  </option>
                ))}
              </SelectField>
              <Field
                label={ar ? 'المنطقة / الحي *' : 'District / area *'}
                name="district"
                required
                maxLength={100}
                value={form.address.district}
                onChange={(e) => update('address', 'district', e.target.value)}
              />
              {[
                ['building', 'Building *', 'المبنى *', true, 200],
                ['street', 'Street *', 'الشارع *', true, 200],
                ['floor', 'Floor · optional', 'الطابق · اختياري', false, 50],
                ['apartment', 'Apartment · optional', 'الشقة · اختياري', false, 50],
              ].map(([key, en, arabic, required, maxLength]) => (
                <Field
                  key={key}
                  label={ar ? arabic : en}
                  name={key}
                  required={required}
                  maxLength={maxLength}
                  value={form.address[key]}
                  onChange={(e) => update('address', key, e.target.value)}
                />
              ))}
              <Field
                label={ar ? 'تفاصيل التوصيل · اختياري' : 'Delivery details · optional'}
                name="details"
                maxLength={1000}
                value={form.address.details}
                onChange={(e) => update('address', 'details', e.target.value)}
              />
            </div>
            {!form.address.governorateCode && form.address.governorate && (
              <p className="order-help">
                {ar ? 'العنوان المحفوظ: ' : 'Saved destination: '}
                {form.address.governorate}.{' '}
                {ar
                  ? 'أكد المحافظة من القائمة لتحديد رسوم التوصيل الصحيحة.'
                  : 'Confirm the governorate above to request the correct delivery fee.'}
              </p>
            )}
            <OrdersError
              error={fees.error || shipping.error}
              retry={fees.error ? fees.reload : shipping.reload}
            />
          </fieldset>
          <fieldset className="order-panel" disabled={disabled}>
            <legend>{ar ? 'طريقة الدفع' : 'Payment method'}</legend>
            <div
              className="payment-choices"
              role="group"
              aria-label={ar ? 'طريقة الدفع' : 'Payment method'}
            >
              {[
                ['cod', ar ? 'الدفع عند الاستلام' : 'Cash on delivery'],
                ['instapay', 'InstaPay'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={form.paymentMethod === value ? 'primary' : 'secondary'}
                  aria-pressed={form.paymentMethod === value}
                  onClick={() => update(null, 'paymentMethod', value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="order-help">
              {ar
                ? 'يتطلب إنستاباي صورة للتحويل ومراجعة يدوية من الفريق.'
                : 'InstaPay requires a transfer screenshot and manual review.'}
            </p>
          </fieldset>
          <Button type="submit" variant="accent" disabled={disabled}>
            {state.busy
              ? ar
                ? 'جارٍ إعداد المراجعة...'
                : 'Preparing review...'
              : ar
                ? 'مراجعة الطلب'
                : 'Review order'}
          </Button>
        </form>
        <aside className="checkout-aside">
          <OrderSummary cart={cart.data} shipping={shipping.data} coupon={currentCoupon} />
          <section className="order-panel">
            <Field
              label={ar ? 'كود الخصم' : 'Promo code'}
              name="couponCode"
              maxLength={40}
              value={form.couponCode}
              disabled={disabled}
              onChange={(e) => update(null, 'couponCode', e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={applyCoupon}
              disabled={disabled || !form.couponCode.trim()}
            >
              {couponBusy
                ? ar
                  ? 'جارٍ التحقق...'
                  : 'Checking...'
                : ar
                  ? 'تطبيق الكود'
                  : 'Apply code'}
            </Button>
            <OrdersError error={couponError} />
            {currentCoupon && (
              <p role="status">
                {ar
                  ? 'الخصم المتاح على المنتجات المؤهلة: '
                  : 'Available discount on eligible items: '}
                {formatMoney(currentCoupon.discountAmount, language)}
              </p>
            )}
          </section>
          <p className="order-help">
            {ar
              ? 'لا يتم تحصيل مبلغ في هذه الخطوة. تتم مراجعة الأسعار والمخزون مجددًا عند إرسال الطلب.'
              : 'No payment is taken on this step. Prices and availability are checked again when placing the order.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
function CheckoutReview() {
  const language = useLocale(),
    ar = language === 'ar',
    navigate = useNavigate()
  const { controller, state } = useOrders(),
    [file, setFile] = useState(null)
  const quote = state.quote,
    instapay = quote.paymentMethod === 'instapay'
  const [time, setTime] = useState(Date.now)
  const expired = Date.parse(quote.expiresAt) <= time
  useEffect(() => {
    const timer = setTimeout(
      () => setTime(Date.now()),
      Math.min(2147483647, Math.max(0, Date.parse(quote.expiresAt) - Date.now() + 1)),
    )
    return () => clearTimeout(timer)
  }, [quote.expiresAt])
  async function place() {
    const result = await controller.place({ language })
    if (result) navigate(`/${language}/checkout/received/${result.order.id}`)
  }
  return (
    <div className="shop-page checkout-page">
      <OrderPageHeading title={ar ? 'راجع الطلب وأرسله' : 'Review and place your order'} step={2}>
        {instapay
          ? ar
            ? 'حوّل المبلغ باستخدام إنستاباي وارفع صورة التحويل للمراجعة.'
            : 'Transfer using InstaPay and upload the screenshot for manual review.'
          : ar
            ? 'الدفع عند الاستلام. لا يتطلب تحويلًا أو صورة.'
            : 'Cash on delivery. No transfer or screenshot is required.'}
      </OrderPageHeading>
      <OrdersError error={state.error} />
      {state.pending && (
        <div className="order-note" role="status">
          {state.uncertain
            ? ar
              ? 'لم تصل نتيجة الإرسال بشكل مؤكد. أعد التحقق باستخدام الطلب الأصلي؛ لا تُنشئ طلبًا جديدًا أو تحوّل المبلغ مرة أخرى.'
              : 'The placement result is uncertain. Reconcile using the original request; do not create another order or transfer again.'
            : ar
              ? 'تم الاحتفاظ بالطلب الأصلي. انتظر قبل إعادة المحاولة.'
              : 'The original request is retained. Wait before retrying.'}
        </div>
      )}
      {expired && !state.pending && (
        <p className="order-note">
          {ar
            ? 'انتهت صلاحية عرض الطلب. عد إلى التفاصيل لطلب عرض جديد.'
            : 'This checkout quote has expired. Return to details for a fresh quote.'}
        </p>
      )}
      <div className="checkout-columns">
        <div className="checkout-form">
          {instapay && (
            <>
              <section className="order-panel order-note">
                <h2>
                  {ar ? 'التحويل عبر إنستاباي: ' : 'Transfer using InstaPay: '}
                  {formatMoney(quote.totals.total, language)}
                </h2>
                <p>{ar ? 'الحساب المستلم' : 'Receiving account'}</p>
                <strong className="receiving-account">
                  <bdi>{quote.receivingAccount}</bdi>
                </strong>
                <p className="order-help">
                  {ar
                    ? 'استخدم بيانات الحساب المعروضة لهذا الطلب فقط.'
                    : 'Use the receiving account shown for this checkout.'}
                </p>
              </section>
              <section className="order-panel order-note">
                <h2>{ar ? 'صورة التحويل' : 'Transfer screenshot'}</h2>
                <FileField
                  label={ar ? 'اختر صورة التحويل' : 'Choose transfer screenshot'}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={state.busy || !!state.pending || expired}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  hint={
                    ar
                      ? 'صورة ثابتة JPEG أو PNG أو WebP، حتى 5 ميبيبايت و20 مليون بكسل. تُحفظ بشكل خاص.'
                      : 'Still JPEG, PNG or WebP, up to 5 MiB and 20 million pixels. Stored privately.'
                  }
                />
                {state.uploadUncertain && (
                  <p role="status">
                    {ar
                      ? 'نتيجة الرفع السابق غير مؤكدة. لم يتم إرسال الطلب. الرفع مرة أخرى عملية جديدة، وسيتم تنظيف الملفات غير المرتبطة بعد انتهاء صلاحيتها.'
                      : 'The previous upload result is uncertain. The order has not been placed. Uploading again is a new upload; unattached files expire automatically.'}
                  </p>
                )}
                {state.proof && (
                  <p role="status">
                    {ar
                      ? 'تم رفع الصورة. أرسل الطلب لإرفاقها.'
                      : 'Screenshot uploaded. Place the order to attach it.'}
                  </p>
                )}
                <Button
                  variant="secondary"
                  disabled={!file || state.busy || !!state.pending || expired}
                  onClick={async () => {
                    const proof = await controller.upload(file, { language })
                    if (proof) setFile(null)
                  }}
                >
                  {state.busy
                    ? ar
                      ? 'جارٍ المعالجة...'
                      : 'Processing...'
                    : state.uploadUncertain
                      ? ar
                        ? 'رفع صورة مرة أخرى'
                        : 'Upload screenshot again'
                      : ar
                        ? 'رفع الصورة'
                        : 'Upload screenshot'}
                </Button>
              </section>
            </>
          )}
          <section className="order-panel">
            <h2>{ar ? 'بيانات التوصيل' : 'Your delivery details'}</h2>
            <DeliveryDetails customer={state.form.customer} address={state.form.address} />
            <Button
              variant="secondary"
              disabled={state.busy || !!state.pending}
              onClick={() => {
                if (controller.edit()) navigate(`/${language}/checkout`)
              }}
            >
              {ar ? 'تعديل التفاصيل' : 'Edit details'}
            </Button>
          </section>
        </div>
        <aside className="checkout-aside">
          <OrderSummary quote={quote} />
          <Button
            variant="accent"
            disabled={state.busy || (!state.pending && (expired || (instapay && !state.proof)))}
            onClick={place}
          >
            {state.busy
              ? ar
                ? 'جارٍ المعالجة...'
                : 'Processing...'
              : state.pending
                ? ar
                  ? 'التحقق من الطلب الأصلي'
                  : 'Reconcile original order'
                : ar
                  ? 'إرسال الطلب'
                  : 'Place order'}
          </Button>
          <p className="order-note">
            {instapay
              ? ar
                ? 'رفع صورة التحويل لا يؤكد استلام المبلغ. يُستلم الطلب بانتظار المراجعة اليدوية من الفريق.'
                : 'Uploading a screenshot does not confirm bank settlement. Your order is received as pending and reviewed by the team.'
              : ar
                ? 'الطلب بانتظار المراجعة. يتم الدفع عند الاستلام؛ إرسال الطلب لا يحصّل أي مبلغ عبر الإنترنت.'
                : 'Your order is pending review. Payment is due on delivery; placing the order does not collect money online.'}
          </p>
          <p className="order-help">
            {ar
              ? 'هذا العرض لا يحجز المخزون ولا يثبت الأسعار. يعرض إيصال الطلب الإجمالي بعد التحقق النهائي.'
              : 'This quote does not reserve stock or lock prices. Your order receipt shows the revalidated total.'}
          </p>
          {state.storageWarning && (
            <p className="order-note">
              {ar
                ? 'حفظ بيانات الاسترداد في هذا التبويب غير متاح. أبقِ الصفحة مفتوحة حتى تصل نتيجة الإرسال.'
                : 'Recovery storage is unavailable in this tab. Keep this page open until placement is confirmed.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
