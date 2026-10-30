import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { CheckIcon, ClockIcon } from '@/components/Icons'
import { formatMoney } from '@/lib/format'

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Success({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // The order id is an unguessable cuid, which is what lets a guest see their own confirmation.
  const o = await db.order.findFirst({ where: { id, isDraft: false }, include: { items: true } })
  if (!o) notFound()
  const paid = o.financialStatus === 'paid'
  const a = (o.shippingAddress ?? {}) as Record<string, string>
  return (
    <div className="wrap os">
      <header className="os-head">
        <span className={`os-badge${paid ? '' : ' pending'}`}>{paid ? <CheckIcon size={28} /> : <ClockIcon size={28} />}</span>
        <p className="os-eyebrow">Order #{o.number}</p>
        <h1>{paid ? "It's ordered." : 'Almost there'}</h1>
        <p className="os-msg" role="status">{paid ? `Thanks. A confirmation is on its way to ${o.email}.` : 'We have not received your payment yet. If you were charged, this page will update shortly.'}</p>
      </header>
      <div className="cart-grid">
        <section aria-labelledby="os-items-h">
          <h2 id="os-items-h" className="os-title">Your items</h2>
          <ul className="os-items">
            {o.items.map((i) => (
              <li key={i.id}>
                {i.imageUrl ? <img src={i.imageUrl} alt="" width={80} height={100} /> : <span className="os-ph" />}
                <div>
                  <h3>{i.title}</h3>
                  <small>{i.variantTitle && i.variantTitle !== 'Default Title' ? `${i.variantTitle} · ` : ''}Qty {i.quantity}</small>
                </div>
                <p className="os-price">{formatMoney(i.price * i.quantity - i.discount)}</p>
              </li>
            ))}
          </ul>
        </section>
        <aside className="cart-summary" aria-labelledby="sum-h">
          <h2 id="sum-h">Order summary</h2>
          <dl>
            <dt>Subtotal</dt><dd>{formatMoney(o.subtotal)}</dd>
            {o.discountTotal > 0 ? <><dt className="save">Discount</dt><dd className="save">−{formatMoney(o.discountTotal)}</dd></> : null}
            <dt>Shipping</dt><dd>{o.shippingTotal === 0 ? 'Free' : formatMoney(o.shippingTotal)}</dd>
            {o.giftCardAmount > 0 ? <><dt className="save">Gift card</dt><dd className="save">−{formatMoney(o.giftCardAmount)}</dd></> : null}
            <dt className="total">Total</dt><dd className="total">{formatMoney(o.total - o.giftCardAmount)}</dd>
          </dl>
          <div className="os-ship">
            <h3>Shipping to</h3>
            <address>{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}</address>
          </div>
          <Link href="/collections/all" className="btn-pill os-btn">Keep shopping</Link>
          <p className="os-track"><Link href="/track" className="link-caps">Track your order</Link></p>
        </aside>
      </div>
    </div>
  )
}
