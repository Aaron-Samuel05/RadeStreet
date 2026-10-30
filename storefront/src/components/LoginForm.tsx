'use client'
import { useActionState } from 'react'
import { requestLoginCode, submitLoginCode, type FormState } from '@/actions/store'

export function LoginForm() {
  const [asked, ask, asking] = useActionState<FormState & { email?: string }, FormData>(requestLoginCode, {})
  const [result, submit, submitting] = useActionState<FormState, FormData>(submitLoginCode, {})

  if (!asked.email) {
    return (
      <form action={ask} className="ui-form">
        <div className="ui-field"><label htmlFor="le">Email</label><input id="le" name="email" type="email" required autoComplete="email" placeholder="you@email.com" /></div>
        {asked.error ? <p className="ui-msg error" role="alert">{asked.error}</p> : null}
        <button className="btn-pill block" disabled={asking} aria-busy={asking}>{asking ? 'Sending…' : 'Email me a code'}</button>
      </form>
    )
  }
  return (
    <form action={submit} className="ui-form">
      <p className="ui-msg ok" role="status">{asked.ok}</p>
      <input type="hidden" name="email" value={asked.email} />
      <div className="ui-field"><label htmlFor="lc">6-digit code</label><input id="lc" className="ui-code" name="code" inputMode="numeric" pattern="\d{6}" title="6-digit code" maxLength={6} required autoComplete="one-time-code" autoFocus /></div>
      {result.error ? <p className="ui-msg error" role="alert">{result.error}</p> : null}
      <button className="btn-pill block" disabled={submitting} aria-busy={submitting}>{submitting ? 'Checking…' : 'Log in'}</button>
    </form>
  )
}
