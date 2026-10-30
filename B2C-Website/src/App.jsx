import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import { LocaleProvider, useLocale } from '../../shared/ui/Locale.jsx'
import { PublicShell } from '../../shared/ui/PublicShell.jsx'
import { Button, Feedback } from '../../shared/ui/Primitives.jsx'
import { Metadata } from '../../shared/ui/Metadata.jsx'
import { RuntimeProvider } from '../../shared/ui/Runtime.jsx'
import Home from './pages/Home.jsx'
import loginCampaign from './assets/images/customer-login-campaign.webp'
import { config, navigation } from './app/config.js'
import { ShopProvider, useShop } from './features/shop/ShopProvider.jsx'
import { OrdersProvider } from './features/orders/OrdersProvider.jsx'
import { Icon } from '../../shared/ui/Brand.jsx'
import './assets/css/shop.css'
import './assets/css/orders.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Product = lazy(() => import('./pages/Product.jsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const OrderReceived = lazy(() => import('./pages/OrderReceived.jsx'))
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const Information = lazy(() => import('./pages/Information.jsx'))
const AccountRoutes = lazy(() =>
  import('../../shared/features/account/AccountRoutes.jsx').then((module) => ({
    default: module.AccountRoutes,
  })),
)
function Unavailable() {
  const language = useLocale(),
    ar = language === 'ar'
  return (
    <>
      <Metadata
        config={config}
        title={ar ? 'نارمر | الصفحة غير متاحة' : 'Narmer | Page unavailable'}
        description=""
      />
      <div className="error-page">
        <Feedback
          title={ar ? 'الصفحة غير متاحة حاليًا' : 'This page is currently unavailable'}
          action={<Button to={`/${language}`}>{ar ? 'العودة للرئيسية' : 'Back to home'}</Button>}
        />
      </div>
    </>
  )
}
function RetailPublic() {
  const language = useLocale(),
    { content, afterLogin, cartCount } = useShop(),
    { pathname } = useLocation(),
    ar = language === 'ar'
  const normalizedPath = pathname.replace(/\/+$/, '')
  const floatingCart =
    normalizedPath === `/${language}` ||
    normalizedPath === `/${language}/products` ||
    normalizedPath.startsWith(`/${language}/products/`)
  return (
    <PublicShell
      store="b2c"
      config={config}
      navigation={navigation(language, content?.categories)}
      cartCount={cartCount}
    >
      {floatingCart && (
        <Link
          className="floating-cart"
          to={`/${language}/cart`}
          aria-label={`${ar ? 'السلة' : 'Cart'}${cartCount == null ? '' : `: ${cartCount} ${ar ? 'قطعة' : cartCount === 1 ? 'item' : 'items'}`}`}
        >
          <Icon name="cart" />
          {cartCount > 0 && <span aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>}
        </Link>
      )}
      <Suspense
        fallback={
          <div className="shop-page">
            <Feedback
              kind="loading"
              title={language === 'ar' ? 'جارٍ تحميل الصفحة' : 'Loading page'}
            />
          </div>
        }
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<Product />} />
          <Route path="products/:productId/:slug" element={<Product />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/review" element={<Checkout review />} />
          <Route path="checkout/received/:orderId" element={<OrderReceived />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="orders/:orderId/receipt" element={<OrderDetail receipt />} />
          <Route path="track" element={<OrderDetail guest />} />
          <Route path="track/:orderId" element={<OrderDetail guest />} />
          <Route path="track/:orderId/receipt" element={<OrderDetail guest receipt />} />
          <Route
            path="account/*"
            element={
              <AccountRoutes
                afterLogin={afterLogin}
                loginImage={{
                  src: loginCampaign,
                  alt:
                    language === 'ar'
                      ? 'عارضان وعارضتان بملابس نارمر اليومية'
                      : 'Two men and two women wearing Narmer everyday clothing',
                }}
              />
            }
          />
          {['about', 'contact', 'privacy', 'terms'].map((page) => (
            <Route key={page} path={page} element={<Information page={page} />} />
          ))}
          <Route path="*" element={<Unavailable />} />
        </Routes>
      </Suspense>
    </PublicShell>
  )
}
function LocalizedApp({ publicData }) {
  const { lang } = useParams()
  if (!['en', 'ar'].includes(lang))
    return (
      <main className="error-page">
        <h1>Page not found / الصفحة غير موجودة</h1>
        <Button to="/en">Home / الرئيسية</Button>
      </main>
    )
  return (
    <LocaleProvider language={lang}>
      <RuntimeProvider config={config}>
        <Routes>
          <Route
            path="dashboard/*"
            element={
              <Suspense
                fallback={
                  <Feedback
                    kind="loading"
                    title={lang === 'ar' ? 'جارٍ التحميل' : 'Loading workspace'}
                  />
                }
              >
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <ShopProvider publicData={publicData}>
                <OrdersProvider>
                  <RetailPublic />
                </OrdersProvider>
              </ShopProvider>
            }
          />
        </Routes>
      </RuntimeProvider>
    </LocaleProvider>
  )
}
export default function App({ publicData }) {
  return (
    <>
      <Routes>
        <Route path="/dashboard" element={<Navigate to="/en/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/en" replace />} />
        <Route path="/:lang/*" element={<LocalizedApp publicData={publicData} />} />
      </Routes>
    </>
  )
}
