import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLocale } from './Locale.jsx'
import { Skeleton } from './Skeleton.jsx'
import { useNotifications } from './Notifications.jsx'
import { Icon } from './Brand.jsx'

export function Button({ to, variant = 'primary', className = '', children, ...props }) {
  const classes = `button button--${variant} ${className}`
  return to ? (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export function Field({ label, error, hint, id: givenId, revealPassword = false, type, ...props }) {
  const uniqueId = useId(),
    id = givenId || uniqueId,
    language = useLocale(),
    [visible, setVisible] = useState(false)
  const input = (
    <input
      id={id}
      type={revealPassword && visible ? 'text' : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={error || hint ? `${id}-help` : undefined}
      {...props}
    />
  )
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {revealPassword ? (
        <div className="password-input">
          {input}
          <button
            type="button"
            className="password-toggle"
            disabled={props.disabled}
            aria-label={
              visible
                ? language === 'ar'
                  ? 'إخفاء كلمة المرور'
                  : 'Hide password'
                : language === 'ar'
                  ? 'إظهار كلمة المرور'
                  : 'Show password'
            }
            aria-pressed={visible}
            aria-controls={id}
            onClick={() => setVisible((value) => !value)}
          >
            <Icon name={visible ? 'eye-off' : 'eye'} />
          </button>
        </div>
      ) : (
        input
      )}
      {(error || hint) && (
        <p id={`${id}-help`} className={error ? 'field-error' : 'muted'}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Feedback({ kind = 'empty', title, children, action, skeleton = 'content' }) {
  const { notify } = useNotifications()
  useEffect(() => {
    if (kind === 'success' && typeof title === 'string') notify(title)
  }, [kind, title, notify])
  if (kind === 'loading') return <Skeleton title={title} variant={skeleton} />
  return (
    <div className={`feedback feedback--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
        {action}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, className = '' }) {
  const ref = useRef(null),
    titleId = useId(),
    language = useLocale()
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const previous = document.activeElement
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])
  function keepFocus(event) {
    if (event.key !== 'Tab') return
    const targets = [
      ...ref.current.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
      ),
    ].filter((node) => node.getClientRects().length)
    const first = targets[0],
      last = targets.at(-1)
    if (!first) {
      event.preventDefault()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onKeyDown={keepFocus}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button close-button"
          onClick={onClose}
          aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function Tabs({ tabs, label, selected: active, onSelect }) {
  const [localSelected, setLocalSelected] = useState(0),
    id = useId(),
    refs = useRef([]),
    invalidPending = useRef(false)
  const selected = active ?? localSelected
  function setSelected(index) {
    setLocalSelected(index)
    onSelect?.(index)
  }
  function onKeyDown(event, index) {
    const rtl = event.currentTarget.closest('[dir="rtl"]') || document.documentElement.dir === 'rtl'
    const step =
      event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + step + tabs.length) % tabs.length
    if (step || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setSelected(next)
      refs.current[next]?.focus()
    }
  }
  return (
    <div
      onInvalidCapture={(event) => {
        if (invalidPending.current) {
          event.preventDefault()
          return
        }
        invalidPending.current = true
        requestAnimationFrame(() => {
          invalidPending.current = false
        })
        const field = event.target,
          panel = field.closest('[role="tabpanel"]'),
          panels = [...event.currentTarget.querySelectorAll(':scope > [role="tabpanel"]')],
          index = panels.indexOf(panel),
          closed = field.closest('details:not([open])')
        if (index < 0 || (!panel.hidden && !closed)) return
        event.preventDefault()
        setSelected(index)
        for (let node = field.parentElement; node && node !== panel; node = node.parentElement)
          if (node.tagName === 'DETAILS') node.open = true
        requestAnimationFrame(() => {
          field.focus()
          field.reportValidity()
        })
      }}
    >
      <div className="tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            ref={(node) => {
              refs.current[index] = node
            }}
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => setSelected(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selected !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

export function LabelledRows({ rows }) {
  return (
    <div className="labelled-rows">
      {rows.map((row) => (
        <dl key={row.id}>
          {row.fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  )
}
