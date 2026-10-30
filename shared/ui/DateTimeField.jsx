import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from './Locale.jsx'
import { Button } from './Primitives.jsx'
import { SelectField } from './SelectField.jsx'
import { Icon } from './Brand.jsx'
import { calendarDays, explicitDateTime, localDateTime } from '../lib/date-time.js'
import '../assets/css/dashboard-controls.css'

export function DateTimeField({ label, value, onChange, required = false }) {
  const language = useLocale(),
    ar = language === 'ar',
    id = useId(),
    popup = useRef(null),
    trigger = useRef(null),
    [open, setOpen] = useState(false),
    [invalid, setInvalid] = useState(false),
    [chosen, setChosen] = useState(''),
    [hour, setHour] = useState('00'),
    [minute, setMinute] = useState('00'),
    [view, setView] = useState(() => {
      const now = new Date()
      return { year: now.getFullYear(), month: now.getMonth() }
    }),
    [error, setError] = useState('')
  const local = localDateTime(value),
    months = Array.from({ length: 12 }, (_, month) =>
      new Intl.DateTimeFormat(language, { month: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, month, 1)),
      ),
    ),
    weekdays = Array.from({ length: 7 }, (_, day) =>
      new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 7 + day)),
      ),
    )
  function show() {
    if (trigger.current.matches(':disabled')) return
    const next = local || localDateTime(new Date().toISOString()),
      rect = trigger.current.getBoundingClientRect(),
      width = Math.min(340, innerWidth - 24),
      below = innerHeight - rect.bottom - 12,
      above = rect.top - 12,
      upwards = below < 440 && above > below
    setChosen(next.slice(0, 10))
    setHour(next.slice(11, 13))
    setMinute(next.slice(14, 16))
    setView({ year: Number(next.slice(0, 4)), month: Number(next.slice(5, 7)) - 1 })
    setError('')
    const height = Math.min(540, innerHeight - 24),
      top = Math.min(
        innerHeight - height - 12,
        Math.max(12, upwards ? rect.top - height - 8 : rect.bottom + 8),
      )
    Object.assign(popup.current.style, {
      top: `${top}px`,
      left: `${Math.min(innerWidth - width - 12, Math.max(12, ar ? rect.right - width : rect.left))}px`,
      maxHeight: `${height}px`,
    })
    popup.current.showPopover()
    requestAnimationFrame(() =>
      popup.current.querySelector('[data-date][tabindex="0"]')?.focus({ preventScroll: true }),
    )
  }
  function close() {
    popup.current?.hidePopover()
    trigger.current?.focus({ preventScroll: true })
  }
  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (
        event.type === 'resize' ||
        (!popup.current.contains(event.target) && !trigger.current.contains(event.target))
      )
        popup.current?.hidePopover()
    }
    window.addEventListener('resize', dismiss)
    document.addEventListener('scroll', dismiss, true)
    return () => {
      window.removeEventListener('resize', dismiss)
      document.removeEventListener('scroll', dismiss, true)
    }
  }, [open])
  function shiftMonth(step) {
    const date = new Date(0)
    date.setUTCFullYear(view.year, view.month + step, 1)
    if (date.getUTCFullYear() > 0 && date.getUTCFullYear() < 9999)
      setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() })
  }
  function chooseDay(key, focus = false) {
    setChosen(key)
    setView({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 })
    if (focus)
      requestAnimationFrame(() =>
        popup.current.querySelector(`[data-date="${key}"]`)?.focus({ preventScroll: true }),
      )
  }
  return (
    <div className="field narmer-datetime">
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <input
        className="narmer-date-native"
        type="text"
        value={local}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        onInvalid={(event) => {
          event.preventDefault()
          setInvalid(true)
          show()
        }}
      />
      <button
        ref={trigger}
        id={id}
        type="button"
        className="narmer-date-trigger"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-popup`}
        aria-invalid={(invalid && !local) || undefined}
        onClick={() => (open ? close() : show())}
      >
        <span>
          {local
            ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(value),
              )
            : ar
              ? 'اختر التاريخ والوقت'
              : 'Choose date and time'}
        </span>
        <Icon name="calendar" />
      </button>
      {invalid && !local && (
        <p className="field-error">{ar ? 'اختر التاريخ والوقت.' : 'Choose a date and time.'}</p>
      )}
      <div
        ref={popup}
        id={`${id}-popup`}
        popover="auto"
        role="dialog"
        aria-label={label}
        className="narmer-date-popover"
        dir={ar ? 'rtl' : 'ltr'}
        onToggle={(event) => setOpen(event.newState === 'open')}
      >
        <div className="narmer-calendar-heading">
          <strong>{ar ? 'التاريخ والوقت' : 'Date and time'}</strong>
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
            onClick={() => shiftMonth(-1)}
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
            {Array.from({ length: 21 }, (_, index) => view.year - 10 + index)
              .filter((year) => year > 0 && year < 9999)
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </SelectField>
          <button
            type="button"
            className="icon-button"
            aria-label={ar ? 'الشهر التالي' : 'Next month'}
            onClick={() => shiftMonth(1)}
          >
            <Icon name="chevron" />
          </button>
        </div>
        <div className="narmer-calendar-week" aria-hidden="true">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
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
              data-date={day.key}
              data-outside={day.month !== view.month || undefined}
              aria-pressed={chosen === day.key}
              tabIndex={
                chosen === day.key ||
                (!chosen.startsWith(`${view.year}-${String(view.month + 1).padStart(2, '0')}`) &&
                  day.day === 1 &&
                  day.month === view.month)
                  ? 0
                  : -1
              }
              aria-label={new Intl.DateTimeFormat(language, {
                dateStyle: 'full',
                timeZone: 'UTC',
              }).format(new Date(`${day.key}T12:00:00Z`))}
              onClick={() => chooseDay(day.key)}
              onKeyDown={(event) => {
                const step = {
                  ArrowLeft: ar ? 1 : -1,
                  ArrowRight: ar ? -1 : 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                }[event.key]
                if (step) {
                  event.preventDefault()
                  const date = new Date(`${day.key}T12:00:00Z`)
                  date.setUTCDate(date.getUTCDate() + step)
                  chooseDay(date.toISOString().slice(0, 10), true)
                }
              }}
            >
              {day.day}
            </button>
          ))}
        </div>
        <div className="narmer-calendar-time">
          <SelectField
            floating
            label={ar ? 'الساعة' : 'Hour'}
            value={hour}
            onChange={(event) => setHour(event.target.value)}
          >
            {Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')).map(
              (hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ),
            )}
          </SelectField>
          <span aria-hidden="true">:</span>
          <SelectField
            floating
            label={ar ? 'الدقيقة' : 'Minute'}
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
          >
            {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map(
              (minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ),
            )}
          </SelectField>
          <small>{ar ? 'بتوقيت جهازك · 24 ساعة' : 'Your device time · 24-hour clock'}</small>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="narmer-calendar-actions">
          <Button
            variant="secondary"
            onClick={() => {
              onChange(null)
              setInvalid(false)
              close()
            }}
          >
            {ar ? 'مسح' : 'Clear'}
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              const iso = explicitDateTime(`${chosen}T${hour}:${minute}`)
              if (!iso) {
                setError(
                  ar
                    ? 'هذا الوقت غير صالح. اختر وقتًا آخر.'
                    : 'This local time is not valid. Choose another time.',
                )
                return
              }
              onChange(iso)
              setInvalid(false)
              close()
            }}
          >
            {ar ? 'تطبيق' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
