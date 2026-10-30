import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { SelectField } from '../../../shared/ui/SelectField.jsx'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { useSession } from '../../../shared/ui/Runtime.jsx'
import { useInquiry } from '../features/inquiry/InquiryProvider.jsx'
import {
  InquiryError,
  JourneySteps,
  PageHeading,
  SelectedOffers,
} from '../features/inquiry/components.jsx'
import { formTypes, validateDetails, validateSelections } from '../features/inquiry/model.js'
import '../assets/css/inquiry.css'

function Question({ field, value, onChange, error, disabled, fixed = false }) {
  const ar = useLocale() === 'ar',
    id = `question-${fixed ? 'contact' : 'answer'}-${field.key}`
  const shared = {
    id,
    name: field.key,
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
  let input
  if (field.type === 'multiselect')
    return (
      <fieldset
        className="inquiry-choice-field"
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
      >
        <legend>
          {field.label}
          {field.required && ' *'}
        </legend>
        {field.choices.map((choice) => (
          <label className="check-option" key={choice.key}>
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(choice.key)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...(value || []), choice.key]
                    : value.filter((key) => key !== choice.key),
                )
              }
            />
            {choice.label}
          </label>
        ))}
        {error && (
          <p id={`${id}-error`} className="field-error">
            {ar ? 'راجع اختياراتك.' : 'Review your selection.'}
          </p>
        )}
      </fieldset>
    )
  if (field.type === 'textarea')
    input = (
      <textarea
        {...shared}
        value={value ?? ''}
        rows="4"
        maxLength={field.constraints.maxLength}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  else if (field.type === 'select' || field.type === 'boolean')
    input = (
      <SelectField
        {...shared}
        label={`${field.label}${field.required ? ' *' : ` · ${ar ? 'اختياري' : 'optional'}`}`}
        value={
          field.type === 'boolean'
            ? value === true
              ? 'yes'
              : value === false
                ? 'no'
                : ''
            : (value ?? '')
        }
        required={field.required}
        onChange={(event) =>
          onChange(
            field.type === 'boolean'
              ? event.target.value === ''
                ? undefined
                : event.target.value === 'yes'
              : event.target.value,
          )
        }
      >
        <option value="">{ar ? 'اختر إجابة' : 'Choose an answer'}</option>
        {field.type === 'boolean'
          ? [
              <option key="yes" value="yes">
                {ar ? 'نعم' : 'Yes'}
              </option>,
              <option key="no" value="no">
                {ar ? 'لا' : 'No'}
              </option>,
            ]
          : field.choices.map((choice) => (
              <option key={choice.key} value={choice.key}>
                {choice.label}
              </option>
            ))}
      </SelectField>
    )
  else
    input = (
      <input
        {...shared}
        type={
          field.type === 'phone'
            ? 'tel'
            : field.type === 'number' || field.type === 'email'
              ? field.type
              : 'text'
        }
        value={value ?? ''}
        autoComplete={
          fixed
            ? {
                name: 'name',
                phone: 'tel',
                email: 'email',
                governorate: 'address-level1',
                district: 'address-level2',
              }[field.key]
            : 'off'
        }
        dir={['email', 'phone', 'number'].includes(field.type) ? 'ltr' : undefined}
        maxLength={field.constraints.maxLength}
        min={field.constraints.min}
        max={field.constraints.max}
        step={field.type === 'number' ? 'any' : undefined}
        required={field.required}
        onChange={(event) =>
          onChange(
            field.type === 'number'
              ? event.target.value === ''
                ? undefined
                : event.target.valueAsNumber
              : event.target.value,
          )
        }
      />
    )
  return (
    <div
      className={`field inquiry-field inquiry-field-${field.type} ${field.type === 'textarea' ? 'inquiry-field-wide' : ''}`}
    >
      {!['select', 'boolean'].includes(field.type) && (
        <label htmlFor={id}>
          {field.label}
          {field.required ? ' *' : ` · ${ar ? 'اختياري' : 'optional'}`}
        </label>
      )}
      {input}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {ar ? 'راجع هذه الإجابة وحدود الحقل.' : 'Check this answer and the field limits.'}
        </p>
      )}
    </div>
  )
}

function ReferenceUpload({ context, disabled }) {
  const { state, busy, retryAt, upload, checkUpload, setState } = context,
    ar = useLocale() === 'ar'
  return (
    <section className="inquiry-note reference-upload">
      <h2>{ar ? 'صور مرجعية خاصة · اختياري' : 'Private reference images · optional'}</h2>
      <p>
        {ar
          ? 'حتى 5 صور ثابتة، JPEG أو PNG أو WebP، وبحد أقصى 5 ميبيبايت و20 مليون بكسل للصورة. يطّلع عليها الفريق فقط.'
          : 'Up to 5 still JPEG, PNG or WebP images, at most 5 MiB and 20 million pixels each. Only the team can view them.'}
      </p>
      <label className="upload-label">
        {ar ? 'اختيار صورة' : 'Choose an image'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={
            disabled || retryAt > 0 || Boolean(state.uploadBefore) || state.images.length >= 5
          }
          onChange={(event) => {
            const file = event.target.files[0]
            if (file) upload(file)
            event.target.value = ''
          }}
        />
      </label>
      {state.images.map((image, index) => (
        <label className="check-option" key={image.id}>
          <input
            type="checkbox"
            checked={image.selected !== false}
            disabled={disabled}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                images: current.images.map((item) =>
                  item.id === image.id ? { ...item, selected: event.target.checked } : item,
                ),
              }))
            }
          />
          {ar ? `إرفاق الصورة ${index + 1}` : `Include reference ${index + 1}`}{' '}
          <small>
            {image.width} × {image.height}
          </small>
        </label>
      ))}
      {state.uploadBefore && (
        <>
          <p role="status">
            {ar
              ? 'نتيجة الرفع غير مؤكدة. تحقق من المسودة قبل اختيار صورة أخرى.'
              : 'The upload outcome is uncertain. Check this draft before selecting another image.'}
          </p>
          <Button variant="secondary" disabled={busy || retryAt > 0} onClick={checkUpload}>
            {ar ? 'التحقق من حالة الرفع' : 'Check upload status'}
          </Button>
        </>
      )}
    </section>
  )
}

export function RequestStart({ embedded = false }) {
  const context = useInquiry(),
    {
      state,
      forms,
      loading,
      busy,
      error,
      retryAt,
      update,
      changeType,
      prepareReview,
      forget,
      setState,
    } = context
  const language = useLocale(),
    ar = language === 'ar',
    navigate = useNavigate(),
    auth = useSession(),
    [search] = useSearchParams(),
    [errors, setErrors] = useState({})
  const selectedType = search.get('service')
  const unavailable = error?.code === 'FORM_NOT_FOUND' && !state.form
  const appliedQuery = useRef(null)
  useEffect(() => {
    if (embedded || selectedType === appliedQuery.current) return
    appliedQuery.current = selectedType
    if (formTypes.includes(selectedType) && selectedType !== state.type && !state.pending)
      changeType(selectedType)
  }, [selectedType, embedded, state.type, state.pending, changeType])
  async function review(event) {
    event.preventDefault()
    const next = validateDetails(state.form, state.contact, state.answers)
    if (state.type === 'wholesale' && !validateSelections(state.selections))
      next.wholesale = 'selection'
    setErrors(next)
    if (Object.keys(next).length || state.needsReview || state.uploadBefore) {
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"], .inquiry-alert')?.focus(),
      )
      return
    }
    const result = await prepareReview()
    if (result) navigate(`/${language}/request/review`)
  }
  const disabled = busy || Boolean(state.pending) || Boolean(state.receipt)
  return (
    <section
      className={embedded ? 'request-start request-start-embedded' : 'inquiry-page request-start'}
    >
      {embedded && (
        <header className="embedded-request-heading">
          <h3>{ar ? 'طلب تصنيع وتوريد' : 'Manufacturing & supply request'}</h3>
          <p>
            {ar
              ? 'الحقول المحددة بـ * مطلوبة. لا تحتاج إلى حساب.'
              : 'Fields marked * are required. No account needed.'}
          </p>
          {state.form?.helpText && <p>{state.form.helpText}</p>}
        </header>
      )}
      {!embedded && (
        <>
          <PageHeading
            title={ar ? 'أخبرنا بما تحتاجه' : 'Tell us what you need'}
            description={
              ar
                ? 'أرسل استفسار تصنيع أو توريد. لا تحتاج إلى حساب.'
                : 'Send a manufacturing or supply inquiry. No account is required.'
            }
            path="/request"
          />
          <JourneySteps />
        </>
      )}
      {!unavailable && <InquiryError />}
      <div className="service-picker">
        <SelectField
          label={`${ar ? 'الخدمة' : 'Service'} *`}
          id="request-service"
          value={state.type}
          disabled={disabled || (unavailable && !forms.length)}
          onChange={(event) => {
            changeType(event.target.value)
            setErrors({})
          }}
        >
          {!forms.some((form) => form.type === state.type) && (
            <option value={state.type} disabled>
              {unavailable && !forms.length
                ? ar
                  ? 'لا توجد نماذج طلبات متاحة'
                  : 'No request forms available'
                : ar
                  ? 'اختر خدمة متاحة'
                  : 'Choose an available service'}
            </option>
          )}
          {forms.map((form) => (
            <option key={form.type} value={form.type}>
              {form.title}
            </option>
          ))}
        </SelectField>
      </div>
      {state.pending ? (
        <div className="inquiry-note">
          <h2>{ar ? 'تحقق من الإرسال السابق أولًا' : 'Check the previous submission first'}</h2>
          <p>
            {ar
              ? 'احتفظنا بنفس الطلب حتى لا يُرسل مرتين.'
              : 'We kept the exact request so it is not sent twice.'}
          </p>
          <Button to={`/${language}/request/review`}>
            {ar ? 'التحقق من النتيجة' : 'Check the result'}
          </Button>
        </div>
      ) : state.receipt ? (
        <div className="inquiry-note">
          <h2>{ar ? 'الطلب مُرسل بالفعل' : 'Your request has already been sent'}</h2>
          <Button to={`/${language}/request/received/${state.receipt.lead.id}`}>
            {ar ? 'عرض الإيصال' : 'View receipt'}
          </Button>
          <Button variant="secondary" onClick={forget}>
            {ar ? 'بدء طلب جديد' : 'Start a new request'}
          </Button>
        </div>
      ) : loading ? (
        <Feedback
          kind="loading"
          skeleton="form"
          title={ar ? 'جارٍ تحميل الأسئلة' : 'Loading the questionnaire'}
        />
      ) : !state.form ? (
        <Feedback
          kind={error && !unavailable ? 'error' : 'empty'}
          title={ar ? 'النموذج غير متاح حاليًا' : 'This questionnaire is currently unavailable'}
          action={
            <div className="inquiry-unavailable-actions">
              <Button variant="secondary" onClick={context.refreshForm}>
                {ar ? 'إعادة المحاولة' : 'Try again'}
              </Button>
              {unavailable && (
                <Button to={`/${language}/contact`}>
                  {ar ? 'تواصل مع الفريق' : 'Contact our team'}
                </Button>
              )}
            </div>
          }
        >
          {unavailable &&
            (forms.length
              ? ar
                ? 'اختر خدمة أخرى متاحة، أو تواصل مع الفريق لمناقشة طلبك.'
                : 'Choose another available service, or contact our team to discuss your request.'
              : ar
                ? 'نماذج الطلبات غير متاحة بعد. يمكنك التواصل مع الفريق لمناقشة ما تحتاجه.'
                : 'Request forms are not available yet. You can contact our team to discuss what you need.')}
        </Feedback>
      ) : (
        <form onSubmit={review} className="inquiry-form" noValidate>
          <div className="inquiry-columns">
            <div className="inquiry-primary">
              <fieldset className="form-section inquiry-contact-fields" disabled={disabled}>
                <legend>{ar ? 'بيانات التواصل' : 'Your contact details'}</legend>
                <div className="inquiry-fields">
                  {state.form.fixedFields.map((field) => (
                    <Question
                      fixed
                      key={field.key}
                      field={field}
                      value={state.contact[field.key]}
                      error={errors[`contact.${field.key}`]}
                      disabled={disabled}
                      onChange={(value) => update({ contact: { [field.key]: value } })}
                    />
                  ))}
                </div>
                {auth.user?.role === 'user' && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      update({
                        contact: {
                          ...state.contact,
                          name: auth.user.name,
                          phone: auth.user.phone || '',
                          email: auth.user.email || '',
                        },
                      })
                    }
                  >
                    {ar ? 'استخدام بيانات ملفي الشخصي' : 'Use my profile details'}
                  </Button>
                )}
              </fieldset>
              <fieldset className="form-section inquiry-project-column" disabled={disabled}>
                <legend>{ar ? 'تفاصيل المشروع' : 'Project details'}</legend>
                {!embedded && state.form.helpText && <p className="muted">{state.form.helpText}</p>}
                <div className="inquiry-fields">
                  {state.form.fields.map((field) => (
                    <Question
                      key={field.key}
                      field={field}
                      value={state.answers[field.key]}
                      error={errors[`answers.${field.key}`]}
                      disabled={disabled}
                      onChange={(value) => update({ answers: { [field.key]: value } })}
                    />
                  ))}
                </div>
              </fieldset>
              {state.type === 'wholesale' && (
                <>
                  <SelectedOffers editable={!disabled} />
                  {errors.wholesale && (
                    <p className="field-error" role="alert">
                      {ar
                        ? 'اختر من عرض إلى 10 عروض متاحة بكميات صحيحة من العبوات.'
                        : 'Choose 1–10 available offers with valid whole-pouch quantities.'}
                    </p>
                  )}
                </>
              )}
              <ReferenceUpload context={context} disabled={disabled} />
            </div>
            <aside className="inquiry-aside">
              <div className="inquiry-note">
                <h2>{ar ? 'الخطوة التالية' : 'What happens next'}</h2>
                <p>
                  {ar
                    ? 'راجع تفاصيلك وأرسل الاستفسار، ثم يناقش الفريق المتطلبات معك. لا يوجد دفع عبر الموقع.'
                    : 'Review your details and send the inquiry. The team will discuss your requirements with you. No payment is taken online.'}
                </p>
                <Button
                  variant={embedded ? 'primary' : 'accent'}
                  type="submit"
                  disabled={
                    disabled || retryAt > 0 || Boolean(state.uploadBefore) || state.needsReview
                  }
                >
                  {ar ? 'مراجعة الطلب' : 'Review your request'}
                </Button>
                <p className="privacy-hint">
                  {ar
                    ? 'بعد بدء المسودة، تُحفظ التفاصيل في هذا التبويب حتى انتهاء مهلة المسودة. استخدم «نسيان المسودة» على جهاز مشترك.'
                    : 'Once a draft starts, its details are kept in this tab until its deadline. Use “Forget draft” on a shared device.'}
                </p>
                {state.draft && (
                  <>
                    <small>
                      {ar ? 'تنتهي المسودة: ' : 'Draft expires: '}
                      {new Date(state.draft.expiresAt).toLocaleString(language)}
                    </small>
                    <Button variant="secondary" onClick={forget}>
                      {ar ? 'نسيان المسودة' : 'Forget draft'}
                    </Button>
                  </>
                )}
                {!auth.user && (
                  <p>
                    <Link to={`/${language}/account/login`}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Link>{' '}
                    {ar
                      ? 'اختياري. الطلبات السابقة كضيف لا ترتبط بالحساب تلقائيًا.'
                      : 'is optional. Earlier guest requests are not linked automatically.'}
                  </p>
                )}
              </div>
            </aside>
          </div>
          {state.needsReview && (
            <div className="inquiry-note">
              <h2>{ar ? 'راجع التغييرات' : 'Review the changes'}</h2>
              <p>
                {ar
                  ? 'راجع الأسئلة والإجابات والعروض الحالية قبل المتابعة.'
                  : 'Check the current questions, answers and offers before continuing.'}
              </p>
              <Button onClick={() => setState((current) => ({ ...current, needsReview: false }))}>
                {ar ? 'راجعت التفاصيل الحالية' : 'I reviewed the current details'}
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  )
}
