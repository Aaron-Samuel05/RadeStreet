import Link from 'next/link'
import { ArrowIcon } from './Icons'

export type TicketPick = { href: string; image: string; alt: string; title: string; price: string }

/**
 * The restock call-to-action drawn as a black ticket: the words on the main part, one real bundle on the stub, a dashed
 * perforation between them with a notch cut out at each end. The words come from the admin's restock settings.
 */
export function RestockTicket({ eyebrow, title, text, button, href, pick }: { eyebrow: string; title: string; text: string; button: string; href: string; pick: TicketPick | null }) {
  return (
    <section className="restock" aria-labelledby="restock-h">
      <div className="wrap">
        <div className={`ticket${pick ? '' : ' solo'}`}>
          <div className="ticket-main">
            {eyebrow ? <p className="ticket-eyebrow"><i aria-hidden="true" />{eyebrow}</p> : null}
            <h2 id="restock-h">{title}</h2>
            {text ? <p className="ticket-text">{text}</p> : null}
            <Link href={href} className="btn-pill light">{button} <ArrowIcon /></Link>
          </div>
          {pick ? (
            <Link href={pick.href} className="ticket-stub">
              <span className="ticket-pic"><img src={pick.image} alt={pick.alt} loading="lazy" /></span>
              <span className="ticket-pick">
                <small>Featured bundle</small>
                <b>{pick.title}</b>
                <span>{pick.price}</span>
              </span>
              <span className="ticket-code" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
