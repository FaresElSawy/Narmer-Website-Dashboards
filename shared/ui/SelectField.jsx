import { Children, useEffect, useId, useRef, useState } from 'react'
import { useLocale } from './Locale.jsx'
import '../assets/css/dashboard-controls.css'

export function SelectField({
  label,
  children,
  value,
  onChange,
  disabled,
  required,
  floating = false,
  id: givenId,
  'aria-invalid': fieldInvalid,
  'aria-describedby': describedBy,
  ...props
}) {
  const ar = useLocale() === 'ar',
    generatedId = useId(),
    id = givenId || generatedId,
    root = useRef(null),
    native = useRef(null),
    trigger = useRef(null),
    list = useRef(null),
    search = useRef({ text: '', time: 0 }),
    [open, setOpen] = useState(false),
    [invalid, setInvalid] = useState(false),
    [active, setActive] = useState(0),
    [placement, setPlacement] = useState({ above: false, height: 280 })
  const options = Children.toArray(children).filter(Boolean),
    optionValue = (option) => String(option.props.value ?? option.props.children),
    selected = options.findIndex((option) => optionValue(option) === String(value)),
    enabled = options
      .map((option, index) => (!option.props.disabled ? index : -1))
      .filter((i) => i >= 0)

  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    function reposition() {
      setOpen(false)
    }
    function scroll(event) {
      if (!list.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', reposition)
    if (floating) document.addEventListener('scroll', scroll, true)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('resize', reposition)
      if (floating) document.removeEventListener('scroll', scroll, true)
    }
  }, [open, floating])

  useEffect(() => {
    if (!open) return
    const menu = list.current,
      option = menu?.children[active]
    if (!option) return
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight)
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight
  }, [open, active])

  function expand(
    index = selected >= 0 && !options[selected]?.props.disabled ? selected : enabled[0],
  ) {
    if (native.current.matches(':disabled') || !enabled.length) return
    const rect = trigger.current.getBoundingClientRect(),
      dialog = trigger.current.closest('dialog[open]')?.getBoundingClientRect(),
      below = Math.min(window.innerHeight, dialog?.bottom ?? window.innerHeight) - rect.bottom - 16,
      above = rect.top - Math.max(0, dialog?.top ?? 0) - 16,
      upwards = below < 200 && above > below
    setPlacement({
      above: upwards,
      height: Math.max(80, Math.min(280, upwards ? above : below)),
      offset: rect.top - root.current.getBoundingClientRect().top,
      ...(floating && {
        width: Math.max(112, rect.width),
        left: Math.max(
          12,
          Math.min(
            window.innerWidth - Math.max(112, rect.width) - 12,
            ar ? rect.right - Math.max(112, rect.width) : rect.left,
          ),
        ),
        top: upwards ? undefined : rect.bottom + 6,
        bottom: upwards ? window.innerHeight - rect.top + 6 : undefined,
      }),
    })
    setActive(index ?? 0)
    setOpen(true)
  }

  function choose(index) {
    if (native.current.matches(':disabled') || options[index]?.props.disabled) return
    native.current.value = optionValue(options[index])
    native.current.dispatchEvent(new Event('change', { bubbles: true }))
    setInvalid(false)
    setOpen(false)
    trigger.current.focus()
  }

  function keyDown(event) {
    const key = event.key
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault()
      if (!open) {
        expand(key === 'Home' ? enabled[0] : key === 'End' ? enabled.at(-1) : undefined)
        return
      }
      const current = enabled.indexOf(active)
      setActive(
        key === 'Home'
          ? enabled[0]
          : key === 'End'
            ? enabled.at(-1)
            : enabled[(current + (key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length],
      )
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (open) choose(active)
      else expand()
    } else if (key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    } else if (key === 'Tab') setOpen(false)
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const now = Date.now(),
        text =
          (now - search.current.time < 600 ? search.current.text : '') + key.toLocaleLowerCase()
      search.current = { text, time: now }
      const start = open ? active : selected,
        ordered = [...enabled.filter((i) => i > start), ...enabled.filter((i) => i <= start)],
        match = ordered.find((i) =>
          String(options[i].props.children).toLocaleLowerCase().startsWith(text),
        )
      if (match !== undefined) {
        if (!open) expand(match)
        else setActive(match)
      }
    }
  }

  return (
    <div
      ref={root}
      className="field staff-select narmer-select"
      data-open={open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      {/* Keep native form validation and fieldset disabling behind the styled control. */}
      <select
        {...props}
        ref={native}
        className="narmer-select-native"
        aria-hidden="true"
        tabIndex={-1}
        value={value}
        disabled={disabled}
        required={required}
        onChange={onChange}
        onInvalid={(event) => {
          event.preventDefault()
          setInvalid(true)
          trigger.current.focus()
          expand()
        }}
      >
        {children}
      </select>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        className="narmer-select-trigger"
        aria-labelledby={`${id}-label`}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
        aria-invalid={invalid || fieldInvalid || undefined}
        aria-describedby={invalid ? `${id}-error` : describedBy}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        onKeyDown={keyDown}
        onClick={(event) => {
          event.currentTarget.focus()
          if (open) setOpen(false)
          else expand()
        }}
      >
        <span>{options[selected]?.props.children ?? options[0]?.props.children ?? '-'}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {invalid && (
        <p className="field-error" id={`${id}-error`}>
          {ar ? 'اختر أحد الخيارات.' : 'Choose an option.'}
        </p>
      )}
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className={`narmer-select-list${placement.above ? ' narmer-select-list--above' : ''}${floating ? ' narmer-select-list--floating' : ''}`}
          style={{
            maxHeight: placement.height,
            '--select-trigger-offset': `${placement.offset}px`,
            ...(floating && {
              width: placement.width,
              left: placement.left,
              top: placement.top,
              bottom: placement.bottom,
            }),
          }}
        >
          {options.map((option, index) => (
            <li
              id={`${id}-option-${index}`}
              key={optionValue(option)}
              role="option"
              aria-selected={index === selected}
              aria-disabled={option.props.disabled || undefined}
              data-active={index === active || undefined}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => {
                if (!option.props.disabled) setActive(index)
              }}
              onClick={() => choose(index)}
            >
              <span>{option.props.children}</span>
              {index === selected && (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m3 8 3 3 7-7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
