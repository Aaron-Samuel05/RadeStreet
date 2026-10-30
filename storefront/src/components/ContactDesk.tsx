'use client'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { sendContact } from '@/actions/contact'
import type { FormState } from '@/actions/store'
import { ArrowIcon, CheckIcon } from './Icons'
import { Select } from './Select'

const TOPICS = [
  { label: 'Order tracking & issues' },
  { label: 'Shipping & delivery' },
  { label: 'Payments & discounts' },
  { label: 'Branded bundle questions' },
]
const OTHER = 'Something else'
const HEARD = ['Instagram', 'Facebook', 'YouTube', 'Google search', 'Friend or family', 'Other']

type Values = Record<'first' | 'last' | 'heard' | 'email' | 'phone' | 'topic' | 'order' | 'message', string>
const EMPTY: Values = { first: '', last: '', heard: '', email: '', phone: '', topic: TOPICS[0].label, order: '', message: '' }

/** One entry per wizard step: the heading (the middle part is in the accent colour), a line under it, and the fields it owns. */
const STEPS: { head: [string, string, string]; sub: string; fields: (keyof Values)[] }[] = [
  { head: ["What's your ", 'name', '?'], sub: "Let's start with the basics. Letters only, please.", fields: ['first', 'last', 'heard'] },
  { head: ['How can we ', 'reach you', '?'], sub: 'We reply by email. Add a phone number if you would like a call or a WhatsApp message.', fields: ['email', 'phone'] },
  { head: ["What's it ", 'about', '?'], sub: 'Pick the closest topic. If this is about an order, add its number.', fields: ['topic', 'order'] },
  { head: ['Tell us ', 'more', '.'], sub: 'The more detail you give, the faster we can help.', fields: ['message'] },
  { head: ['Ready to ', 'send', '?'], sub: 'Check everything looks right, then send it our way.', fields: [] },
]
const LAST = STEPS.length

const NAME_PATTERN = "[\\p{L}][\\p{L}\\s.'\\-]*"
const PHONE_PATTERN = '\\+?\\d[\\d\\s\\-]{8,13}'

export function ContactDesk({ email, phone, whatsapp }: { email: string; phone: string; whatsapp: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, {})
  const [step, setStep] = useState(1)
  const [v, setV] = useState<Values>(EMPTY)
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const shown = useRef(1)
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }))

  // After a step change, put the keyboard where the new step starts (not on first load, which would scroll the page).
  useEffect(() => {
    if (shown.current === step) return
    shown.current = step
    const first = form.current?.querySelector<HTMLElement>('input:not([type=hidden]):not(.ct-hp), button.rs-select-trigger, textarea')
    ;(first ?? heading.current)?.focus()
  }, [step])

  const s = STEPS[step - 1]
  const own = new Set(s.fields)
  const sent = !!state.ok

  return (
    <section className="ct">
      <div className="ct-in">
      <div className="ct-left">
        <p className="ct-tag">Support</p>
        <h1 className="ct-title">Let&apos;s get<br />in <em>touch</em></h1>
        <p className="ct-lead">Don&apos;t be afraid to say hello. Our team responds within 24 hours, always.</p>

        <ul className="ct-topics" aria-label="What do you need help with?">
          {TOPICS.map(({ label }, i) => (
            <li key={label}>
              <button type="button" aria-pressed={v.topic === label} onClick={() => setV((p) => ({ ...p, topic: label }))}>
                <span className="ct-topic-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="ct-topic-label">{label}</span>
                <ArrowIcon size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className="ct-direct">
          <a href={`mailto:${email}`} className="ct-direct-card">
            <h2>Email us</h2>
            <span>{email} <ArrowIcon size={14} /></span>
            <p>For general queries reach us via email</p>
          </a>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="ct-direct-card">
            <h2>WhatsApp</h2>
            <span>{phone} <ArrowIcon size={14} /></span>
            <p>Chat with us on WhatsApp directly</p>
          </a>
        </div>
      </div>

      <div className="ct-right">
        <div className="ct-card">
          {sent ? (
            <div className="ct-sent" role="status">
              <span className="ct-sent-mark"><CheckIcon size={28} /></span>
              <h2>Message <em>sent</em></h2>
              <p>{state.ok}</p>
              <Link href="/collections" className="btn-pill">Keep shopping <ArrowIcon size={16} /></Link>
            </div>
          ) : (
            <>
              <ol className="ct-dots" aria-label="Progress">
                {STEPS.map((_, i) => {
                  const n = i + 1
                  const done = n < step
                  return (
                    <li key={n}>
                      <button type="button" disabled={!done} data-state={done ? 'done' : n === step ? 'now' : 'todo'} aria-current={n === step ? 'step' : undefined} aria-label={`Step ${n}${done ? ', go back' : ''}`} onClick={() => setStep(n)}>
                        {done ? <CheckIcon size={16} /> : n}
                      </button>                    </li>
                  )
                })}
              </ol>

              <form
                ref={form}
                action={action}
                className="ct-form"
                // Steps 1 to 4 only move on (the browser has already checked this step's fields); step 5 sends.
                onSubmit={(e) => { if (step < LAST) { e.preventDefault(); setStep(step + 1) } }}
              >
                <h2 ref={heading} tabIndex={-1} className="ct-step-title">{s.head[0]}<em>{s.head[1]}</em>{s.head[2]}</h2>
                <p className="ct-step-sub">{s.sub}</p>

                {/* Fields of the other steps ride along as hidden inputs so the final submit carries everything. */}
                {(Object.keys(v) as (keyof Values)[]).filter((k) => !own.has(k)).map((k) => <input key={k} type="hidden" name={k} value={v[k]} />)}
                <input className="ct-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                {step === 1 ? (
                  <div className="ui-fields">
                    <div className="ui-field">
                      <label htmlFor="ct-first">First name</label>
                      <input id="ct-first" name="first" required maxLength={60} pattern={NAME_PATTERN} title="Letters only" placeholder="John" autoComplete="given-name" value={v.first} onChange={set('first')} />
                    </div>
                    <div className="ui-field">
                      <label htmlFor="ct-last">Last name</label>
                      <input id="ct-last" name="last" maxLength={60} pattern={NAME_PATTERN} title="Letters only" placeholder="Doe" autoComplete="family-name" value={v.last} onChange={set('last')} />
                    </div>
                    <div className="ui-field full">
                      <label id="ct-heard-label">How did you hear about us?</label>
                      <Select
                        name="heard"
                        value={v.heard}
                        onChange={(val) => setV((p) => ({ ...p, heard: val }))}
                        options={HEARD.map((h) => ({ value: h, label: h }))}
                        placeholder="Select an option"
                        labelledBy="ct-heard-label"
                      />
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="ui-fields">
                    <div className="ui-field full">
                      <label htmlFor="ct-email">Email</label>
                      <input id="ct-email" name="email" type="email" required maxLength={120} placeholder="you@email.com" autoComplete="email" value={v.email} onChange={set('email')} />
                    </div>
                    <div className="ui-field full">
                      <label htmlFor="ct-phone">Phone or WhatsApp (optional)</label>
                      <input id="ct-phone" name="phone" type="tel" maxLength={20} pattern={PHONE_PATTERN} title="A phone number, for example +91 99999 99999" placeholder="+91 99999 99999" autoComplete="tel" value={v.phone} onChange={set('phone')} />
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="ui-fields">
                    <div className="ui-field full">
                      <label id="ct-topic-label">Topic</label>
                      <Select
                        name="topic"
                        value={v.topic}
                        onChange={(val) => setV((p) => ({ ...p, topic: val }))}
                        options={[...TOPICS.map((t) => t.label), OTHER].map((t) => ({ value: t, label: t }))}
                        labelledBy="ct-topic-label"
                      />
                    </div>
                    <div className="ui-field full">
                      <label htmlFor="ct-order">Order number (optional)</label>
                      <input id="ct-order" name="order" maxLength={20} placeholder="1001" autoComplete="off" value={v.order} onChange={set('order')} />
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="ui-fields">
                    <div className="ui-field full">
                      <label htmlFor="ct-message">Your message</label>
                      <textarea id="ct-message" name="message" required minLength={10} maxLength={2000} rows={6} placeholder="Tell us what happened or what you would like to know." value={v.message} onChange={set('message')} />
                    </div>
                  </div>
                ) : null}

                {step === LAST ? (
                  <dl className="ct-review">
                    <div><dt>Name</dt><dd>{`${v.first} ${v.last}`.trim()}</dd></div>
                    <div><dt>Reach you at</dt><dd>{v.email}{v.phone ? ` · ${v.phone}` : ''}</dd></div>
                    <div><dt>Topic</dt><dd>{v.topic}{v.order ? ` · order ${v.order}` : ''}</dd></div>
                    <div><dt>Message</dt><dd className="ct-review-msg">{v.message}</dd></div>
                  </dl>
                ) : null}

                <div role="status" aria-live="polite">{step === LAST && state.error ? <p className="ui-msg error">{state.error}</p> : null}</div>

                <div className="ct-foot">
                  <span className="ct-count">Step {step} of {LAST}</span>
                  <div className="ct-actions">
                    {step > 1 ? <button type="button" className="btn-pill ghost" onClick={() => setStep(step - 1)}>Back</button> : null}
                    <button key={step === LAST ? 'send' : 'next'} className="btn-pill" disabled={pending} aria-busy={pending}>
                      {step === LAST ? (pending ? 'Sending…' : 'Send message') : 'Next'} <ArrowIcon size={16} />
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
    </section>
  )
}
