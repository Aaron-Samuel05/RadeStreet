import type { MetadataRoute } from 'next'
import { db } from '@radestreet/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const [products, collections, pages, posts] = await Promise.all([
    db.product.findMany({ where: { status: 'active' }, select: { handle: true, updatedAt: true } }),
    db.collection.findMany({ where: { published: true }, select: { handle: true, updatedAt: true } }),
    db.page.findMany({ where: { published: true }, select: { handle: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { published: true }, select: { handle: true, updatedAt: true } }),
  ])
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/collections/all`, changeFrequency: 'daily', priority: 0.9 },
    ...collections.map((c) => ({ url: `${base}/collections/${c.handle}`, lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: `${base}/products/${p.handle}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${base}/pages/${p.handle}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.handle}`, lastModified: p.updatedAt })),
  ]
}
