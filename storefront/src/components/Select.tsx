'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { ChevronIcon } from './Icons'

export interface SelectOption { value: string; label: string; disabled?: boolean }

/**
 * A select that stays on-brand even open: a native <select>'s popup list always renders in the
 * OS/browser's own default theme (plain white, system font, OS blue highlight) no matter what CSS
 * the page applies to it, so it reads as a foreign control dropped onto the site. This renders its
 * own ARIA listbox menu instead; a hidden input carries the value so forms submit exactly as a real
 * select would. Visual skin (border, radius, font) is supplied by the surrounding context class
 * (e.g. .ui-field, .field, .plp-sort) targeting .rs-select-trigger, same as those contexts used to
 * target the `select` tag directly.
 */
export function Select({
  name,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  autoComplete,
  className = '',
  triggerClassName = '',
  ariaLabel,
  labelledBy,
}: {
  name?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
  className?: string
  triggerClassName?: string
  ariaLabel?: string
  labelledBy?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const uid = useId()
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const fromIndex = options.findIndex((o) => o.value === value)
    setActive(fromIndex >= 0 ? fromIndex : 0)
    list.current?.focus()
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, options, value])

  const close = (focusTrigger = false) => {
    setOpen(false)
    if (focusTrigger) trigger.current?.focus()
  }

  const choose = (i: number) => {
    const opt = options[i]
    if (!opt || opt.disabled) return
    onChange(opt.value)
    close(true)
  }

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape': e.preventDefault(); close(true); break
      case 'Tab': close(); break
      case 'ArrowDown': e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); break
      case 'ArrowUp': e.preventDefault(); setActive((i) => Math.max(0, i - 1)); break
      case 'Home': e.preventDefault(); setActive(0); break
      case 'End': e.preventDefault(); setActive(options.length - 1); break
      case 'Enter':
      case ' ': e.preventDefault(); choose(active); break
      default:
        if (e.key.length === 1) {
          const from = (active + 1) % options.length
          const rotated = [...options.slice(from), ...options.slice(0, from)]
          const hit = rotated.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
          if (hit >= 0) setActive((from + hit) % options.length)
        }
    }
  }

  return (
    <div className={`rs-select ${className}`} ref={root}>
      {name ? <input type="hidden" name={name} value={value} autoComplete={autoComplete} /> : null}
      <button
        type="button"
        ref={trigger}
        id={`${uid}-trigger`}
        className={`rs-select-trigger ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy ? `${labelledBy} ${uid}-trigger` : undefined}
        data-empty={!selected || undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronIcon size={14} />
      </button>
      {open ? (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          className="rs-select-menu"
          aria-activedescendant={options[active] ? `${uid}-${active}` : undefined}
          onKeyDown={onListKey}
          onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) close() }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(i) }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
