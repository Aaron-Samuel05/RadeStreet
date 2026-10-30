import type { Metadata } from 'next'
import Link from 'next/link'
import { BagIcon } from '@/components/Icons'

export const metadata: Metadata = { title: 'Your cart' }

export default function CartPage() {
  return (
    <div className="wrap cart">
      <div className="cart-empty">
        <span className="cart-empty-icon"><BagIcon size={28} /></span>
        <h1>Shopping is disabled in this demo</h1>
        <p>Browse the storefront preview; checkout is unavailable until the commerce backend is connected.</p>
        <Link href="/" className="btn-pill">Back to the storefront</Link>
      </div>
    </div>
  )
}
