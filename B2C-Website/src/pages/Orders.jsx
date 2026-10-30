import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../shared/ui/Brand.jsx'
import { SelectField } from '../../../shared/ui/SelectField.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useRuntime, useSession } from '../../../shared/ui/Runtime.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { AccountFrame } from '../../../shared/features/account/AccountFrame.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { useOrders } from '../features/orders/OrdersProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { orderStatuses, statusLabel } from '../features/orders/model.js'
import { OrdersError } from '../features/orders/components.jsx'

export default function Orders() {
  const language = useLocale(),
    ar = language === 'ar',
    { config } = useRuntime(),
    { user } = useSession(),
    { ready } = useOrders(),
    location = useLocation()
  if (!ready)
    return (
      <div className="shop-page">
        <Feedback kind="loading" title={ar ? 'تحميل سجل الطلبات' : 'Loading orders'} />
      </div>
    )
  if (!user)
    return (
      <Navigate
        to={`/${language}/account/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  if (user.role !== 'user')
    return (
      <div className="shop-page">
        <Feedback
          title={
            ar ? 'سجل الطلبات مخصص لحسابات العملاء.' : 'Order history is for customer accounts.'
          }
        />
      </div>
    )
  return (
    <AccountFrame>
      <Metadata
        config={config}
        title={ar ? 'طلباتك | نارمر' : 'Your orders | Narmer'}
        description=""
      />
      <OrderHistory key={user.id} />
    </AccountFrame>
  )
}
function OrderHistory() {
  const language = useLocale(),
    ar = language === 'ar',
    { api } = useOrders(),
    [search, setSearch] = useSearchParams()
  const page = /^\d+$/.test(search.get('page') || '')
    ? Math.max(1, Math.min(100000, Number(search.get('page'))))
    : 1
  const status = orderStatuses.includes(search.get('status')) ? search.get('status') : ''
  const query = new URLSearchParams({ page: String(page), limit: '20', ...(status && { status }) })
  const read = useShopRead(
    (signal) => api.orders(query, { language, signal }),
    `${query}:${language}`,
  )
  return (
    <section className="account-panel orders-history">
      <div className="orders-toolbar">
        <div className="account-panel-heading">
          <p className="account-eyebrow">{ar ? 'سجل المشتريات' : 'PURCHASE HISTORY'}</p>
          <h2>{ar ? 'طلباتك' : 'Your orders'}</h2>
          <p className="profile-description">
            {ar
              ? 'الطلبات التي أرسلتها أثناء تسجيل الدخول إلى هذا الحساب.'
              : 'Orders placed while signed in to this store account.'}
          </p>
        </div>
        <div className="orders-filter">
          <SelectField
            label={ar ? 'الحالة' : 'Status'}
            value={status}
            onChange={(e) => setSearch(e.target.value ? { status: e.target.value } : {})}
          >
            <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
            {orderStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, language)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      {read.error ? (
        <OrdersError error={read.error} retry={read.reload} />
      ) : !read.data ? (
        <Feedback kind="loading" title={ar ? 'تحميل الطلبات' : 'Loading orders'} />
      ) : (
        <>
          {!read.data.items.length ? (
            <Feedback
              title={ar ? 'لا توجد طلبات مطابقة.' : 'No matching orders.'}
              action={
                <Button to={`/${language}/products`}>
                  {ar ? 'تصفح المنتجات' : 'Explore products'}
                </Button>
              }
            />
          ) : (
            <div className="order-history-list">
              {read.data.items.map((order) => (
                <article className="order-history-card" key={order.id}>
                  <dl>
                    <div>
                      <dt>{ar ? 'مرجع الطلب' : 'Order reference'}</dt>
                      <dd className="order-reference">
                        <bdi>{order.orderNumber ?? order.id}</bdi>
                      </dd>
                    </div>
                    <div>
                      <dt>{ar ? 'الإجمالي' : 'Total'}</dt>
                      <dd>{formatMoney(order.totals.total, language)}</dd>
                    </div>
                    <div>
                      <dt>{ar ? 'الحالة' : 'Status'}</dt>
                      <dd>
                        <span className="order-history-status">
                          {statusLabel(order.status, language)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <Button variant="text" to={`/${language}/orders/${order.id}`}>
                    {ar ? 'عرض الطلب' : 'View order'}
                    <Icon name="arrow" />
                  </Button>
                </article>
              ))}
            </div>
          )}
          <nav className="catalog-pagination" aria-label={ar ? 'صفحات الطلبات' : 'Order pages'}>
            <Button
              variant="secondary"
              disabled={read.loading || page <= 1 || !read.data.pagination.pages}
              aria-label={ar ? 'السابق' : 'Previous'}
              onClick={() => setSearch({ ...Object.fromEntries(search), page: String(page - 1) })}
            >
              <span className="page-arrow-previous">
                <Icon name="arrow" />
              </span>
            </Button>
            <span>
              {read.data.pagination.pages ? page : 0} / {read.data.pagination.pages}
            </span>
            <Button
              variant="secondary"
              disabled={read.loading || page >= read.data.pagination.pages}
              aria-label={ar ? 'التالي' : 'Next page'}
              onClick={() => setSearch({ ...Object.fromEntries(search), page: String(page + 1) })}
            >
              <Icon name="arrow" />
            </Button>
          </nav>
        </>
      )}
      <p className="order-history-help">
        {ar
          ? 'طلبت كزائر؟ استخدم رابط التتبع الخاص الذي حفظته عند الطلب.'
          : 'Ordered as a guest? Use the private tracking link you saved when placing your order.'}{' '}
        <Link to={`/${language}/track`}>
          {ar ? 'تتبع طلب زائر' : 'Track a guest order'}
          <Icon name="arrow" />
        </Link>
      </p>
    </section>
  )
}
