import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useSession } from '../../../shared/ui/Runtime.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { consumeTrackingFragment } from '../../../shared/lib/private-state.js'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import {
  InquiryError,
  JourneySteps,
  PageHeading,
  RequestSnapshot,
} from '../features/inquiry/components.jsx'
import { isId, isSecret } from '../features/inquiry/model.js'
import '../assets/css/inquiry.css'

export function RequestTracking({ account = false }) {
  const { leadId: parameter } = useParams(),
    context = useInquiry(),
    { api, tracking, saveTracking, forgetTracking } = context,
    language = useLocale(),
    ar = language === 'ar',
    auth = useSession()
  const [access, setAccess] = useState(null),
    [result, setResult] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [retryAt, setRetryAt] = useState(0)
  const accessKey = `${account ? auth.user?.id || '' : 'guest'}:${access?.id || ''}:${access?.token || ''}:${language}`
  const lead = result?.key === accessKey ? result.lead : null
  useEffect(() => {
    if (account) {
      // eslint-disable-next-line react/set-state-in-effect -- Route changes restore private access after hydration.
      setAccess({ id: parameter, token: null })
      return
    }
    const fragment = consumeTrackingFragment(window.location, window.history),
      saved = parameter && tracking(parameter)
    if (isId(parameter) && isSecret(fragment || saved?.token))
      setAccess({ id: parameter, token: fragment || saved.token })
  }, [parameter, account, tracking])
  useEffect(() => {
    if (!access || (account && auth.user?.role !== 'user')) return
    const controller = new AbortController()
    // eslint-disable-next-line react/set-state-in-effect -- The external request starts when private access changes.
    setBusy(true)
    setError(null)
    const request = account
      ? api.detail(access.id, controller.signal)
      : api.track(access.id, access.token, controller.signal)
    request
      .then((lead) => {
        if (controller.signal.aborted) return
        setResult({ lead, key: accessKey })
        setBusy(false)
        if (!account)
          saveTracking(
            lead.id,
            access.token,
            new Date(Date.parse(lead.createdAt) + 90 * 86400000).toISOString(),
          )
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason)
          setResult(null)
          setBusy(false)
          if (reason.status === 429) setRetryAt(Date.now() + (reason.retryAfter ?? 30) * 1000)
        }
      })
    return () => controller.abort()
  }, [api, access, account, auth.user?.id, auth.user?.role, accessKey, saveTracking])
  useEffect(() => {
    if (!retryAt) return
    const timer = setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()))
    return () => clearTimeout(timer)
  }, [retryAt])
  function read(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget),
      id = String(values.get('reference')).trim(),
      token = String(values.get('token')).trim()
    if (!isId(id) || !isSecret(token)) {
      setError({ code: 'LEAD_NOT_FOUND' })
      return
    }
    setAccess({ id, token })
  }
  const allowed = !account || auth.user?.role === 'user'
  return (
    <div className="inquiry-page">
      <PageHeading
        title={ar ? 'طلبك' : 'Your request'}
        description={
          ar
            ? 'تفاصيل ما أرسلته إلى نارمر وحالته الحالية.'
            : 'The saved details of what you sent to Narmer and its current status.'
        }
        path={account ? `/requests/${parameter}` : '/track'}
      />
      <InquiryError error={error} />
      {!allowed ? (
        <Feedback
          title={
            ar
              ? 'سجّل الدخول بحساب العميل لعرض الطلب'
              : 'Sign in with the customer account to view this request'
          }
          action={
            <Button to={`/${language}/account/login`}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Button>
          }
        />
      ) : (
        <>
          {!account && (
            <form onSubmit={read} className="tracking-access">
              <div className="field">
                <label htmlFor="tracking-reference">
                  {ar ? 'مرجع الطلب' : 'Request reference'}
                </label>
                <input
                  id="tracking-reference"
                  name="reference"
                  defaultValue={parameter || ''}
                  maxLength="24"
                  required
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="tracking-token">
                  {ar ? 'مفتاح الوصول الخاص' : 'Private access key'}
                </label>
                <input
                  id="tracking-token"
                  name="token"
                  type="password"
                  autoComplete="off"
                  maxLength="43"
                  required
                  defaultValue=""
                  dir="ltr"
                />
              </div>
              <Button type="submit" disabled={busy || retryAt > 0}>
                {ar ? 'عرض الحالة' : 'View status'}
              </Button>
            </form>
          )}
          {busy && <Feedback kind="loading" title={ar ? 'جارٍ تحميل الطلب' : 'Loading request'} />}
          {lead && (
            <>
              <JourneySteps status step={lead.status === 'contacted' ? 2 : 1} />
              <div className="inquiry-columns">
                <RequestSnapshot lead={lead} />
                <aside className="inquiry-note">
                  <h2>
                    {lead.status === 'contacted'
                      ? ar
                        ? 'تم التواصل'
                        : 'Contacted'
                      : ar
                        ? 'تم الإرسال'
                        : 'Submitted'}
                  </h2>
                  <p>
                    {lead.status === 'contacted'
                      ? ar
                        ? 'سجّل الفريق التواصل بشأن طلبك.'
                        : 'The team has marked your request contacted.'
                      : ar
                        ? 'وصل الطلب، ولم يسجّل الفريق التواصل بعد.'
                        : 'Your request has been received. The team has not yet marked it contacted.'}
                  </p>
                  {lead.contactedAt && (
                    <p>
                      {new Date(lead.contactedAt).toLocaleString(language, {
                        timeZone: 'Africa/Cairo',
                      })}
                    </p>
                  )}
                  <p>
                    {ar
                      ? 'لا يمكن تعديل الطلب المُرسل أو إلغاؤه عبر الموقع.'
                      : 'Submitted requests cannot be edited or canceled online.'}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setAccess((current) => ({ ...current }))}
                    disabled={retryAt > 0}
                  >
                    {ar ? 'تحديث الحالة' : 'Refresh status'}
                  </Button>
                  {!account && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        forgetTracking(lead.id)
                        setAccess(null)
                        setResult(null)
                      }}
                    >
                      {ar ? 'نسيان الوصول' : 'Forget access'}
                    </Button>
                  )}
                </aside>
              </div>
            </>
          )}
        </>
      )}
      <Link to={`/${language}/contact`}>{ar ? 'المساعدة والتواصل' : 'Help and contact'}</Link>
    </div>
  )
}
