import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { ArrowIcon, BoxIcon, CalendarIcon, ShieldIcon, SparkIcon, TruckIcon } from '@/components/Icons'

export const dynamic = 'force-dynamic'

// The wording below is copied from the live About page (radestreet.com/pages/about). The page record in the admin
// still decides whether this page is published and supplies its search title and description.
const LEAD = "Rade Street is India's first branded fashion bundle, curated surprise drops of premium clothing delivered to your door. Pick your category, choose your size, and let us do the rest."

const POINTS = [
  { Icon: SparkIcon, text: 'Premium fashion brands at surprise prices' },
  { Icon: CalendarIcon, text: 'New drops every Monday, never the same bundle twice' },
  { Icon: ShieldIcon, text: 'Every item brand new, sealed and quality checked' },
  { Icon: TruckIcon, text: 'Delivered pan India in 3 to 5 days' },
]

const STEPS = [
  { title: 'Pick a Category', text: 'Choose from Men or Women: T-Shirts, Shirts, Jackets, Pants, Sweaters, Hoodies and more. Every category is a separate branded bundle with its own price and surprise count.' },
  { title: 'Select Your Bundle', text: 'Each bundle shows how many items are inside: 2, 3 or 5 pieces depending on the category. Choose your size, add to bag and checkout. Simple.' },
  { title: 'We Pack It', text: 'Handpicked surprise items in different designs and colours. Sealed and shipped fresh. No two bundles alike.' },
  { title: 'Unbox & Wear', text: "Receive, reveal and rock your new wardrobe. Every Rade Street bundle is a surprise drop you'll absolutely love." },
]

const MYSTERY = [
  { title: 'Pick a Category', text: 'T-Shirts, Shirts, Jeans, Jackets. Choose what type of clothing you want.' },
  { title: 'Know the Count', text: 'See exactly how many items are inside before you buy. Always clear, always upfront.' },
  { title: 'Unbox the Surprise', text: "Designs, colours and prints revealed only when you open the bundle. That's the thrill." },
]

const COUNTS: [string, number][] = [['T-Shirts', 5], ['Jeans', 2], ['Shirts', 3], ['Jackets', 1]]
const TAGS = ['Brand New Items', 'Quality Checked', 'Revealed on Delivery']

const load = () => db.page.findFirst({ where: { handle: 'about', published: true } })

export async function generateMetadata(): Promise<Metadata> {
  const p = await load()
  return p ? { title: p.seoTitle || p.title, description: p.seoDescription || undefined } : {}
}

export default async function AboutPage() {
  const p = await load()
  if (!p) notFound()
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      <section className="about-hero">
        <div className="wrap about-hero-grid">
          <div className="about-hero-copy">
            <nav className="plp-crumbs" aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li aria-current="page">{p.title}</li>
              </ol>
            </nav>
            <h1><span className="about-kicker">About</span>{' '}Rade<br />Street</h1>
            <p className="about-lead">{LEAD}</p>
            <div className="about-hero-cta">
              <Link href="/collections/all" className="btn-pill">Shop Now <ArrowIcon /></Link>
              <a href="#how" className="link-caps">How it works</a>
            </div>
          </div>
          <figure className="about-photo">
            <img src="/images/hero/banner-mobile.jpg" width={887} height={887} alt="Friends sitting on concrete steps at sunset with a skateboard and a basketball" />
            <figcaption className="about-sticker"><BoxIcon size={18} /> Branded bundle</figcaption>
          </figure>
        </div>
      </section>

      <section className="about-points" aria-label="Why Rade Street">
        <ul className="wrap">
          {POINTS.map(({ Icon, text }) => (
            <li key={text}>
              <Icon size={28} />
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-how" id="how" aria-labelledby="how-h">
        <div className="wrap about-how-grid">
          <header className="about-how-head">
            <p className="sec-eyebrow">Pick your category. We do the rest. You unbox the surprise.</p>
            <h2 id="how-h">How it works</h2>
            <p className="about-how-sub">We built Rade Street to make fashion simple, exciting and affordable, every single time.</p>
            <Link href="/collections/all" className="btn-pill">Shop Now <ArrowIcon /></Link>
          </header>
          <ol className="about-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="about-step-n" aria-hidden="true">{pad(i + 1)}</span>
                <div>
                  <p className="about-step-label">Step {pad(i + 1)}</p>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-mystery" aria-labelledby="mystery-h">
        <div className="wrap">
          <h2 id="mystery-h">The mystery explained</h2>
          <ol className="about-count">
            {MYSTERY.map((m, i) => (
              <li key={m.title}>
                <b aria-hidden="true">{pad(i + 1)}</b>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
          <div className="about-board">
            <div className="about-inside">
              <p className="about-eyebrow">What&apos;s inside</p>
              <h3>Fixed item count per category</h3>
              <p>Each Rade Street bundle contains a fixed number of handpicked fashion items. The count depends on the category. T-Shirts give you 5, Jeans give you 2, Shirts give you 3. Always fresh, always different.</p>
              <ul className="about-tiles">
                {COUNTS.map(([name, n]) => (
                  <li key={name}>
                    <b>{n}</b>
                    <span>{name}</span>
                    <small>{n === 1 ? 'item' : 'items'}</small>
                  </li>
                ))}
              </ul>
            </div>
            <div className="about-surprise">
              <p className="about-eyebrow">The surprise</p>
              <h3>Mystery = Excitement</h3>
              <p>You know the category and the item count. The exact designs and colours are revealed only when you unbox. That&apos;s the Rade Street experience. Pure fashion thrill at every delivery.</p>
              <ul className="about-tags">
                {TAGS.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
