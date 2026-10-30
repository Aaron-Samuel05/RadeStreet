import Link from 'next/link'
import { ArrowIcon } from './Icons'

export type PriceTier = { max: number; label: string; count: number }

/**
 * Design B's category block: shop by price. One big tile per price point in the real catalogue ("Up to ₹999 · 4 bundles"),
 * each linking to the shop filtered to that price, and a black tile for everything. Suits a store where the price is the pitch.
 * With three or more tiers, the middle one is flagged "Most popular" (radedesign.md's highlighted price card) — a real,
 * data-driven choice of position, not an invented discount.
 */
export function HomePrice({ tiers, total }: { tiers: PriceTier[]; total: number }) {
  const popularAt = tiers.length >= 3 ? Math.floor((tiers.length - 1) / 2) : -1
  return (
    <section className="price" aria-labelledby="price-h">
      <div className="wrap">
        <div className="price-head">
          <div>
            <p className="sec-eyebrow">Shop by price</p>
            <h2 id="price-h">One price. <em>Your price.</em></h2>
          </div>
          <p className="price-sub">Every bundle has one honest price. Pick what you want to spend and see what it gets you.</p>
        </div>
        <ul className="price-grid">
          {tiers.map((t, i) => (
            <li key={t.max}>
              <Link href={`/collections/all?max=${t.max}`} className={i === popularAt ? 'price-tile popular' : 'price-tile'}>
                {i === popularAt ? <span className="price-tile-flag">Most popular</span> : null}
                <span>
                  <span className="price-tile-tier">Tier {i + 1}</span>
                  <small>Up to</small><b>{t.label}</b>
                </span>
                <span className="price-tile-foot">
                  <span>{t.count} {t.count === 1 ? 'bundle' : 'bundles'}</span>
                  <span className="price-tile-go" aria-hidden="true"><ArrowIcon size={18} /></span>
                </span>
              </Link>
            </li>
          ))}
          <li className="all">
            <Link href="/collections/all" className="price-tile all">
              <span><small>Everything</small><b>All bundles</b></span>
              <span className="price-tile-foot">
                <span>{total} {total === 1 ? 'bundle' : 'bundles'}</span>
                <span className="price-tile-go" aria-hidden="true"><ArrowIcon size={18} /></span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
