'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowIcon } from './Icons'

export interface Slide {
  id: string
  headline: string
  subline: string
  imageUrl: string
  mobileUrl: string | null
  alt: string
  ctaLabel: string
  ctaHref: string
}

/** The headline with its lines alternately thin and bold. A one-line headline keeps its first word thin and the rest bold. */
function Headline({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const parts = lines.length > 1 ? lines : [text.trim().split(/\s+/)[0] ?? '', text.trim().split(/\s+/).slice(1).join(' ')].filter(Boolean)
  return (
    <>
      {parts.map((line, k) => (
        <span key={k} className={k % 2 ? 'b' : undefined}>{k > 0 ? ' ' : ''}{line}</span>
      ))}
    </>
  )
}

/**
 * Full-bleed slides managed in the admin. Auto-advances, pauses on hover/focus, and stays still for reduced-motion users.
 * When previewing a banner from the admin, `previewIndex` opens on that slide and keeps it there.
 */
export function HeroSlider({ slides, previewIndex }: { slides: Slide[]; previewIndex?: number }) {
  const [i, setI] = useState(previewIndex ?? 0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (slides.length < 2 || paused || previewIndex !== undefined || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [slides.length, paused, previewIndex])

  return (
    <section className="hero-slider" aria-roledescription="carousel" aria-label="Featured" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {slides.map((s, n) => (
        <div key={s.id} className="slide" data-active={n === i} aria-hidden={n !== i} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${slides.length}`}>
          <picture>
            {s.mobileUrl ? <source media="(max-width: 700px)" srcSet={s.mobileUrl} /> : null}
            <img src={s.imageUrl} alt={s.alt || ''} loading={n === 0 ? 'eager' : 'lazy'} fetchPriority={n === 0 ? 'high' : undefined} />
          </picture>
          <div className="slide-copy">
            {n === 0 ? (
              <div className="hero-badge" aria-hidden="true"><i /> Fresh drop every Monday</div>
            ) : null}
            {n === 0 ? <h1><Headline text={s.headline} /></h1> : <h2><Headline text={s.headline} /></h2>}
            {s.subline ? <p>{s.subline}</p> : null}
            {s.ctaLabel && s.ctaHref ? (
              <div className="slide-cta">
                <Link href={s.ctaHref} className="btn-pill light" tabIndex={n === i ? 0 : -1}>{s.ctaLabel} <ArrowIcon /></Link>
                <Link href="#price-h" className="btn-pill glass" tabIndex={n === i ? 0 : -1}>Shop by price</Link>
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {slides.length > 1 ? (
        <div className="slide-dots">
          {slides.map((s, n) => <button key={s.id} type="button" aria-label={`Show slide ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} />)}
        </div>
      ) : null}
    </section>
  )
}
