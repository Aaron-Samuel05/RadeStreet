import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@radestreet/db'
import { logout } from '@/actions/store'
import { ProfileForm } from '@/components/ProfileForm'
import { getCustomer } from '@/lib/data'
import { formatMoney } from '@/lib/format'

export const metadata: Metadata = { title: 'Your account', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Account() {
  const c = await getCustomer()
  if (!c) redirect('/account/login')
  const orders = await db.order.findMany({ where: { customerId: c.id, isDraft: false }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <>
      <section className="plp-head">
        <div className="wrap acct-top">
          <div>
            <nav className="plp-crumbs" aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li aria-current="page">Your account</li>
              </ol>
            </nav>
            <h1>Your account</h1>
            <p className="acct-email">{c.email}</p>
          </div>
          <div className="acct-actions">
            <Link href="/account/wishlist" className="btn-pill ghost sm">Wishlist</Link>
            <Link href="/track" className="btn-pill ghost sm">Track an order</Link>
            <form action={logout}><button className="btn-pill ghost sm">Log out</button></form>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="acct-grid">
          <section aria-labelledby="ord-h">
            <h2 id="ord-h" className="acct-title">Orders</h2>
            {orders.length === 0 ? (
              <div className="acct-empty"><p>No orders yet.</p><Link href="/collections/all" className="btn-pill">Start shopping</Link></div>
            ) : (
              <ul className="acct-orders">
                {orders.map((o) => {
                  const cancelled = o.status === 'cancelled'
                  return (
                    <li key={o.id}>
                      <Link href={`/checkout/success/${o.id}`} className="acct-order">
                        <span className="acct-order-main">
                          <b>#{o.number}</b>
                          <small>{o.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                        </span>
                        <span className="acct-pills">
                          {cancelled ? (
                            <span className="acct-pill bad">Cancelled</span>
                          ) : (
                            <>
                              <span className="acct-pill"><span className="sr">Payment: </span>{o.financialStatus.replace('_', ' ')}</span>
                              <span className="acct-pill"><span className="sr">Delivery: </span>{o.fulfillmentStatus.replace('_', ' ')}</span>
                            </>
                          )}
                        </span>
                        <span className="acct-total">{formatMoney(o.total - o.giftCardAmount)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="det-h">
            <h2 id="det-h" className="acct-title">Your details</h2>
            <div className="acct-card">
              <ProfileForm firstName={c.firstName} lastName={c.lastName} phone={c.phone ?? ''} marketing={c.acceptsMarketing} />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
