import { DashboardShell } from '../../../shared/ui/DashboardShell.jsx'
import { Navigate, Route, Routes } from 'react-router'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { config } from '../app/config.js'
import { DashboardProvider } from '../features/dashboard/DashboardContext.jsx'
import { NotificationBadge } from '../features/dashboard/NotificationBadge.jsx'
import { DashboardRequests } from './DashboardRequests.jsx'
import { DashboardRequestDetail } from './DashboardRequestDetail.jsx'
import { DashboardForms } from './DashboardForms.jsx'
import { DashboardProducts } from './DashboardProducts.jsx'
import { DashboardProductEditor } from './DashboardProductEditor.jsx'
import { DashboardWholesale } from './DashboardWholesale.jsx'
import { DashboardAccounts } from './DashboardAccounts.jsx'
import { DashboardProfile } from './DashboardProfile.jsx'
import { DashboardNotifications } from './DashboardNotifications.jsx'
import { DashboardHomepage } from './DashboardHomepage.jsx'
import { DashboardSettings } from './DashboardSettings.jsx'
import '../assets/css/dashboard.css'

const navigation = [
  {
    key: 'requests',
    icon: 'forms',
    label: {
      en: 'Requests',
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
    key: 'wholesale',
    icon: 'tag',
    label: {
      en: 'Wholesale offers',
      ar: 'عروض الجملة',
    },
    roles: ['admin', 'superAdmin'],
  },
  {
    key: 'forms',
    icon: 'forms',
    label: { en: 'Request forms', ar: 'نماذج الطلبات' },
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
              <Route index element={<Navigate to={`/${language}/dashboard/requests`} replace />} />
              <Route path="requests" element={<DashboardRequests />} />
              <Route path="requests/:leadId" element={<DashboardRequestDetail />} />
              <Route path="forms/:formType?" element={<DashboardForms />} />
              <Route path="products" element={<DashboardProducts />} />
              <Route path="products/new" element={<DashboardProductEditor key="new" create />} />
              <Route
                path="products/source/:productId"
                element={<DashboardProductEditor key="source" source />}
              />
              <Route path="products/:productId" element={<DashboardProductEditor key="edit" />} />
              <Route path="wholesale/:offerId?" element={<DashboardWholesale />} />
              <Route path="accounts/:userId?" element={<DashboardAccounts />} />
              <Route path="notifications" element={<DashboardNotifications />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="homepage" element={<DashboardHomepage />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route
                path="*"
                element={<Navigate to={`/${language}/dashboard/requests`} replace />}
              />
            </Routes>
          </DashboardProvider>
        )}
      </DashboardShell>
    </>
  )
}
