import { useState } from 'react'
import { useLocale } from './Locale.jsx'
import { Button, Feedback, Field, LabelledRows, Modal, Tabs } from './Primitives.jsx'
import { foundationRows } from '../fixtures/foundation.js'

export function FoundationReview({ store }) {
  const language = useLocale(),
    ar = language === 'ar'
  const [dialog, setDialog] = useState(false),
    [value, setValue] = useState(''),
    [invalid, setInvalid] = useState(false)
  const rows = foundationRows(store, language)
  return (
    <>
      <div className="workspace-title">
        <div>
          <h1>{ar ? 'مساحة العمل' : 'Workspace'}</h1>
          <p className="muted">
            {ar ? 'مراجعة المكونات الأساسية والتخطيط.' : 'Foundation layout and component review.'}
          </p>
        </div>
        <Button onClick={() => setDialog(true)}>{ar ? 'عرض النافذة' : 'Open dialog'}</Button>
      </div>
      <section className="panel">
        <h2>{ar ? 'الحالات والتفاعل' : 'States and interaction'}</h2>
        <Tabs
          label={ar ? 'حالات العرض' : 'Display states'}
          tabs={[
            {
              label: ar ? 'فارغ' : 'Empty',
              content: (
                <Feedback title={ar ? 'لا توجد نتائج بعد' : 'No results yet'}>
                  {ar
                    ? 'ستظهر النتائج هنا عند توفرها.'
                    : 'Results will appear here when available.'}
                </Feedback>
              ),
            },
            {
              label: ar ? 'جارٍ التحميل' : 'Loading',
              content: <Feedback kind="loading" title={ar ? 'جارٍ التحميل' : 'Loading results'} />,
            },
            {
              label: ar ? 'خطأ' : 'Error',
              content: (
                <Feedback kind="error" title={ar ? 'تعذر تحميل النتائج' : 'Could not load results'}>
                  {ar ? 'تحقق من الاتصال وحاول مرة أخرى.' : 'Check your connection and try again.'}
                </Feedback>
              ),
            },
          ]}
        />
      </section>
      <div className="foundation-grid">
        <section className="panel">
          <h2>{ar ? 'الحقول والأزرار' : 'Fields and buttons'}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setInvalid(!value.trim())
            }}
            noValidate
          >
            <Field
              label={ar ? 'الاسم' : 'Name'}
              name="name"
              autoComplete="name"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setInvalid(false)
              }}
              error={invalid ? (ar ? 'أدخل الاسم.' : 'Enter a name.') : null}
              hint={
                ar
                  ? 'مثال للمراجعة فقط؛ لن يتم حفظه.'
                  : 'Review example only; this value is not saved.'
              }
            />
            <div className="button-row">
              <Button type="submit">{ar ? 'تحقق من الحقل' : 'Check field'}</Button>
              <Button disabled variant="secondary">
                {ar ? 'غير متاح' : 'Unavailable'}
              </Button>
            </div>
            {value.trim() && !invalid && (
              <p className="muted">
                {ar ? 'لن يتم إرسال بيانات إلى الخادم.' : 'No data will be sent to the server.'}
              </p>
            )}
          </form>
        </section>
        <section className="panel">
          <h2>{ar ? 'قائمة متجاوبة' : 'Responsive records'}</h2>
          <LabelledRows rows={rows} />
        </section>
      </div>
      <Modal
        open={dialog}
        onClose={() => setDialog(false)}
        title={ar ? 'مراجعة النافذة' : 'Dialog review'}
      >
        <p>
          {ar
            ? 'يمكن إغلاق النافذة بزر الإغلاق أو مفتاح Escape. سيعود التركيز إلى الزر السابق.'
            : 'Close with the close button or Escape. Focus returns to the opening button.'}
        </p>
        <Field label={ar ? 'ملاحظة للمراجعة' : 'Review note'} autoComplete="off" />
        <Button onClick={() => setDialog(false)}>{ar ? 'إغلاق' : 'Close'}</Button>
      </Modal>
    </>
  )
}
