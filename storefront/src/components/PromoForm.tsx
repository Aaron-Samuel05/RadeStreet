'use client'
import { useActionState } from 'react'
import { applyCode, clearPromo, removeCode, type FormState } from '@/actions/store'
import { formatMoney } from '@/lib/format'

/** Add discount codes or a gift card. Every code on the cart is listed with a remove button. */
export function PromoForm({ codes, applied, gift }: { codes: string[]; applied: { id: string; title: string; code: string | null; amount: number }[]; gift: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyCode, {})
  const works = new Set(applied.flatMap((a) => (a.code ? [a.code.toLowerCase()] : [])))
  return (
    <div className="cart-promo">
      <form action={action}>
        <label htmlFor="promo">Discount code or gift card</label>
        <div className="cart-promo-row">
          <input id="promo" key={state.ok ?? 'f'} name="code" placeholder="Enter code" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          <button className="cart-apply" disabled={pending} aria-busy={pending}>{pending ? 'Checking…' : 'Apply'}</button>
        </div>
      </form>
      {state.error ? <p className="cart-msg error" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="cart-msg" role="status">{state.ok}</p> : null}
      {codes.length || gift || applied.some((a) => !a.code) ? (
        <ul className="cart-chips" aria-label="Applied discounts">
          {applied.filter((a) => !a.code).map((a) => <li key={a.id} className="cart-chip">{a.title} <small>automatic · −{formatMoney(a.amount)}</small></li>)}
          {codes.map((c) => {
            const hit = applied.find((a) => a.code?.toLowerCase() === c.toLowerCase())
            return (
              <li key={c} className={`cart-chip${works.has(c.toLowerCase()) ? '' : ' off'}`}>
                <b>{c.toUpperCase()}</b> <small>{hit ? (hit.amount > 0 ? `−${formatMoney(hit.amount)}` : 'free shipping') : 'not applied'}</small>
                <button type="button" aria-label={`Remove ${c}`} onClick={() => removeCode(c)}>✕</button>
              </li>
            )
          })}
          {gift ? <li className="cart-chip"><b>{gift}</b> <small>gift card</small></li> : null}
        </ul>
      ) : null}
      {codes.length || gift ? <button type="button" className="cart-clear" onClick={() => clearPromo()}>Remove all</button> : null}
    </div>
  )
}
