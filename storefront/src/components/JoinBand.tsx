import { Newsletter } from './Newsletter'

/**
 * "Join the family" sign-up set on the sticker banner artwork. The footer shows it above the links on every page.
 * The words come from the newsletter settings in the admin.
 */
export function JoinBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="promise join" aria-labelledby="join-h">
      <div className="promise-copy">
        <p className="sec-eyebrow">Get the drop</p>
        <h2 id="join-h">{title}</h2>
        {text ? <p className="join-text">{text}</p> : null}
        <Newsletter />
      </div>
    </section>
  )
}
