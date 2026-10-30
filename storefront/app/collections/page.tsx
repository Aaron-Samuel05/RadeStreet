import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@radestreet/db'
import { HIDDEN_COLLECTIONS } from '@/lib/data'

export const metadata: Metadata = { title: 'Collections' }
export const dynamic = 'force-dynamic'

export default async function Collections() {
  const live = { product: { status: 'active' } } as const
  // Same rule as the home page: skip the plumbing collections and any with nothing to buy.
  const cols = await db.collection.findMany({
    where: { published: true, handle: { notIn: HIDDEN_COLLECTIONS }, products: { some: live } },
    orderBy: { title: 'asc' },
    include: {
      _count: { select: { products: { where: live } } },
      products: { where: live, take: 1, orderBy: { position: 'asc' }, select: { product: { select: { images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } } } } } },
    },
  })
  return (
    <>
      <section className="plp-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Collections</li>
            </ol>
          </nav>
          <h1>Collections</h1>
          <p className="plp-desc"><Link href="/collections/all" className="link-caps">Shop everything</Link></p>
        </div>
      </section>

      <div className="wrap">
        {cols.length ? (
          <ul className="col-grid">
            {cols.map((c) => {
              const img = c.imageUrl || c.products[0]?.product.images[0]?.url
              const n = c._count.products
              return (
                <li key={c.id}>
                  <Link href={`/collections/${c.handle}`} className="col-tile">
                    <span className="col-media">{img ? <img src={img} alt="" loading="lazy" /> : null}</span>
                    <span className="col-body">
                      <h2 className="col-name">{c.title}</h2>
                      <span className="col-count">{n} {n === 1 ? 'product' : 'products'}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="plp-empty"><h2>Nothing here yet</h2><p>New collections land soon.</p><Link href="/collections/all" className="btn-pill">Shop everything</Link></div>
        )}
      </div>
    </>
  )
}
