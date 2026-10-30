import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  return (
    <div className="wrap cart">
      <div className="cart-empty">
        <h1>Checkout is unavailable</h1>
        <p>This read-only storefront demo does not accept orders or payments.</p>
        <Link href="/" className="btn-pill">Back to the storefront</Link>
      </div>
    </div>
  )
}
