import { useEffect, useState, type RefObject } from 'react'

const HOLD_MS = 2500

/**
 * Makes a sideways scroll row drift left at a steady speed, forever, like a ticker you can still swipe. The row's `count` real
 * items are followed by a second, identical copy (the caller renders it when this returns true), and the scroll position wraps
 * by exactly one copy so the join never shows. Returns whether the row overflows enough to need that: a row whose items all
 * fit is left alone and never gets the copy.
 *
 * It pauses while the pointer is over the row, for a moment after a touch or key press, while the row is off screen, the tab is
 * hidden, or reduced motion is on.
 */
export function useFreeFlow(row: RefObject<HTMLElement | null>, count: number, pxPerSecond = 45) {
  const [flowing, setFlowing] = useState(false)

  // Does one copy of the items spill over the row by at least half an item? Only then is there anything to flow.
  useEffect(() => {
    const el = row.current
    if (!el) return
    const measure = () => {
      const kids = Array.from(el.children) as HTMLElement[]
      if (count < 2 || kids.length < count) return setFlowing(false)
      const style = getComputedStyle(el)
      const start = kids[0].getBoundingClientRect().left
      const end = kids[count - 1].getBoundingClientRect().right
      const copy = end - start + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
      setFlowing(copy - el.clientWidth >= kids[0].offsetWidth / 2)
    }
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [row, count])

  useEffect(() => {
    const el = row.current
    if (!el || !flowing) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    let span = 0
    let pos = el.scrollLeft
    let onScreen = false
    let touched = false
    let hovering = false
    let release: number | undefined
    let last = 0
    let raf = 0
    // One copy's length, gap included: where the first real item sits against its twin in the second copy.
    const measure = () => {
      const kids = el.children
      if (kids.length > count) span = kids[count].getBoundingClientRect().left - kids[0].getBoundingClientRect().left
    }
    const touch = () => {
      touched = true
      window.clearTimeout(release)
      release = window.setTimeout(() => { touched = false; pos = el.scrollLeft }, HOLD_MS)
    }
    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame)
      const dt = Math.min(now - last, 64) / 1000
      last = now
      if (touched || hovering || !onScreen || document.hidden || calm.matches || span <= 0) return
      pos += pxPerSecond * dt
      if (pos >= span) pos -= span
      el.scrollLeft = pos
    }
    measure()
    const size = new ResizeObserver(measure)
    size.observe(el)
    const watch = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.4 })
    watch.observe(el)
    const enter = () => { hovering = true }
    const leave = () => { hovering = false; pos = el.scrollLeft }
    const touches = ['touchstart', 'pointerdown', 'wheel', 'focusin', 'keydown'] as const
    touches.forEach((t) => el.addEventListener(t, touch, { passive: true }))
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    raf = window.requestAnimationFrame((t) => { last = t; frame(t) })
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(release)
      size.disconnect()
      watch.disconnect()
      touches.forEach((t) => el.removeEventListener(t, touch))
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [row, count, flowing, pxPerSecond])

  return flowing
}
