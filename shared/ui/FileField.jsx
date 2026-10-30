import { useId, useState } from 'react'
import { useLocale } from './Locale.jsx'
import '../assets/css/dashboard-controls.css'

export function FileField({ label, hint, onChange, disabled, ref, ...props }) {
  const id = useId(),
    ar = useLocale() === 'ar',
    [filename, setFilename] = useState('')
  return (
    <div className="field narmer-file">
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div className="narmer-file-control" data-disabled={disabled || undefined}>
        <div className="narmer-file-picker">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 13V3m-4 4 4-4 4 4M3 12v5h14v-5" />
          </svg>
          <span>{ar ? 'اختيار صورة' : 'Choose image'}</span>
          <input
            {...props}
            ref={ref}
            id={id}
            type="file"
            disabled={disabled}
            aria-labelledby={`${id}-label`}
            aria-describedby={hint ? `${id}-hint` : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setFilename(file.name)
              onChange?.(event)
            }}
          />
        </div>
        <span className="narmer-file-name" title={filename || undefined} aria-live="polite">
          {filename || (ar ? 'لم يتم اختيار صورة' : 'No image selected')}
        </span>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="muted">
          {hint}
        </p>
      )}
    </div>
  )
}
