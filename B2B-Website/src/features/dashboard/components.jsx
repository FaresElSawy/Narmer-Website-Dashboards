import { Link } from 'react-router'
export { SelectField } from '../../../../shared/ui/SelectField.jsx'
import { Button, Feedback } from '../../../../shared/ui/Primitives.jsx'
import { errorMessage } from '../../../../shared/lib/messages.js'
import { useLocale } from '../../../../shared/ui/Locale.jsx'

export function StaffHeading({ title, description, action }) {
  return (
    <header className="workspace-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  )
}
export function StaffError({ error }) {
  const language = useLocale(),
    ar = language === 'ar'
  if (!error) return null
  const messages = {
    IMAGE_TYPE_UNSUPPORTED: ar
      ? 'اختر صورة JPEG أو PNG أو WebP صالحة.'
      : 'Choose a valid JPEG, PNG or WebP image.',
    BODY_TOO_LARGE: ar
      ? 'اختر صورة غير فارغة لا تتجاوز 5 ميبيبايت.'
      : 'Choose a non-empty image no larger than 5 MiB.',
    INVALID_IMAGE: ar
      ? 'الصورة غير مقبولة. استخدم صورة ثابتة لا تتجاوز 20 مليون بكسل.'
      : 'The image could not be accepted. Use a still image with no more than 20 million pixels.',
    SESSION_REFRESHED: ar
      ? 'تم تجديد جلستك. راجع تعديلاتك واضغط الحفظ مجددًا.'
      : 'Your session was renewed. Review your edits and save again.',
    INVALID_FORM: ar
      ? 'راجع المفاتيح الفريدة والتسميات باللغتين والخيارات. حتى 40 سؤالًا و50 خيارًا للسؤال.'
      : 'Check unique keys, both translations and choices. Maximum 40 questions and 50 choices per question.',
    INVALID_SETTINGS_URL: ar
      ? 'استخدم رابط HTTPS من الخدمة المحددة أو رابط خرائط مدعوم.'
      : 'Use an HTTPS link on the named service or a supported Maps host.',
    VALIDATION_ERROR: ar
      ? 'تعذر حفظ بعض القيم. راجع الحقول والرسائل التالية.'
      : 'Some values could not be saved. Review the fields and messages below.',
    WHOLESALE_REFERENCED: ar
      ? 'هذا السجل مستخدم في عروض أو طلبات محفوظة ولا يمكن حذفه. يمكنك إلغاء إتاحته بدلًا من حذفه.'
      : 'This record is referenced by offers or saved requests and cannot be deleted. You can disable it instead.',
    MEDIA_CONFLICT: ar
      ? 'الصورة منتهية الصلاحية أو غير مرتبطة بهذا الموضع. ارفعها مجددًا للموضع الصحيح.'
      : 'The image has expired or belongs to another target. Upload it again for this position.',
  }
  return (
    <>
      <Feedback kind="error" title={messages[error.code] || errorMessage(error, language)}>
        {error.code}
        {error.requestId ? ` · ${error.requestId}` : ''}
        {error.status === 429
          ? ` · ${ar ? 'انتظر' : 'Wait'} ${error.retryAfter ?? 30} ${ar ? 'ثانية' : 'seconds'}`
          : ''}
      </Feedback>
      {error.errors?.length > 0 && (
        <ul className="staff-validation-errors">
          {error.errors.map((item, index) => (
            <li key={index}>
              {item.field}: {item.message}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
export function ReadState({ read, children }) {
  const ar = useLocale() === 'ar'
  if (read.loading)
    return <Feedback kind="loading" title={ar ? 'جارٍ التحميل' : 'Loading workspace'} />
  if (read.error)
    return (
      <>
        <StaffError error={read.error} />
        <Button onClick={read.reload}>{ar ? 'إعادة المحاولة' : 'Try again'}</Button>
      </>
    )
  return children
}
export function StaffTable({ columns, rows, empty }) {
  return rows.length ? (
    <div className="staff-table-wrap">
      <table className="staff-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td data-label={column.label} key={column.key}>
                  {column.render ? column.render(row) : (row[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Feedback title={empty} />
  )
}
export function Pagination({ pagination, onPage }) {
  const ar = useLocale() === 'ar'
  if (!pagination) return null
  return (
    <nav className="staff-pagination" aria-label={ar ? 'صفحات النتائج' : 'Results pages'}>
      <span>
        {ar ? 'الصفحة' : 'Page'} {pagination.page} / {Math.max(1, pagination.pages)} ·{' '}
        {pagination.total} {ar ? 'سجل' : 'records'}
      </span>
      <div>
        <Button
          variant="secondary"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          {ar ? 'السابق' : 'Previous'}
        </Button>
        <Button
          variant="secondary"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPage(pagination.page + 1)}
        >
          {ar ? 'التالي' : 'Next'}
        </Button>
      </div>
    </nav>
  )
}
export function StaffLink({ section, id, children }) {
  const language = useLocale()
  return (
    <Link
      className={id ? undefined : 'staff-back-link'}
      to={`/${language}/dashboard/${section}${id ? `/${id}` : ''}`}
    >
      {children}
    </Link>
  )
}
export function BilingualFields({
  label,
  value,
  onChange,
  maxLength = 200,
  multiline = false,
  required = false,
}) {
  const ar = useLocale() === 'ar',
    Input = multiline ? 'textarea' : 'input'
  return (
    <div className="staff-field-pair">
      {['en', 'ar'].map((language) => (
        <label className="field" key={language}>
          <span>
            {label} ·{' '}
            {language === 'en' ? (ar ? 'الإنجليزية' : 'English') : ar ? 'العربية' : 'Arabic'}
          </span>
          <Input
            lang={language}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            value={value?.[language] ?? ''}
            maxLength={maxLength}
            required={required}
            rows={multiline ? 3 : undefined}
            onChange={(event) => onChange({ ...value, [language]: event.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
export function StaffDate({ value }) {
  const language = useLocale()
  return value ? (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Cairo',
      }).format(new Date(value))}
    </time>
  ) : (
    '-'
  )
}
