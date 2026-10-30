import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { safeHtml } from '@/lib/format'

export const dynamic = 'force-dynamic'
const load = (handle: string) => db.blogPost.findFirst({ where: { handle, published: true } })

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const p = await load((await params).handle)
  return p ? { title: p.seoTitle || p.title, description: p.seoDescription || p.excerpt || undefined } : {}
}

export default async function Post({ params }: { params: Promise<{ handle: string }> }) {
  const p = await load((await params).handle)
  if (!p) notFound()
  return (
    <article className="wrap">
      <header className="page-title">
        <p className="eyebrow">{p.author}{p.publishedAt ? ` · ${p.publishedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</p>
        <h1>{p.title}</h1>
      </header>
      {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ maxWidth: 720, marginBottom: 24, border: '2px solid var(--ink)' }} /> : null}
      <div className="prose" style={{ paddingBottom: 72 }} dangerouslySetInnerHTML={{ __html: safeHtml(p.bodyHtml) }} />
    </article>
  )
}
