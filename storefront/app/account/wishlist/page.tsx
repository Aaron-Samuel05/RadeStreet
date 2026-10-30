import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@radestreet/db'
import { ProductCard } from '@/components/ProductCard'
import { getCustomer } from '@/lib/data'

export const metadata: Metadata = { title: 'Your wishlist', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Wishlist() {
  const c = await getCustomer()
  if (!c) redirect('/account/login')
  const rows = await db.wishlistItem.findMany({
    where: { customerId: c.id, product: { status: 'active' } },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          images: { orderBy: { position: 'asc' }, take: 2 },
          variants: { orderBy: { position: 'asc' }, include: { levels: { select: { available: true } } } },
        },
      },
    },
  })
  return (
    <>
      <section className="plp-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/account">Your account</Link></li>
              <li aria-current="page">Wishlist</li>
            </ol>
          </nav>
          <h1>Your wishlist</h1>
          {rows.length ? <p className="acct-count">{rows.length} saved</p> : null}
        </div>
      </section>
      <div className="wrap acct-body">
        {rows.length === 0 ? (
          <div className="plp-empty"><h2>Nothing saved yet</h2><p>Tap the heart on a product to keep it here.</p><Link href="/collections/all" className="btn-pill">Browse the shop</Link></div>
        ) : (
          <ul className="plp-grid">{rows.map((r) => <li key={r.id}><ProductCard product={r.product} /></li>)}</ul>
        )}
      </div>
    </>
  )
}
