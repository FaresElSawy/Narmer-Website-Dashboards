import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import { LocaleProvider, useLocale } from '../../shared/ui/Locale.jsx'
import { PublicShell } from '../../shared/ui/PublicShell.jsx'
import { Button, Feedback } from '../../shared/ui/Primitives.jsx'
import { Metadata } from '../../shared/ui/Metadata.jsx'
import { RuntimeProvider } from '../../shared/ui/Runtime.jsx'
import Home from './pages/Home.jsx'
import { config, navigation } from './app/config.js'
import { BusinessContentProvider } from './features/content/BusinessContentProvider.jsx'
import { ContactPage } from './pages/ContactPage.jsx'
import { InformationPage } from './pages/InformationPage.jsx'
import { ServicePage } from './pages/ServicePage.jsx'
import { InquiryProvider } from './features/inquiry/InquiryProvider.jsx'
import { RequestStart } from './pages/RequestStart.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const AccountRoutes = lazy(() =>
  import('../../shared/features/account/AccountRoutes.jsx').then((module) => ({
    default: module.AccountRoutes,
  })),
)
const Wholesale = lazy(() => import('./pages/Wholesale.jsx'))
const RequestReview = lazy(() =>
  import('./pages/RequestReview.jsx').then((module) => ({ default: module.RequestReview })),
)
const RequestReceipt = lazy(() =>
  import('./pages/RequestReceipt.jsx').then((module) => ({ default: module.RequestReceipt })),
)
const RequestTracking = lazy(() =>
  import('./pages/RequestTracking.jsx').then((module) => ({ default: module.RequestTracking })),
)
const RequestHistory = lazy(() =>
  import('./pages/RequestHistory.jsx').then((module) => ({ default: module.RequestHistory })),
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
function LocalizedApp({ publicData }) {
  const { lang } = useParams()
  const { pathname } = useLocation()
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
              <BusinessContentProvider publicData={publicData}>
                <InquiryProvider publicData={publicData}>
                  <PublicShell store="b2b" config={config} navigation={navigation(lang)}>
                    <Suspense
                      fallback={
                        <div className="inquiry-page">
                          <Feedback
                            kind="loading"
                            skeleton={pathname.split('/')[2] === 'account' ? 'form' : 'content'}
                            title={lang === 'ar' ? 'جارٍ تحميل الصفحة' : 'Loading page'}
                          />
                        </div>
                      }
                    >
                      <Routes>
                        <Route index element={<Home />} />
                        <Route
                          path="services/wholesale"
                          element={<Navigate to={`/${lang}/wholesale`} replace />}
                        />
                        <Route path="services/:type" element={<ServicePage />} />
                        <Route path="wholesale" element={<Wholesale />} />
                        <Route path="wholesale/offers/:offerId" element={<Wholesale />} />
                        <Route path="request" element={<RequestStart />} />
                        <Route path="request/review" element={<RequestReview />} />
                        <Route path="request/received/:leadId" element={<RequestReceipt />} />
                        <Route path="track" element={<RequestTracking />} />
                        <Route path="track/:leadId" element={<RequestTracking />} />
                        <Route path="requests" element={<RequestHistory />} />
                        <Route path="requests/:leadId" element={<RequestTracking account />} />
                        <Route path="account/*" element={<AccountRoutes />} />
                        <Route path="contact" element={<ContactPage />} />
                        {['about', 'privacy', 'terms'].map((page) => (
                          <Route key={page} path={page} element={<InformationPage page={page} />} />
                        ))}
                        <Route path="*" element={<Unavailable />} />
                      </Routes>
                    </Suspense>
                  </PublicShell>
                </InquiryProvider>
              </BusinessContentProvider>
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
