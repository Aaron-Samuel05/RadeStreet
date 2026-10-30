'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export type DropTab = { key: string; label: string }
export type DropItem = { id: string; lanes: string[]; node: ReactNode }

/**
 * The weekly drop as a grid you can filter by lane. The cards are drawn on the server and handed in as nodes, so this only
 * decides which of them to show. With one lane (or none) there is nothing to filter and the chips are left out.
 * On phones the grid is a sideways row you swipe (see .drop-grid in globals.css).
 */
export function DropTabs({ tabs, items, label }: { tabs: DropTab[]; items: DropItem[]; label: string }) {
  const [tab, setTab] = useState('all')
  const list = useRef<HTMLUListElement>(null)
  const shown = tab === 'all' ? items : items.filter((it) => it.lanes.includes(tab))

  // A different filter is a different row: start it from the first card.
  useEffect(() => { list.current?.scrollTo({ left: 0, behavior: 'instant' }) }, [tab])

  const chips: (DropTab & { n: number })[] = [
    { key: 'all', label: 'All', n: items.length },
    ...tabs.map((t) => ({ ...t, n: items.filter((it) => it.lanes.includes(t.key)).length })),
  ].filter((t) => t.n > 0)

  return (
    <>
      {chips.length > 2 ? (
        <div className="drop-chips" role="group" aria-label={`Filter ${label}`}>
          {chips.map((c) => (
            <button key={c.key} type="button" className="drop-chip" aria-pressed={tab === c.key} onClick={() => setTab(c.key)}>
              {c.label}<sup>{c.n}</sup>
            </button>
          ))}
        </div>
      ) : null}
      <ul ref={list} className={`drop-grid${shown.length === 5 ? ' five' : ''}`} aria-label={label}>
        {shown.map((it) => <li key={it.id}>{it.node}</li>)}
      </ul>
    </>
  )
}
