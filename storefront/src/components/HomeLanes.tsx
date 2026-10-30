import Link from 'next/link'
import { ArrowIcon } from './Icons'

export type Lane = {
  handle: string
  /** The collection's own title, e.g. "Men T-Shirt Branded Bundle". */
  title: string
  /** The title without the words every lane shares, e.g. "T-Shirt". Empty when nothing is left. */
  short: string
  count: number
  from: string
  images: string[]
}

/**
 * "Pick your lane": one big typographic row per category, numbered, with two bundle photos fanned at the end of the row.
 * Hovering a row (or tabbing to it) turns it black and spreads the photos. Phones show the same rows, smaller, with no hover.
 */
export function HomeLanes({ lanes }: { lanes: Lane[] }) {
  return (
    <section className="lanes" aria-labelledby="lanes-h">
      <div className="wrap">
        <div className="lanes-head">
          <div>
            <p className="sec-eyebrow">Step one</p>
            <h2 id="lanes-h">Pick your <em>lane</em></h2>
          </div>
          <Link href="/collections" className="link-caps">All collections</Link>
        </div>
        <ol className="lanes-list">
          {lanes.map((l, i) => {
            const name = l.short || l.title
            return (
              <li key={l.handle}>
                <Link href={`/collections/${l.handle}`} className="lane">
                  <span className="lane-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lane-name">
                    <b>{name}</b>
                    {l.short && l.short !== l.title ? <small>{l.title}</small> : null}
                  </span>
                  <span className="lane-meta">
                    <span>{l.count} {l.count === 1 ? 'bundle' : 'bundles'}</span>
                    <span>From {l.from}</span>
                  </span>
                  <span className="lane-pics" aria-hidden="true">
                    {l.images.slice(0, 2).map((src, k) => <img key={k} src={src} alt="" loading="lazy" />)}
                  </span>
                  <span className="lane-go" aria-hidden="true"><ArrowIcon size={20} /></span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
