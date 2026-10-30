import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Brand } from '../../ui/Brand.jsx'
import { LanguageLink, useLocale } from '../../ui/Locale.jsx'
import { Button, Feedback, Field } from '../../ui/Primitives.jsx'
import { useRuntime, useSession } from '../../ui/Runtime.jsx'
import { Metadata } from '../../ui/Metadata.jsx'
import { canUseDashboard, staffLanding } from '../../lib/session.js'
import { ApiError } from '../../lib/api.js'
import { errorMessage } from '../../lib/messages.js'
import { createAccountApi, normalizeEmail } from './api.js'
import '../../assets/css/account.css'
import '../../assets/css/staff-access.css'

export function StaffAccess({ page = 'login' }) {
  const language = useLocale(),
    ar = language === 'ar'
  const { config, api, session } = useRuntime(),
    auth = useSession()
  const account = useMemo(() => createAccountApi({ config, api, session }), [config, api, session])
  const location = useLocation(),
    navigate = useNavigate(),
    base = `/${language}/dashboard`
  const [email, setEmail] = useState(location.state?.email || '')
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [retryAfter, setRetryAfter] = useState(account.authCooldown)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const login = page === 'login',
    reset = page === 'reset-password'
  const title = login
    ? ar
      ? 'دخول الموظفين'
      : 'Staff sign in'
    : reset
      ? ar
        ? 'اختيار كلمة مرور جديدة'
        : 'Choose a new password'
      : ar
        ? 'استعادة كلمة المرور'
        : 'Reset your password'
  const requested = location.state?.returnTo
  const returnTo =
    typeof requested === 'string' &&
    requested.startsWith(`${base}/`) &&
    !/[?#\\]/.test(requested) &&
    !requested.includes('..') &&
    !requested.includes('//') &&
    !['login', 'forgot-password', 'reset-password'].includes(requested.split('/')[3])
      ? requested
      : null
  const destination = (user) => returnTo || `${base}/${staffLanding(config.store, user?.role)}`
  useEffect(() => {
    if (!retryAfter) return
    const timer = setTimeout(() => setRetryAfter(Math.max(0, account.authCooldown())), 1000)
    return () => clearTimeout(timer)
  }, [account, retryAfter])
  if (login && canUseDashboard(auth.user, config.store))
    return <Navigate to={destination(auth.user)} replace />

  async function submit(event) {
    event.preventDefault()
    if (busy || retryAfter) return
    const form = event.currentTarget,
      body = new FormData(form)
    const normalized = normalizeEmail(email)
    setEmail(normalized)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (login) {
        const password = String(body.get('password'))
        let result
        if (config.mode === 'fixtures') {
          if (normalized !== 'staff@example.test' || password !== 'NarmerDemo123')
            throw new ApiError('INVALID_CREDENTIALS', { status: 401 })
          result = {
            user: {
              id: 'review-staff',
              store: config.store,
              role: 'admin',
              name: 'Review staff',
              email: normalized,
            },
            accessToken: 'memory-only-review-staff',
            expiresIn: 900,
          }
        } else result = await account.login({ email: normalized, password })
        session.accept(result)
        if (!canUseDashboard(result.user, config.store)) {
          setError(
            ar
              ? 'تحتاج إلى حساب موظف في هذا المتجر لفتح لوحة التحكم.'
              : 'Use a staff account for this store to open the dashboard.',
          )
          return
        }
        navigate(destination(result.user), { replace: true })
      } else if (reset) {
        const password = String(body.get('password'))
        if (new TextEncoder().encode(password).length > 72)
          throw new ApiError('PASSWORD_TOO_LONG', { status: 422 })
        await account.resetPassword({ email: normalized, otp: String(body.get('otp')), password })
        navigate(`${base}/login`, { state: { email: normalized }, replace: true })
      } else {
        await account.forgotPassword(normalized)
        setNotice(
          ar
            ? 'إذا كان الحساب مؤهلًا، ستصلك رسالة برمز الاستعادة.'
            : 'If the account is eligible, an email with a recovery code will arrive.',
        )
      }
    } catch (reason) {
      if (reason.status === 429 && reason.retryAfter != null) {
        account.setAuthCooldown(reason.retryAfter)
        setRetryAfter(account.authCooldown())
      }
      setError(errorMessage(reason, language))
    } finally {
      const password = form.elements.namedItem('password')
      if (password) password.value = ''
      setPasswordVisible(false)
      setBusy(false)
    }
  }

  return (
    <div className="staff-access">
      <Metadata
        config={config}
        title={`${login ? (ar ? 'دخول الموظفين' : 'Staff Login') : title} | Narmer`}
        description=""
        path={`/dashboard/${page}`}
      />
      <main className="staff-access-panel" id="main" tabIndex={-1}>
        <div className="staff-access-language">
          <LanguageLink showIcon />
        </div>
        <Link className="staff-access-brand" to={`/${language}`} aria-label="Narmer">
          <Brand />
        </Link>
        <section className="account-panel auth-panel">
          <h1>{title}</h1>
          {!login && (
            <p className="auth-intro">
              {ar
                ? 'استخدم البريد الإلكتروني الخاص بحساب الموظف.'
                : 'Use your staff account email address.'}
            </p>
          )}
          {config.mode === 'fixtures' && (
            <div className="demo-note" role="note">
              <strong>{ar ? 'معاينة للمراجعة فقط' : 'Review preview only'}</strong>
              <p>
                {ar ? 'لا يوجد تسجيل دخول أو بريد حقيقي.' : 'No real sign-in or email.'}{' '}
                <bdi>staff@example.test</bdi> · <bdi>NarmerDemo123</bdi>
              </p>
            </div>
          )}
          {error && <Feedback kind="error" title={error} />}
          {notice && <Feedback kind="success" title={notice} />}
          {retryAfter > 0 && (
            <p className="account-cooldown" role="status">
              {ar
                ? `انتظر ${retryAfter} ثانية قبل المحاولة مجددًا.`
                : `Wait ${retryAfter} seconds before trying again.`}
            </p>
          )}
          <form className="account-form" onSubmit={submit}>
            <Field
              label={ar ? 'البريد الإلكتروني' : 'Email'}
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
            {reset && (
              <Field
                label={ar ? 'رمز التأكيد المكون من ستة أرقام' : 'Six-digit code'}
                name="otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                autoComplete="one-time-code"
                required
                disabled={busy}
              />
            )}
            {(login || reset) && (
              <div className="staff-password-field">
                <Field
                  label={
                    reset
                      ? ar
                        ? 'كلمة المرور الجديدة'
                        : 'New password'
                      : ar
                        ? 'كلمة المرور'
                        : 'Password'
                  }
                  name="password"
                  id="staff-password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete={login ? 'current-password' : 'new-password'}
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="staff-password-toggle"
                  disabled={busy}
                  aria-label={
                    passwordVisible
                      ? ar
                        ? 'إخفاء كلمة المرور'
                        : 'Hide password'
                      : ar
                        ? 'إظهار كلمة المرور'
                        : 'Show password'
                  }
                  aria-pressed={passwordVisible}
                  aria-controls="staff-password"
                  onClick={() => setPasswordVisible((value) => !value)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {passwordVisible && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </div>
            )}
            <div className="account-actions">
              <Button
                type="submit"
                variant="accent"
                className="auth-submit"
                disabled={busy || retryAfter > 0}
              >
                {busy
                  ? ar
                    ? 'جارٍ الإرسال…'
                    : 'Sending…'
                  : login
                    ? ar
                      ? 'تسجيل الدخول'
                      : 'Sign in'
                    : reset
                      ? ar
                        ? 'حفظ كلمة المرور'
                        : 'Save password'
                      : ar
                        ? 'إرسال رمز الاستعادة'
                        : 'Send recovery code'}
              </Button>
            </div>
          </form>
          <div className="auth-links">
            {login ? (
              <Link to={`${base}/forgot-password`} state={{ email }}>
                {ar ? 'نسيت كلمة المرور' : 'Forgot password'}
              </Link>
            ) : (
              <>
                {!reset && (
                  <Link to={`${base}/reset-password`} state={{ email }}>
                    {ar ? 'أدخل رمز الاستعادة' : 'Enter the recovery code'}
                  </Link>
                )}
                <Link to={`${base}/login`} state={{ email }}>
                  {ar ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
                </Link>
              </>
            )}
          </div>
          {login && (
            <p className="auth-footnote">
              {ar
                ? 'لوحة التحكم متاحة لحسابات الموظفين المصرح لها فقط.'
                : 'Dashboard access is restricted to authorized staff accounts.'}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
