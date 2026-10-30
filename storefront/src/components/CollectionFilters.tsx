'use client'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CloseIcon, SlidersIcon } from './Icons'
import { SortSelect } from './SortSelect'

type Selected = { sizes: string[]; types: string[]; vendors: string[]; inStock: boolean; min: string; max: string }
type Facets = { sizes: string[]; types: string[]; vendors: string[]; hasSoldOut: boolean; priceMin: number; priceMax: number }
type List = 'sizes' | 'types' | 'vendors'

/**
 * The toolbar and filter panel of a collection page. The panel is a sidebar on desktop and a slide-in drawer on phones.
 * Choices apply as they are made by changing the address, so the server re-renders the list; the products themselves
 * arrive as children from the page.
 */
export function CollectionFilters({ facets, selected, count, currency, sort, sorts, children }: {
  facets: Facets
  selected: Selected
  count: number
  currency: string
  sort: string
  sorts: readonly (readonly [string, string])[]
  children: ReactNode
}) {
  const router = useRouter()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(selected)
  const [pending, start] = useTransition()
  const trigger = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  // The address is the source of truth: when it changes (a chip, Clear all, back button) the panel follows.
  const signature = JSON.stringify(selected)
  useEffect(() => setSel(selected), [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = facets.sizes.length > 0 || facets.types.length > 0 || facets.vendors.length > 0 || facets.hasSoldOut || facets.priceMax > facets.priceMin
  const active = sel.sizes.length + sel.types.length + sel.vendors.length + (sel.inStock ? 1 : 0) + (sel.min || sel.max ? 1 : 0)

  const apply = (next: Selected) => {
    setSel(next)
    const q = new URLSearchParams()
    if (sort !== 'newest') q.set('sort', sort)
    next.sizes.forEach((v) => q.append('size', v))
    next.types.forEach((v) => q.append('type', v))
    next.vendors.forEach((v) => q.append('vendor', v))
    if (next.inStock) q.set('stock', '1')
    if (next.min) q.set('min', next.min)
    if (next.max) q.set('max', next.max)
    const s = q.toString()
    start(() => router.replace(s ? `${path}?${s}` : path, { scroll: false }))
  }
  const toggle = (list: List, value: string) => apply({ ...sel, [list]: sel[list].includes(value) ? sel[list].filter((v) => v !== value) : [...sel[list], value] })
  const commitPrice = () => { if (sel.min !== selected.min || sel.max !== selected.max) apply(sel) }
  const clear = () => apply({ sizes: [], types: [], vendors: [], inStock: false, min: '', max: '' })

  const close = () => setOpen(false)
  // Focus goes back to the Filters button once the drawer has closed (the toolbar is inert while it is open).
  const wasOpen = useRef(false)
  useEffect(() => {
    if (!open && wasOpen.current) trigger.current?.focus()
    wasOpen.current = open
  }, [open])
  useEffect(() => {
    if (!open) return
    const small = window.matchMedia('(max-width: 1099px)')
    const onWide = () => { if (!small.matches) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    small.addEventListener('change', onWide)
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; small.removeEventListener('change', onWide); window.removeEventListener('keydown', onKey) }
  }, [open])

  const checks = (list: List, label: string, values: string[]) => (
    <fieldset className="plp-group">
      <legend>{label}</legend>
      <ul className="plp-checks">
        {values.map((v) => (
          <li key={v}><label><input type="checkbox" checked={sel[list].includes(v)} onChange={() => toggle(list, v)} /><span>{v}</span></label></li>
        ))}
      </ul>
    </fieldset>
  )

  return (
    <div className="plp">
      <div className="plp-toolbar" inert={open}>
        {groups ? (
          <button type="button" ref={trigger} className="plp-filter-btn" aria-expanded={open} aria-controls="plp-filters" onClick={() => setOpen(true)}>
            <SlidersIcon /> Filters{active > 0 ? <span className="plp-badge" aria-label={`${active} applied`}>{active}</span> : null}
          </button>
        ) : null}
        <p className="plp-count" role="status">{count} {count === 1 ? 'bundle' : 'bundles'}</p>
        <SortSelect value={sort} options={sorts} />
      </div>

      <div className={`plp-body${groups ? ' has-filters' : ''}`}>
        {groups ? (
          <>
            <div className="plp-scrim" data-open={open} onClick={close} aria-hidden="true" />
            <aside id="plp-filters" className="plp-filters" data-open={open} aria-label="Filters" role={open ? 'dialog' : undefined} aria-modal={open || undefined}>
              <div className="plp-filters-head">
                <h2>Filters</h2>
                {active > 0 ? <button type="button" className="plp-clear" onClick={clear}>Clear all</button> : null}
                <button type="button" ref={closeBtn} className="plp-close" onClick={close} aria-label="Close filters"><CloseIcon size={20} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); commitPrice() }}>
                {facets.sizes.length ? (
                  <fieldset className="plp-group">
                    <legend>Size</legend>
                    <ul className="plp-sizes">
                      {facets.sizes.map((s) => (
                        <li key={s}><label className="plp-chip"><input type="checkbox" checked={sel.sizes.includes(s)} onChange={() => toggle('sizes', s)} /><span>{s}</span></label></li>
                      ))}
                    </ul>
                  </fieldset>
                ) : null}
                {facets.priceMax > facets.priceMin ? (
                  <fieldset className="plp-group">
                    <legend>Price</legend>
                    <div className="plp-price">
                      <label><span>Min ({currency})</span><input type="number" inputMode="numeric" min={0} placeholder={String(facets.priceMin)} value={sel.min} onChange={(e) => setSel({ ...sel, min: e.target.value })} onBlur={commitPrice} /></label>
                      <label><span>Max ({currency})</span><input type="number" inputMode="numeric" min={0} placeholder={String(facets.priceMax)} value={sel.max} onChange={(e) => setSel({ ...sel, max: e.target.value })} onBlur={commitPrice} /></label>
                    </div>
                  </fieldset>
                ) : null}
                {facets.hasSoldOut ? (
                  <fieldset className="plp-group">
                    <legend>Availability</legend>
                    <ul className="plp-checks">
                      <li><label><input type="checkbox" checked={sel.inStock} onChange={() => apply({ ...sel, inStock: !sel.inStock })} /><span>In stock only</span></label></li>
                    </ul>
                  </fieldset>
                ) : null}
                {facets.types.length ? checks('types', 'Type', facets.types) : null}
                {facets.vendors.length ? checks('vendors', 'Brand', facets.vendors) : null}
                <button type="button" className="btn-pill plp-show" onClick={close}>Show {count} {count === 1 ? 'bundle' : 'bundles'}</button>
              </form>
            </aside>
          </>
        ) : null}
        <div className="plp-main" aria-busy={pending} data-pending={pending} inert={open}>{children}</div>
      </div>
    </div>
  )
}
