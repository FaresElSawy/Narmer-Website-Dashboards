import { useState } from 'react'
import { useParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Button } from '../../../shared/ui/Primitives.jsx'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import { JourneySteps, PageHeading } from '../features/inquiry/components.jsx'
import '../assets/css/inquiry.css'

export function RequestReceipt() {
  const { leadId } = useParams(),
    { state, tracking, forgetTracking, forget } = useInquiry(),
    language = useLocale(),
    ar = language === 'ar',
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false)
  const receipt = state.receipt?.lead.id === leadId ? state.receipt : null,
    credential = receipt?.trackingToken
      ? { token: receipt.trackingToken, expiresAt: receipt.trackingExpiresAt }
      : tracking(leadId)
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${language}/track/${leadId}#token=${encodeURIComponent(credential.token)}`,
      )
      setCopied(true)
    } catch {
      setCopyError(true)
    }
  }
  return (
    <div className="inquiry-page">
      <PageHeading
        title={ar ? 'إيصال الطلب' : 'Request receipt'}
        path={`/request/received/${leadId}`}
      />
      <JourneySteps step={3} />
      <section className="inquiry-success">
        <p className="eyebrow">{ar ? 'تم استلام الطلب' : 'REQUEST RECEIVED'}</p>
        <h2>
          {receipt
            ? ar
              ? 'شكرًا لك. طلبك لدى نارمر.'
              : 'Thank you. Your request is with Narmer.'
            : ar
              ? 'راجع الطلب المحفوظ'
              : 'Check your saved request'}
        </h2>
        <p>
          {ar
            ? 'يناقش الفريق المتطلبات معك. لا توجد مدفوعات عبر الموقع.'
            : 'The team will discuss your requirements with you. No online payment has been made.'}
        </p>
        <p>
          {ar ? 'مرجع الطلب: ' : 'Request reference: '}
          <bdi>{leadId}</bdi>
        </p>
        {credential ? (
          <>
            <h3>{ar ? 'احتفظ برابط التتبع الخاص' : 'Keep your private tracking link'}</h3>
            <p>
              {ar
                ? 'وصول الضيف متاح حتى الموعد الموضح. الاسم أو الهاتف أو البريد لا يمكن أن تحل محل الرابط.'
                : 'Guest access lasts until the displayed deadline. Your name, phone or email cannot replace the link.'}
            </p>
            <p>{new Date(credential.expiresAt).toLocaleString(language)}</p>
            <div className="inquiry-actions">
              <Button variant="accent" to={`/${language}/track/${leadId}`}>
                {ar ? 'عرض حالة الطلب' : 'View request status'}
              </Button>
              <Button variant="secondary" onClick={copyLink}>
                {copied
                  ? ar
                    ? 'تم نسخ الرابط'
                    : 'Link copied'
                  : ar
                    ? 'نسخ رابط التتبع الخاص'
                    : 'Copy private tracking link'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  forgetTracking(leadId)
                  forget()
                }}
              >
                {ar ? 'نسيان بيانات الوصول على هذا الجهاز' : 'Forget access on this device'}
              </Button>
            </div>
            {copyError && (
              <label className="private-link">
                {ar ? 'انسخ هذا الرابط واحفظه بأمان' : 'Copy this link and keep it safely'}
                <textarea
                  readOnly
                  dir="ltr"
                  aria-label={ar ? 'رابط التتبع الخاص' : 'Private tracking link'}
                  value={`${window.location.origin}/${language}/track/${leadId}#token=${encodeURIComponent(credential.token)}`}
                  onFocus={(event) => event.target.select()}
                />
              </label>
            )}
            <p className="privacy-hint">
              {ar
                ? 'الرابط خاص بمن يملكه. انسخه واحفظه بأمان قبل مغادرة جهاز مشترك.'
                : 'Anyone with this link can access the request. Copy and keep it safely before leaving a shared device.'}
            </p>
          </>
        ) : (
          <>
            <p>
              {ar
                ? 'طلبات الحساب تظهر في سجله. لطلب الضيف، استخدم رابط التتبع الخاص الأصلي المحفوظ لديك. طلبات الضيف لا ترتبط بالحساب تلقائيًا.'
                : 'Signed-in submissions appear in request history. For a guest request, use the original saved private tracking link. Guest requests are not linked to an account automatically.'}
            </p>
            <Button variant="accent" to={`/${language}/requests/${leadId}`}>
              {ar ? 'عرض طلب الحساب' : 'View account request'}
            </Button>
            <Button variant="secondary" to={`/${language}/track/${leadId}`}>
              {ar ? 'إدخال بيانات التتبع الخاصة' : 'Enter private tracking access'}
            </Button>
          </>
        )}
        <Button variant="secondary" to={`/${language}/wholesale`}>
          {ar ? 'تصفح الجملة' : 'Browse wholesale'}
        </Button>
      </section>
    </div>
  )
}
