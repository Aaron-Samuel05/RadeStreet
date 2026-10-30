import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { cardInfo, getWishlistIds, type Card } from '@/lib/data'
import { CardHeart } from './CardHeart'
import { SearchIcon } from './Icons'

/** "Men's T-Shirt Bundle (3 T-Shirts)" → "3 T-Shirts": the pack size the title already carries in parentheses. */
const packLabel = (title: string) => /\(([^)]+)\)\s*$/.exec(title)?.[1] ?? null

export async function ProductCard({ product }: { product: Card }) {
  const info = cardInfo(product)
  const saved = (await getWishlistIds()).has(product.id)
  const [a, b] = product.images
  const off = info.compareAt ? Math.round((1 - info.from / info.compareAt) * 100) : 0
  const pack = packLabel(product.title)
  return (
    <article className="pcard reveal">
      <Link href={`/products/${product.handle}`} className="pcard-link">
        <span className="pcard-media">
          {!info.available ? <span className="pcard-badge sold">Sold out</span> : off > 0 ? <span className="pcard-badge sale">−{off}%</span> : null}
          {pack ? <span className="pcard-pack">{pack}</span> : null}
          {/* Product images are hosted by the store's CDN; sizing is handled by the object-fit box. */}
          {a ? <img src={a.url} alt={a.alt || product.title} loading="lazy" /> : null}
          {b ? <img src={b.url} alt="" loading="lazy" /> : null}
          <span className="pcard-peek" aria-hidden="true"><SearchIcon size={18} /> Inspect bundle</span>
        </span>
        <span className="pcard-body">
          {product.vendor ? <span className="pcard-vendor">{product.vendor}</span> : null}
          <h3 className="pcard-name">{product.title}</h3>
          <span className="pcard-price">
            <span className={info.compareAt ? 'sale' : undefined}>{info.varies ? 'From ' : ''}{formatMoney(info.from)}</span>
            {info.compareAt ? <s>{formatMoney(info.compareAt)}</s> : null}
          </span>
          <span className="pcard-cta" aria-hidden="true">{info.available ? 'Open & inspect' : 'View details'}</span>
        </span>
      </Link>
      <CardHeart productId={product.id} saved={saved} />
    </article>
  )
}
