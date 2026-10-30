'use client'
import { usePathname } from 'next/navigation'
import { toggleWishlist } from '@/actions/store'
import { HeartIcon } from './Icons'

/** The heart in a product card's corner. It saves to the wishlist (guests are sent to sign in) and refreshes the page it sits on. */
export function CardHeart({ productId, saved }: { productId: string; saved: boolean }) {
  const back = usePathname()
  const text = saved ? 'Remove from wishlist' : 'Save to wishlist'
  return (
    <form action={toggleWishlist} className="pcard-heart-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="back" value={back} />
      <button className="pcard-heart" aria-pressed={saved} aria-label="Wishlist" title={text}><HeartIcon size={20} /></button>
    </form>
  )
}
