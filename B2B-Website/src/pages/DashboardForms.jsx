import { useParams, useNavigate } from 'react-router'
import { Button, Field } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  ReadState,
  SelectField,
  BilingualFields,
} from '../features/dashboard/components.jsx'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { formPayload, staffLabel } from '../features/dashboard/model.js'
import { localText } from '../features/inquiry/model.js'
import { serviceLinks } from '../app/config.js'

function FormEditor({ initial, supportedFieldTypes, definitions, onSaved }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate()
  const pair = () => ({ en: '', ar: '' })
  return (
    <RecordEditor
      initial={initial}
      path={`/forms/${initial.type}`}
      payload={formPayload}
      onSaved={onSaved}
    >
      {({ draft, setDraft }) => {
        const updateField = (index, patch) =>
          setDraft({
            ...draft,
            fields: draft.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
          })
        const move = (index, delta) => {
          const fields = [...draft.fields]
          ;[fields[index], fields[index + delta]] = [fields[index + delta], fields[index]]
          setDraft({ ...draft, fields })
        }
        return (
          <>
            <div
              className="staff-service-options"
              role="group"
              aria-label={ar ? 'نوع النموذج' : 'Form type'}
            >
              {serviceLinks(language).map((service) => (
                <Button
                  key={service.key}
                  variant={initial.type === service.key ? 'accent' : 'secondary'}
                  aria-pressed={initial.type === service.key}
                  disabled={!definitions.some((form) => form.type === service.key)}
                  onClick={() => {
                    if (initial.type === service.key) return
                    navigate(`/${language}/dashboard/forms/${service.key}`)
                  }}
                >
                  {service.label}
                </Button>
              ))}
            </div>
            <section className="panel staff-panel">
              <h2>{ar ? 'محتوى النموذج' : 'Form content'}</h2>
              <BilingualFields
                label={ar ? 'العنوان' : 'Title'}
                required
                maxLength={150}
                value={draft.title}
                onChange={(title) => setDraft({ ...draft, title })}
              />
              <BilingualFields
                multiline
                label={ar ? 'النص المساعد' : 'Help text'}
                maxLength={2000}
                value={draft.helpText}
                onChange={(helpText) => setDraft({ ...draft, helpText })}
              />
            </section>
            <section className="staff-panel">
              <h2>{ar ? 'حقول التواصل الثابتة · مقفلة' : 'Fixed contact fields · locked'}</h2>
              <p>
                {draft.fixedFields
                  .map(
                    (field) => `${localText(field.label, language)}${field.required ? ' *' : ''}`,
                  )
                  .join(' · ')}
              </p>
            </section>
            {draft.fields.map((field, index) => (
              <section className="panel staff-panel" key={index}>
                <div className="staff-section-heading">
                  <h2>
                    {ar ? 'السؤال' : 'Question'} {index + 1}
                  </h2>
                  <div className="staff-actions">
                    <Button
                      variant="secondary"
                      className="staff-reorder"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={
                        ar ? `نقل السؤال ${index + 1} لأعلى` : `Move question ${index + 1} up`
                      }
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 16V4m-5 5 5-5 5 5" />
                      </svg>
                    </Button>
                    <Button
                      variant="secondary"
                      className="staff-reorder"
                      disabled={index === draft.fields.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={
                        ar ? `نقل السؤال ${index + 1} لأسفل` : `Move question ${index + 1} down`
                      }
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 4v12m-5-5 5 5 5-5" />
                      </svg>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (
                          window.confirm(
                            ar
                              ? 'إزالة هذا السؤال من النموذج الحالي؟'
                              : 'Remove this question from the current form?',
                          )
                        )
                          setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== index) })
                      }}
                    >
                      {ar ? 'إزالة السؤال' : 'Remove question'}
                    </Button>
                  </div>
                </div>
                <div className="staff-field-pair">
                  <Field
                    label={ar ? 'مفتاح السؤال الثابت' : 'Stable question key'}
                    dir="ltr"
                    value={field.key}
                    required
                    pattern="[a-z][a-z0-9_-]{0,39}"
                    maxLength={40}
                    onChange={(event) => updateField(index, { key: event.target.value })}
                  />
                  <SelectField
                    label={ar ? 'نوع الحقل' : 'Widget type'}
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, {
                        type: event.target.value,
                        choices: ['select', 'multiselect'].includes(event.target.value)
                          ? field.choices
                          : [],
                      })
                    }
                  >
                    {supportedFieldTypes.map((type) => (
                      <option key={type} value={type}>
                        {staffLabel(type, language)}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <BilingualFields
                  label={ar ? 'التسمية' : 'Label'}
                  value={field.label}
                  required
                  maxLength={150}
                  onChange={(label) => updateField(index, { label })}
                />
                <label className="staff-check">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => updateField(index, { required: event.target.checked })}
                  />
                  {ar ? 'إجابة مطلوبة' : 'Required answer'}
                </label>
                {['select', 'multiselect'].includes(field.type) && (
                  <div className="staff-choices">
                    <h3>{ar ? 'الخيارات' : 'Choices'}</h3>
                    {field.choices.map((choice, choiceIndex) => (
                      <div className="staff-choice" key={choiceIndex}>
                        <Field
                          label={ar ? 'مفتاح الخيار' : 'Choice key'}
                          dir="ltr"
                          required
                          maxLength={40}
                          value={choice.key}
                          onChange={(event) =>
                            updateField(index, {
                              choices: field.choices.map((item, i) =>
                                i === choiceIndex ? { ...item, key: event.target.value } : item,
                              ),
                            })
                          }
                        />
                        <BilingualFields
                          label={ar ? 'تسمية الخيار' : 'Choice label'}
                          value={choice.label}
                          required
                          maxLength={150}
                          onChange={(label) =>
                            updateField(index, {
                              choices: field.choices.map((item, i) =>
                                i === choiceIndex ? { ...item, label } : item,
                              ),
                            })
                          }
                        />
                        <Button
                          variant="secondary"
                          onClick={() =>
                            updateField(index, {
                              choices: field.choices.filter((_, i) => i !== choiceIndex),
                            })
                          }
                        >
                          {ar ? 'إزالة الخيار' : 'Remove choice'} {choiceIndex + 1}
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      disabled={field.choices.length >= 50}
                      onClick={() =>
                        updateField(index, {
                          choices: [...field.choices, { key: '', label: pair() }],
                        })
                      }
                    >
                      {ar ? 'إضافة خيار' : 'Add choice'}
                    </Button>
                  </div>
                )}
              </section>
            ))}
            <Button
              variant="secondary"
              disabled={draft.fields.length >= 40}
              onClick={() =>
                setDraft({
                  ...draft,
                  fields: [
                    ...draft.fields,
                    {
                      key: '',
                      type: supportedFieldTypes[0],
                      label: pair(),
                      required: false,
                      choices: [],
                    },
                  ],
                })
              }
            >
              {ar ? 'إضافة سؤال' : 'Add question'}
            </Button>
            <p>
              {ar
                ? 'احتفظ بالمفاتيح عند تغيير التسمية. لا تغيّر التعديلات الطلبات السابقة. لا توجد قواعد تحقق مخصصة.'
                : 'Keep stable keys when relabeling. Edits do not rewrite historical submissions. Custom validation rules are not supported.'}
            </p>
            <SelectField
              label={ar ? 'حالة النشر' : 'Publication state'}
              value={String(draft.isActive)}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.value === 'true' })}
            >
              <option value="true">{ar ? 'منشور' : 'Published'}</option>
              <option value="false">{ar ? 'غير منشور' : 'Unpublished'}</option>
            </SelectField>
            <p className="staff-help">
              {ar
                ? 'حفظ نموذج منشور يغيّر الاستبيان المتاح فورًا. لا توجد نسخة مسودة منفصلة.'
                : 'Saving an active form changes the live questionnaire immediately. There is no separate staged draft copy.'}
            </p>
          </>
        )
      }}
    </RecordEditor>
  )
}
export function DashboardForms() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    { formType } = useParams()
  const read = useStaffRead('/forms'),
    selected = read.data?.items.find((form) => form.type === formType) || read.data?.items[0]
  return (
    <>
      <StaffHeading title={ar ? 'نماذج الطلبات' : 'Request forms'} />
      <ReadState read={read}>
        {selected && (
          <>
            <FormEditor
              key={selected.type}
              initial={selected}
              supportedFieldTypes={read.data.supportedFieldTypes}
              definitions={read.data.items}
              onSaved={(result) =>
                read.setData({
                  ...read.data,
                  items: read.data.items.map((form) => (form.type === result.type ? result : form)),
                })
              }
            />
          </>
        )}
      </ReadState>
    </>
  )
}
