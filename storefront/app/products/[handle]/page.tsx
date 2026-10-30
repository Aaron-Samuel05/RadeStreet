import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { BuyBox } from '@/components/BuyBox'
import { CardRail } from '@/components/CardRail'
import { MysteryPanel } from '@/components/MysteryPanel'
import { ReviewForm } from '@/components/ReviewForm'
import { ProductCard } from '@/components/ProductCard'
import { getCustomer, getShippingInfo, getWishlistIds, relatedProducts } from '@/lib/data'
import { formatMoney, safeHtml } from '@/lib/format'
import { BoxIcon, CalendarIcon, TagIcon, TruckIcon } from '@/components/Icons'

export const dynamic = 'force-dynamic'

const load = (handle: string) =>
  db.product.findFirst({
    where: { handle, status: 'active' },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: { position: 'asc' }, include: { levels: { where: { location: { active: true } }, select: { available: true } } } },
    },
  })

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const p = await load((await params).handle)
  if (!p) return {}
  const desc = p.seoDescription || p.descriptionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
  return { title: p.seoTitle || p.title, description: desc, openGraph: { title: p.title, description: desc, images: p.images[0] ? [p.images[0].url] : undefined } }
}

const stars = (n: number) => `${'★'.repeat(n)}${'☆'.repeat(5 - n)}`

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const p = await load(handle)
  if (!p) notFound()
  const [ship, customer, sizeGuide, wishlist] = await Promise.all([
    getShippingInfo(),
    getCustomer(),
    db.page.findFirst({ where: { handle: 'size-guide', published: true }, select: { id: true } }),
    getWishlistIds(),
  ])

  const variants = p.variants.map((v) => {
    const stock = v.levels.reduce((s, l) => s + l.available, 0)
    const open = !v.trackInventory || v.continueSelling
    return { id: v.id, title: v.title, price: v.price, compareAt: v.compareAtPrice, available: open || stock > 0, max: open ? 20 : Math.min(stock, 20) }
  })
  const [reviews, agg] = await Promise.all([
    db.review.findMany({ where: { productId: p.id, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 30 }),
    db.review.aggregate({ where: { productId: p.id, status: 'approved' }, _avg: { rating: true }, _count: true }),
  ])
  const related = await relatedProducts(p.id, 8)
  const lowest = Math.min(...variants.map((v) => v.price))
  const avg = Math.round(agg._avg.rating ?? 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    image: p.images.map((i) => i.url),
    description: p.descriptionHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300),
    brand: { '@type': 'Brand', name: p.vendor || 'Radestreet' },
    ...(agg._count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: (agg._avg.rating ?? 0).toFixed(1), reviewCount: agg._count } } : {}),
    offers: { '@type': 'Offer', priceCurrency: 'INR', price: (lowest / 100).toFixed(2), availability: variants.some((v) => v.available) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  }

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="plp-crumbs pdp-crumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/collections/all">Shop</Link></li>
          <li aria-current="page">{p.title}</li>
        </ol>
      </nav>

      <div className="pdp">
        <BuyBox
          productId={p.id}
          saved={wishlist.has(p.id)}
          title={p.title}
          vendor={p.vendor}
          rating={{ avg: agg._avg.rating ?? 0, count: agg._count }}
          variants={variants}
          optionName={p.optionName}
          email={customer?.email ?? ''}
          images={p.images.map((i) => ({ url: i.url, alt: i.alt || p.title }))}
          sizeGuide={sizeGuide ? '/pages/size-guide' : undefined}
        >
          <ul className="pdp-perks">
            <li><TruckIcon size={20} />{ship.freeAt ? `Free shipping over ${formatMoney(ship.freeAt)}` : 'Tracked shipping across India'}</li>
            <li><CalendarIcon size={20} />Ships in {ship.dispatch}</li>
            <li><BoxIcon size={20} />Surprise contents, one fixed price</li>
            <li><TagIcon size={20} />Branded pieces below MRP</li>
          </ul>
          <div className="pdp-acc">
            {p.descriptionHtml.trim() ? (
              <details open>
                <summary>Description</summary>
                <div className="pdp-acc-body prose" dangerouslySetInnerHTML={{ __html: safeHtml(p.descriptionHtml) }} />
              </details>
            ) : null}
            <details>
              <summary>Shipping &amp; delivery</summary>
              <div className="pdp-acc-body">
                <p>Orders ship in {ship.dispatch}{ship.freeAt ? `, and shipping is free on orders over ${formatMoney(ship.freeAt)}` : ''}. The exact rate for your address is shown at checkout.</p>
                <p>Follow your parcel any time on the <Link href="/track">order tracking</Link> page.</p>
              </div>
            </details>
            <details>
              <summary>Payments</summary>
              <div className="pdp-acc-body"><p>Pay securely online at checkout. We never see or store your card details.</p></div>
            </details>
          </div>
        </BuyBox>
      </div>

      <MysteryPanel title={p.title} productType={p.productType} optionName={p.optionName} />

      <section className="pdp-reviews" id="reviews" aria-labelledby="rev-h">
        <div>
          <h2 id="rev-h">Reviews</h2>
          {agg._count ? (
            <p className="pdp-rev-sum"><span className="stars" aria-hidden="true">{stars(avg)}</span> {(agg._avg.rating ?? 0).toFixed(1)} out of 5 · {agg._count} {agg._count === 1 ? 'review' : 'reviews'}</p>
          ) : (
            <p className="pdp-rev-sum">No reviews yet. Be the first.</p>
          )}
          {reviews.map((r) => (
            <article className="pdp-review" key={r.id}>
              <div className="stars" role="img" aria-label={`${r.rating} out of 5 stars`}>{stars(r.rating)}</div>
              {r.title ? <h3>{r.title}</h3> : null}
              <p>{r.body}</p>
              <p className="pdp-review-by">{r.name}{r.place ? `, ${r.place}` : ''}{r.verified ? <span className="pdp-verified">Verified buyer</span> : null}</p>
              {r.reply ? <p className="pdp-reply"><b>Radestreet:</b> {r.reply}</p> : null}
            </article>
          ))}
        </div>
        <div>
          <h2>Write a review</h2>
          <ReviewForm productId={p.id} />
        </div>
      </section>

      {related.length ? (
        <section className="pdp-related" aria-labelledby="rel-h">
          <div className="sec-head"><h2 id="rel-h">You may also like</h2></div>
          <CardRail label="You may also like">{related.map((r) => <li key={r.id}><ProductCard product={r} /></li>)}</CardRail>
        </section>
      ) : null}
    </div>
  )
}
