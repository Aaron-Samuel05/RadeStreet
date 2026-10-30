'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { useFreeFlow } from '@/lib/use-free-flow'

export type BrowseItem = { href: string; image: string | null; label: string; name: string }

/**
 * "Browse bags": a single row of small rounded photos, one per bundle, each named by its pack ("3 T-Shirts"). All of them fit
 * side by side on a desktop. With more bundles, or on a phone, the row drifts sideways on its own at a steady speed and loops
 * without a break (useFreeFlow); it can still be swiped. The looping copy of the tiles is hidden from screen readers and the
 * tab order.
 */
export function HomeBrowse({ items }: { items: BrowseItem[] }) {
  const row = useRef<HTMLUListElement>(null)
  const flowing = useFreeFlow(row, items.length)
  const tile = (it: BrowseItem, i: number, copy: boolean) => (
    <li key={copy ? `${it.href}-copy` : it.href} aria-hidden={copy || undefined}>
      <Link href={it.href} className="browse-tile" aria-label={it.name} tabIndex={copy ? -1 : undefined}>
        <span className="browse-pic">
          {it.image ? <img src={it.image} alt="" loading={!copy && i < 5 ? 'eager' : 'lazy'} /> : null}
        </span>
        <span className="browse-name" aria-hidden="true">{it.label}</span>
      </Link>
    </li>
  )
  return (
    <section className="browse" aria-label="Browse bags">
      <div className="wrap">
        <ul ref={row} className={`browse-row${flowing ? ' flow' : ''}`}>
          {items.map((it, i) => tile(it, i, false))}
          {flowing ? items.map((it, i) => tile(it, i, true)) : null}
        </ul>
      </div>
    </section>
  )
}
