import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button, Field, Feedback, Modal } from '../../../shared/ui/Primitives.jsx'
import { useRuntime } from '../../../shared/ui/Runtime.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { accountPayload, pageQuery, staffLabel } from '../features/dashboard/model.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import { CreateStaffAccount } from '../features/dashboard/CreateStaffAccount.jsx'
import {
  StaffHeading,
  ReadState,
  StaffTable,
  StaffLink,
  StaffError,
  SelectField,
  Pagination,
} from '../features/dashboard/components.jsx'

function Handover({ target }) {
  const { user, request, language, confirmUnsaved, leaveGuards } = useDashboard(),
    { session } = useRuntime(),
    ar = language === 'ar',
    navigate = useNavigate()
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  if (
    user.role !== 'superAdmin' ||
    target.id === user.id ||
    target.role === 'superAdmin' ||
    target.status !== 'active' ||
    !target.emailVerified
  )
    return null
  async function transfer() {
    if (!confirmUnsaved()) return
    setBusy(true)
    try {
      await request('/auth/super-admin/handover', { method: 'POST', body: { userId: target.id } })
      leaveGuards.current.clear()
      session.clear()
      navigate(`/${language}/account/login`, { replace: true })
    } catch (error) {
      setError(error)
      if (!error.status || error.status >= 500) {
        leaveGuards.current.clear()
        session.clear()
        navigate(`/${language}/account/login`, { replace: true })
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {ar
          ? 'نقل صلاحية المسؤول الرئيسي لهذا الحساب'
          : 'Transfer super-admin ownership to this account'}
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={ar ? 'نقل المسؤولية الرئيسية' : 'Transfer super-admin ownership'}
      >
        <p>
          {target.name} · {target.email}
        </p>
        <p>
          {ar
            ? 'سيصبح هذا الحساب المسؤول الرئيسي وستصبح أنت مسؤولًا. ستنتهي جلسات الحسابين ويجب تسجيل الدخول مجددًا.'
            : 'This account will become super admin and you will become admin. Both accounts must sign in again. This takes effect immediately.'}
        </p>
        <StaffError error={error} />
        <Button disabled={busy} onClick={transfer}>
          {ar ? 'تأكيد نقل المسؤولية' : 'Confirm ownership transfer'}
        </Button>
      </Modal>
    </>
  )
}
function AccountDetail({ userId, onSaved }) {
  const { user, language } = useDashboard(),
    { session } = useRuntime(),
    ar = language === 'ar',
    navigate = useNavigate(),
    read = useStaffRead(`/users/${userId}`)
  const target = read.data
  return (
    <ReadState read={read}>
      {target && (
        <>
          <h2>{ar ? 'الحساب المختار' : 'Selected account'}</h2>
          {target.role === 'superAdmin' || target.status === 'deleted' ? (
            <section className="panel staff-panel">
              <h3>{target.name}</h3>
              <p>{target.email}</p>
              <Feedback
                title={
                  target.role === 'superAdmin'
                    ? ar
                      ? 'حساب محمي · عرض فقط'
                      : 'Protected account · view only'
                    : ar
                      ? 'حساب محذوف · لا يمكن استعادته'
                      : 'Deleted account · cannot be restored'
                }
              />
            </section>
          ) : (
            <>
              <RecordEditor
                key={userId}
                initial={target}
                path={`/users/${userId}`}
                payload={accountPayload}
                onSaved={(result) => {
                  read.setData(result)
                  onSaved?.()
                  if (userId === user.id) {
                    session.clear()
                    navigate(`/${language}/account/login`, { replace: true })
                  }
                }}
              >
                {({ draft, setDraft }) => (
                  <section className="panel staff-panel">
                    <p dir="ltr">{draft.email}</p>
                    <div className="staff-field-pair">
                      <Field
                        label={ar ? 'الاسم' : 'Name'}
                        value={draft.name}
                        required
                        maxLength={100}
                        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      />
                      <Field
                        label={ar ? 'الهاتف' : 'Phone'}
                        type="tel"
                        dir="ltr"
                        required
                        value={draft.phone}
                        maxLength={32}
                        onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                      />
                      <SelectField
                        label={ar ? 'الدور' : 'Role'}
                        value={draft.role}
                        onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                      >
                        {['user', 'moderator', 'admin'].map((role) => (
                          <option key={role} value={role}>
                            {staffLabel(role, language)}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        label={ar ? 'الحالة' : 'Status'}
                        value={draft.status}
                        onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                      >
                        <option value="active">{ar ? 'نشط' : 'Active'}</option>
                        <option value="blocked">{ar ? 'محظور' : 'Blocked'}</option>
                      </SelectField>
                    </div>
                    <p>
                      {ar
                        ? 'أي تعديل يلغي جلسات الحساب المستهدف، بما في ذلك تعديل الاسم أو الهاتف.'
                        : 'Every staff edit invalidates the target’s sessions, including a name or phone edit.'}
                    </p>
                  </section>
                )}
              </RecordEditor>
              <div className="staff-actions">
                <DeleteRecord
                  path={`/users/${userId}`}
                  back="accounts"
                  onDeleted={onSaved}
                  label={ar ? 'الحساب' : 'account'}
                />
                <Handover target={target} />
              </div>
            </>
          )}
        </>
      )}
    </ReadState>
  )
}
export function DashboardAccounts() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    { userId } = useParams(),
    [search, setSearch] = useSearchParams()
  const status = ['active', 'blocked', 'deleted'].includes(search.get('status'))
      ? search.get('status')
      : '',
    role = ['admin', 'superAdmin', 'moderator', 'user'].includes(search.get('role'))
      ? search.get('role')
      : ''
  const query = new URLSearchParams({
      page: pageQuery(search),
      limit: 20,
      ...(status && { status }),
      ...(role && { role }),
    }),
    read = useStaffRead(`/users?${query}`)
  function update(key, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }
  return (
    <>
      <StaffHeading
        title={ar ? 'الحسابات' : 'Accounts'}
        action={<CreateStaffAccount onCreated={read.reload} />}
        description={
          ar
            ? 'راجع الحسابات وأدر الأدوار والحالة. المسؤول الرئيسي وحده يمكنه إنشاء الحسابات أو نقل الملكية.'
            : 'Review accounts and manage roles and status. Only the super admin can create accounts or transfer ownership.'
        }
      />
      <div className="staff-filters">
        <SelectField
          label={ar ? 'الحالة' : 'Status'}
          value={status}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">{ar ? 'كل الحسابات غير المحذوفة' : 'All non-deleted accounts'}</option>
          {['active', 'blocked', 'deleted'].map((value) => (
            <option key={value} value={value}>
              {staffLabel(value, language)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={ar ? 'الدور' : 'Role'}
          value={role}
          onChange={(event) => update('role', event.target.value)}
        >
          <option value="">{ar ? 'كل الأدوار' : 'All roles'}</option>
          {['user', 'moderator', 'admin', 'superAdmin'].map((value) => (
            <option key={value} value={value}>
              {staffLabel(value, language)}
            </option>
          ))}
        </SelectField>
      </div>
      <ReadState read={read}>
        {read.data && (
          <>
            <StaffTable
              columns={[
                { key: 'name', label: ar ? 'الحساب' : 'Account' },
                {
                  key: 'role',
                  label: ar ? 'الدور' : 'Role',
                  render: (row) => staffLabel(row.role, language),
                },
                {
                  key: 'status',
                  label: ar ? 'الحالة' : 'Status',
                  render: (row) => staffLabel(row.status, language),
                },
                {
                  key: 'action',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <StaffLink section="accounts" id={row.id}>
                      {row.role === 'superAdmin' || row.status === 'deleted'
                        ? ar
                          ? 'عرض فقط'
                          : 'View only'
                        : ar
                          ? 'تعديل الحساب'
                          : 'Edit account'}
                    </StaffLink>
                  ),
                },
              ]}
              rows={read.data.items}
              empty={ar ? 'لا توجد حسابات مطابقة' : 'No matching accounts'}
            />
            <Pagination pagination={read.data.pagination} onPage={(page) => update('page', page)} />
          </>
        )}
      </ReadState>
      {userId && <AccountDetail key={userId} userId={userId} onSaved={read.reload} />}
    </>
  )
}
