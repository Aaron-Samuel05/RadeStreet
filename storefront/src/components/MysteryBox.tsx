'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * The mystery box drawing. It sits closed until it scrolls into view, then the lid lifts and three "?" cards pop out.
 * Decorative only. For visitors who prefer reduced motion it simply starts open.
 */
export function MysteryBox() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setOpen(true)
      return
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOpen(true); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="mb" data-open={open} aria-hidden="true">
      <svg viewBox="0 0 240 260" focusable="false">
        <g className="mb-tile" style={{ ['--i' as string]: 0, ['--tilt' as string]: '-9deg', ['--rise' as string]: '-64px' }}>
          <rect x="54" y="172" width="48" height="62" rx="6" fill="#fc5702" />
          <text x="78" y="214" textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff">?</text>
        </g>
        <g className="mb-tile" style={{ ['--i' as string]: 1, ['--tilt' as string]: '3deg', ['--rise' as string]: '-78px' }}>
          <rect x="96" y="172" width="48" height="62" rx="6" fill="#f9f9f7" />
          <text x="120" y="214" textAnchor="middle" fontSize="38" fontWeight="800" fill="#000">?</text>
        </g>
        <g className="mb-tile" style={{ ['--i' as string]: 2, ['--tilt' as string]: '11deg', ['--rise' as string]: '-62px' }}>
          <rect x="138" y="172" width="48" height="62" rx="6" fill="none" stroke="#fff" strokeWidth="2" />
          <text x="162" y="214" textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff">?</text>
        </g>

        <rect x="40" y="162" width="160" height="90" rx="6" fill="#f4f4f2" />
        <rect x="108" y="162" width="24" height="90" fill="#fc5702" />
        <text x="74" y="228" textAnchor="middle" fontSize="58" fontWeight="800" fill="#000">?</text>
        <text x="166" y="228" textAnchor="middle" fontSize="58" fontWeight="800" fill="#000">?</text>

        <g className="mb-lid">
          <rect x="32" y="136" width="176" height="30" rx="5" fill="#fff" />
          <rect x="108" y="136" width="24" height="30" fill="#fc5702" />
          <ellipse cx="108" cy="130" rx="13" ry="8" fill="#fc5702" transform="rotate(-24 108 130)" />
          <ellipse cx="132" cy="130" rx="13" ry="8" fill="#fc5702" transform="rotate(24 132 130)" />
          <circle cx="120" cy="132" r="5" fill="#ff7a29" />
        </g>
      </svg>
    </div>
  )
}
