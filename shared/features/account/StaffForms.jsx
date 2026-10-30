import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Field, Feedback, Modal } from '../../ui/Primitives.jsx'
import { SelectField } from '../../ui/SelectField.jsx'
import { useRuntime } from '../../ui/Runtime.jsx'
import { ApiError } from '../../lib/api.js'
import { createdAccount, createAccountPayload } from '../../lib/staff-account.js'

const unknownWrite = (error) =>
  !error.status || error.status >= 500 || error.code === 'INVALID_RESPONSE'
function useDraftGuard(dirty, leaveGuards) {
  const id = useId()
  useEffect(() => {
    const guards = leaveGuards.current
    if (dirty) guards.add(id)
    else guards.delete(id)
    return () => guards.delete(id)
  }, [dirty, id, leaveGuards])
}

export function StaffAccountCreate({ dashboard, ErrorView, onCreated }) {
  const { user, language, request, confirmUnsaved, leaveGuards } = dashboard,
    { config } = useRuntime(),
    ar = language === 'ar'
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'moderator',
    }),
    [created, setCreated] = useState(null),
    [error, setError] = useState(null),
    [uncertain, setUncertain] = useState(false)
  const dirty =
    ['name', 'email', 'phone', 'password'].some((key) => draft[key].trim()) ||
    draft.role !== 'moderator'
  useDraftGuard(open && dirty, leaveGuards)
  if (user.role !== 'superAdmin') return null
  function close(handoffComplete = false) {
    if (busy) return
    if (handoffComplete !== true && dirty && !confirmUnsaved()) return
    setOpen(false)
    setDraft({ name: '', email: '', phone: '', password: '', role: 'moderator' })
    setCreated(null)
    setError(null)
    setUncertain(false)
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || uncertain) return
    setBusy(true)
    setError(null)
    try {
      const body = createAccountPayload(draft)
      const account = await request('/users', { method: 'POST', body })
      setCreated(createdAccount(account, config.store, body))
      onCreated?.()
    } catch (failure) {
      setError(failure)
      if (unknownWrite(failure)) {
        setUncertain(true)
        setDraft((current) => ({ ...current, password: '' }))
        onCreated?.()
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button
        variant="accent"
        onClick={() => {
          setError(null)
          setCreated(null)
          setUncertain(false)
          setDraft({ name: '', email: '', phone: '', password: '', role: 'moderator' })
          setOpen(true)
        }}
      >
        {ar ? 'إنشاء حساب موظف' : 'Create staff account'}
      </Button>
      <Modal open={open} onClose={close} title={ar ? 'إنشاء حساب موظف' : 'Create staff account'}>
        {created ? (
          <>
            <Feedback kind="success" title={ar ? 'تم إنشاء الحساب' : 'Account created'}>
              {created.name} · {created.email}
            </Feedback>
            <p>
              {ar
                ? 'سلّم كلمة المرور الأولية يدويًا للشخص. لا تُرسل كلمة المرور بالبريد أو الرسائل.'
                : 'Hand the initial password to the person directly. Do not send it by email or message.'}
            </p>
            <Field
              label={ar ? 'كلمة المرور الأولية' : 'Initial password'}
              value={draft.password}
              readOnly
              dir="ltr"
            />
            <p className="staff-help">
              {config.mode === 'fixtures'
                ? ar
                  ? 'معاينة محلية فقط. لا ينشئ هذا حسابًا حقيقيًا ولا يمكنه تسجيل الدخول.'
                  : 'Local review only. This does not create a real account and cannot sign in.'
                : ar
                  ? 'يمكن للحساب تسجيل الدخول الآن دون تحقق بالبريد. غيّر كلمة المرور من الملف الشخصي بعد تسليمها.'
                  : 'The account can sign in immediately without email verification. Change the password from Staff profile after handoff.'}
            </p>
            <Button onClick={() => close(true)}>{ar ? 'تم التسليم' : 'Handoff complete'}</Button>
          </>
        ) : (
          <form onSubmit={submit} className="staff-create-account">
            <p className="staff-help">
              {config.mode === 'fixtures'
                ? ar
                  ? 'معاينة محلية فقط. الحسابات وكلمات المرور هنا لا تُرسل إلى الخادم.'
                  : 'Local review only. Accounts and passwords here are not sent to the server.'
                : ar
                  ? `ينشئ هذا الحساب النشط فورًا في متجر ${config.store.toUpperCase()}. سلّم كلمة المرور الأولية يدويًا.`
                  : `This creates an active account in the ${config.store.toUpperCase()} store immediately. Hand over the initial password manually.`}
            </p>
            <Field
              label={ar ? 'الاسم' : 'Name'}
              required
              maxLength={100}
              autoComplete="name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            <Field
              label={ar ? 'البريد الإلكتروني' : 'Email'}
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              dir="ltr"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
            <Field
              label={ar ? 'الهاتف' : 'Phone'}
              required
              type="tel"
              autoComplete="tel"
              dir="ltr"
              maxLength={32}
              value={draft.phone}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            />
            <Field
              label={ar ? 'كلمة المرور الأولية' : 'Initial password'}
              required
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            />
            <SelectField
              label={ar ? 'الدور' : 'Role'}
              value={draft.role}
              onChange={(event) => setDraft({ ...draft, role: event.target.value })}
            >
              <option value="moderator">{ar ? 'مشرف' : 'Moderator'}</option>
              <option value="admin">{ar ? 'مسؤول' : 'Admin'}</option>
              <option value="user">{ar ? 'عميل' : 'Customer'}</option>
            </SelectField>
            <ErrorView error={error} />
            {uncertain && (
              <p role="status">
                {ar
                  ? 'قد يكون الحساب قد تم إنشاؤه. أغلق هذه النافذة وراجع قائمة الحسابات قبل إنشاء حساب آخر.'
                  : 'The account may have been created. Close this dialog and review the accounts list before creating another account.'}
              </p>
            )}
            <div className="staff-actions">
              <Button type="submit" variant="accent" disabled={busy || uncertain}>
                {busy
                  ? ar
                    ? 'جارٍ الإنشاء…'
                    : 'Creating…'
                  : ar
                    ? 'إنشاء الحساب'
                    : 'Create account'}
              </Button>
              <Button variant="secondary" onClick={close}>
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

export function StaffPasswordChange({ dashboard, ErrorView }) {
  const { language, request, leaveGuards } = dashboard,
    { session } = useRuntime(),
    ar = language === 'ar',
    navigate = useNavigate(),
    [password, setPassword] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }),
    [passwordError, setPasswordError] = useState(null),
    [passwordBusy, setPasswordBusy] = useState(false)
  useDraftGuard(Object.values(password).some(Boolean), leaveGuards)
  async function changePassword(event) {
    event.preventDefault()
    if (passwordBusy || password.newPassword !== password.confirmPassword) return
    if (
      [password.currentPassword, password.newPassword].some(
        (value) =>
          value.length < 8 || value.length > 72 || new TextEncoder().encode(value).length > 72,
      )
    ) {
      setPasswordError(new ApiError('PASSWORD_TOO_LONG', { status: 422 }))
      return
    }
    setPasswordBusy(true)
    setPasswordError(null)
    try {
      await request('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: password.currentPassword, newPassword: password.newPassword },
      })
      leaveGuards.current.clear()
      session.clear()
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      navigate(`/${language}/dashboard/login`, { replace: true })
    } catch (error) {
      setPasswordError(error)
      if (unknownWrite(error)) {
        leaveGuards.current.clear()
        session.clear()
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
        navigate(`/${language}/dashboard/login`, { replace: true })
      }
    } finally {
      setPasswordBusy(false)
    }
  }
  return (
    <section className="panel staff-panel">
      <h2>{ar ? 'تغيير كلمة المرور' : 'Change password'}</h2>
      <p className="staff-help">
        {ar
          ? 'سيتم إنهاء جميع الجلسات. سجّل الدخول مجددًا بكلمة المرور الجديدة.'
          : 'This ends all sessions. Sign in again with the new password.'}
      </p>
      <ErrorView error={passwordError} />
      <form onSubmit={changePassword} className="staff-field-pair staff-password-form">
        <Field
          label={ar ? 'كلمة المرور الحالية' : 'Current password'}
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="current-password"
          value={password.currentPassword}
          onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })}
        />
        <Field
          label={ar ? 'كلمة المرور الجديدة' : 'New password'}
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={password.newPassword}
          onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
        />
        <Field
          label={ar ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={password.confirmPassword || ''}
          onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })}
        />
        <Button
          type="submit"
          disabled={
            passwordBusy ||
            !password.currentPassword ||
            !password.newPassword ||
            password.newPassword !== password.confirmPassword ||
            new TextEncoder().encode(password.currentPassword).length > 72 ||
            new TextEncoder().encode(password.newPassword).length > 72
          }
        >
          {ar ? 'تغيير كلمة المرور' : 'Change password'}
        </Button>
      </form>
    </section>
  )
}
