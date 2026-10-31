import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { Button, Feedback, Field } from '../../ui/Primitives.jsx'
import { Metadata } from '../../ui/Metadata.jsx'
import { Icon } from '../../ui/Brand.jsx'
import { useLocale } from '../../ui/Locale.jsx'
import { useRuntime, useSession } from '../../ui/Runtime.jsx'
import { errorMessage } from '../../lib/messages.js'
import { createAccountApi, normalizeEmail, normalizePhone } from './api.js'
import { AccountFrame } from './AccountFrame.jsx'
import manufacturingImage from '../../assets/images/account-manufacturing.webp'
import '../../assets/css/account.css'

const initialAddress = {
  label: '',
  governorate: '',
  district: '',
  building: '',
  street: '',
  floor: '',
  apartment: '',
  details: '',
  contactPhone: '',
}
const AccountContext = createContext(null)
const emailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const phoneValid = (value) => /^\+?\d{6,15}$/.test(normalizePhone(value))
function safeReturnTo(value, language) {
  return value?.startsWith(`/${language}/`) &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/[?#]/.test(value)
    ? value
    : null
}
function displayError(error, language) {
  const message = errorMessage(error, language)
  return error?.status === 429 && error.retryAfter != null
    ? `${message} ${language === 'ar' ? `انتظر ${error.retryAfter} ثانية.` : `Wait ${error.retryAfter} seconds before trying again.`}`
    : message
}

function AccountLayout() {
  const language = useLocale(),
    ar = language === 'ar',
    { config } = useRuntime()
  const { pathname } = useLocation()
  if (
    ['login', 'register', 'verify', 'forgot-password', 'reset-password'].includes(
      pathname.split('/')[3],
    )
  )
    return (
      <div className="auth-access-page">
        <Metadata config={config} title={ar ? 'حساب نارمر' : 'Narmer account'} description="" />
        {config.store === 'b2c' && (
          <p className="auth-breadcrumb">
            <Link to={`/${language}`}>{ar ? 'الرئيسية' : 'Home'}</Link> /{' '}
            {ar ? 'متجر نارمر' : 'Narmer Store'}
          </p>
        )}
        <Outlet />
      </div>
    )
  return (
    <>
      <Metadata
        config={config}
        title={ar ? 'حسابك | نارمر' : 'Your account | Narmer'}
        description=""
        path="/account"
      />
      <AccountFrame>
        <Outlet />
      </AccountFrame>
    </>
  )
}

function useAccount() {
  return useContext(AccountContext)
}

function AccountPage({ page }) {
  const language = useLocale(),
    ar = language === 'ar',
    { config, api, session, restoring, restoreError } = useRuntime(),
    auth = useSession(),
    account = useAccount(),
    navigate = useNavigate(),
    location = useLocation()
  const [profile, setProfile] = useState(null),
    [addresses, setAddresses] = useState([]),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(null),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null),
    [leaving, setLeaving] = useState(false)
  const noticeRevision = useRef(0)
  const customer = auth.user?.role === 'user'
  useEffect(() => {
    if (restoring || !auth.user) return
    let active = true
    Promise.all([account.profile(), ...(customer ? [account.addresses()] : [])])
      .then(([nextProfile, nextAddresses]) => {
        if (active) {
          setProfile(nextProfile)
          setAddresses(nextAddresses || [])
        }
      })
      .catch((reason) => {
        if (active) setError(displayError(reason, language))
      })
    return () => {
      active = false
    }
  }, [account, auth.user, customer, language, restoring])
  async function saveProfile(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget),
      body = {
        name: String(form.get('name')).trim(),
        phone: normalizePhone(String(form.get('phone'))),
      }
    if (!body.name || body.name.length > 100 || !phoneValid(body.phone)) {
      setError(ar ? 'أدخل اسمًا ورقم هاتف صالحين.' : 'Enter a valid name and phone number.')
      return
    }
    setBusy(true)
    setError('')
    try {
      setProfile(await account.updateProfile(body))
      setNotice({
        route: location.key,
        id: ++noticeRevision.current,
        message: ar ? 'تم حفظ الملف الشخصي.' : 'Profile saved.',
      })
    } catch (reason) {
      setError(displayError(reason, language))
    } finally {
      setBusy(false)
    }
  }
  async function saveAddress(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget),
      body = Object.fromEntries(
        Object.keys(initialAddress).map((key) => [key, String(form.get(key) ?? '').trim()]),
      )
    body.contactPhone = body.contactPhone || null
    if (!body.label || !body.governorate || !body.building || !body.street) {
      setError(ar ? 'أكمل الحقول المطلوبة.' : 'Complete the required fields.')
      return
    }
    if (body.contactPhone && !phoneValid(body.contactPhone)) {
      setError(ar ? 'رقم الهاتف غير صالح.' : 'Enter a valid phone number.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const address = editing
        ? await account.updateAddress(editing.id, body)
        : await account.createAddress(body)
      setAddresses((current) =>
        editing
          ? current.map((item) => (item.id === address.id ? address : item))
          : [...current, address],
      )
      setEditing(null)
      setNotice({
        route: location.key,
        id: ++noticeRevision.current,
        message: ar ? 'تم حفظ العنوان.' : 'Address saved.',
      })
    } catch (reason) {
      setError(displayError(reason, language))
    } finally {
      setBusy(false)
    }
  }
  async function removeAddress(id) {
    setBusy(true)
    setError('')
    try {
      await account.deleteAddress(id)
      setAddresses((current) => current.filter((item) => item.id !== id))
      setNotice({
        route: location.key,
        id: ++noticeRevision.current,
        message: ar ? 'تم حذف العنوان.' : 'Address deleted.',
      })
    } catch (reason) {
      setError(displayError(reason, language))
      if (reason.code === 'ADDRESS_NOT_FOUND')
        account
          .addresses()
          .then(setAddresses)
          .catch(() => {})
    } finally {
      setBusy(false)
    }
  }
  if (restoring)
    return (
      <Feedback
        kind="loading"
        skeleton="form"
        title={ar ? 'جارٍ استعادة الجلسة' : 'Restoring your session'}
      />
    )
  if (!auth.user && leaving)
    return (
      <Feedback kind="loading" skeleton="form" title={ar ? 'جارٍ تسجيل الخروج' : 'Signing out'} />
    )
  if (!auth.user)
    return (
      <Navigate to={`/${language}/account/login`} replace state={{ returnTo: location.pathname }} />
    )
  if (restoreError) return <Feedback kind="error" title={errorMessage(restoreError, language)} />
  if ((!profile && !error) || (profile && profile.id !== auth.user.id))
    return (
      <Feedback
        kind="loading"
        skeleton="form"
        title={ar ? 'جارٍ تحميل الحساب' : 'Loading account'}
      />
    )
  const title =
    page === 'addresses'
      ? ar
        ? 'عناويني'
        : 'My addresses'
      : page === 'profile'
        ? ar
          ? 'ملفك الشخصي'
          : 'Your profile'
        : ar
          ? 'مرحبًا'
          : 'Welcome'
  return (
    <section className={`account-panel account-panel--${page}`}>
      <div className="account-panel-heading">
        <p className="account-eyebrow">{ar ? 'مساحة خاصة' : 'PRIVATE ACCOUNT'}</p>
        <h2>
          {title}
          {page === 'index' && profile ? `${ar ? '، ' : ', '}${profile.name}` : ''}
        </h2>
        {page === 'profile' && (
          <p className="profile-description">
            {ar
              ? 'حدّث بيانات التواصل التي نستخدمها لمتابعة طلباتك.'
              : 'Keep your contact details up to date so we can reach you about your orders.'}
          </p>
        )}
        {page === 'addresses' && (
          <p className="profile-description">
            {ar
              ? 'احفظ عناوين التوصيل لتستخدمها عند إتمام طلبك.'
              : 'Save your delivery details for a quicker checkout next time.'}
          </p>
        )}
      </div>
      {error && <Feedback kind="error" title={error} />}
      {notice?.route === location.key && (
        <Feedback key={notice.id} kind="success" title={notice.message} />
      )}
      {page === 'index' && (
        <div className="account-overview">
          <p>
            {ar
              ? 'إدارة بياناتك وعناوين التوصيل المحفوظة.'
              : 'Manage your profile and saved delivery addresses.'}
          </p>
          <div className="account-links">
            <Link to={`/${language}/account/profile`}>
              <div>
                <strong>{ar ? 'تعديل الملف الشخصي' : 'Edit profile'}</strong>
                <p>{ar ? 'اسمك وبيانات التواصل' : 'Your name and contact details'}</p>
              </div>
              <Icon name="arrow" />
            </Link>
            {customer && (
              <Link to={`/${language}/account/addresses`}>
                <div>
                  <strong>{ar ? 'إدارة العناوين' : 'Manage addresses'}</strong>
                  <p>{ar ? 'أماكن التوصيل المفضلة' : 'Your preferred delivery locations'}</p>
                </div>
                <Icon name="arrow" />
              </Link>
            )}
            {config.store === 'b2c' && customer && (
              <Link to={`/${language}/orders`}>
                <div>
                  <strong>{ar ? 'طلباتك' : 'Your orders'}</strong>
                  <p>
                    {ar ? 'عرض الطلبات ومتابعة حالتها' : 'View purchases and follow their progress'}
                  </p>
                </div>
                <Icon name="arrow" />
              </Link>
            )}
            {config.store === 'b2b' && (
              <Link to={`/${language}/${customer ? 'requests' : 'dashboard/requests'}`}>
                <div>
                  <strong>{ar ? 'سجل الطلبات' : 'Request history'}</strong>
                  <p>
                    {customer
                      ? ar
                        ? 'عرض طلباتك ومتابعة رد الفريق'
                        : 'View your requests and follow their progress'
                      : ar
                        ? 'فتح الطلبات في لوحة تحكم الموظفين'
                        : 'Open requests in your staff dashboard'}
                  </p>
                </div>
                <Icon name="arrow" />
              </Link>
            )}
          </div>
          <div className="account-overview-actions">
            <Button
              variant="secondary"
              onClick={async () => {
                setLeaving(true)
                setBusy(true)
                setError('')
                try {
                  if (config.mode === 'fixtures') session.clear()
                  else await session.logout(api)
                  navigate(`/${language}`, { replace: true })
                } catch (reason) {
                  setLeaving(false)
                  setError(displayError(reason, language))
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
            >
              {ar ? 'تسجيل الخروج' : 'Sign out'}
            </Button>
          </div>
        </div>
      )}
      {page === 'profile' && profile && (
        <div className={`profile-layout${customer ? '' : ' profile-layout--single'}`}>
          <form onSubmit={saveProfile} className="account-form profile-form">
            <div className="profile-field-row">
              <Field
                label={ar ? 'الاسم الكامل' : 'Full name'}
                name="name"
                defaultValue={profile.name}
                maxLength={100}
                required
                disabled={busy}
              />
              <Field
                label={ar ? 'رقم الهاتف' : 'Phone number'}
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={profile.phone}
                required
                disabled={busy}
              />
            </div>
            <div className="readonly-email">
              <span>{ar ? 'البريد الإلكتروني' : 'Email address'}</span>
              <strong dir="ltr">{profile.email}</strong>
              <small>{ar ? 'البريد الإلكتروني لا يمكن تغييره.' : 'Email cannot be changed.'}</small>
            </div>
            <div className="account-actions">
              <Button type="submit" disabled={busy}>
                {busy ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : ar ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
          {customer && (
            <aside className="profile-sidebar" aria-label={ar ? 'روابط الحساب' : 'Account links'}>
              <h3>{ar ? 'خيارات الحساب' : 'Account options'}</h3>
              <Link to={`/${language}/account/addresses`}>
                {ar ? 'العناوين المحفوظة' : 'Saved addresses'} <Icon name="arrow" />
              </Link>
            </aside>
          )}
        </div>
      )}
      {page === 'addresses' && customer && (
        <div className="address-layout">
          <div className="address-list">
            {addresses.length ? (
              addresses.map((address) => (
                <article className="address-item" key={address.id}>
                  <div>
                    <h3>{address.label}</h3>
                    <p>
                      {[address.building, address.street, address.district, address.governorate]
                        .filter(Boolean)
                        .join(ar ? '، ' : ', ')}
                    </p>
                    <small>
                      <bdi>{address.effectiveContactPhone}</bdi>
                    </small>
                  </div>
                  <div className="address-actions">
                    <button type="button" onClick={() => setEditing(address)} disabled={busy}>
                      {ar ? 'تعديل' : 'Edit'}
                    </button>
                    <button type="button" onClick={() => removeAddress(address.id)} disabled={busy}>
                      {ar ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">
                {ar ? 'لا توجد عناوين محفوظة بعد.' : 'No saved addresses yet.'}
              </p>
            )}
          </div>
          <form
            key={editing?.id || 'new'}
            onSubmit={saveAddress}
            className="account-form address-form"
          >
            <h3>
              {editing
                ? ar
                  ? 'تعديل العنوان'
                  : 'Edit address'
                : ar
                  ? 'إضافة عنوان'
                  : 'Add an address'}
            </h3>
            <div className="address-fields">
              {Object.entries({
                label: ar ? 'اسم العنوان' : 'Address label',
                governorate: ar ? 'المحافظة' : 'Governorate',
                district: ar ? 'المنطقة' : 'District',
                building: ar ? 'المبنى' : 'Building',
                street: ar ? 'الشارع' : 'Street',
                floor: ar ? 'الطابق' : 'Floor',
                apartment: ar ? 'الشقة' : 'Apartment',
              }).map(([key, label]) => (
                <Field
                  key={key}
                  label={`${label}${['label', 'governorate', 'building', 'street'].includes(key) ? ' *' : ''}`}
                  name={key}
                  defaultValue={editing?.[key] || ''}
                  required={['label', 'governorate', 'building', 'street'].includes(key)}
                  disabled={busy}
                />
              ))}
              <div className="field">
                <label htmlFor="address-details">
                  {ar ? 'تفاصيل التوصيل' : 'Delivery details'}
                </label>
                <textarea
                  id="address-details"
                  name="details"
                  maxLength={1000}
                  defaultValue={editing?.details || ''}
                  disabled={busy}
                />
              </div>
              <Field
                label={ar ? 'هاتف لهذا العنوان (اختياري)' : 'Phone for this address (optional)'}
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                defaultValue={editing?.contactPhone || ''}
                disabled={busy}
                hint={
                  ar
                    ? 'اتركه فارغًا لاستخدام هاتف الملف الشخصي.'
                    : 'Leave blank to use your profile phone.'
                }
              />
            </div>
            <div className="account-actions">
              <Button type="submit" disabled={busy}>
                {busy
                  ? ar
                    ? 'جارٍ الحفظ…'
                    : 'Saving…'
                  : editing
                    ? ar
                      ? 'حفظ العنوان'
                      : 'Save address'
                    : ar
                      ? 'إضافة العنوان'
                      : 'Add address'}
              </Button>
              {editing && (
                <button type="button" className="account-cancel" onClick={() => setEditing(null)}>
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {page === 'addresses' && !customer && (
        <Feedback
          kind="error"
          title={
            ar
              ? 'العناوين متاحة لحسابات العملاء فقط.'
              : 'Addresses are available to customer accounts only.'
          }
        />
      )}
    </section>
  )
}

function AuthPage({ page, image }) {
  const language = useLocale(),
    ar = language === 'ar',
    { config, session, restoring } = useRuntime(),
    account = useAccount(),
    auth = useSession(),
    navigate = useNavigate(),
    location = useLocation()
  const [email, setEmail] = useState(location.state?.email || account.demoEmail || ''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [retryAfter, setRetryAfter] = useState(() => account.authCooldown())
  const [loginDestination, setLoginDestination] = useState(null)
  const labels = {
    login: ar ? 'تسجيل الدخول' : 'Sign in',
    register: ar ? 'إنشاء حساب' : 'Create account',
    verify: ar ? 'تأكيد البريد الإلكتروني' : 'Verify your email',
    'forgot-password': ar ? 'استعادة كلمة المرور' : 'Reset your password',
    'reset-password': ar ? 'اختيار كلمة مرور جديدة' : 'Choose a new password',
  }
  const formRef = useRef(null)
  useEffect(() => {
    if (!retryAfter) return
    const timer = setTimeout(() => setRetryAfter((value) => Math.max(0, value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [retryAfter])
  const passwordOk = (value) =>
    value.length >= 8 && value.length <= 72 && new TextEncoder().encode(value).length <= 72
  function applyRateLimit(error) {
    if (error.status === 429 && error.retryAfter != null) {
      account.setAuthCooldown(error.retryAfter)
      setRetryAfter(account.authCooldown())
    }
  }
  async function submit(event) {
    event.preventDefault()
    if (retryAfter) return
    const form = new FormData(event.currentTarget),
      data = Object.fromEntries(form.entries())
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const normalized = normalizeEmail(String(data.email || email))
      setEmail(normalized)
      if (!emailValid(normalized))
        throw new Error(ar ? 'أدخل بريدًا إلكترونيًا صالحًا.' : 'Enter a valid email address.')
      if (page === 'register') {
        const name = String(data.name).trim(),
          phone = normalizePhone(String(data.phone)),
          password = String(data.password)
        if (!name || name.length > 100 || !phoneValid(phone) || !passwordOk(password))
          throw new Error(
            ar
              ? 'راجع الاسم والهاتف وكلمة المرور.'
              : 'Check the name, phone and password requirements.',
          )
        await account.register({ name, email: normalized, phone, password })
        navigate(`/${language}/account/verify`, { state: { email: normalized }, replace: true })
        setNotice(
          ar ? 'راجع بريدك لإدخال رمز التأكيد.' : 'Check your email for a verification code.',
        )
      } else if (page === 'verify') {
        const otp = String(data.otp)
        if (!/^\d{6}$/.test(otp))
          throw new Error(ar ? 'أدخل الرمز المكون من ستة أرقام.' : 'Enter the six-digit code.')
        await account.verifyEmail(normalized, otp)
        navigate(`/${language}/account/login`, { state: { email: normalized }, replace: true })
      } else if (page === 'login') {
        const result = await account.login({ email: normalized, password: String(data.password) })
        if (config.mode !== 'fixtures') session.accept(result)
        const merged = await account.afterLogin?.(result.user)
        const returnTo = safeReturnTo(location.state?.returnTo, language)
        setLoginDestination(
          (merged === false ? `/${language}/cart` : returnTo) ||
            (result.user.role === 'user' ? `/${language}/account` : `/${language}/dashboard`),
        )
      } else if (page === 'forgot-password') {
        await account.forgotPassword(normalized)
        setNotice(
          ar
            ? 'إذا كان الحساب مؤهلًا، ستصلك رسالة. لا تكشف هذه الرسالة ما إذا كان الحساب موجودًا.'
            : 'If the account is eligible, an email will arrive. This message does not reveal whether the account exists.',
        )
      } else if (page === 'reset-password') {
        const otp = String(data.otp),
          password = String(data.password)
        if (!/^\d{6}$/.test(otp) || !passwordOk(password))
          throw new Error(
            ar
              ? 'راجع رمز التأكيد ومتطلبات كلمة المرور.'
              : 'Check the code and password requirements.',
          )
        await account.resetPassword({ email: normalized, otp, password })
        navigate(`/${language}/account/login`, { state: { email: normalized }, replace: true })
      }
      if (account.demo)
        setNotice(
          page === 'login'
            ? ar
              ? 'تم تسجيل الدخول في وضع المراجعة فقط.'
              : 'Signed in to the review preview only.'
            : notice,
        )
    } catch (reason) {
      applyRateLimit(reason)
      if (reason.code === 'EMAIL_NOT_VERIFIED' && page === 'login')
        navigate(`/${language}/account/verify`, { state: { email: normalizeEmail(email) } })
      setError(reason.status ? displayError(reason, language) : reason.message)
    } finally {
      setBusy(false)
    }
  }
  if (restoring)
    return (
      <Feedback
        kind="loading"
        skeleton="form"
        title={ar ? 'جارٍ استعادة الجلسة' : 'Restoring your session'}
      />
    )
  if (auth.user && page === 'login' && !busy)
    return <Navigate to={loginDestination || `/${language}/account`} replace />
  const needsOtp = ['verify', 'reset-password'].includes(page)
  return (
    <div className={`auth-stage ${page === 'login' ? 'auth-stage--login' : ''}`}>
      {page === 'login' && (
        <figure className="auth-art">
          <img
            src={image?.src || manufacturingImage}
            alt={
              image?.alt ||
              (ar
                ? 'تجهيز أقمشة وقطع ملابس بجانب ماكينة خياطة'
                : 'Fabric and garment pieces beside a sewing machine')
            }
            width="704"
            height="600"
          />
          <figcaption>
            {image?.caption ||
              (ar ? 'من القماش إلى ملابسك اليومية.' : 'From fabric to your everyday.')}
          </figcaption>
        </figure>
      )}
      <section className="account-panel auth-panel">
        {page !== 'login' && (
          <p className="account-eyebrow">{ar ? 'حساب نارمر' : 'NARMER ACCOUNT'}</p>
        )}
        <h1>{page === 'login' ? (ar ? 'مرحبًا بعودتك' : 'Welcome back') : labels[page]}</h1>
        <p className="auth-intro">
          {page === 'verify'
            ? ar
              ? 'أدخل الرمز المرسل إلى بريدك الإلكتروني.'
              : 'Enter the code sent to your email.'
            : page === 'forgot-password'
              ? ar
                ? 'أدخل بريدك لاستعادة الوصول إلى حسابك.'
                : 'Enter your email to recover account access.'
              : ''}
        </p>
        {account.demo && (
          <div className="demo-note" role="note">
            <strong>{ar ? 'وضع المراجعة فقط' : 'Review preview only'}</strong>
            <p>
              {ar
                ? 'لا يتم إرسال بريد أو تسجيل دخول حقيقي. للحساب التجريبي استخدم'
                : 'No email is sent and no real sign-in occurs. Use the demo account'}{' '}
              <bdi>{account.demoEmail}</bdi>
              {page === 'login' ? (
                <>
                  {' '}
                  · <bdi>{account.demoPassword}</bdi>
                </>
              ) : null}
              {needsOtp ? (
                <>
                  {' '}
                  · {ar ? 'الرمز:' : 'Code:'} <bdi>{account.demoOtp}</bdi>
                </>
              ) : null}
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
        <form ref={formRef} onSubmit={submit} className="account-form">
          {page === 'register' && (
            <Field
              label={ar ? 'الاسم الكامل' : 'Full name'}
              name="name"
              maxLength={100}
              autoComplete="name"
              required
              disabled={busy}
            />
          )}
          <Field
            label={ar ? 'البريد الإلكتروني' : 'Email address'}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || (needsOtp && Boolean(location.state?.email))}
          />
          {page === 'register' && (
            <Field
              label={ar ? 'رقم الهاتف' : 'Phone number'}
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              disabled={busy}
            />
          )}
          {needsOtp && (
            <Field
              label={ar ? 'رمز التأكيد المكون من ستة أرقام' : 'Six-digit code'}
              name="otp"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              autoComplete="one-time-code"
              required
              disabled={busy}
            />
          )}
          {['login', 'register', 'reset-password'].includes(page) && (
            <Field
              key={page}
              label={
                page === 'reset-password'
                  ? ar
                    ? 'كلمة المرور الجديدة'
                    : 'New password'
                  : ar
                    ? 'كلمة المرور'
                    : 'Password'
              }
              name="password"
              type="password"
              revealPassword
              autoComplete={page === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              maxLength={72}
              required
              disabled={busy}
              hint={
                page === 'login'
                  ? undefined
                  : ar
                    ? 'من 8 إلى 72 حرفًا أو بايت UTF-8.'
                    : '8 to 72 characters and at most 72 UTF-8 bytes.'
              }
            />
          )}
          <div className="account-actions">
            <Button
              type="submit"
              variant="accent"
              className="auth-submit"
              disabled={busy || retryAfter > 0}
            >
              {busy ? (ar ? 'جارٍ الإرسال…' : 'Sending…') : labels[page]}
            </Button>
          </div>
        </form>
        {page === 'verify' && (
          <button
            className="account-resend"
            type="button"
            disabled={busy || retryAfter > 0}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await account.resendOtp(normalizeEmail(email))
                if (formRef.current?.elements.namedItem('otp'))
                  formRef.current.elements.namedItem('otp').value = ''
                setNotice(ar ? 'تم طلب إرسال الرمز.' : 'A code resend was requested.')
              } catch (reason) {
                applyRateLimit(reason)
                setError(displayError(reason, language))
              } finally {
                setBusy(false)
              }
            }}
          >
            {ar ? 'إعادة إرسال الرمز' : 'Resend code'}
          </button>
        )}
        {page === 'reset-password' && (
          <button
            className="account-resend"
            type="button"
            disabled={busy || retryAfter > 0}
            onClick={async () => {
              setBusy(true)
              try {
                await account.forgotPassword(normalizeEmail(email))
                if (formRef.current?.elements.namedItem('otp'))
                  formRef.current.elements.namedItem('otp').value = ''
                setNotice(
                  ar
                    ? 'إذا كان الحساب مؤهلًا، ستصلك رسالة.'
                    : 'If the account is eligible, an email will arrive.',
                )
              } catch (reason) {
                applyRateLimit(reason)
                setError(displayError(reason, language))
              } finally {
                setBusy(false)
              }
            }}
          >
            {ar ? 'طلب رمز جديد' : 'Request a new code'}
          </button>
        )}
        <div className="auth-links">
          {page === 'login' && (
            <>
              <Link to={`/${language}/account/forgot-password`} state={{ email }}>
                {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
              <p>{ar ? 'هل هذه زيارتك الأولى؟ أنشئ حسابًا.' : 'New here? Create an account.'}</p>
              <Link to={`/${language}/account/register`}>
                {ar ? 'إنشاء حساب جديد' : 'Create account'}
              </Link>
            </>
          )}
          {page === 'register' && (
            <Link to={`/${language}/account/login`}>
              {ar ? 'لديك حساب؟ تسجيل الدخول' : 'Already have an account? Sign in'}
            </Link>
          )}
          {page === 'forgot-password' && (
            <Link to={`/${language}/account/reset-password`} state={{ email }}>
              {ar ? 'أدخل رمز الاستعادة' : 'Enter the recovery code'}
            </Link>
          )}
          {['verify', 'reset-password'].includes(page) && (
            <Link to={`/${language}/account/login`} state={{ email }}>
              {ar ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
            </Link>
          )}
        </div>
        {page === 'login' && (
          <p className="auth-footnote">
            {config.store === 'b2b'
              ? ar
                ? 'لا تحتاج إلى حساب لإرسال طلب أو تتبعه برابطك الخاص.'
                : 'No account is needed to send a request or track it using your private link.'
              : ar
                ? 'لا يتطلب التسوق إنشاء حساب.'
                : 'Shopping does not require an account.'}
          </p>
        )}
      </section>
    </div>
  )
}

export function AccountRoutes({ afterLogin, loginImage }) {
  const language = useLocale(),
    { config, api, session } = useRuntime()
  const account = useMemo(() => createAccountApi({ config, api, session }), [config, api, session])
  return (
    <AccountContext.Provider value={{ ...account, afterLogin }}>
      <Routes>
        <Route element={<AccountLayout />}>
          <Route index element={<AccountPage page="index" />} />
          <Route path="profile" element={<AccountPage page="profile" />} />
          <Route path="addresses" element={<AccountPage page="addresses" />} />
          <Route path="login" element={<AuthPage page="login" image={loginImage} />} />
          <Route path="register" element={<AuthPage page="register" />} />
          <Route path="verify" element={<AuthPage page="verify" />} />
          <Route path="forgot-password" element={<AuthPage page="forgot-password" />} />
          <Route path="reset-password" element={<AuthPage page="reset-password" />} />
          <Route path="*" element={<Navigate to={`/${language}/account`} replace />} />
        </Route>
      </Routes>
    </AccountContext.Provider>
  )
}
