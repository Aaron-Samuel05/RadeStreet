import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@radestreet/db'

export const metadata: Metadata = { title: 'Journal' }
export const dynamic = 'force-dynamic'

export default async function Blog() {
  const posts = await db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' } })
  return (
    <div className="wrap">
      <header className="page-title"><h1>Journal</h1></header>
      {posts.length === 0 ? <div className="empty"><p>No posts yet.</p></div> : (
        <div className="grid" style={{ paddingBottom: 72 }}>
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.handle}`} className="card">
              {p.imageUrl ? <div className="media"><img src={p.imageUrl} alt="" loading="lazy" /></div> : null}
              <h3>{p.title}</h3>
              <p className="mono" style={{ fontSize: '.82rem', margin: 0 }}>{p.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
