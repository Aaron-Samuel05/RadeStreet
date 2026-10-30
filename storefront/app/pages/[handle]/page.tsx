import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { DocPage } from '@/components/DocPage'

export const dynamic = 'force-dynamic'
const load = (handle: string) => db.page.findFirst({ where: { handle, published: true } })

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const p = await load((await params).handle)
  return p ? { title: p.seoTitle || p.title, description: p.seoDescription || undefined } : {}
}

export default async function ContentPage({ params }: { params: Promise<{ handle: string }> }) {
  const p = await load((await params).handle)
  if (!p) notFound()
  return <DocPage title={p.title} html={p.bodyHtml} />
}
