'use client'
import { useActionState, useState } from 'react'
import { notifyWhenBack, type FormState } from '@/actions/store'

/** Shown instead of a dead "Sold out" button: leave an email and we write when it returns. */
export function StockAlertForm({ variantId, email }: { variantId: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(notifyWhenBack, {})
  const [mail, setMail] = useState(email)
  return (
    <form action={action} className="alert-form">
      <input type="hidden" name="variantId" value={variantId} />
      <div aria-hidden="true" className="sr"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className="alert-title">Sold out. Tell me when it&apos;s back</p>
      <div className="alert-row">
        <label className="sr" htmlFor="alert-email">Email</label>
        <input id="alert-email" name="email" type="email" required value={mail} onChange={(e) => setMail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
        <button className="btn-pill" disabled={pending} aria-busy={pending}>{pending ? 'Saving…' : 'Notify me'}</button>
      </div>
      <p role="status" className="alert-msg">{state.error ?? state.ok ?? ''}</p>
    </form>
  )
}
