import { DashboardShell } from '../../../shared/ui/DashboardShell.jsx'
import { Navigate, Route, Routes } from 'react-router'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { config } from '../app/config.js'
import { DashboardProvider } from '../features/dashboard/DashboardContext.jsx'
import { NotificationBadge } from '../features/dashboard/NotificationBadge.jsx'
import { DashboardOrders } from './DashboardOrders.jsx'
import { DashboardOrderDetail } from './DashboardOrderDetail.jsx'
import { DashboardProducts } from './DashboardProducts.jsx'
import { DashboardProductEditor } from './DashboardProductEditor.jsx'
import { DashboardCategories, DashboardCategoryEditor } from './DashboardCategories.jsx'
import { DashboardSizeCharts, DashboardSizeChartEditor } from './DashboardSizeCharts.jsx'
import { DashboardPromotions } from './DashboardPromotions.jsx'
import { DashboardShipping } from './DashboardShipping.jsx'
import { DashboardAccounts } from './DashboardAccounts.jsx'
import { DashboardProfile } from './DashboardProfile.jsx'
import { DashboardNotifications } from './DashboardNotifications.jsx'
import { DashboardHomepage } from './DashboardHomepage.jsx'
import { DashboardSettings } from './DashboardSettings.jsx'
import { DashboardOverview, DashboardFinance, DashboardPerformance } from './DashboardReports.jsx'
import '../assets/css/dashboard.css'

const navigation = [
  {
    key: 'overview',
    icon: 'overview',
    label: {
      en: 'Overview',
      ar: 'نظرة عامة',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'finance',
    icon: 'chart',
    label: {
      en: 'Revenue & finance',
      ar: 'الإيرادات والمالية',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'performance',
    icon: 'chart',
    label: {
      en: 'Sales performance',
      ar: 'أداء المبيعات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'orders',
    icon: 'orders',
    label: {
      en: 'Orders',
      ar: 'الطلبات',
    },
  },
  {
    key: 'products',
    icon: 'box',
    label: {
      en: 'Products',
      ar: 'المنتجات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'categories',
    icon: 'box',
    label: {
      en: 'Categories',
      ar: 'التصنيفات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'promotions',
    icon: 'tag',
    label: {
      en: 'Sales & coupons',
      ar: 'التخفيضات والكوبونات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'size-charts',
    icon: 'forms',
    label: {
      en: 'Size charts',
      ar: 'جداول المقاسات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'homepage',
    icon: 'image',
    label: {
      en: 'Homepage content',
      ar: 'محتوى الرئيسية',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'shipping',
    icon: 'settings',
    label: {
      en: 'Shipping & payments',
      ar: 'الشحن والدفع',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'accounts',
    icon: 'people',
    label: {
      en: 'Accounts',
      ar: 'الحسابات',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'settings',
    icon: 'settings',
    label: {
      en: 'Settings',
      ar: 'الإعدادات',
    },
    roles: ['admin', 'superAdmin'],
  },
]

export default function Dashboard() {
  const language = useLocale()
  return (
    <>
      <Metadata
        config={config}
        title={language === 'ar' ? 'نارمر | لوحة التحكم' : 'Narmer | Dashboard'}
        description=""
      />
      <DashboardShell
        navigation={navigation}
        staffUtilities
        notificationBadge={(user) => (
          <NotificationBadge key={`${user.id}:${user.role}`} user={user} />
        )}
      >
        {(user, registerExitGuard) => (
          <DashboardProvider
            key={`${user.id}:${user.role}`}
            user={user}
            registerExitGuard={registerExitGuard}
          >
            <Routes>
              <Route
                index
                element={
                  <Navigate
                    to={`/${language}/dashboard/${user.role === 'moderator' ? 'orders' : 'overview'}`}
                    replace
                  />
                }
              />
              <Route path="orders" element={<DashboardOrders />} />
              <Route path="orders/:orderId" element={<DashboardOrderDetail />} />
              <Route path="products" element={<DashboardProducts />} />
              <Route path="products/:productId" element={<DashboardProductEditor key="edit" />} />
              <Route path="categories" element={<DashboardCategories />} />
              <Route path="categories/:categoryId" element={<DashboardCategoryEditor />} />
              <Route path="size-charts" element={<DashboardSizeCharts />} />
              <Route path="size-charts/:chartId" element={<DashboardSizeChartEditor />} />
              <Route path="promotions/*" element={<DashboardPromotions />} />
              <Route path="shipping/*" element={<DashboardShipping />} />
              <Route path="accounts/:userId?" element={<DashboardAccounts />} />
              <Route path="notifications" element={<DashboardNotifications />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="homepage" element={<DashboardHomepage />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route path="finance" element={<DashboardFinance />} />
              <Route path="performance" element={<DashboardPerformance />} />
              <Route path="overview" element={<DashboardOverview />} />
              <Route path="*" element={<Navigate to={`/${language}/dashboard/orders`} replace />} />
            </Routes>
          </DashboardProvider>
        )}
      </DashboardShell>
    </>
  )
}
