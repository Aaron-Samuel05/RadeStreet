import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@radestreet/db'
import { SearchIcon } from '@/components/Icons'
import { ProductCard } from '@/components/ProductCard'
import { HIDDEN_COLLECTIONS, listProducts } from '@/lib/data'
import { str } from '@/lib/format'

export const metadata: Metadata = { title: 'Search', robots: { index: false } }
export const dynamic = 'force-dynamic'
const TAKE = 48

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = str((await searchParams).q).trim().slice(0, 80)
  const results = q ? await listProducts({ q, take: TAKE }) : []
  // With nothing to show, point at the collections instead of leaving a dead end.
  const lanes = results.length
    ? []
    : await db.collection.findMany({
        where: { published: true, handle: { notIn: HIDDEN_COLLECTIONS }, products: { some: { product: { status: 'active' } } } },
        orderBy: { products: { _count: 'desc' } },
        take: 8,
        select: { handle: true, title: true },
      })

  return (
    <>
      <section className="plp-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Search</li>
            </ol>
          </nav>
          <h1 className="srch-title">{q ? `Results for “${q}”` : 'Search'}</h1>
          <form role="search" action="/search" className="srch">
            <label className="sr" htmlFor="q">Search products</label>
            <span className="srch-box">
              <SearchIcon size={20} />
              <input id="q" name="q" type="search" defaultValue={q} placeholder="Search products" autoComplete="off" enterKeyHint="search" maxLength={80} />
            </span>
            <button className="btn-pill">Search</button>
          </form>
          {results.length ? <p className="srch-count" role="status">{results.length === TAKE ? `Showing the first ${TAKE} results` : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}</p> : null}
        </div>
      </section>

      <div className="wrap srch-body">
        {results.length ? (
          <ul className="plp-grid">{results.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>
        ) : (
          <div className="plp-empty">
            <h2>{q ? `No results for “${q}”` : 'What are you looking for?'}</h2>
            <p>{q ? 'Check the spelling or try a shorter word.' : 'Search by product name or type.'}</p>
            {lanes.length ? (
              <ul className="plp-lanes srch-lanes" aria-label="Browse collections">
                <li><Link href="/collections/all">All bundles</Link></li>
                {lanes.map((l) => <li key={l.handle}><Link href={`/collections/${l.handle}`}>{l.title}</Link></li>)}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
