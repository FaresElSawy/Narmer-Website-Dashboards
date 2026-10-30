import { useId, useRef, useState } from 'react'
import { SelectField } from '../../../../shared/ui/SelectField.jsx'
import { Icon } from '../../../../shared/ui/Brand.jsx'
import { calendarDays } from '../../../../shared/lib/date-time.js'
import { calendarDate, cairoDate, shiftDate } from './dates.js'

export function ReportDateField({ label, value, onChange, language }) {
  const ar = language === 'ar',
    locale = ar ? 'ar-EG' : 'en-GB',
    id = useId(),
    popup = useRef(null),
    trigger = useRef(null)
  const [open, setOpen] = useState(false),
    [view, setView] = useState({ year: 2026, month: 0 }),
    [active, setActive] = useState(value)
  const months = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, month, 1)),
    ),
  )
  const fullDate = (key) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(
      new Date(`${key}T12:00Z`),
    )
  function close() {
    popup.current.hidePopover()
    trigger.current.focus({ preventScroll: true })
  }
  function show() {
    const key = calendarDate(value) ? value : cairoDate(),
      rect = trigger.current.getBoundingClientRect(),
      width = Math.min(340, innerWidth - 24)
    setView({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 })
    setActive(key)
    Object.assign(popup.current.style, {
      left: `${Math.max(12, Math.min(innerWidth - width - 12, ar ? rect.right - width : rect.left))}px`,
      top: `${Math.max(12, Math.min(innerHeight - 410, rect.bottom + 8))}px`,
      maxHeight: `${innerHeight - 24}px`,
    })
    popup.current.showPopover()
    requestAnimationFrame(() =>
      popup.current.querySelector('[tabindex="0"]')?.focus({ preventScroll: true }),
    )
  }
  function move(step) {
    const date = new Date(Date.UTC(view.year, view.month + step, 1))
    if (date.getUTCFullYear() >= 2000 && date.getUTCFullYear() <= 2100)
      setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() })
  }
  return (
    <div className="field report-date-field">
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        ref={trigger}
        type="button"
        className="narmer-date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        onClick={() => (open ? close() : show())}
      >
        <span>
          {calendarDate(value)
            ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
                new Date(`${value}T12:00Z`),
              )
            : value || (ar ? 'اختر التاريخ' : 'Choose date')}
        </span>
        <Icon name="calendar" />
      </button>
      <div
        ref={popup}
        id={`${id}-calendar`}
        popover="auto"
        className="narmer-date-popover report-calendar"
        role="dialog"
        aria-label={label}
        dir={ar ? 'rtl' : 'ltr'}
        onToggle={(event) => setOpen(event.newState === 'open')}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            close()
          }
        }}
      >
        <div className="narmer-calendar-heading">
          <strong>{label}</strong>
          <button
            type="button"
            className="icon-button close-button"
            aria-label={ar ? 'إغلاق التقويم' : 'Close calendar'}
            onClick={close}
          >
            ×
          </button>
        </div>
        <div className="narmer-calendar-month">
          <button
            type="button"
            className="icon-button"
            aria-label={ar ? 'الشهر السابق' : 'Previous month'}
            disabled={view.year === 2000 && view.month === 0}
            onClick={() => move(-1)}
          >
            <Icon name="chevron" />
          </button>
          <SelectField
            floating
            label={ar ? 'الشهر' : 'Month'}
            value={view.month}
            onChange={(event) => setView({ ...view, month: Number(event.target.value) })}
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </SelectField>
          <SelectField
            floating
            label={ar ? 'السنة' : 'Year'}
            value={view.year}
            onChange={(event) => setView({ ...view, year: Number(event.target.value) })}
          >
            {Array.from({ length: 101 }, (_, index) => index + 2000).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectField>
          <button
            type="button"
            className="icon-button"
            aria-label={ar ? 'الشهر التالي' : 'Next month'}
            disabled={view.year === 2100 && view.month === 11}
            onClick={() => move(1)}
          >
            <Icon name="chevron" />
          </button>
        </div>
        <div className="narmer-calendar-week" aria-hidden="true">
          {Array.from({ length: 7 }, (_, day) => (
            <span key={day}>
              {new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(
                new Date(Date.UTC(2024, 0, 7 + day)),
              )}
            </span>
          ))}
        </div>
        <div
          className="narmer-calendar-days"
          role="group"
          aria-label={ar ? 'اختر اليوم' : 'Choose day'}
        >
          {calendarDays(view.year, view.month).map((day) => (
            <button
              key={day.key}
              type="button"
              disabled={day.key < '2000-01-01' || day.key > '2100-12-31'}
              data-date={day.key}
              data-outside={day.month !== view.month || undefined}
              aria-label={fullDate(day.key)}
              aria-pressed={value === day.key}
              tabIndex={
                (
                  active.slice(0, 7) === `${view.year}-${String(view.month + 1).padStart(2, '0')}`
                    ? active === day.key
                    : day.month === view.month && day.day === 1
                )
                  ? 0
                  : -1
              }
              onClick={() => {
                onChange(day.key)
                close()
              }}
              onKeyDown={(event) => {
                const step = {
                  ArrowLeft: ar ? 1 : -1,
                  ArrowRight: ar ? -1 : 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                  Home: -new Date(`${day.key}T12:00Z`).getUTCDay(),
                  End: 6 - new Date(`${day.key}T12:00Z`).getUTCDay(),
                }[event.key]
                if (step === undefined) return
                event.preventDefault()
                const key = shiftDate(day.key, step)
                if (key < '2000-01-01' || key > '2100-12-31') return
                setActive(key)
                setView({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 })
                requestAnimationFrame(() =>
                  popup.current.querySelector(`[data-date="${key}"]`)?.focus(),
                )
              }}
            >
              {new Intl.NumberFormat(language).format(day.day)}
            </button>
          ))}
        </div>
        <p className="staff-help">
          {ar ? 'توقيت القاهرة · يشمل اليوم المحدد' : 'Cairo time · includes the selected day'}
        </p>
      </div>
    </div>
  )
}
