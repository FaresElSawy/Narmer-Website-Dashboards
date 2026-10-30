import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { Button, Modal } from '../../../shared/ui/Primitives.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  StaffError,
  StaffLink,
  ReadState,
  StaffTable,
} from '../features/dashboard/components.jsx'
import { orderStatusLabel, orderTransitions } from '../features/dashboard/orders.js'
import { unknownWrite } from '../features/dashboard/model.js'
import { useNotifications } from '../../../shared/ui/Notifications.jsx'
import { OrderItems } from '../features/dashboard/OrderItems.jsx'

function PaymentProof({ order }) {
  const { request, language } = useDashboard(),
    ar = language === 'ar',
    [state, setState] = useState({}),
    objectUrl = useRef(null),
    pending = useRef(null),
    active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      pending.current?.abort()
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    }
  }, [])
  async function show() {
    pending.current?.abort()
    pending.current = new AbortController()
    setState({ busy: true })
    try {
      const blob = await request(`/orders/${order.id}/proof`, {
        binary: true,
        signal: pending.current.signal,
      })
      if (!active.current) return
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = URL.createObjectURL(blob)
      setState({ url: objectUrl.current })
    } catch (error) {
      if (active.current && error.name !== 'AbortError') setState({ error })
    }
  }
  return (
    <section className="panel staff-panel">
      <h2>{ar ? 'إثبات التحويل الخاص' : 'Private transfer proof'}</h2>
      <p>
        {ar
          ? 'وجود الصورة لا يعني التحقق من الدفع. تحقق من التحويل خارج النظام قبل قبول الطلب.'
          : 'An uploaded image does not verify payment. Confirm the transfer outside the system before accepting the order.'}
      </p>
      {order.payment.hasProof ? (
        <Button variant="secondary" disabled={state.busy} onClick={show}>
          {ar ? 'عرض إثبات التحويل' : 'View transfer proof'}
        </Button>
      ) : (
        <p>{ar ? 'لا يوجد إثبات مرفق.' : 'No proof is attached.'}</p>
      )}
      <StaffError error={state.error} />
      {state.url && (
        <img
          className="staff-proof-image"
          src={state.url}
          alt={ar ? 'إثبات التحويل الخاص بهذا الطلب' : 'Private transfer proof for this order'}
        />
      )}
    </section>
  )
}
export function DashboardOrderDetail() {
  const { orderId } = useParams(),
    { request, language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead(`/orders/${orderId}`),
    [target, setTarget] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [uncertain, setUncertain] = useState(false)
  const { notify } = useNotifications()
  async function update() {
    setBusy(true)
    setError(null)
    try {
      const result = await request(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: target, expectedStatus: read.data.status },
      })
      read.setData(result)
      notify(ar ? 'تم تحديث حالة الطلب' : 'Order status updated')
      setTarget('')
      setUncertain(false)
    } catch (reason) {
      setError(reason)
      if (reason.status === 409 || unknownWrite(reason)) {
        setUncertain(true)
        try {
          const latest = await request(`/orders/${orderId}`)
          read.setData(latest)
          if (latest.status === target) {
            setError(null)
            notify(ar ? 'تم تحديث حالة الطلب' : 'Order status updated')
          }
          setTarget('')
          setUncertain(false)
        } catch {
          /* Keep status actions blocked until a fresh read succeeds. */
        }
      }
    } finally {
      setBusy(false)
    }
  }
  const order = read.data,
    date = (value) =>
      value
        ? new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo' })
        : '-'
  return (
    <>
      <StaffLink section="orders">{ar ? 'العودة للطلبات' : 'Back to orders'}</StaffLink>
      <StaffHeading title={ar ? 'تفاصيل الطلب' : 'Order details'} />
      <ReadState read={read}>
        {order && (
          <>
            <section className="panel staff-panel">
              <div className="staff-order-heading">
                <div>
                  <p className="staff-help">{ar ? 'مرجع الطلب' : 'Order reference'}</p>
                  <strong className="staff-reference" dir="ltr">
                    {order.id}
                  </strong>
                  <p>{date(order.createdAt)}</p>
                </div>
                <span className={`staff-status staff-status--${order.status}`}>
                  {orderStatusLabel(order.status, language)}
                </span>
              </div>
              <div className="staff-actions">
                {orderTransitions(order.status).map((status) => (
                  <Button
                    key={status}
                    variant={
                      status === 'canceled' || status === 'returned' ? 'secondary' : 'accent'
                    }
                    disabled={busy || uncertain}
                    onClick={() => setTarget(status)}
                  >
                    {orderStatusLabel(status, language)}
                  </Button>
                ))}
              </div>
              <StaffError error={error} />
              {uncertain && (
                <Button
                  onClick={async () => {
                    try {
                      read.setData(await request(`/orders/${orderId}`))
                      setUncertain(false)
                    } catch (reason) {
                      setError(reason)
                    }
                  }}
                >
                  {ar ? 'إعادة قراءة الحالة قبل المتابعة' : 'Read current status before continuing'}
                </Button>
              )}
            </section>
            <div className="staff-two-column">
              <section className="panel staff-panel">
                <h2>{ar ? 'العميل والتوصيل' : 'Customer and delivery'}</h2>
                <strong>{order.customer.name}</strong>
                <p dir="ltr">
                  {order.customer.email}
                  <br />
                  {order.customer.phone}
                </p>
                <p>
                  {[
                    order.address.building,
                    order.address.street,
                    order.address.district,
                    order.address.governorate,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p>
                  {ar ? 'الدور / الشقة' : 'Floor / apartment'}: {order.address.floor || '-'} /{' '}
                  {order.address.apartment || '-'}
                </p>
                <p>{order.address.details}</p>
              </section>
              <section className="panel staff-panel">
                <h2>{ar ? 'الدفع' : 'Payment'}</h2>
                <strong>
                  {order.payment.method === 'cod'
                    ? ar
                      ? 'الدفع عند الاستلام'
                      : 'Cash on delivery'
                    : 'InstaPay'}
                </strong>
                <p>{order.payment.receivingAccount}</p>
                <p>
                  {ar ? 'تم التحقق من التحويل' : 'Transfer verified'}:{' '}
                  {date(order.payment.verifiedAt)}
                </p>
                <p>
                  {ar ? 'تسجيل تحصيل النقد' : 'Cash collection marker'}:{' '}
                  {date(order.payment.cashCollectedAt)}
                </p>
                {order.refund && (
                  <p className="staff-warning">
                    {ar
                      ? 'سجل رد المبلغ فقط، وليس تأكيدًا لإرجاع المال فعليًا.'
                      : 'Refund marker only; this does not confirm an actual refund.'}{' '}
                    <bdi>{formatMoney(order.refund.amount, language)}</bdi>
                  </p>
                )}
                <p>
                  {ar ? 'تمت استعادة المخزون' : 'Stock restored'}:{' '}
                  {order.stockRestored ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No'}
                </p>
              </section>
            </div>
            <section className="panel staff-panel">
              <h2>{ar ? 'المنتجات المطلوبة' : 'Items ordered'}</h2>
              <OrderItems items={order.items} />
              <dl className="staff-order-totals">
                {Object.entries({
                  subtotal: ar ? 'المنتجات' : 'Items',
                  discountAmount: ar ? 'الخصم' : 'Discount',
                  shippingFee: ar ? 'التوصيل' : 'Delivery',
                  total: ar ? 'الإجمالي' : 'Total',
                }).map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>
                      <bdi>{formatMoney(order.totals[key], language)}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            {order.payment.method === 'instapay' && <PaymentProof key={order.id} order={order} />}
            <section className="panel staff-panel">
              <h2>{ar ? 'سجل الحالة' : 'Status history'}</h2>
              <StaffTable
                rows={order.history.map((entry, index) => ({ ...entry, id: String(index) }))}
                columns={[
                  {
                    key: 'status',
                    label: ar ? 'الحالة' : 'Status',
                    render: (entry) => orderStatusLabel(entry.status, language),
                  },
                  {
                    key: 'at',
                    label: ar ? 'التوقيت (القاهرة)' : 'Time (Cairo)',
                    render: (entry) => date(entry.at),
                  },
                  {
                    key: 'actorId',
                    label: ar ? 'مرجع الموظف' : 'Staff reference',
                    render: (entry) => (
                      <span className="staff-reference">
                        {entry.actorId || (ar ? 'إنشاء الطلب' : 'Order placed')}
                      </span>
                    ),
                  },
                ]}
              />
            </section>
            {order.quotedPreview && (
              <section className="panel staff-panel">
                <h2>{ar ? 'عرض السعر المحفوظ قبل التأكيد' : 'Saved quote before placement'}</h2>
                <p>
                  {ar
                    ? 'قد تختلف القيم النهائية عن العرض السابق عند تغير الأسعار قبل تأكيد الطلب.'
                    : 'Final placement values can differ from the earlier quote when pricing changes before placement.'}
                </p>
                <p>{date(order.quotedPreview.quotedAt)}</p>
                <p>
                  {ar ? 'إجمالي العرض' : 'Quoted total'}:{' '}
                  <bdi>{formatMoney(order.quotedPreview.totals.total, language)}</bdi>
                </p>
              </section>
            )}
            <Modal
              open={!!target}
              onClose={() => !busy && setTarget('')}
              title={ar ? 'تأكيد تغيير حالة الطلب' : 'Confirm order status change'}
            >
              <p>
                {orderStatusLabel(order.status, language)} - {orderStatusLabel(target, language)}
              </p>
              {target === 'accepted' && order.payment.method === 'instapay' && (
                <p>
                  {ar
                    ? 'أكد فقط بعد التحقق من وصول التحويل خارج هذا النظام.'
                    : 'Confirm only after checking the transfer was received outside this system.'}
                </p>
              )}
              {target === 'delivered' && order.payment.method === 'cod' && (
                <p>
                  {ar
                    ? 'سيتم تسجيل تحصيل النقد لهذا الطلب.'
                    : 'This records that cash was collected for this order.'}
                </p>
              )}
              {['canceled', 'returned'].includes(target) && (
                <p>
                  {ar
                    ? 'يستعيد النظام المخزون ويسجل علامة رد المبلغ مرة واحدة. يجب تسوية أي أموال خارج النظام؛ هذا الإجراء لا يحول أموالًا.'
                    : 'The system restores stock and records a refund marker once. Reconcile any money outside the system; this action does not transfer funds.'}
                </p>
              )}
              <StaffError error={error} />
              <Button variant="accent" disabled={busy} onClick={update}>
                {ar ? 'تأكيد التغيير' : 'Confirm change'}
              </Button>
            </Modal>
          </>
        )}
      </ReadState>
    </>
  )
}
