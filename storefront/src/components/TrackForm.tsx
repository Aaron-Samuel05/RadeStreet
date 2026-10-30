'use client'
import { useActionState, useState } from 'react'
import { trackOrder, type TrackState } from '@/actions/track'
import { formatMoney } from '@/lib/format'

const STEPS = ['Order placed', 'Being prepared', 'On its way', 'Shipped']

export function TrackForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, {})
  // Controlled, so a failed lookup does not wipe what the shopper typed (React resets plain fields after an action).
  const [number, setNumber] = useState('')
  const [mail, setMail] = useState(email)
  const o = state.order
  return (
    <>
      <form action={action} className="ui-form track-form">
        <div className="ui-fields">
          <div className="ui-field">
            <label htmlFor="t-number">Order number</label>
            <input id="t-number" name="number" inputMode="numeric" required placeholder="1001" autoComplete="off" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="ui-field">
            <label htmlFor="t-email">Email used at checkout</label>
            <input id="t-email" name="email" type="email" required value={mail} onChange={(e) => setMail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
          </div>
        </div>
        <button className="btn-pill" disabled={pending} aria-busy={pending}>{pending ? 'Looking…' : 'Track order'}</button>
      </form>
      <div role="status" aria-live="polite">
        {state.error ? <p className="ui-msg error">{state.error}</p> : null}
        {o ? (
          <section className="track-result" aria-label={`Order ${o.number}`}>
            <p className="track-eyebrow">Order #{o.number} · {new Date(o.placed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <h2>{o.stageLabel}</h2>
            {o.stageLabel === 'Cancelled' ? null : (
              <ol className="track-steps">
                {STEPS.map((s, i) => <li key={s} data-done={i <= o.stage}>{s}</li>)}
              </ol>
            )}
            {o.shipments.length ? (
              <div className="track-ship">
                {o.shipments.map((s, i) => (
                  <p key={i}>{s.company || 'Courier'}{s.number ? ` · ${s.number}` : ''}{s.url ? <> · <a href={s.url} target="_blank" rel="noopener noreferrer">Track the parcel</a></> : null}</p>
                ))}
              </div>
            ) : null}
            <ul className="os-items">
              {o.items.map((i, n) => (
                <li key={n}>
                  {i.image ? <img src={i.image} alt="" width={80} height={100} /> : <span className="os-ph" />}
                  <div>
                    <h3>{i.title}</h3>
                    {i.variant ? <small>{i.variant}</small> : null}
                  </div>
                  <p className="os-price">× {i.quantity}</p>
                </li>
              ))}
            </ul>
            <p className="track-sum">Total {formatMoney(o.total)} · Payment {o.payment}{o.city ? ` · Delivering to ${o.city}` : ''}</p>
          </section>
        ) : null}
      </div>
    </>
  )
}
