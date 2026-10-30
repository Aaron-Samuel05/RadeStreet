import Link from 'next/link'
import { ArrowIcon } from './Icons'
import type { Lane } from './HomeLanes'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Design C's category picker: a row of tall photo panels, one per category. The panel under the pointer (or focus) grows
 * and swaps to its second photo while the others make room; phones stack them. Nothing here is invented: the counts and
 * the "from" price are the category's own.
 */
export function HomeDoors({ lanes }: { lanes: Lane[] }) {
  return (
    <section className="doors" aria-labelledby="doors-h">
      <div className="wrap">
        <div className="doors-head">
          <p className="sec-eyebrow">Start here</p>
          <h2 id="doors-h">Pick a <em>category</em></h2>
        </div>
        <ul className="doors-row">
          {lanes.map((l, i) => {
            const name = l.short || l.title
            return (
              <li key={l.handle}>
                <Link href={`/collections/${l.handle}`} className="door">
                  {l.images[0] ? <img className="door-img" src={l.images[0]} alt="" loading={i < 2 ? 'eager' : 'lazy'} /> : null}
                  {l.images[1] ? <img className="door-img alt" src={l.images[1]} alt="" loading="lazy" /> : null}
                  <span className="door-n" aria-hidden="true">{pad(i + 1)}</span>
                  <span className="door-go" aria-hidden="true"><ArrowIcon size={22} /></span>
                  <span className="door-body">
                    <b className="door-name">{name}</b>
                    <span className="door-meta">
                      {l.short && l.short !== l.title ? <span>{l.title}</span> : null}
                      <span>{l.count} {l.count === 1 ? 'bundle' : 'bundles'} · From {l.from}</span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
