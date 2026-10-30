import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Modal } from '../../../../shared/ui/Primitives.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { StaffError } from './components.jsx'

export function DeleteRecord({ path, back, label, onDeleted }) {
  const { user, request, language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate()
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  if (user.role !== 'superAdmin') return null
  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await request(path, { method: 'DELETE' })
      setOpen(false)
      onDeleted?.()
      navigate(`/${language}/dashboard/${back}`)
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {ar ? 'حذف' : 'Delete'} {label}
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={ar ? 'تأكيد الحذف' : 'Confirm deletion'}
      >
        <p>
          {ar
            ? 'لا يمكن التراجع عن الحذف. المراجع المحمية تمنع حذف السجلات المستخدمة.'
            : 'Deletion cannot be undone. Protected references prevent deleting records in use.'}
        </p>
        <StaffError error={error} />
        <Button disabled={busy} onClick={remove}>
          {ar ? 'تأكيد الحذف' : 'Confirm deletion'}
        </Button>
      </Modal>
    </>
  )
}
