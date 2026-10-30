import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { CollectionFilters } from '@/components/CollectionFilters'
import { CloseIcon } from '@/components/Icons'
import { ProductCard } from '@/components/ProductCard'
import { applyFilters, activeChips, activeCount, currencySymbol, facetsOf, parseFilters, queryOf } from '@/lib/collection-filters'
import { HIDDEN_COLLECTIONS, listProducts } from '@/lib/data'
import { safeHtml, str } from '@/lib/format'

export const dynamic = 'force-dynamic'
const PAGE = 24

const SORTS = [['newest', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['title', 'A to Z']] as const

async function find(handle: string) {
  if (handle === 'all') return { id: undefined, title: 'All Bundles', descriptionHtml: '', seoTitle: null, seoDescription: null, handle }
  return db.collection.findFirst({ where: { handle, published: true } })
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const c = await find((await params).handle)
  return c ? { title: c.seoTitle || c.title, description: c.seoDescription || undefined } : {}
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { handle } = await params
  const sp = await searchParams
  const c = await find(handle)
  if (!c) notFound()
  const sort = SORTS.some(([v]) => v === str(sp.sort)) ? str(sp.sort) : 'newest'
  const filters = parseFilters(sp)
  const base = `/collections/${handle}`

  // Sorting and filtering both happen in memory, so fetch the whole collection, narrow it, then slice out the page.
  const [all, lanes] = await Promise.all([
    listProducts({ collectionId: c.id, sort }),
    db.collection.findMany({
      where: { published: true, handle: { notIn: [...HIDDEN_COLLECTIONS, handle] }, products: { some: { product: { status: 'active' } } } },
      orderBy: { products: { _count: 'desc' } },
      take: 8,
      select: { handle: true, title: true },
    }),
  ])
  const facets = facetsOf(all)
  const matched = applyFilters(all, filters)
  const pages = Math.max(1, Math.ceil(matched.length / PAGE))
  const page = Math.min(pages, Math.max(1, parseInt(str(sp.page), 10) || 1))
  const products = matched.slice((page - 1) * PAGE, page * PAGE)
  const chips = activeChips(filters, sort, base)
  const href = (p: number) => {
    const q = queryOf(filters, { sort, page: p })
    return q ? `${base}?${q}` : base
  }

  return (
    <>
      <section className="plp-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/collections">Collections</Link></li>
              <li aria-current="page">{c.title}</li>
            </ol>
          </nav>
          <h1>{c.title}</h1>
          {c.descriptionHtml ? <div className="plp-desc" dangerouslySetInnerHTML={{ __html: safeHtml(c.descriptionHtml) }} /> : null}
          {lanes.length ? (
            <ul className="plp-lanes" aria-label="Browse collections">
              <li><Link href="/collections/all" aria-current={handle === 'all' ? 'page' : undefined}>All bundles</Link></li>
              {lanes.map((l) => <li key={l.handle}><Link href={`/collections/${l.handle}`}>{l.title}</Link></li>)}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="wrap">
        <CollectionFilters
          facets={facets}
          selected={{ sizes: filters.sizes, types: filters.types, vendors: filters.vendors, inStock: filters.inStock, min: filters.min != null ? String(filters.min) : '', max: filters.max != null ? String(filters.max) : '' }}
          count={matched.length}
          currency={currencySymbol()}
          sort={sort}
          sorts={SORTS}
        >
          {chips.length ? (
            <ul className="plp-active" aria-label="Applied filters">
              {chips.map((chip) => <li key={chip.label}><Link href={chip.href} aria-label={`Remove filter: ${chip.label}`}>{chip.label}<CloseIcon size={14} /></Link></li>)}
              <li><Link href={sort !== 'newest' ? `${base}?sort=${sort}` : base} className="plp-clear-all">Clear all</Link></li>
            </ul>
          ) : null}
          {products.length === 0 ? (
            activeCount(filters) > 0 ? (
              <div className="plp-empty"><h2>No bundles match</h2><p>Nothing fits every filter you picked. Try taking one away.</p><Link href={sort !== 'newest' ? `${base}?sort=${sort}` : base} className="btn-pill">Clear filters</Link></div>
            ) : (
              <div className="plp-empty"><h2>Nothing here yet</h2><p>This drop is empty right now.</p><Link href="/collections/all" className="btn-pill">Shop everything</Link></div>
            )
          ) : (
            <ul className="plp-grid">{products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>
          )}
          {pages > 1 ? (
            <nav className="plp-pager" aria-label="Pages">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <Link key={p} href={href(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`}>{p}</Link>)}
            </nav>
          ) : null}
        </CollectionFilters>
      </div>
    </>
  )
}
