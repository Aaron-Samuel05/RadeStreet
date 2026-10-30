import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackForm } from '@/components/TrackForm'
import { getCustomer } from '@/lib/data'

export const metadata: Metadata = { title: 'Track your order', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function TrackPage() {
  const c = await getCustomer()
  return (
    <>
      <section className="plp-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Track order</li>
            </ol>
          </nav>
          <h1>Track your order</h1>
          <p className="plp-desc">Enter your order number and the email you used at checkout.</p>
        </div>
      </section>
      <div className="wrap">
        <div className="track">
          <TrackForm email={c?.email ?? ''} />
        </div>
      </div>
    </>
  )
}
