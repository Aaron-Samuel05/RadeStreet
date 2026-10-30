import Link from 'next/link'
import { safeHtml } from '@/lib/format'
import { ArrowIcon } from './Icons'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const plain = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'").trim()

/** Gives each h2 an anchor id (for the "On this page" list) and wraps tables so wide ones scroll instead of squeezing. */
function prepare(source: string) {
  const heads: { id: string; text: string }[] = []
  const used = new Set<string>()
  const html = safeHtml(source)
    .replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (whole, attrs: string, inner: string) => {
      const text = plain(inner)
      if (!text) return whole
      const own = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]
      const base = own || slug(text) || 'section'
      let id = base
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`
      used.add(id)
      heads.push({ id, text })
      return own ? whole : `<h2${attrs} id="${id}">${inner}</h2>`
    })
    .replace(/<table[\s\S]*?<\/table>/gi, (t) => `<div class="doc-table">${t}</div>`)
  return { html, heads }
}

/**
 * The page template for text written in the admin: content pages (/pages/...) and the policies. Long text with three or
 * more h2 headings gets a sticky "On this page" list; tables (a size guide, say) get a clean, scrollable frame.
 */
export function DocPage({ title, html, kicker, empty = 'There is nothing on this page yet.' }: { title: string; html: string; kicker?: string; empty?: string }) {
  const { html: body, heads } = prepare(html)
  const toc = heads.length >= 3
  return (
    <article className="doc">
      <header className="doc-head">
        <div className="wrap">
          <nav className="plp-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          {kicker ? <p className="doc-kicker">{kicker}</p> : null}
          <h1>{title}</h1>
        </div>
      </header>

      <div className={`wrap doc-grid${toc ? ' has-toc' : ''}`}>
        {toc ? (
          <nav className="doc-toc" aria-label="On this page">
            <p className="sec-eyebrow">On this page</p>
            <ol>{heads.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
          </nav>
        ) : null}
        {body.trim() ? <div className="doc-body" dangerouslySetInnerHTML={{ __html: body }} /> : <p className="doc-empty">{empty}</p>}
      </div>

      <aside className="wrap" aria-label="Need help">
        <div className="doc-help">
          <div>
            <h2>Still have a question?</h2>
            <p>Write to us and we will help.</p>
          </div>
          <Link href="/pages/contact" className="btn-pill light">Contact us <ArrowIcon /></Link>
        </div>
      </aside>
    </article>
  )
}
