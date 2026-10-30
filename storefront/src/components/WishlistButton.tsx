import { toggleWishlist } from '@/actions/store'

/** A heart that saves a product to the signed-in customer's wishlist (guests are sent to sign in). */
export function WishlistButton({ productId, saved, back, label = true }: { productId: string; saved: boolean; back: string; label?: boolean }) {
  const text = saved ? 'Saved to wishlist' : 'Save to wishlist'
  return (
    <form action={toggleWishlist} className="wish-form">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="back" value={back} />
      <button className="wish" aria-pressed={saved} aria-label={text} title={text}>
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        {label ? <span>{text}</span> : null}
      </button>
    </form>
  )
}
