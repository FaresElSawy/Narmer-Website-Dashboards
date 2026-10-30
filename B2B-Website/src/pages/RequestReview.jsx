import { useNavigate } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import {
  InquiryError,
  JourneySteps,
  PageHeading,
  RequestSnapshot,
  SelectedOffers,
} from '../features/inquiry/components.jsx'
import { validateDetails, validateSelections } from '../features/inquiry/model.js'
import '../assets/css/inquiry.css'

export function RequestReview() {
  const context = useInquiry(),
    { state, busy, ready, retryAt, error, submit, refreshForm, refreshOffers, setState, report } =
      context,
    language = useLocale(),
    ar = language === 'ar',
    navigate = useNavigate()
  const valid =
    state.form &&
    !Object.keys(validateDetails(state.form, state.contact, state.answers)).length &&
    (state.type !== 'wholesale' || validateSelections(state.selections))
  async function send() {
    try {
      const receipt = await submit()
      if (receipt) navigate(`/${language}/request/received/${receipt.lead.id}`, { replace: true })
    } catch (reason) {
      report(reason)
    }
  }
  return (
    <div className="inquiry-page">
      <PageHeading
        title={ar ? 'راجع طلبك' : 'Review your request'}
        description={
          ar
            ? 'تحقق من البيانات والإجابات قبل الإرسال.'
            : 'Check your details and answers before sending.'
        }
        path="/request/review"
      />
      <JourneySteps step={2} />
      <InquiryError />
      {!ready ? (
        <Feedback kind="loading" title={ar ? 'جارٍ استعادة المسودة' : 'Restoring draft'} />
      ) : !state.form || !state.draft ? (
        <Feedback
          title={ar ? 'أكمل تفاصيل طلبك أولًا' : 'Complete your request details first'}
          action={
            <Button to={`/${language}/request`}>{ar ? 'إدخال التفاصيل' : 'Enter details'}</Button>
          }
        />
      ) : (
        <>
          <div className="inquiry-columns">
            <div className="inquiry-primary">
              <RequestSnapshot
                lead={{
                  id: state.draft.draftId,
                  form: state.form,
                  formType: state.type,
                  contact: state.pending?.payload.contact || state.contact,
                  answers: state.pending?.payload.answers || state.answers,
                  wholesaleRequests: [],
                  imageCount: state.images.filter((image) => image.selected !== false).length,
                  createdAt: new Date(Date.parse(state.draft.expiresAt) - 86400000).toISOString(),
                }}
              />
              {state.type === 'wholesale' && <SelectedOffers editable={!state.pending && !busy} />}
              {!state.pending && (
                <Button variant="secondary" to={`/${language}/request`}>
                  {ar ? 'تعديل التفاصيل' : 'Edit details'}
                </Button>
              )}
            </div>
            <aside className="inquiry-aside">
              <div className="inquiry-note">
                <h2>
                  {state.pending
                    ? ar
                      ? 'نتيجة الإرسال غير مؤكدة'
                      : 'Submission result is uncertain'
                    : ar
                      ? 'جاهز للإرسال؟'
                      : 'Ready to send?'}
                </h2>
                <p>
                  {state.pending
                    ? ar
                      ? 'سنعيد نفس الطلب بنفس بياناته للتحقق من النتيجة، دون إنشاء طلب آخر.'
                      : 'We will resend the exact same request to check its result, without creating another draft.'
                    : ar
                      ? 'لا يُحصّل أي مبلغ. يناقش الفريق التسعير وإمكانية التنفيذ بعد مراجعة الاستفسار.'
                      : 'No payment is taken. The team discusses pricing and feasibility after reviewing the inquiry.'}
                </p>
                <Button
                  variant="accent"
                  disabled={
                    busy ||
                    retryAt > 0 ||
                    (!state.pending && (!valid || state.needsReview || Boolean(state.uploadBefore)))
                  }
                  onClick={send}
                >
                  {busy
                    ? ar
                      ? 'جارٍ التحقق…'
                      : 'Checking…'
                    : state.pending
                      ? ar
                        ? 'التحقق من الإرسال'
                        : 'Check submission'
                      : ar
                        ? 'إرسال الطلب'
                        : 'Submit request'}
                </Button>
                {state.pending && (
                  <p>
                    {ar
                      ? 'لا تبدأ طلبًا آخر قبل تأكيد النتيجة. سجّل الدخول بالحساب الأصلي إن طُلب ذلك.'
                      : 'Do not start another request until the outcome is known. Sign back into the original account if required.'}
                  </p>
                )}
              </div>
            </aside>
          </div>
          {!state.pending && ['FORM_CONFLICT', 'FORM_NOT_FOUND'].includes(error?.code) && (
            <Button
              variant="secondary"
              disabled={busy || retryAt > 0}
              onClick={async () => {
                await refreshForm()
                navigate(`/${language}/request`)
              }}
            >
              {ar ? 'تحميل الأسئلة الحالية' : 'Load current questions'}
            </Button>
          )}
          {!state.pending &&
            ['WHOLESALE_CONFLICT', 'WHOLESALE_SOURCE_UNAVAILABLE'].includes(error?.code) && (
              <Button variant="secondary" disabled={busy || retryAt > 0} onClick={refreshOffers}>
                {ar ? 'مراجعة العروض الحالية' : 'Review current offers'}
              </Button>
            )}
          {state.needsReview && (
            <div className="inquiry-note">
              <p>
                {ar
                  ? 'راجع التغييرات الظاهرة قبل الإرسال.'
                  : 'Review the displayed changes before sending.'}
              </p>
              <Button onClick={() => setState((current) => ({ ...current, needsReview: false }))}>
                {ar ? 'راجعت التفاصيل الحالية' : 'I reviewed the current details'}
              </Button>
            </div>
          )}
          {error?.code === 'LEAD_DRAFT_UNAVAILABLE' && !state.pending && (
            <Button
              variant="secondary"
              to={`/${language}/request`}
              onClick={() => {
                setState((current) => ({
                  ...current,
                  draft: null,
                  images: [],
                  owner: null,
                  pending: null,
                }))
                context.clearError()
              }}
            >
              {ar ? 'بدء مسودة جديدة بنفس التفاصيل' : 'Start a fresh draft with these details'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
