import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button, Modal, Feedback } from '../../../shared/ui/Primitives.jsx'
import { localText, compositionRows, isId } from '../features/inquiry/model.js'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import whatsappIcon from '../assets/images/whatsapp.png'
import { whatsappContactUrl } from '../features/dashboard/model.js'
import {
  StaffHeading,
  StaffTable,
  ReadState,
  StaffError,
  StaffLink,
  StaffDate,
} from '../features/dashboard/components.jsx'

function PrivateImage({ leadId, imageId }) {
  const { request, language } = useDashboard(),
    ar = language === 'ar'
  const [state, setState] = useState({ url: '', error: null }),
    [revision, retry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let url
    request(`/leads/${leadId}/images/${imageId}`, { binary: true, signal: controller.signal })
      .then((blob) => {
        if (!controller.signal.aborted) {
          url = URL.createObjectURL(blob)
          setState({ url, error: null })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ url: '', error })
      })
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [request, leadId, imageId, revision])
  return state.error ? (
    <div>
      <StaffError error={state.error} />
      <Button variant="secondary" onClick={() => retry((value) => value + 1)}>
        {ar ? 'إعادة تحميل الصورة' : 'Retry image'}
      </Button>
    </div>
  ) : state.url ? (
    <a href={state.url} target="_blank" rel="noreferrer">
      <img src={state.url} alt={ar ? 'صورة مرجعية خاصة للطلب' : 'Private request reference'} />
    </a>
  ) : (
    <Feedback
      kind="loading"
      skeleton="image"
      title={ar ? 'جارٍ تحميل الصورة' : 'Loading private image'}
    />
  )
}
export function DashboardRequestDetail() {
  const { leadId } = useParams(),
    { request, language } = useDashboard(),
    ar = language === 'ar'
  const read = useStaffRead(isId(leadId) ? `/leads/${leadId}` : '/leads/invalid')
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  async function mark() {
    setBusy(true)
    setError(null)
    try {
      read.setData(await request(`/leads/${leadId}/contacted`, { method: 'PATCH' }))
      setConfirm(false)
    } catch (error) {
      setError(error)
      if (error.status === 409) read.reload()
    } finally {
      setBusy(false)
    }
  }
  const lead = read.data
  const whatsappUrl = whatsappContactUrl(lead?.contact.phone)
  return (
    <>
      <StaffLink section="requests">{ar ? 'العودة للطلبات' : 'Back to requests'}</StaffLink>
      <StaffHeading title={ar ? 'تفاصيل الطلب' : 'Request detail'} />
      <ReadState read={read}>
        {lead && (
          <>
            <ol className="staff-status-steps">
              <li aria-current={lead.status === 'submitted' ? 'step' : undefined}>
                {ar ? 'تم الإرسال' : 'Submitted'}
              </li>
              <li aria-current={lead.status === 'contacted' ? 'step' : undefined}>
                {ar ? 'تم التواصل' : 'Contacted'}
              </li>
            </ol>
            <div className="staff-detail-grid">
              <div>
                <section className="panel staff-panel">
                  <h2>
                    {localText(lead.form.title, language)} · {lead.contact.name}
                  </h2>
                  <dl className="staff-details">
                    {Object.entries(lead.contact).map(([key, value]) => (
                      <div key={key}>
                        <dt>
                          {
                            {
                              name: ar ? 'الاسم' : 'Name',
                              phone: ar ? 'الهاتف' : 'Phone',
                              email: ar ? 'البريد الإلكتروني' : 'Email',
                              governorate: ar ? 'المحافظة' : 'Governorate',
                              district: ar ? 'المنطقة' : 'District',
                            }[key]
                          }
                        </dt>
                        <dd
                          className={key === 'phone' ? 'staff-contact-phone' : undefined}
                          dir={['phone', 'email'].includes(key) ? 'ltr' : undefined}
                        >
                          <span>{value ?? '-'}</span>
                          {key === 'phone' && whatsappUrl && (
                            <a
                              className="staff-whatsapp"
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              dir={ar ? 'rtl' : 'ltr'}
                              title={ar ? 'واتساب' : 'WhatsApp'}
                              aria-label={
                                ar
                                  ? `التواصل مع ${lead.contact.name} عبر واتساب`
                                  : `Contact ${lead.contact.name} on WhatsApp`
                              }
                            >
                              <img
                                src={whatsappIcon}
                                width="24"
                                height="24"
                                alt=""
                                aria-hidden="true"
                              />
                            </a>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="muted">
                    <StaffDate value={lead.createdAt} />
                  </p>
                  {lead.form.fields.length > 0 && (
                    <div className="staff-answer-list">
                      {lead.form.fields.map((field) => {
                        const value = lead.answers[field.key],
                          display = (choice) =>
                            localText(
                              field.choices.find((item) => item.key === choice)?.label || choice,
                              language,
                            )
                        return (
                          <div key={field.key}>
                            <strong>{localText(field.label, language)}</strong>
                            <p>
                              {value === undefined
                                ? '-'
                                : field.type === 'boolean'
                                  ? value
                                    ? ar
                                      ? 'نعم'
                                      : 'Yes'
                                    : ar
                                      ? 'لا'
                                      : 'No'
                                  : Array.isArray(value)
                                    ? value.map(display).join('، ')
                                    : field.type === 'select'
                                      ? display(value)
                                      : String(value)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {lead.wholesaleRequests.map((offer) => (
                    <section key={offer.id}>
                      <h3>{localText(offer.name, language)}</h3>
                      <p>
                        {offer.quantity} {ar ? 'عبوة' : 'pouches'} × {offer.piecesPerPouch} ={' '}
                        {offer.quantity * offer.piecesPerPouch} {ar ? 'قطعة' : 'pieces'}
                      </p>
                      <StaffTable
                        columns={[
                          { key: 'selection', label: ar ? 'التكوين الثابت' : 'Fixed composition' },
                          { key: 'quantity', label: ar ? 'قطع في العبوة' : 'Pieces per pouch' },
                        ]}
                        rows={compositionRows(offer, language)}
                      />
                    </section>
                  ))}
                </section>
                <section className="staff-panel staff-attachments">
                  <h2>{ar ? 'صور مرجعية خاصة' : 'Private reference images'}</h2>
                  {lead.imageIds.length ? (
                    <div className="staff-private-images">
                      {lead.imageIds.map((imageId) => (
                        <PrivateImage key={imageId} leadId={lead.id} imageId={imageId} />
                      ))}
                    </div>
                  ) : (
                    <p>
                      {ar ? 'لم تُرفق صور بهذا الطلب.' : 'No images were attached to this request.'}
                    </p>
                  )}
                </section>
              </div>
              <aside className="staff-panel">
                <Button
                  variant="accent"
                  disabled={lead.status === 'contacted'}
                  onClick={() => setConfirm(true)}
                >
                  {lead.status === 'contacted'
                    ? ar
                      ? 'تم التواصل'
                      : 'Contacted'
                    : ar
                      ? 'تسجيل إتمام التواصل'
                      : 'Mark contacted'}
                </Button>
                <p>
                  {ar
                    ? 'تواصل مع العميل خارج الموقع أولًا. لا يمكن تعديل الإجابات أو حذف الطلب.'
                    : 'Contact the customer offline first. Submitted answers and snapshots cannot be edited or deleted.'}
                </p>
                {lead.contactedAt && (
                  <>
                    <p>
                      <StaffDate value={lead.contactedAt} />
                    </p>
                    <p className="staff-reference">
                      {ar ? 'بواسطة' : 'Marked by'}: {lead.contactedBy}
                    </p>
                  </>
                )}
              </aside>
            </div>
            <Modal
              open={confirm}
              onClose={() => !busy && setConfirm(false)}
              title={ar ? 'هل تم التواصل مع العميل؟' : 'Have you contacted the customer?'}
            >
              <p>
                {ar
                  ? 'أكد فقط بعد إتمام المتابعة خارج الموقع. يسجّل الخادم الموظف والوقت.'
                  : 'Confirm after completing offline follow-up. The server records the staff member and time.'}
              </p>
              <StaffError error={error} />
              <Button variant="accent" disabled={busy} onClick={mark}>
                {busy
                  ? ar
                    ? 'جارٍ الحفظ'
                    : 'Saving'
                  : ar
                    ? 'نعم، تم التواصل'
                    : 'Yes, mark contacted'}
              </Button>
            </Modal>
          </>
        )}
      </ReadState>
    </>
  )
}
