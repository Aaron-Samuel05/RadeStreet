import Link from 'next/link'
import { db } from '@radestreet/db'
import { HeroSlider, type Slide } from '@/components/HeroSlider'
import type { Lane } from '@/components/HomeLanes'
import { HomeBrowse } from '@/components/HomeBrowse'
import { HomePrice } from '@/components/HomePrice'
import { HomeDoors } from '@/components/HomeDoors'
import { DropTabs } from '@/components/DropTabs'
import { HomeChat } from '@/components/HomeChat'
import { faqItems, faqSchema } from '@/components/HomeFaq'
import { HowSteps } from '@/components/HowSteps'
import { MarqueeBand } from '@/components/MarqueeBand'
import { ProductCard } from '@/components/ProductCard'
import { RestockTicket } from '@/components/RestockTicket'
import { ArrowIcon } from '@/components/Icons'
import { formatMoney } from '@/lib/format'
import { cardInfo, getHeroSlides, getShippingInfo, getSite, HIDDEN_COLLECTIONS, listProducts } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** The banner shown until a hero banner is added in the admin, which then replaces it. Line breaks in the headline are kept. */
const DEFAULT_SLIDE: Slide = {
  id: 'default',
  headline: 'Surprise\nfashion drops.\n1 price.\n0 regrets.',
  subline: 'Curated bundles of branded pieces at one honest price. Pick your lane, choose your size and unbox something better every week.',
  imageUrl: '/images/hero/banner-desktop.jpg',
  mobileUrl: '/images/hero/banner-mobile.jpg',
  alt: 'Four friends in oversized streetwear, a grey tee, a cream hoodie, a sage hoodie and a black graphic tee, sitting on concrete steps at golden hour with skateboards and a basketball.',
  ctaLabel: 'Shop the drop',
  ctaHref: '/collections/all',
}

/** "Men T-Shirt Branded Bundle" becomes "T-Shirt": the title without the words every lane shares. Empty when nothing is left. */
const shortName = (title: string) =>
  title.replace(/\b(?:men|women|kids?)(?:'s)?\b/gi, '').replace(/\b(?:branded bundles?|mystery (?:bag|box)(?:es)?)\b/gi, '').replace(/\s+/g, ' ').trim()

/** Whole-rupee prices lose their ".00" where the number is set large (the hero tag, lane rows, the ticket stub). */
const rupees = (paise: number) => formatMoney(paise).replace(/\.00$/, '')

export default async function Home() {
  const site = await getSite()
  const [all, { slides, previewIndex }, ship, cols] = await Promise.all([
    listProducts(),
    getHeroSlides(),
    getShippingInfo(),
    db.collection.findMany({
      where: { published: true, handle: { notIn: HIDDEN_COLLECTIONS }, products: { some: { product: { status: 'active' } } } },
      include: {
        products: {
          where: { product: { status: 'active' } },
          orderBy: { position: 'asc' },
          include: { product: { include: { images: { take: 2, orderBy: { position: 'asc' } }, variants: { select: { price: true } } } } },
        },
      },
    }),
  ])

  const products = all.slice(0, site.dropCount)

  // Browse bags: one tile per bundle, named by its pack, so "Peplos Round Neck T-Shirt (3 T-Shirts)" reads "3 T-Shirts".
  const browse = all.map((p) => ({ href: `/products/${p.handle}`, image: p.images[0]?.url ?? null, label: /\(([^)]+)\)\s*$/.exec(p.title)?.[1] ?? p.title, name: p.title }))

  // Shop by price: up to four of the real price points, spread across the range, each counting the bundles at or below it.
  const points = [...new Set(all.map((p) => cardInfo(p).from).filter((n) => n > 0))].sort((a, b) => a - b)
  const chosen = points.length <= 4 ? points : [0, 1, 2, 3].map((k) => points[Math.round((k * (points.length - 1)) / 3)])
  const tiers = [...new Set(chosen)].map((paise) => ({ max: Math.ceil(paise / 100), label: rupees(paise), count: all.filter((p) => cardInfo(p).from <= paise).length }))

  // A lane is a collection with something to buy. Collections that hold exactly the same bundles are one lane, not three,
  // and a collection whose title still names a kind of clothing is preferred over a generic one like "Men's Branded Bundle".
  const seen = new Set<string>()
  const lanes: (Lane & { ids: Set<string> })[] = []
  const ranked = [...cols].sort((a, b) => Number(!!shortName(b.title)) - Number(!!shortName(a.title)) || b.products.length - a.products.length || a.title.localeCompare(b.title))
  for (const c of ranked) {
    const sig = c.products.map((p) => p.productId).sort().join()
    if (seen.has(sig)) continue
    seen.add(sig)
    const prices = c.products.flatMap((p) => p.product.variants.map((v) => v.price))
    lanes.push({
      handle: c.handle,
      title: c.title,
      short: shortName(c.title),
      count: c.products.length,
      from: rupees(prices.length ? Math.min(...prices) : 0),
      images: [...new Set([c.imageUrl, ...c.products.flatMap((p) => p.product.images.map((i) => i.url))].filter((u): u is string => !!u))].slice(0, 2),
      ids: new Set(c.products.map((p) => p.productId)),
    })
  }
  const shownLanes = lanes.slice(0, 4)

  // The restock ticket's stub shows a real bundle: the second cheapest with a photo, or the cheapest when it is the only one.
  const priced = products.map((p) => ({ p, info: cardInfo(p) })).filter((x) => x.info.from > 0).sort((a, b) => a.info.from - b.info.from)
  const cheapest = priced[0]
  const pickRow = priced.find((x) => x.p.id !== cheapest?.p.id && x.p.images[0]) ?? (cheapest?.p.images[0] ? cheapest : undefined)
  const pick = pickRow
    ? {
        href: `/products/${pickRow.p.handle}`,
        image: (pickRow.p.images[1] ?? pickRow.p.images[0])!.url,
        alt: pickRow.p.images[0]?.alt || pickRow.p.title,
        title: pickRow.p.title,
        price: `${pickRow.info.varies ? 'From ' : ''}${rupees(pickRow.info.from)}`,
      }
    : null

  const faq = faqItems(ship.freeAt)

  return (
    <>
      <HeroSlider slides={slides.length ? slides : [DEFAULT_SLIDE]} previewIndex={slides.length ? previewIndex : undefined} />

      {browse.length ? <HomeBrowse items={browse} /> : null}

      {shownLanes.length ? <HomeDoors lanes={shownLanes.slice(0, 3)} /> : null}

      <section className="drop" aria-labelledby="drop-h">
        <div className="wrap">
          <div className="drop-head">
            <div>
              {site.dropEyebrow ? <p className="sec-eyebrow">{site.dropEyebrow}</p> : null}
              <h2 id="drop-h">{site.dropTitle}</h2>
            </div>
            <Link href="/collections/all" className="link-caps">View all</Link>
          </div>
          {products.length === 0 ? (
            <div className="empty"><h3>The drop is loading</h3><p>New bundles land soon.</p></div>
          ) : (
            <DropTabs
              label={site.dropTitle}
              tabs={shownLanes.map((l) => ({ key: l.handle, label: l.title }))}
              items={products.map((p) => ({ id: p.id, lanes: shownLanes.filter((l) => l.ids.has(p.id)).map((l) => l.handle), node: <ProductCard product={p} /> }))}
            />
          )}
        </div>
      </section>

      {site.marqueeOn ? (
        <div className="marquee" aria-hidden="true">
          <MarqueeBand items={site.marquee} />
        </div>
      ) : null}

      {tiers.length ? <HomePrice tiers={tiers} total={all.length} /> : null}

      {site.stepsOn ? (
        <section className="how" id="how" aria-labelledby="how-h">
          <div className="wrap">
            <div className="how-head">
              <p className="sec-eyebrow">Simple as it gets</p>
              <h2 id="how-h">{site.stepsTitle}</h2>
              <p className="how-sub">Four steps from browsing to wearing. One price, and all the fun is in the reveal.</p>
              <Link href="/collections/all" className="btn-pill">Start shopping <ArrowIcon /></Link>
            </div>
            <HowSteps steps={site.steps.map(([title, text]) => ({ title, text }))} />
          </div>
        </section>
      ) : null}

      {site.restockOn ? (
        <RestockTicket eyebrow={site.restockEyebrow} title={site.restockTitle} text={site.restockText} button={site.restockButton} href={site.restockLink} pick={pick} />
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema(faq) }} />
      <section className="chat" aria-labelledby="chat-h">
        <div className="wrap chat-grid">
          <div className="chat-side">
            <p className="sec-eyebrow">Good to know</p>
            <h2 id="chat-h">Questions, <em>answered</em></h2>
            <p className="chat-sub">The short version, before you open a bundle. Pick a question and we will answer it.</p>
          </div>
          <HomeChat items={faq} />
        </div>
      </section>
    </>
  )
}
