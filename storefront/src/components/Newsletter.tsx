'use client'
import { useActionState } from 'react'
import { subscribe, type FormState } from '@/actions/store'
import { ArrowIcon } from './Icons'

export function Newsletter() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {})
  return (
    <>
      <form action={action}>
        <label className="sr" htmlFor="nl-email">Email</label>
        <input id="nl-email" name="email" type="email" required placeholder="Your email address" autoComplete="email" />
        <button className="btn-pill" disabled={pending}>{pending ? 'Joining…' : <>Subscribe <ArrowIcon /></>}</button>
      </form>
      <p role="status">{state.error ?? state.ok ?? ''}</p>
    </>
  )
}
