'use client'
import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/actions/store'
import { formatMoney } from '@/lib/format'
import { CardHeart } from './CardHeart'
import { StockAlertForm } from './StockAlertForm'
import { ShieldIcon, TruckIcon } from './Icons'

export interface BuyVariant {
  id: string
  title: string
  price: number
  compareAt: number | null
  available: boolean
  max: number
}

/** The submit button reads the form's own status, so it shows "Adding…" while the server action runs. */
function AddButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button className="btn-pill pdp-add" disabled={disabled || pending} aria-busy={pending}>
      {pending ? 'Adding…' : children}
    </button>
  )
}

/**
 * The product page's gallery and buy panel. With more than one size the shopper must choose one before adding,
 * and is told so if they try without; a single-variant product needs no choice. `children` (delivery notes, details) sit below.
 */
export function BuyBox({ productId, saved, title, vendor, rating, variants, optionName, images, email = '', sizeGuide, children }: {
  productId: string
  saved: boolean
  title: string
  vendor?: string
  rating?: { avg: number; count: number }
  variants: BuyVariant[]
  optionName: string
  images: { url: string; alt: string }[]
  email?: string
  sizeGuide?: string
  children?: React.ReactNode
}) {
  const single = variants.length === 1 && variants[0]?.title === 'Default Title'
  const needsChoice = variants.length > 1
  const [id, setId] = useState<string | undefined>(needsChoice ? undefined : variants[0]?.id)
  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  const [tried, setTried] = useState(false)
  const firstOption = useRef<HTMLButtonElement>(null)
  const errId = useId()

  const selected = variants.find((x) => x.id === id)
  // Until a size is chosen, show the first one that can be bought so the price is never blank.
  const shown = selected ?? variants.find((x) => x.available) ?? variants[0]
  const missing = needsChoice && !selected
  const onSale = shown?.compareAt != null && shown.compareAt > shown.price
  const off = onSale ? Math.round((1 - shown!.price / shown!.compareAt!) * 100) : 0
  const label = optionName.toLowerCase()
  const showError = tried && missing

  return (
    <>
      <div className={`pdp-gallery${images.length > 1 ? '' : ' single'}`}>
        <div className="pdp-main">
          {images[shot] ? <img key={images[shot].url} src={images[shot].url} alt={images[shot].alt} /> : null}
          <CardHeart productId={productId} saved={saved} />
        </div>
        {images.length > 1 ? (
          <ul className="pdp-thumbs" aria-label="Product images">
            {images.slice(0, 10).map((im, i) => (
              <li key={im.url}>
                <button type="button" aria-current={i === shot} aria-label={`Show image ${i + 1} of ${Math.min(images.length, 10)}`} onClick={() => setShot(i)}><img src={im.url} alt="" /></button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="pdp-buy">
        {vendor ? <p className="pdp-vendor">{vendor}</p> : null}
        <h1 className="pdp-title">{title}</h1>
        {rating && rating.count ? (
          <a href="#reviews" className="pdp-rating">
            <span className="stars" aria-hidden="true">{'★'.repeat(Math.round(rating.avg))}{'☆'.repeat(5 - Math.round(rating.avg))}</span>
            <span>{rating.avg.toFixed(1)} · {rating.count} {rating.count === 1 ? 'review' : 'reviews'}</span>
          </a>
        ) : null}

        <form
          action={missing ? undefined : addToCart}
          onSubmit={(e) => { if (missing) { e.preventDefault(); setTried(true); firstOption.current?.focus() } }}
          noValidate
        >
          <input type="hidden" name="variantId" value={selected?.id ?? ''} />
          <input type="hidden" name="quantity" value={qty} />

          <div className="pdp-price" aria-live="polite">
            <span className={onSale ? 'sale' : undefined}>{formatMoney(shown?.price ?? 0)}</span>
            {onSale ? <s>MRP {formatMoney(shown!.compareAt!)}</s> : null}
            {off > 0 ? <span className="pdp-save">Save {off}%</span> : null}
          </div>

          {!single ? (
            <div className="pdp-opt">
              <div className="pdp-opt-head">
                <p id={`${errId}-label`}>{optionName}{selected ? <>: <b>{selected.title}</b></> : null}</p>
                {sizeGuide ? <Link href={sizeGuide} className="pdp-guide">Size guide</Link> : null}
              </div>
              <div className="pdp-sizes" role="group" aria-labelledby={`${errId}-label`} aria-describedby={showError ? errId : undefined} data-invalid={showError}>
                {variants.map((o, i) => (
                  <button
                    key={o.id}
                    ref={i === 0 ? firstOption : undefined}
                    type="button"
                    className="pdp-size"
                    aria-pressed={o.id === id}
                    data-soldout={!o.available}
                    title={o.available ? undefined : 'Sold out. Pick it to be told when it is back'}
                    onClick={() => { setId(o.id); setQty(1); setTried(false) }}
                  >
                    {o.title}{o.available ? null : <span className="sr"> (sold out)</span>}
                  </button>
                ))}
              </div>
              {showError ? <p id={errId} className="pdp-err" role="alert">Select a {label} to add this to your cart.</p> : null}
            </div>
          ) : null}

          <div className="pdp-buy-row">
            <div className="pdp-qty" role="group" aria-label="Quantity">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <output aria-live="polite">{qty}</output>
              <button type="button" aria-label="Increase quantity" disabled={qty >= (shown?.max ?? 1)} onClick={() => setQty((q) => Math.min(shown?.max ?? 1, q + 1))}>+</button>
            </div>
            <AddButton disabled={!missing && !shown?.available}>
              {missing ? 'Add to cart' : shown?.available ? <>Add to cart<span className="pdp-add-price"> · {formatMoney((shown?.price ?? 0) * qty)}</span></> : 'Sold out'}
            </AddButton>
          </div>
          <p className="pdp-trust"><span><ShieldIcon size={16} /> Secure checkout</span><span><TruckIcon size={16} /> Tracked delivery</span></p>
        </form>

        {selected && !selected.available ? <StockAlertForm key={selected.id} variantId={selected.id} email={email} /> : null}
        {children}
      </div>
    </>
  )
}
