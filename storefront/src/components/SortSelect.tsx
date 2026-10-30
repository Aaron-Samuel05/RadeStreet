'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from './Select'

/** Changes the sort but keeps any filters in the address, and starts again from page one. */
export function SortSelect({ value, options }: { value: string; options: readonly (readonly [string, string])[] }) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const change = (next: string) => {
    const q = new URLSearchParams(params.toString())
    q.delete('page')
    if (next === 'newest') q.delete('sort')
    else q.set('sort', next)
    const s = q.toString()
    router.push(s ? `${path}?${s}` : path)
  }
  return (
    <div className="plp-sort">
      <label id="sort-label">Sort by</label>
      <Select name="sort" value={value} onChange={change} options={options.map(([v, l]) => ({ value: v, label: l }))} labelledBy="sort-label" />
    </div>
  )
}
