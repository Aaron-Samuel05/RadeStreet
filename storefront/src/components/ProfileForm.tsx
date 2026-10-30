'use client'
import { useActionState } from 'react'
import { saveProfile, type FormState } from '@/actions/store'

export function ProfileForm({ firstName, lastName, phone, marketing }: { firstName: string; lastName: string; phone: string; marketing: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {})
  return (
    <form action={action} className="ui-form">
      <div className="ui-fields">
        <div className="ui-field"><label htmlFor="fn">First name</label><input id="fn" name="firstName" defaultValue={firstName} autoComplete="given-name" /></div>
        <div className="ui-field"><label htmlFor="ln">Last name</label><input id="ln" name="lastName" defaultValue={lastName} autoComplete="family-name" /></div>
        <div className="ui-field full"><label htmlFor="ph">Phone</label><input id="ph" name="phone" type="tel" defaultValue={phone} autoComplete="tel" /></div>
        <label className="ui-check full"><input type="checkbox" name="marketing" defaultChecked={marketing} /> Email me about new drops</label>
      </div>
      {state.error ? <p className="ui-msg error" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="ui-msg ok" role="status">{state.ok}</p> : null}
      <button className="btn-pill" disabled={pending} aria-busy={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  )
}
