import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useSession } from '../../../shared/ui/Runtime.jsx'
import { Button, Feedback, LabelledRows } from '../../../shared/ui/Primitives.jsx'
import { SelectField } from '../../../shared/ui/SelectField.jsx'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import { InquiryError, PageHeading } from '../features/inquiry/components.jsx'
import { formTypes } from '../features/inquiry/model.js'
import '../assets/css/inquiry.css'

export function RequestHistory() {
  const { api } = useInquiry(),
    language = useLocale(),
    ar = language === 'ar',
    auth = useSession(),
    [search, setSearch] = useSearchParams(),
    [resource, setResource] = useState(null),
    [error, setError] = useState(null)
  const page = Math.max(1, Math.min(100000, Number(search.get('page')) || 1)),
    status = ['submitted', 'contacted'].includes(search.get('status')) ? search.get('status') : '',
    type = formTypes.includes(search.get('formType')) ? search.get('formType') : ''
  useEffect(() => {
    if (auth.user?.role !== 'user') return
    const controller = new AbortController()
    api
      .history({ page, limit: 20, status, formType: type }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResource({ data, page, status, type, owner: auth.user.id })
          setError(null)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason)
      })
    return () => controller.abort()
  }, [api, page, status, type, auth.user?.id, auth.user?.role])
  const data =
    resource &&
    resource.owner === auth.user?.id &&
    resource.page === page &&
    resource.status === status &&
    resource.type === type
      ? resource.data
      : null
  function filter(key, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }
  return (
    <div className="inquiry-page">
      <PageHeading
        title={ar ? 'طلباتك' : 'Your requests'}
        description={
          ar
            ? 'الطلبات التي أرسلتها أثناء تسجيل الدخول إلى حساب الأعمال هذا.'
            : 'Requests submitted while signed in to this B2B account.'
        }
        path="/requests"
      />
      {auth.user?.role !== 'user' ? (
        <Feedback
          title={
            ar
              ? 'سجّل الدخول بحساب العميل لعرض السجل'
              : 'Sign in with a customer account to view history'
          }
          action={
            <Button to={`/${language}/account/login`}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Button>
          }
        />
      ) : (
        <>
          <div className="history-filters">
            <SelectField
              label={ar ? 'الحالة' : 'Status'}
              value={status}
              onChange={(event) => filter('status', event.target.value)}
            >
              <option value="">{ar ? 'الكل' : 'All'}</option>
              <option value="submitted">{ar ? 'تم الإرسال' : 'Submitted'}</option>
              <option value="contacted">{ar ? 'تم التواصل' : 'Contacted'}</option>
            </SelectField>
            <SelectField
              label={ar ? 'الخدمة' : 'Service'}
              value={type}
              onChange={(event) => filter('formType', event.target.value)}
            >
              <option value="">{ar ? 'الكل' : 'All'}</option>
              {formTypes.map((item) => (
                <option key={item} value={item}>
                  {
                    {
                      spinning: ar ? 'الغزل' : 'Spinning',
                      weaving: ar ? 'النسيج' : 'Weaving',
                      fabric: ar ? 'الأقمشة' : 'Fabric',
                      'school-uniforms': ar ? 'الزي المدرسي' : 'School uniforms',
                      wholesale: ar ? 'الجملة' : 'Wholesale',
                    }[item]
                  }
                </option>
              ))}
            </SelectField>
          </div>
          <InquiryError error={error} />
          {!data && !error && (
            <Feedback kind="loading" title={ar ? 'جارٍ تحميل السجل' : 'Loading history'} />
          )}
          {data?.items.length === 0 && (
            <Feedback
              title={ar ? 'لا توجد طلبات بهذه الخيارات' : 'No requests for these options'}
              action={
                <Button to={`/${language}/request`}>{ar ? 'بدء طلب' : 'Start a request'}</Button>
              }
            />
          )}
          {data && (
            <>
              <LabelledRows
                rows={data.items.map((lead) => ({
                  id: lead.id,
                  fields: [
                    [ar ? 'الخدمة' : 'Service', lead.form.title],
                    [
                      ar ? 'الاستلام' : 'Received',
                      new Date(lead.createdAt).toLocaleDateString(language, {
                        timeZone: 'Africa/Cairo',
                      }),
                    ],
                    [
                      ar ? 'الحالة' : 'Status',
                      lead.status === 'contacted'
                        ? ar
                          ? 'تم التواصل'
                          : 'Contacted'
                        : ar
                          ? 'تم الإرسال'
                          : 'Submitted',
                    ],
                    [
                      ar ? 'التفاصيل' : 'Details',
                      <Link key={lead.id} to={`/${language}/requests/${lead.id}`}>
                        {ar ? 'عرض الطلب' : 'View request'}
                      </Link>,
                    ],
                  ],
                }))}
              />
              <nav className="inquiry-pagination" aria-label={ar ? 'صفحات السجل' : 'History pages'}>
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => filter('page', String(page - 1))}
                >
                  {ar ? 'السابق' : 'Previous'}
                </Button>
                <span>
                  {page} / {Math.max(1, data.pagination.pages)}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= data.pagination.pages}
                  onClick={() => filter('page', String(page + 1))}
                >
                  {ar ? 'التالي' : 'Next'}
                </Button>
              </nav>
            </>
          )}
        </>
      )}
      <div className="inquiry-note">
        <p>
          {ar
            ? 'طلبات الضيف لا تظهر هنا تلقائيًا. استخدم رابط التتبع الخاص الأصلي لتلك الطلبات.'
            : 'Guest requests do not appear here automatically. Use the original private tracking link for those requests.'}
        </p>
      </div>
    </div>
  )
}
