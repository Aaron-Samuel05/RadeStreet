'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowIcon } from './Icons'
import type { FaqItem } from './HomeFaq'

/**
 * Design D's FAQ: a small chat. The first question is already answered; the rest wait as suggestion pills, and picking
 * one adds it to the thread as a message, then the answer after a short "typing" beat (instant with reduced motion).
 * The questions and answers are the same words as the other versions; the structured data is added by the page.
 */
export function HomeChat({ items }: { items: FaqItem[] }) {
  const [asked, setAsked] = useState<number[]>([0])
  const [pending, setPending] = useState<number | null>(null)
  const thread = useRef<HTMLDivElement>(null)
  const touched = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  useEffect(() => {
    const el = thread.current
    if (!el || !touched.current) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  }, [asked, pending])

  const ask = (n: number) => {
    if (pending !== null || asked.includes(n)) return
    touched.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setAsked((a) => [...a, n]); return }
    setPending(n)
    timer.current = setTimeout(() => { setAsked((a) => [...a, n]); setPending(null) }, 750)
  }

  const shown = pending === null ? asked : [...asked, pending]
  const left = items.map((it, n) => ({ it, n })).filter(({ n }) => !asked.includes(n) && n !== pending)

  return (
    <div className="chat-card">
      <div className="chat-bar">
        <span className="chat-av" aria-hidden="true">RS</span>
        <div><b>Rade Street</b><small>Quick answers</small></div>
      </div>

      <div className="chat-thread" ref={thread} role="log" aria-live="polite" aria-label="Questions and answers">
        {shown.map((n) => {
          const it = items[n]
          const done = asked.includes(n)
          return (
            <div key={n} className="chat-pair">
              <p className="chat-msg me">{it.q}</p>
              <div className="chat-reply">
                <span className="chat-av sm" aria-hidden="true">RS</span>
                {done ? (
                  <div className="chat-msg them">
                    <p>{it.a}</p>
                    {it.link ? <Link href={it.link.href} className="link-caps">{it.link.label}</Link> : null}
                  </div>
                ) : (
                  <div className="chat-msg them typing" aria-hidden="true"><i /><i /><i /></div>
                )}
              </div>
            </div>
          )
        })}
        {left.length === 0 && pending === null ? (
          <div className="chat-reply">
            <span className="chat-av sm" aria-hidden="true">RS</span>
            <div className="chat-msg them">
              <p>That is everything we get asked most. Something else on your mind?</p>
              <Link href="/pages/contact" className="link-caps">Ask us</Link>
            </div>
          </div>
        ) : null}
      </div>

      {left.length ? (
        <div className="chat-pills" role="group" aria-label="Ask another question">
          {left.map(({ it, n }) => (
            <button key={n} type="button" className="chat-pill" disabled={pending !== null} onClick={() => ask(n)}>{it.q}</button>
          ))}
        </div>
      ) : null}

      <div className="chat-foot">
        <Link href="/pages/contact" className="btn-pill ghost sm">Ask us something else <ArrowIcon /></Link>
      </div>
    </div>
  )
}
