import { useState } from 'react'
import { Button, Modal } from '../../../shared/ui/Primitives.jsx'
import { ApiError } from '../../../shared/lib/api.js'
import { formatMoney } from '../../../shared/lib/money.js'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  StaffTable,
  ReadState,
  Pagination,
  BilingualFields,
  SelectField,
  MoneyField,
} from '../features/dashboard/components.jsx'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import { StaffAction } from '../../../shared/ui/StaffAction.jsx'
import { shippingPayload } from '../features/dashboard/shipping-model.js'
import { governorates } from '../features/orders/governorates.js'

function OverrideEditor({ initial, onClose, onSaved }) {
  const { language, confirmUnsaved } = useDashboard(),
    ar = language === 'ar',
    [busy, setBusy] = useState(false),
    create = !initial.id,
    en = governorates('en'),
    arabic = governorates('ar')
  return (
    <Modal
      open
      onClose={() => !busy && confirmUnsaved() && onClose()}
      title={ar ? 'رسوم محافظة' : 'Governorate delivery fee'}
    >
      <RecordEditor
        initial={initial}
        path={`/shipping-fees${create ? '' : `/${initial.id}`}`}
        create={create}
        onSaved={onSaved}
        onBusy={setBusy}
        payload={(draft) => shippingPayload(draft)}
      >
        {({ draft, setDraft }) => (
          <section className="staff-panel">
            <SelectField
              label={ar ? 'المحافظة' : 'Governorate'}
              required
              disabled={!create}
              value={draft.governorateCode}
              onChange={(event) => {
                const code = event.target.value
                setDraft({
                  ...draft,
                  governorateCode: code,
                  name: {
                    en: en.find((item) => item.code === code)?.name || '',
                    ar: arabic.find((item) => item.code === code)?.name || '',
                  },
                })
              }}
            >
              <option value="">{ar ? 'اختر محافظة' : 'Choose a governorate'}</option>
              {!en.some((item) => item.code === draft.governorateCode) && draft.governorateCode && (
                <option value={draft.governorateCode}>
                  {draft.name?.[language] || draft.governorateCode}
                </option>
              )}
              {governorates(language).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <BilingualFields
              label={ar ? 'اسم المحافظة' : 'Governorate name'}
              required
              maxLength={150}
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <MoneyField
              required
              label={ar ? 'رسوم التوصيل (جنيه مصري)' : 'Delivery fee (EGP)'}
              value={draft.fee}
              onChange={(fee) => setDraft({ ...draft, fee })}
            />
          </section>
        )}
      </RecordEditor>
    </Modal>
  )
}
function DefaultFee() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead('/shipping-fees/default')
  return (
    <ReadState read={read}>
      {read.data && (
        <RecordEditor
          initial={read.data}
          path="/shipping-fees/default"
          payload={(draft) => shippingPayload(draft, true)}
        >
          {({ draft, setDraft }) => (
            <section className="panel staff-panel">
              <h2>{ar ? 'رسوم التوصيل الافتراضية' : 'Default delivery fee'}</h2>
              <p className="staff-help">
                {ar
                  ? 'تُستخدم هذه الرسوم لأي محافظة بلا استثناء مخصص. الصفر يعني توصيلًا مجانيًا.'
                  : 'Used for governorates without an override. Zero means free delivery.'}
              </p>
              <MoneyField
                required
                label={ar ? 'الرسوم الافتراضية (جنيه مصري)' : 'Default fee (EGP)'}
                value={draft.defaultFee}
                onChange={(defaultFee) => setDraft({ ...draft, defaultFee })}
              />
            </section>
          )}
        </RecordEditor>
      )}
    </ReadState>
  )
}
function ReceivingAccount() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    read = useStaffRead('/orders/settings')
  return (
    <ReadState read={read}>
      {read.data && (
        <RecordEditor
          initial={read.data}
          path="/orders/settings"
          payload={(draft) => {
            const value = draft.receivingAccount?.trim() || null
            if (value && value.length > 200) throw new ApiError('VALIDATION_ERROR', { status: 422 })
            return { receivingAccount: value }
          }}
        >
          {({ draft, setDraft }) => (
            <section className="panel staff-panel">
              <h2>{ar ? 'حساب استقبال InstaPay' : 'InstaPay receiving account'}</h2>
              <p className="staff-help">
                {ar
                  ? 'تُحدّث تعليمات الاستقبال للطلبات الجديدة. لا تغيّر الطلبات المحفوظة ولا تنفّذ أي تحويل مالي.'
                  : 'Updates receiving instructions for new checkout quotes. Existing orders keep their saved instructions; this does not execute transfers.'}
              </p>
              <label className="field">
                <span>
                  {ar
                    ? 'تعليمات الاستقبال - فارغ للإزالة'
                    : 'Receiving instructions - blank clears'}
                </span>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={draft.receivingAccount ?? ''}
                  onChange={(event) => setDraft({ ...draft, receivingAccount: event.target.value })}
                />
              </label>
            </section>
          )}
        </RecordEditor>
      )}
    </ReadState>
  )
}
export function DashboardShipping() {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [page, setPage] = useState(1),
    [edit, setEdit] = useState(null),
    read = useStaffRead(`/shipping-fees?page=${page}&limit=20`)
  return (
    <>
      <StaffHeading
        title={ar ? 'الشحن والدفع' : 'Shipping & payments'}
        description={
          ar
            ? 'رسوم المحافظات وتعليمات الدفع، بإعدادات منفصلة.'
            : 'Manage delivery fees and payment instructions with separate saves.'
        }
      />
      <DefaultFee />
      <section className="panel staff-panel">
        <StaffHeading
          level="h2"
          title={ar ? 'استثناءات المحافظات' : 'Governorate overrides'}
          action={
            <Button
              variant="accent"
              onClick={() => setEdit({ governorateCode: '', name: { en: '', ar: '' }, fee: null })}
            >
              {ar ? 'إضافة استثناء' : 'Add override'}
            </Button>
          }
        />
        <ReadState read={read}>
          {read.data && (
            <>
              <StaffTable
                rows={read.data.items}
                empty={
                  ar
                    ? 'لا توجد رسوم مخصصة؛ تُطبق الرسوم الافتراضية.'
                    : 'No overrides. The default fee applies.'
                }
                columns={[
                  {
                    key: 'name',
                    label: ar ? 'المحافظة' : 'Governorate',
                    render: (row) => row.name?.[language] || row.name?.en,
                  },
                  {
                    key: 'fee',
                    label: ar ? 'الرسوم' : 'Fee',
                    render: (row) => formatMoney(row.fee, language),
                  },
                  {
                    key: 'action',
                    label: ar ? 'الإجراء' : 'Action',
                    render: (row) => (
                      <div className="staff-actions">
                        <StaffAction
                          action="edit"
                          label={`${ar ? 'تعديل' : 'Edit'} ${row.name?.[language] || row.governorateCode}`}
                          onClick={() => setEdit(row)}
                        />
                        <DeleteRecord
                          iconOnly
                          path={`/shipping-fees/${row.id}`}
                          back="shipping"
                          label={row.name?.[language]}
                          roles={['admin', 'superAdmin']}
                          onDeleted={read.reload}
                        />
                      </div>
                    ),
                  },
                ]}
              />
              <Pagination pagination={read.data.pagination} onPage={setPage} />
            </>
          )}
        </ReadState>
      </section>
      <ReceivingAccount />
      {edit && (
        <OverrideEditor
          key={edit.id || 'new'}
          initial={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null)
            read.reload()
          }}
        />
      )}
    </>
  )
}
