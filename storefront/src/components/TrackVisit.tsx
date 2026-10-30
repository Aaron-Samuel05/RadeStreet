'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Page-view beacon for Analytics. First-party session id, no cookies set by third parties. */
export function TrackVisit() {
  const path = usePathname()
  useEffect(() => {
    try {
      let sid = sessionStorage.getItem('rs_sid')
      if (!sid) {
        sid = crypto.randomUUID()
        sessionStorage.setItem('rs_sid', sid)
      }
      const body = JSON.stringify({ sid, path, ref: document.referrer ? new URL(document.referrer).host : '' })
      navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))
    } catch {
      /* storage or beacon blocked: analytics is best-effort */
    }
  }, [path])
  return null
}
