import { useLocale } from './Locale.jsx'
import '../assets/css/dashboard-controls.css'

export function Switch({ checked, onChange, label, ...props }) {
  const ar = useLocale() === 'ar'
  return (
    <button
      type="button"
      className="narmer-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      {...props}
    >
      <span className="narmer-switch-track" aria-hidden="true">
        <span />
      </span>
      <span>{checked ? (ar ? 'مفعّل' : 'Enabled') : ar ? 'معطل' : 'Disabled'}</span>
    </button>
  )
}
