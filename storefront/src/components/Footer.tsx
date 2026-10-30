import Link from 'next/link'
import { getMenu, getPrefs, getSite } from '@/lib/data'
import { JoinBand } from './JoinBand'

export async function Footer() {
  const [prefs, site, items] = await Promise.all([getPrefs(), getSite(), getMenu('footer')])
  // Footer menu: each top-level item is a column heading, its sub-items are the links.
  const tops = items.filter((i) => !i.parentId)
  const columns = tops
    .map((t) => ({ id: t.id, title: t.label, url: t.url, links: items.filter((i) => i.parentId === t.id) }))
    .filter((c) => c.links.length > 0)
  // Top-level items with no children are plain links, grouped together.
  const loose = tops.filter((t) => !items.some((i) => i.parentId === t.id))
  const social = [['Instagram', site.instagram], ['Facebook', site.facebook], ['YouTube', site.youtube], ['X', site.x]].filter(([, u]) => u)
  const showConnect = social.length > 0 || (site.showContact && (prefs.email || prefs.phone))
  return (
    <>
    {/* The "join the family" banner closes every page, just above the footer. */}
    {site.newsletterOn ? <JoinBand title={site.newsletterTitle} text={site.newsletterText} /> : null}
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="foot-logo"><img src="/images/brand/logo.png" width={768} height={144} alt={site.logoText} /></Link>
            <p className="foot-tagline">{site.tagline}</p>
          </div>
          {columns.map((c) => (
            <nav key={c.id} className="foot-col" aria-label={c.title}>
              <h3 className="foot-head">{c.title}</h3>
              <ul>{c.links.map((l) => <li key={l.id}><Link href={l.url}>{l.label}</Link></li>)}</ul>
            </nav>
          ))}
          {loose.length ? (
            <nav className="foot-col" aria-label="More">
              <h3 className="foot-head">More</h3>
              <ul>{loose.map((l) => <li key={l.id}><Link href={l.url}>{l.label}</Link></li>)}</ul>
            </nav>
          ) : null}
          {showConnect ? (
            <div className="foot-col">
              <h3 className="foot-head">Connect</h3>
              <ul>
                {social.map(([name, url]) => <li key={name}><a href={url} rel="noopener noreferrer" target="_blank">{name}</a></li>)}
                {site.showContact && prefs.email ? <li><a href={`mailto:${prefs.email}`}>{prefs.email}</a></li> : null}
                {site.showContact && prefs.phone ? <li><a href={`tel:${prefs.phone}`}>{prefs.phone}</a></li> : null}
              </ul>
            </div>
          ) : null}
        </div>
        <img className="foot-mark" src="/images/brand/wordmark.png" width={840} height={82} alt="" loading="lazy" aria-hidden="true" />
        <div className="copy">
          <span>© {new Date().getFullYear()} {prefs.storeName}. {site.copyright} · <Link href="/track">Track your order</Link></span>
          <span className="pay-marks" aria-label="Payment methods"><span>UPI</span><span>Cards</span><span>Netbanking</span></span>
        </div>
      </div>
    </footer>
    </>
  )
}
