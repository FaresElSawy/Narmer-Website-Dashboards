import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../../shared/ui/Primitives.jsx'
import { Switch } from '../../../../shared/ui/Switch.jsx'
import { useNotifications } from '../../../../shared/ui/Notifications.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { StaffError } from './components.jsx'
import { changePromotionEnabled, readPromotion } from './promotion-state.js'

export function PromotionSwitch({ record, kind, onSaved }) {
  const { language, request } = useDashboard(),
    ar = language === 'ar',
    { notify } = useNotifications(),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [error, setError] = useState(null),
    mounted = useRef(true),
    pending = useRef(false),
    name = record.name[language] || record.name.en,
    path = `/${kind}/${record.id}`
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function update(enabled, readOnly = false) {
    if (pending.current || (locked && !readOnly)) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      const result = readOnly
        ? { record: await readPromotion(request, path) }
        : await changePromotionEnabled(request, path, enabled)
      if (!mounted.current) return
      if (result.record) onSaved({ ...record, ...result.record })
      setLocked(!!result.locked)
      setError(result.error || null)
      if (result.record && !result.error && !readOnly)
        notify(
          `${name}: ${result.record.isEnabled ? (ar ? 'مفعّل' : 'Enabled') : ar ? 'معطل' : 'Disabled'}`,
        )
    } catch (failure) {
      if (!mounted.current) return
      setError(failure)
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <div className="promotion-state">
      <Switch
        label={`${ar ? 'تفعيل' : 'Enabled'}: ${name}`}
        checked={record.isEnabled}
        disabled={busy || locked}
        aria-busy={busy || undefined}
        onChange={(enabled) => update(enabled)}
      />
      <StaffError error={error} />
      {locked && (
        <Button variant="secondary" disabled={busy} onClick={() => update(null, true)}>
          {ar ? 'قراءة الحالة الحالية' : 'Read current state'}
        </Button>
      )}
    </div>
  )
}
