import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button, Modal } from '../../../shared/ui/Primitives.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { DateTimeField } from '../../../shared/ui/DateTimeField.jsx'
import { Switch } from '../../../shared/ui/Switch.jsx'
import { StaffAction } from '../../../shared/ui/StaffAction.jsx'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import {
  StaffHeading,
  StaffTable,
  ReadState,
  Pagination,
  BilingualFields,
  SelectField,
  StaffDate,
  MoneyField,
} from '../features/dashboard/components.jsx'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import { PromotionSwitch } from '../features/dashboard/PromotionSwitch.jsx'
import { salePayload, couponPayload } from '../features/dashboard/promotion-model.js'

const blank = (kind) => ({
  ...(kind === 'coupons' ? { code: '' } : {}),
  name: { en: '', ar: '' },
  targetType: kind === 'sales' ? 'products' : 'all',
  productIds: [],
  categoryId: null,
  discountType: 'percentage',
  discountValue: 10,
  minimumSpend: 0,
  maxUses: null,
  maxUsesPerPerson: null,
  startsAt: null,
  endsAt: null,
  isEnabled: true,
})
const text = (value, language) => value?.[language] || value?.en || '-'
function Targets({ draft, setDraft, language }) {
  const ar = language === 'ar',
    [page, setPage] = useState(1),
    products = useStaffRead(`/products?page=${page}&limit=20`),
    categories = useStaffRead('/categories/tree')
  const nodes = (items = []) => items.flatMap((item) => [item, ...nodes(item.children)])
  return (
    <>
      <SelectField
        label={ar ? 'نطاق الخصم' : 'Discount scope'}
        value={draft.targetType}
        onChange={(event) =>
          setDraft({ ...draft, targetType: event.target.value, productIds: [], categoryId: null })
        }
      >
        {draft.code !== undefined && (
          <option value="all">{ar ? 'كل المنتجات المؤهلة' : 'All eligible products'}</option>
        )}
        <option value="products">{ar ? 'منتجات مختارة' : 'Selected products'}</option>
        <option value="category">{ar ? 'تصنيف وفروعه' : 'Category and descendants'}</option>
      </SelectField>
      {draft.targetType === 'category' && (
        <ReadState read={categories}>
          <SelectField
            required
            label={ar ? 'التصنيف' : 'Category'}
            value={draft.categoryId || ''}
            onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
          >
            <option value="">{ar ? 'اختر تصنيفًا' : 'Choose a category'}</option>
            {nodes(categories.data || []).map((item) => (
              <option key={item.id} value={item.id}>
                {text(item.name, language)}
              </option>
            ))}
          </SelectField>
        </ReadState>
      )}
      {draft.targetType === 'products' && (
        <ReadState read={products}>
          <div className="staff-target-products">
            <p>
              {draft.productIds.length} {ar ? 'منتج مختار' : 'products selected'}
            </p>
            {products.data?.items.map((item) => (
              <label key={item.id} className="staff-check">
                <input
                  type="checkbox"
                  checked={draft.productIds.includes(item.id)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      productIds: event.target.checked
                        ? [...draft.productIds, item.id]
                        : draft.productIds.filter((id) => id !== item.id),
                    })
                  }
                  disabled={!draft.productIds.includes(item.id) && draft.productIds.length >= 100}
                />
                {text(item.name, language)}
              </label>
            ))}
            <Pagination pagination={products.data?.pagination} onPage={setPage} />
          </div>
        </ReadState>
      )}
    </>
  )
}
function Editor({ kind, initial, onClose, onSaved }) {
  const { language, confirmUnsaved } = useDashboard(),
    ar = language === 'ar',
    [busy, setBusy] = useState(false),
    create = !initial.id
  return (
    <Modal
      open
      onClose={() => !busy && confirmUnsaved() && onClose()}
      title={
        ar
          ? kind === 'sales'
            ? 'حملة تخفيض'
            : 'كوبون'
          : kind === 'sales'
            ? 'Sales campaign'
            : 'Coupon'
      }
      className="staff-promotion-modal"
    >
      <RecordEditor
        initial={initial}
        path={`/${kind}${create ? '' : `/${initial.id}`}`}
        create={create}
        onSaved={onSaved}
        onBusy={setBusy}
        payload={kind === 'sales' ? salePayload : couponPayload}
      >
        {({ draft, setDraft }) => (
          <section className="staff-panel">
            {kind === 'coupons' && (
              <label className="field">
                <span>{ar ? 'رمز الكوبون' : 'Coupon code'}</span>
                <input
                  required
                  minLength={3}
                  maxLength={40}
                  value={draft.code}
                  onChange={(event) =>
                    setDraft({ ...draft, code: event.target.value.toUpperCase() })
                  }
                />
              </label>
            )}
            <BilingualFields
              label={ar ? 'الاسم' : 'Name'}
              required
              maxLength={150}
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <Targets draft={draft} setDraft={setDraft} language={language} />
            <div className="staff-field-pair">
              <SelectField
                label={ar ? 'نوع الخصم' : 'Discount type'}
                value={draft.discountType}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    discountType: event.target.value,
                    discountValue: event.target.value === 'percentage' ? 10 : 1000,
                  })
                }
              >
                <option value="percentage">{ar ? 'نسبة مئوية' : 'Percentage'}</option>
                <option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed amount'}</option>
              </SelectField>
              {draft.discountType === 'fixed' ? (
                <MoneyField
                  label={ar ? 'الخصم (جنيه مصري)' : 'Discount (EGP)'}
                  required
                  value={draft.discountValue}
                  onChange={(discountValue) => setDraft({ ...draft, discountValue })}
                />
              ) : (
                <label className="field">
                  <span>{ar ? 'النسبة %' : 'Percent %'}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    required
                    value={draft.discountValue}
                    onChange={(event) =>
                      setDraft({ ...draft, discountValue: Number(event.target.value) })
                    }
                  />
                </label>
              )}
            </div>
            {kind === 'coupons' && (
              <>
                <MoneyField
                  label={
                    ar ? 'الحد الأدنى للشراء المؤهل (جنيه مصري)' : 'Minimum eligible spend (EGP)'
                  }
                  required
                  value={draft.minimumSpend}
                  onChange={(minimumSpend) => setDraft({ ...draft, minimumSpend })}
                />
                <div className="staff-field-pair">
                  {[
                    ['maxUses', ar ? 'عدد الاستخدامات الكلي' : 'Maximum uses'],
                    [
                      'maxUsesPerPerson',
                      ar ? 'عدد الاستخدامات لكل هاتف' : 'Uses per checkout phone',
                    ],
                  ].map(([key, label]) => (
                    <label key={key} className="field">
                      <span>
                        {label} ({ar ? 'فارغ بلا حد' : 'blank for unlimited'})
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={1000000000}
                        step={1}
                        value={draft[key] ?? ''}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [key]: event.target.value === '' ? null : Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <p className="staff-help">
                  {ar
                    ? 'لا يطبق الكوبون على المنتجات المخفضة أو الشحن؛ يُحسب الاستخدام عند تأكيد الطلب.'
                    : 'Coupons exclude sale items and shipping. Usage is consumed when an order is placed.'}
                </p>
              </>
            )}
            <div className="staff-field-pair">
              {[
                ['startsAt', ar ? 'يبدأ (بتوقيت جهازك)' : 'Starts (your device time)'],
                [
                  'endsAt',
                  ar ? 'ينتهي - غير شامل (بتوقيت جهازك)' : 'Ends - exclusive (your device time)',
                ],
              ].map(([key, label]) => (
                <DateTimeField
                  key={key}
                  label={label}
                  required={kind === 'sales'}
                  value={draft[key]}
                  onChange={(date) => setDraft({ ...draft, [key]: date })}
                />
              ))}
            </div>
            <Switch
              label={ar ? 'تفعيل' : 'Enabled'}
              checked={draft.isEnabled}
              onChange={(isEnabled) => setDraft({ ...draft, isEnabled })}
            />
            {kind === 'sales' && (
              <p className="staff-help">
                {ar
                  ? 'الحملات المفعّلة المتداخلة على نفس المنتجات قد تتعارض. راجع نطاق الحملة وفترتها عند ظهور تعارض.'
                  : 'Enabled campaigns can conflict when their targets and periods overlap. Review the scope and dates if the server reports a conflict.'}
              </p>
            )}
          </section>
        )}
      </RecordEditor>
    </Modal>
  )
}
export function DashboardPromotions() {
  const { language, user } = useDashboard(),
    ar = language === 'ar',
    [search, setSearch] = useSearchParams(),
    kind = search.get('tab') === 'coupons' ? 'coupons' : 'sales',
    page = Math.max(1, Number(search.get('page')) || 1),
    [edit, setEdit] = useState(null),
    read = useStaffRead(`/${kind}?page=${page}&limit=20`)
  return (
    <>
      <StaffHeading
        title={ar ? 'التخفيضات والكوبونات' : 'Sales & coupons'}
        action={
          <Button variant="accent" onClick={() => setEdit(blank(kind))}>
            {kind === 'sales'
              ? ar
                ? 'إضافة حملة'
                : 'Create sale'
              : ar
                ? 'إضافة كوبون'
                : 'Create coupon'}
          </Button>
        }
      />
      <div className="staff-tabs">
        {['sales', 'coupons'].map((tab) => (
          <Button
            key={tab}
            variant={kind === tab ? 'accent' : 'secondary'}
            aria-pressed={kind === tab}
            onClick={() => setSearch({ tab })}
          >
            {tab === 'sales' ? (ar ? 'الحملات' : 'Sales') : ar ? 'الكوبونات' : 'Coupons'}
          </Button>
        ))}
      </div>
      <ReadState read={read}>
        {read.data && (
          <div className="staff-promotion-table">
            <StaffTable
              rows={read.data.items}
              empty={ar ? 'لا توجد سجلات' : 'No records'}
              columns={[
                {
                  key: 'name',
                  label: ar ? 'الاسم / الرمز' : 'Name / code',
                  render: (row) => (
                    <>
                      <strong>{text(row.name, language)}</strong>
                      {row.code && <p>{row.code}</p>}
                    </>
                  ),
                },
                {
                  key: 'discountValue',
                  label: ar ? 'الخصم' : 'Discount',
                  render: (row) =>
                    row.discountType === 'percentage'
                      ? `${row.discountValue}%`
                      : formatMoney(row.discountValue, language),
                },
                {
                  key: 'schedule',
                  label: ar ? 'الفترة' : 'Schedule',
                  render: (row) => (
                    <>
                      {row.startsAt ? (
                        <StaffDate value={row.startsAt} />
                      ) : ar ? (
                        'بلا بداية'
                      ) : (
                        'No start'
                      )}
                      <br />
                      {row.endsAt ? <StaffDate value={row.endsAt} /> : ar ? 'بلا نهاية' : 'No end'}
                    </>
                  ),
                },
                {
                  key: 'isEnabled',
                  label: ar ? 'الحالة / الاستخدام' : 'State / usage',
                  render: (row) => (
                    <>
                      <PromotionSwitch
                        key={`${kind}:${row.id}`}
                        record={row}
                        kind={kind}
                        onSaved={(fresh) =>
                          read.setData((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                              item.id === fresh.id ? fresh : item,
                            ),
                          }))
                        }
                      />
                      {kind === 'coupons' && (
                        <p>
                          {row.usedCount ?? 0} / {row.maxUses ?? (ar ? 'بلا حد' : 'Unlimited')}
                        </p>
                      )}
                    </>
                  ),
                },
                {
                  key: 'actions',
                  label: ar ? 'الإجراء' : 'Action',
                  render: (row) => (
                    <div className="staff-actions">
                      <StaffAction
                        action="edit"
                        label={`${ar ? 'تعديل' : 'Edit'} ${text(row.name, language)}`}
                        onClick={() => setEdit(row)}
                      />
                      {user.role === 'superAdmin' && (
                        <DeleteRecord
                          iconOnly
                          path={`/${kind}/${row.id}`}
                          back={`promotions?tab=${kind}`}
                          label={text(row.name, language)}
                          onDeleted={read.reload}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              pagination={read.data.pagination}
              onPage={(value) => setSearch({ tab: kind, page: String(value) })}
            />
          </div>
        )}
      </ReadState>
      {edit && (
        <Editor
          key={`${kind}:${edit.id || 'new'}`}
          kind={kind}
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
