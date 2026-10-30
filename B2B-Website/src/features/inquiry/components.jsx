import { Link } from 'react-router'
import { Metadata } from '../../../../shared/ui/Metadata.jsx'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { Button, LabelledRows } from '../../../../shared/ui/Primitives.jsx'
import { errorMessage } from '../../../../shared/lib/messages.js'
import { compositionRows, localText } from './model.js'
import { useInquiry } from './InquiryProvider.jsx'

const errors = {
  FORM_NOT_FOUND: [
    'This questionnaire is currently unavailable. Choose another published service.',
    'هذا النموذج غير متاح حاليًا. اختر خدمة أخرى متاحة.',
  ],
  FORM_CONFLICT: [
    'The questions have changed. Reload the current form and review your answers.',
    'تغيرت الأسئلة. حمّل النموذج الحالي وراجع إجاباتك.',
  ],
  WHOLESALE_CONFLICT: [
    'A selected pouch has changed. Review the current offers before sending.',
    'تغيرت إحدى العبوات المختارة. راجع العروض الحالية قبل الإرسال.',
  ],
  WHOLESALE_SOURCE_UNAVAILABLE: [
    'A selected offer is unavailable. Review or remove it.',
    'أحد العروض المختارة غير متاح. راجعه أو أزله.',
  ],
  WHOLESALE_OFFER_NOT_FOUND: ['This offer is no longer available.', 'هذا العرض لم يعد متاحًا.'],
  LEAD_DRAFT_UNAVAILABLE: [
    'This draft is no longer available. Resolve any uncertain submission before starting a new one.',
    'هذه المسودة لم تعد متاحة. تحقق من أي إرسال غير مؤكد قبل بدء مسودة جديدة.',
  ],
  LEAD_REQUEST_CONFLICT: [
    'This draft already has a submission. Check its original receipt or tracking access.',
    'أُرسل طلب بهذه المسودة من قبل. راجع الإيصال أو بيانات التتبع الأصلية.',
  ],
  LEAD_NOT_FOUND: [
    'The request or its private access is unavailable. Check your saved reference and access key, or contact the team.',
    'الطلب أو بيانات الوصول الخاصة غير متاحة. راجع المرجع ومفتاح الوصول المحفوظين أو تواصل مع الفريق.',
  ],
  LEAD_IMAGE_LIMIT: [
    'The five image slots are used. Uncheck an image to exclude it from your request; uploading another needs a new draft.',
    'تم استخدام خانات الصور الخمس. يمكنك إلغاء اختيار صورة لاستبعادها من الطلب، ورفع صورة أخرى يحتاج مسودة جديدة.',
  ],
  LEAD_IMAGE_CONFLICT: [
    'Check the ready images in this draft before trying again.',
    'تحقق من الصور الجاهزة في هذه المسودة قبل المحاولة مجددًا.',
  ],
  IMAGE_TYPE_UNSUPPORTED: ['Choose a JPEG, PNG or WebP image.', 'اختر صورة JPEG أو PNG أو WebP.'],
  BODY_TOO_LARGE: [
    'Choose a non-empty image no larger than 5 MiB, or shorten the request.',
    'اختر صورة غير فارغة لا تتجاوز 5 ميبيبايت، أو اختصر الطلب.',
  ],
  INVALID_IMAGE: [
    'This image could not be accepted. Use a valid still image with no more than 20 million pixels.',
    'تعذر قبول هذه الصورة. استخدم صورة ثابتة صالحة لا تتجاوز 20 مليون بكسل.',
  ],
  LEAD_STORAGE_UNAVAILABLE: [
    'Image storage is unavailable. You can continue with a text-only request.',
    'رفع الصور غير متاح حاليًا. يمكنك المتابعة بطلب نصي فقط.',
  ],
  ORIGINAL_SESSION_REQUIRED: [
    'Sign back into the account that started this submission to check its result.',
    'سجّل الدخول إلى الحساب الذي بدأ هذا الإرسال للتحقق من نتيجته.',
  ],
  INVALID_LEAD: [
    'Review the contact details, answers and selected images.',
    'راجع بيانات التواصل والإجابات والصور المختارة.',
  ],
  INVALID_WHOLESALE: [
    'Choose 1–10 available offers with 1–10,000 whole pouches per offer.',
    'اختر من عرض إلى 10 عروض متاحة، ومن عبوة إلى 10,000 عبوة كاملة لكل عرض.',
  ],
}

export function PageHeading({
  title,
  description,
  path,
  publicPage = false,
  breadcrumbOnly = false,
}) {
  const { config } = useRuntime(),
    language = useLocale()
  return (
    <>
      <Metadata
        config={config}
        title={`${title} | ${language === 'ar' ? 'نارمر' : 'Narmer'}`}
        description={description || ''}
        path={path}
        publicPage={publicPage}
      />
      <header className="inquiry-heading">
        <Link to={`/${language}`}>
          {language === 'ar' ? 'الرئيسية / نارمر للأعمال' : 'Home / Narmer Business'}
        </Link>
        {!breadcrumbOnly && (
          <>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </>
        )}
      </header>
    </>
  )
}
export function JourneySteps({ step = 1, status = false }) {
  const ar = useLocale() === 'ar',
    labels = status
      ? ar
        ? ['تم الإرسال', 'تم التواصل']
        : ['Submitted', 'Contacted']
      : ar
        ? ['التفاصيل', 'المراجعة', 'الإيصال']
        : ['Details', 'Review', 'Receipt']
  return (
    <ol className="inquiry-steps" aria-label={ar ? 'خطوات الطلب' : 'Request steps'}>
      {labels.map((label, index) => (
        <li key={label} aria-current={step === index + 1 ? 'step' : undefined}>
          <span>{index + 1}.</span> {label}
        </li>
      ))}
    </ol>
  )
}
export function InquiryError({ error: supplied }) {
  const context = useInquiry(),
    error = supplied === undefined ? context.error : supplied,
    language = useLocale(),
    ar = language === 'ar'
  if (!error) return null
  const copy = errors[error.code],
    message = copy ? copy[ar ? 1 : 0] : errorMessage(error, language)
  return (
    <div className="inquiry-alert" role="alert">
      <p>{message}</p>
      {error.status === 429 && (
        <p>
          {ar
            ? `انتظر ${error.retryAfter ?? 30} ثانية قبل المحاولة مجددًا. بياناتك محفوظة.`
            : `Wait ${error.retryAfter ?? 30} seconds before trying again. Your details are kept.`}
        </p>
      )}
      {error.requestId && (
        <small>
          {ar ? 'مرجع الدعم: ' : 'Support reference: '}
          <bdi>{error.requestId}</bdi>
        </small>
      )}
    </div>
  )
}
export function SelectedOffers({ editable = false }) {
  const { state, setState } = useInquiry(),
    language = useLocale(),
    ar = language === 'ar'
  return (
    <div className="selected-offers">
      <h2>{ar ? 'العروض المختارة' : 'Selected offers'}</h2>
      {!state.selections.length ? (
        <p>{ar ? 'اختر عرض جملة واحدًا على الأقل.' : 'Choose at least one wholesale offer.'}</p>
      ) : (
        state.selections.map(({ offer, quantity }) => (
          <article key={offer.id} className="selected-offer">
            <div className="selected-offer-heading">
              <h3>{localText(offer.name, language)}</h3>
              {editable && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      selections: current.selections.filter((item) => item.offer.id !== offer.id),
                    }))
                  }
                >
                  {ar ? 'إزالة' : 'Remove'}
                </Button>
              )}
            </div>
            {offer.unavailable && (
              <p className="field-error">
                {ar
                  ? 'هذا العرض غير متاح. أزله للمتابعة.'
                  : 'This offer is unavailable. Remove it to continue.'}
              </p>
            )}
            <p className="muted">
              {compositionRows(offer, language)
                .map((row) => `${row.selection} × ${row.quantity}`)
                .join(' / ')}
            </p>
            <div className="pouch-summary">
              {editable ? (
                <label>
                  {ar ? 'العبوات المطلوبة' : 'Pouches required'}
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    value={quantity}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setState((current) => ({
                        ...current,
                        selections: current.selections.map((item) =>
                          item.offer.id === offer.id ? { ...item, quantity: next } : item,
                        ),
                      }))
                    }}
                  />
                </label>
              ) : (
                <span>
                  {quantity.toLocaleString(language)} {ar ? 'عبوة' : 'pouches'}
                </span>
              )}
              <strong>
                {(offer.piecesPerPouch * quantity).toLocaleString(language)}{' '}
                {ar ? 'قطعة إجمالًا' : 'pieces total'}
              </strong>
            </div>
          </article>
        ))
      )}
      {editable && (
        <Button variant="secondary" to={`/${language}/wholesale`}>
          {ar ? 'إضافة عرض آخر' : 'Add another offer'}
        </Button>
      )}
    </div>
  )
}
export function RequestSnapshot({ lead }) {
  const language = useLocale(),
    ar = language === 'ar'
  const answer = (field) => {
    const value = lead.answers[field.key]
    if (typeof value === 'boolean') return value ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No'
    if (field.type === 'select')
      return (
        localText(field.choices.find((choice) => choice.key === value)?.label, language) || value
      )
    if (Array.isArray(value))
      return value
        .map(
          (key) =>
            localText(field.choices.find((choice) => choice.key === key)?.label, language) || key,
        )
        .join('، ')
    return String(value)
  }
  return (
    <div className="request-snapshot">
      <h2>{localText(lead.form.title, language)}</h2>
      <p className="muted">
        <bdi>{lead.id}</bdi> ·{' '}
        {new Date(lead.createdAt).toLocaleString(language, { timeZone: 'Africa/Cairo' })}
      </p>
      <h3>{ar ? 'بيانات التواصل' : 'Contact details'}</h3>
      <LabelledRows
        rows={[
          {
            id: lead.id,
            fields: lead.form.fixedFields.map((field) => [
              localText(field.label, language),
              lead.contact[field.key] || (ar ? 'غير مُدخل' : 'Not supplied'),
            ]),
          },
        ]}
      />
      <h3>{ar ? 'تفاصيل الطلب' : 'Request details'}</h3>
      <dl className="answer-summary">
        {lead.form.fields
          .filter((field) => Object.hasOwn(lead.answers, field.key))
          .map((field) => (
            <div key={field.key}>
              <dt>{localText(field.label, language)}</dt>
              <dd>{answer(field)}</dd>
            </div>
          ))}
      </dl>
      {lead.wholesaleRequests.map((offer) => (
        <section key={offer.id} className="snapshot-offer">
          <h3>{localText(offer.name, language)}</h3>
          <p>
            {offer.quantity.toLocaleString(language)} {ar ? 'عبوة' : 'pouches'} ×{' '}
            {offer.piecesPerPouch} ={' '}
            {(offer.quantity * offer.piecesPerPouch).toLocaleString(language)}{' '}
            {ar ? 'قطعة' : 'pieces'}
          </p>
          <LabelledRows
            rows={compositionRows(offer, language).map((row) => ({
              id: row.id,
              fields: [
                [ar ? 'التكوين' : 'Contents', row.selection],
                [ar ? 'القطع في العبوة' : 'Pieces per pouch', row.quantity],
              ],
            }))}
          />
        </section>
      ))}
      <p>
        {ar
          ? `الصور المرفقة: ${lead.imageCount}. الصور الخاصة متاحة للفريق فقط.`
          : `Attached images: ${lead.imageCount}. Private images are viewable by the team only.`}
      </p>
    </div>
  )
}
