'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowIcon } from './Icons'

/**
 * A single row of cards that scrolls sideways: swipe or trackpad on touch screens, arrow buttons with a mouse.
 * Four cards fit on a wide screen; any more sit off to the right. Pass the cards as `<li>` children.
 */
export function CardRail({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    return () => { el.removeEventListener('scroll', measure); resize.disconnect() }
  }, [measure])

  const go = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth, behavior: calm ? 'auto' : 'smooth' })
  }

  const overflows = !(edge.start && edge.end)
  return (
    <div className="rail-wrap">
      <ul className="rail" ref={track} aria-label={label}>{children}</ul>
      {overflows ? (
        <>
          <button type="button" className="rail-btn prev" aria-label="Previous products" disabled={edge.start} onClick={() => go(-1)}><ArrowIcon size={18} /></button>
          <button type="button" className="rail-btn next" aria-label="Next products" disabled={edge.end} onClick={() => go(1)}><ArrowIcon size={18} /></button>
        </>
      ) : null}
    </div>
  )
}
