import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { DocPage } from '@/components/DocPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const p = await db.policy.findUnique({ where: { type: (await params).type } })
  return p ? { title: p.title } : {}
}

export default async function PolicyPage({ params }: { params: Promise<{ type: string }> }) {
  const p = await db.policy.findUnique({ where: { type: (await params).type } })
  if (!p) notFound()
  return <DocPage title={p.title} kicker="Policy" html={p.bodyHtml} empty="This policy has not been published yet." />
}
