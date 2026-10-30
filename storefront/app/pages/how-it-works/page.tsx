import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { getSite } from '@/lib/data'
import { ArrowIcon } from '@/components/Icons'

export const dynamic = 'force-dynamic'

// The page record in the admin decides whether this page is published and supplies its search title and description.
// The four steps are the homepage's "How it works" steps (Homepage settings in the admin), so the two always agree
// and match the step pictures, which carry the same titles.
const SUB = 'Four steps from browsing to wearing. One price, and all the fun is in the reveal.'

const load = () => db.page.findFirst({ where: { handle: 'how-it-works', published: true } })

export async function generateMetadata(): Promise<Metadata> {
  const p = await load()
  return p ? { title: p.seoTitle || p.title, description: p.seoDescription || undefined } : {}
}

export default async function HowItWorksPage() {
  const [p, site] = await Promise.all([load(), getSite()])
  if (!p) notFound()
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      <section className="hiw-hero">
        <div className="wrap hiw-hero-grid">
          <div>
            <nav className="plp-crumbs" aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li aria-current="page">{p.title}</li>
              </ol>
            </nav>
            <p className="hiw-kicker">Simple as it gets</p>
            <h1>How<br />it works</h1>
            <p className="hiw-sub">{SUB}</p>
            <div className="hiw-cta">
              <Link href="/collections/all" className="btn-pill">Start shopping <ArrowIcon /></Link>
              <Link href="/track" className="link-caps">Track an order</Link>
            </div>
          </div>
          <ol className="hiw-index" aria-label="The four steps">
            {site.steps.map(([title], i) => (
              <li key={title}>
                <a href={`#step-${i + 1}`}>
                  <b>{pad(i + 1)}</b>
                  <span>{title}</span>
                  <ArrowIcon size={18} />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="hiw-steps" aria-label="Step by step">
        <ol className="wrap">
          {site.steps.map(([title, text], i) => (
            <li key={title} id={`step-${i + 1}`} className="hiw-step">
              <figure>
                <img src={`/images/how-it-works/step-${i + 1}.webp`} width={800} height={1067} alt={`Step ${i + 1}: ${title}`} loading="lazy" />
              </figure>
              <div className="hiw-step-copy">
                <b className="hiw-n" aria-hidden="true">{pad(i + 1)}</b>
                <p className="hiw-step-label">Step {i + 1} of {site.steps.length}</p>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
