'use client'
import { useActionState, useState } from 'react'
import type { FormState } from '@/actions/store'
import { Select } from './Select'

export interface FieldSpec {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  required?: boolean
  options?: string[]
  full?: boolean
  maxLength?: number
}

/** A small server-action form with labelled fields, a spam honeypot and an inline result message. */
export function FieldsForm({ action, fields, submit, hidden = {} }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  fields: FieldSpec[]
  submit: string
  hidden?: Record<string, string>
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {})
  const [picked, setPicked] = useState<Record<string, string>>({})
  return (
    <form action={run}>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {/* Honeypot: invisible to people, tempting to bots. Clipped like .sr rather than pushed off at -9999px, so it can't widen the page's scrollable area. */}
      <div aria-hidden="true" className="sr"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-grid">
        {fields.map((f) => (
          <div key={f.name} className={`field${f.full || f.type === 'textarea' ? ' full' : ''}`}>
            <label id={f.type === 'select' ? `f-${f.name}-label` : undefined} htmlFor={f.type === 'select' ? undefined : `f-${f.name}`}>{f.label}{f.required ? '' : ' (optional)'}</label>
            {f.type === 'textarea' ? <textarea id={`f-${f.name}`} name={f.name} rows={4} required={f.required} maxLength={f.maxLength} />
              : f.type === 'select' ? (
                <Select
                  name={f.name}
                  value={picked[f.name] ?? ''}
                  onChange={(v) => setPicked((p) => ({ ...p, [f.name]: v }))}
                  options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                  placeholder="Choose"
                  labelledBy={`f-${f.name}-label`}
                />
              )
              : <input id={`f-${f.name}`} name={f.name} type={f.type ?? 'text'} required={f.required} maxLength={f.maxLength} />}
          </div>
        ))}
      </div>
      {state.error ? <p className="notice error" role="alert" style={{ marginTop: 14 }}>{state.error}</p> : null}
      {state.ok ? <p className="notice ok" role="status" style={{ marginTop: 14 }}>{state.ok}</p> : null}
      <button className="btn" style={{ marginTop: 16 }} disabled={pending || Boolean(state.ok)}>{pending ? 'Sending…' : submit}</button>
    </form>
  )
}
