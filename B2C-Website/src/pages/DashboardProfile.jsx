import { StaffPasswordChange } from '../../../shared/features/account/StaffForms.jsx'
import { Field } from '../../../shared/ui/Primitives.jsx'
import { StaffError } from '../features/dashboard/components.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { accountPayload, staffLabel } from '../features/dashboard/staff-model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { StaffHeading, ReadState, StaffLink } from '../features/dashboard/components.jsx'

const profilePayload = (draft, baseline) => accountPayload(draft, baseline, true)
export function DashboardProfile() {
  const dashboard = useDashboard(),
    { user, language } = dashboard,
    { session, config } = useRuntime(),
    ar = language === 'ar',
    read = useStaffRead('/users/me')
  return (
    <>
      <StaffHeading title={ar ? 'الملف الشخصي للموظف' : 'Staff profile'} />
      <ReadState read={read}>
        {read.data && (
          <RecordEditor
            initial={read.data}
            path="/users/me"
            payload={profilePayload}
            onSaved={(result) => {
              if (config.mode !== 'fixtures') session.updateUser(result)
            }}
          >
            {({ draft, setDraft }) => (
              <section className="panel staff-panel">
                <h2>{ar ? 'الملف الشخصي' : 'Staff profile'}</h2>
                <div className="staff-field-pair">
                  <Field
                    label={ar ? 'الاسم' : 'Name'}
                    required
                    maxLength={100}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                  <Field
                    label={ar ? 'الهاتف' : 'Phone'}
                    type="tel"
                    dir="ltr"
                    required
                    maxLength={32}
                    value={draft.phone}
                    onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  />
                  <Field
                    label={ar ? 'البريد الإلكتروني · ثابت' : 'Email · read only'}
                    value={draft.email}
                    dir="ltr"
                    readOnly
                  />
                  <Field
                    label={ar ? 'الدور · ثابت' : 'Role · read only'}
                    value={staffLabel(draft.role, language)}
                    readOnly
                  />
                </div>
              </section>
            )}
          </RecordEditor>
        )}
      </ReadState>
      <p className="staff-help">
        {ar
          ? 'البريد الإلكتروني والدور غير قابلين للتعديل من الملف الشخصي.'
          : 'Email and role are not editable through your self-profile.'}
      </p>
      <StaffPasswordChange dashboard={dashboard} ErrorView={StaffError} />
      {user.role === 'superAdmin' && (
        <StaffLink section="accounts">
          {ar
            ? 'اختر حسابًا لنقل المسؤولية الرئيسية'
            : 'Choose an account for super-admin handover'}
        </StaffLink>
      )}
    </>
  )
}
