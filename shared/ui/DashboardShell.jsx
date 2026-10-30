import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Brand } from './Brand.jsx'
import { Button, Feedback, Modal } from './Primitives.jsx'
import { LanguageLink, useLocale } from './Locale.jsx'
import { useRuntime, useSession } from './Runtime.jsx'
import { canUseDashboard, staffLanding } from '../lib/session.js'
import { SelectField } from './SelectField.jsx'
import { errorMessage } from '../lib/messages.js'
import { StaffAccess } from '../features/account/StaffAccess.jsx'
import overview from '../assets/images/overview.svg'
import chart from '../assets/images/chart.svg'
import orders from '../assets/images/orders.svg'
import box from '../assets/images/box.svg'
import tag from '../assets/images/tag.svg'
import forms from '../assets/images/forms.svg'
import image from '../assets/images/image.svg'
import settings from '../assets/images/settings.svg'
import people from '../assets/images/people.svg'
import bell from '../assets/images/bell.svg'
import logoutIcon from '../assets/images/logout.svg'
import menu from '../assets/images/menu.svg'

const icons = { overview, chart, orders, box, tag, forms, image, settings, people, bell }

export function DashboardShell({
  navigation,
  children,
  staffUtilities = false,
  notificationBadge,
}) {
  const language = useLocale(),
    ar = language === 'ar',
    base = `/${language}/dashboard`
  const { config, session, api, restoring, restoreError } = useRuntime(),
    auth = useSession()
  const [drawer, setDrawer] = useState(false),
    [error, setError] = useState(''),
    [notifications, setNotifications] = useState(false)
  const [reviewRole, setReviewRole] = useState('admin')
  const [exitGuard, setExitGuard] = useState(null)
  const registerExitGuard = useCallback((guard) => setExitGuard(guard), [])
  const isReview = config.mode === 'fixtures'
  const user = useMemo(
    () =>
      isReview
        ? {
            id: `review-${reviewRole}`,
            name: ar ? 'حساب للمراجعة' : 'Review account',
            role: reviewRole,
            store: config.store,
          }
        : auth.user,
    [isReview, reviewRole, ar, config.store, auth.user],
  )
  const roleLabel = {
    admin: ar ? 'المسؤول' : 'Admin',
    moderator: ar ? 'المشرف' : 'Moderator',
    superAdmin: ar ? 'المسؤول الرئيسي' : 'Super admin',
  }[user?.role]
  const navigate = useNavigate()
  const location = useLocation(),
    selected = location.pathname.split('/')[3] || staffLanding(config.store, user?.role)
  if (restoring)
    return <Feedback kind="loading" title={ar ? 'جارٍ استعادة الجلسة' : 'Restoring your session'} />
  if (restoreError)
    return (
      <main className="error-page">
        <Feedback kind="error" title={errorMessage(restoreError, language)} />
      </main>
    )
  if (['login', 'forgot-password', 'reset-password'].includes(selected))
    return <StaffAccess key={selected} page={selected} />
  if (isReview && !location.pathname.split('/')[3] && !canUseDashboard(auth.user, config.store))
    return <StaffAccess />
  if (!canUseDashboard(user, config.store))
    return <Navigate to={`${base}/login`} state={{ returnTo: location.pathname }} replace />
  const visible = navigation.filter((item) => !item.roles || item.roles.includes(user.role))
  const allowed =
    visible.some((item) => item.key === selected) ||
    (staffUtilities && ['notifications', 'profile'].includes(selected))
  if (
    config.store === 'b2c' &&
    user.role === 'moderator' &&
    ['overview', 'finance', 'performance'].includes(selected)
  )
    return <Navigate to={`${base}/orders`} replace />
  async function logout() {
    if (exitGuard && !exitGuard.confirm()) return
    if (isReview) {
      exitGuard?.clear()
      session.clear()
      navigate(`${base}/login`, { replace: true })
      return
    }
    try {
      await session.logout(api)
      exitGuard?.clear()
      navigate(`${base}/login`, { replace: true })
    } catch {
      setError(ar ? 'تعذر تسجيل الخروج. حاول مرة أخرى.' : 'Could not sign out. Please try again.')
    }
  }
  const sidebar = (
    <>
      <div className="sidebar-brand">
        <Link
          to={`${base}/${visible[0]?.key || staffLanding(config.store, user.role)}`}
          aria-label="Narmer"
          onClick={() => setDrawer(false)}
        >
          <Brand inverted />
        </Link>
        <p>
          {config.store.toUpperCase()} · {ar ? 'لوحة التحكم' : 'Store admin'}
        </p>
      </div>
      <span className="sidebar-caption">{ar ? 'مساحة العمل' : 'WORKSPACE'}</span>
      <nav aria-label={ar ? 'التنقل في لوحة التحكم' : 'Dashboard navigation'}>
        {visible.map((item) => (
          <Link
            key={item.key}
            to={`${base}/${item.key}`}
            aria-current={selected === item.key ? 'page' : undefined}
            onClick={() => setDrawer(false)}
          >
            <img src={icons[item.icon]} width="24" height="24" alt="" />
            <span>{item.label[language]}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div>
          <LanguageLink showIcon onClick={() => setDrawer(false)} />
        </div>
        <button type="button" onClick={logout}>
          <img src={logoutIcon} width="20" height="20" alt="" />
          {ar ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>
    </>
  )
  return (
    <div className="dashboard">
      <a className="skip-link" href="#workspace">
        {ar ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>
      <aside className="dashboard-sidebar">{sidebar}</aside>
      <div className="dashboard-main">
        <header className="workspace-header">
          <button
            type="button"
            className="icon-button dashboard-menu"
            onClick={(event) => {
              event.currentTarget.focus()
              setDrawer(true)
            }}
            aria-label={ar ? 'القائمة' : 'Menu'}
            aria-haspopup="dialog"
            aria-expanded={drawer}
          >
            <img src={menu} width="24" height="24" alt="" />
          </button>
          <div className="workspace-user">
            {staffUtilities ? (
              <Link
                className="icon-button notification-button"
                to={`${base}/notifications`}
                aria-label={ar ? 'الإشعارات' : 'Notifications'}
              >
                <img src={bell} width="24" height="24" alt="" />
                {notificationBadge?.(user)}
              </Link>
            ) : (
              <button
                type="button"
                className="icon-button notification-button"
                onClick={() => setNotifications(true)}
                aria-label={ar ? 'الإشعارات' : 'Notifications'}
              >
                <img src={bell} width="24" height="24" alt="" />
              </button>
            )}
            <span>{roleLabel}</span>
            {staffUtilities ? (
              <Link
                className="avatar"
                to={`${base}/profile`}
                aria-label={ar ? 'الملف الشخصي' : 'Staff profile'}
              >
                {Array.from(user.name)[0]}
              </Link>
            ) : (
              <span className="avatar" aria-label={user.name}>
                {Array.from(user.name)[0]}
              </span>
            )}
          </div>
        </header>
        {isReview && (
          <div className="review-bar">
            <span>{ar ? 'معاينة للمراجعة · بيانات تجريبية' : 'Review preview · Fixture data'}</span>
            <SelectField
              label={ar ? 'الدور التجريبي' : 'Review role'}
              value={reviewRole}
              onChange={(event) => setReviewRole(event.target.value)}
            >
              {['admin', 'moderator', 'superAdmin'].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectField>
            <Link to={`/${language}`}>{ar ? 'عرض الموقع' : 'View website'}</Link>
          </div>
        )}
        <main className="workspace-content" id="workspace" tabIndex={-1}>
          {error && <Feedback kind="error" title={error} />}
          {allowed ? (
            typeof children === 'function' ? (
              children(user, registerExitGuard)
            ) : (
              children
            )
          ) : (
            <Feedback
              kind="error"
              title={ar ? 'غير مسموح بهذا القسم' : 'You do not have access to this section'}
              action={
                <Button to={`${base}/${staffLanding(config.store, user.role)}`}>
                  {ar ? 'القسم المتاح' : 'Open your workspace'}
                </Button>
              }
            />
          )}
        </main>
      </div>
      <Modal
        open={drawer}
        onClose={() => setDrawer(false)}
        title={ar ? 'مساحة العمل' : 'Workspace'}
        className="dashboard-drawer"
      >
        <div className="drawer-sidebar">{sidebar}</div>
      </Modal>
      <Modal
        open={notifications}
        onClose={() => setNotifications(false)}
        title={ar ? 'الإشعارات' : 'Notifications'}
      >
        <Feedback
          title={
            isReview
              ? ar
                ? 'لا توجد إشعارات'
                : 'No notifications'
              : ar
                ? 'الإشعارات غير متاحة حاليًا'
                : 'Notifications are currently unavailable'
          }
        />
      </Modal>
    </div>
  )
}
