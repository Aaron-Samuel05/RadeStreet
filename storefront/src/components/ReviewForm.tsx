'use client'
import { useActionState, useState } from 'react'
import { submitReview } from '@/actions/community'
import type { FormState } from '@/actions/store'

export function ReviewForm({ productId }: { productId: string }) {
  const [state, run, pending] = useActionState<FormState, FormData>(submitReview, {})
  const [stars, setStars] = useState(0)
  if (state.ok) return <p className="notice ok" role="status">{state.ok}</p>
  return (
    <form action={run}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={stars || ''} />
      <div aria-hidden="true" className="sr"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Your rating</p>
      <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)}
            style={{ background: 'none', border: 0, fontSize: '2rem', cursor: 'pointer', color: n <= stars ? 'var(--orange)' : '#12121255', padding: 0, lineHeight: 1 }}>★</button>
        ))}
      </div>
      <div className="form-grid">
        <div className="field"><label htmlFor="rv-name">Name</label><input id="rv-name" name="name" required maxLength={80} autoComplete="name" /></div>
        <div className="field"><label htmlFor="rv-email">Email (kept private; confirms you bought it)</label><input id="rv-email" name="email" type="email" autoComplete="email" /></div>
        <div className="field full"><label htmlFor="rv-title">Headline (optional)</label><input id="rv-title" name="title" maxLength={100} /></div>
        <div className="field full"><label htmlFor="rv-body">Your review</label><textarea id="rv-body" name="body" rows={4} required minLength={10} maxLength={2000} /></div>
      </div>
      {state.error ? <p className="notice error" role="alert" style={{ marginTop: 12 }}>{state.error}</p> : null}
      <button className="btn" style={{ marginTop: 14 }} disabled={pending}>{pending ? 'Sending…' : 'Submit review'}</button>
    </form>
  )
}
