import { Field } from '../../../shared/ui/Primitives.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { settingsPayload } from '../features/dashboard/staff-model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { StaffHeading, ReadState, BilingualFields } from '../features/dashboard/components.jsx'

export function DashboardSettings() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead('/site-settings')
  const socialNames = {
    instagramUrl: 'Instagram',
    whatsappUrl: 'WhatsApp',
    tiktokUrl: 'TikTok',
    facebookUrl: 'Facebook',
  }
  return (
    <>
      <StaffHeading
        title={ar ? 'الإعدادات' : 'Settings'}
        description={
          ar
            ? 'إدارة بيانات التواصل العامة وروابط التواصل والبيانات الوصفية لهذا الموقع.'
            : 'Manage the public contact details, social links and search metadata for this website.'
        }
      />
      <ReadState read={read}>
        {read.data && (
          <RecordEditor
            initial={read.data}
            path="/site-settings"
            payload={settingsPayload}
            saveInChildren
          >
            {({ draft, setDraft, saveButton }) => (
              <>
                <section className="panel staff-panel">
                  <h2>{ar ? 'التواصل وروابط التواصل الاجتماعي' : 'Contact and social links'}</h2>
                  <p className="muted">
                    {ar
                      ? 'استخدم بيانات نارمر الموثقة. اترك البيانات غير المتاحة فارغة لإخفائها.'
                      : 'Use verified Narmer details. Leave unavailable contact values empty to hide them.'}
                  </p>
                  <hr />
                  <div className="staff-field-pair">
                    <Field
                      label={ar ? 'الهاتف' : 'Phone'}
                      type="tel"
                      dir="ltr"
                      maxLength={100}
                      value={draft.phone || ''}
                      onChange={(event) =>
                        setDraft({ ...draft, phone: event.target.value || null })
                      }
                    />
                    <Field
                      label={ar ? 'البريد الإلكتروني' : 'Email'}
                      type="email"
                      dir="ltr"
                      maxLength={254}
                      value={draft.email || ''}
                      onChange={(event) =>
                        setDraft({ ...draft, email: event.target.value || null })
                      }
                    />
                  </div>
                  <BilingualFields
                    label={ar ? 'العنوان' : 'Address'}
                    multiline
                    maxLength={1000}
                    value={draft.address}
                    onChange={(address) => setDraft({ ...draft, address })}
                  />
                  <div className="staff-field-pair">
                    <Field
                      label={ar ? 'رابط الخريطة' : 'Map URL'}
                      type="url"
                      dir="ltr"
                      maxLength={2048}
                      value={draft.mapUrl || ''}
                      onChange={(event) =>
                        setDraft({ ...draft, mapUrl: event.target.value || null })
                      }
                    />
                    {Object.entries(socialNames).map(([key, label]) => (
                      <Field
                        key={key}
                        label={`${label} ${ar ? 'رابط' : 'URL'}`}
                        type="url"
                        dir="ltr"
                        maxLength={2048}
                        value={draft.social[key] || ''}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            social: { ...draft.social, [key]: event.target.value || null },
                          })
                        }
                      />
                    ))}
                  </div>
                  <p className="staff-help">
                    {ar
                      ? 'استخدم روابط HTTPS للخدمة نفسها. روابط الخريطة تدعم Google Maps وApple Maps.'
                      : 'Use HTTPS links for the named service. Map links support Google Maps and Apple Maps.'}
                  </p>
                </section>
                <section className="panel staff-panel">
                  <h2>{ar ? 'البيانات الوصفية لمحركات البحث' : 'Search metadata'}</h2>
                  <p className="muted">
                    {ar
                      ? 'إعدادات افتراضية للموقع باللغتين. تستخدم الصفحات بياناتها المحددة عندما تتوفر.'
                      : 'Website defaults in both languages. Pages use their own specific metadata when available.'}
                  </p>
                  <hr />
                  <BilingualFields
                    label={ar ? 'العنوان الافتراضي' : 'Default page title'}
                    required
                    maxLength={200}
                    value={draft.seo.title}
                    onChange={(title) => setDraft({ ...draft, seo: { ...draft.seo, title } })}
                  />
                  <BilingualFields
                    label={ar ? 'الوصف' : 'Description'}
                    multiline
                    maxLength={500}
                    value={draft.seo.description}
                    onChange={(description) =>
                      setDraft({ ...draft, seo: { ...draft.seo, description } })
                    }
                  />
                  <Field
                    label={ar ? 'الكلمات المفتاحية' : 'Keywords'}
                    maxLength={1000}
                    value={draft.seo.keywords}
                    onChange={(event) =>
                      setDraft({ ...draft, seo: { ...draft.seo, keywords: event.target.value } })
                    }
                  />
                </section>
                <div className="panel staff-settings-save">
                  <p>
                    {ar
                      ? 'راجع البيانات قبل الحفظ. تصبح التغييرات عامة فورًا.'
                      : 'Review the details before saving. Changes become public immediately.'}
                  </p>
                  {saveButton}
                </div>
              </>
            )}
          </RecordEditor>
        )}
      </ReadState>
    </>
  )
}
