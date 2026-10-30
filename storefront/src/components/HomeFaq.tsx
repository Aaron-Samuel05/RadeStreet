import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { ArrowIcon } from './Icons'

export type FaqItem = { q: string; a: string; group: 'bundle' | 'delivery'; link?: { href: string; label: string } }

/**
 * Homepage questions. The wording is taken from the live Rade Street pages (About and the shipping policy). Anything the
 * live site does not say (returns, payment) is left out on purpose; the free shipping limit comes from the real shipping rates.
 */
export function faqItems(freeAt: number | null): FaqItem[] {
  return [
    { group: 'bundle', q: 'What is a Rade Street bundle?', a: "Rade Street is India's first branded fashion bundle, curated surprise drops of premium clothing delivered to your door. Pick your category, choose your size, and let us do the rest." },
    { group: 'bundle', q: "Can I see what's inside before I buy?", a: 'You see exactly how many items are inside before you buy. Designs, colours and prints are revealed only when you open the bundle.' },
    { group: 'bundle', q: 'Are the items brand new?', a: 'Every item is brand new, sealed and quality checked.' },
    { group: 'delivery', q: 'How long does delivery take?', a: 'Orders are processed within 1 to 2 business days after payment confirmation. Delivery then takes 2 to 4 business days to metro cities, 3 to 5 business days to tier 2 cities and 5 to 7 business days to remote and rural areas. These are estimates and can vary with the courier and your location.' },
    { group: 'delivery', q: 'What does shipping cost?', a: freeAt ? `Shipping is free on orders above ${formatMoney(freeAt)}. Below that, a shipping fee is added at checkout. A remote-area surcharge may apply for some pincodes.` : 'Shipping is worked out at checkout. A remote-area surcharge may apply for some pincodes.' },
    { group: 'delivery', q: 'How do I track my order?', a: 'Once your order ships, we email you a tracking link. You can also use Track order with your order number and the email you used at checkout.', link: { href: '/track', label: 'Track an order' } },
    { group: 'bundle', q: 'How often do new bundles arrive?', a: 'New drops land every Monday, and it is never the same bundle twice.' },
  ]
}

/** The FAQPage structured data for a list of questions, safe to put inside a script tag. */
export function faqSchema(items: FaqItem[]) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export function HomeFaq({ freeAt }: { freeAt: number | null }) {
  const items = faqItems(freeAt)
  // Two columns that each keep their own height, so opening an answer in one never stretches the cards beside it.
  const cut = Math.ceil(items.length / 2)
  const columns = [items.slice(0, cut), items.slice(cut)]

  return (
    <section className="faq" aria-labelledby="faq-h">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema(items) }} />
      <div className="wrap">
        <div className="faq-head">
          <p className="sec-eyebrow">Good to know</p>
          <h2 id="faq-h">Questions, <em>answered</em></h2>
          <p className="faq-sub">The short version, before you open a bundle.</p>
        </div>
        <div className="faq-cols">
          {columns.map((col, c) => (
            <div className="faq-col" key={c}>
              {col.map((it, k) => {
                const n = (c === 0 ? 0 : cut) + k
                return (
                  <details key={it.q} name="faq" open={n === 0}>
                    <summary>
                      <b aria-hidden="true">{String(n + 1).padStart(2, '0')}</b>
                      <span>{it.q}</span>
                      <i aria-hidden="true" />
                    </summary>
                    <div className="faq-a">
                      <p>{it.a}</p>
                      {it.link ? <Link href={it.link.href} className="link-caps">{it.link.label}</Link> : null}
                    </div>
                  </details>
                )
              })}
            </div>
          ))}
        </div>
        <div className="faq-ask">
          <p>Still wondering about something?</p>
          <Link href="/pages/contact" className="btn-pill ghost">Ask us <ArrowIcon /></Link>
        </div>
      </div>
    </section>
  )
}
