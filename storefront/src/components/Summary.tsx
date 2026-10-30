import { formatMoney } from '@/lib/format'
import type { Pricing } from '@/lib/pricing'

/** The order card shared by the cart and checkout. `items` (checkout's product list) sits under the heading; `children` under the totals. */
export function Summary({ price, items, children }: { price: Pricing; items?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <aside className="cart-summary" aria-labelledby="sum-h">
      <h2 id="sum-h">Order summary</h2>
      {items}
      <dl>
        <dt>Subtotal</dt><dd>{formatMoney(price.subtotal)}</dd>
        {price.discount > 0 ? <><dt className="save">Discount{price.discountTitle ? ` (${price.discountTitle})` : ''}</dt><dd className="save">−{formatMoney(price.discount)}</dd></> : null}
        <dt>{price.shippingName}{price.shippingEta ? <small> · {price.shippingEta}</small> : null}</dt><dd>{price.shipping === 0 ? 'Free' : formatMoney(price.shipping)}</dd>
        {price.giftCard > 0 ? <><dt className="save">Gift card</dt><dd className="save">−{formatMoney(price.giftCard)}</dd></> : null}
        <dt className="total">Total</dt><dd className="total" data-testid="total">{formatMoney(price.total)}</dd>
      </dl>
      {price.tax > 0 ? <p className="cart-tax">Includes {formatMoney(price.tax)} GST</p> : null}
      {children}
    </aside>
  )
}
