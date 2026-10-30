import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@radestreet/db'
import { getPrefs } from '@/lib/data'
import { ContactDesk } from '@/components/ContactDesk'

export const dynamic = 'force-dynamic'

// Used until the store's email and phone are filled in under Settings. Both come from the live Contact page (radestreet.com).
const FALLBACK_EMAIL = 'shop@radestreet.com'
const FALLBACK_PHONE = '+91 99406 61014'

const load = () => db.page.findFirst({ where: { handle: 'contact', published: true } })

export async function generateMetadata(): Promise<Metadata> {
  const p = await load()
  return p ? { title: p.seoTitle || p.title, description: p.seoDescription || undefined } : {}
}

export default async function ContactPage() {
  const [p, prefs] = await Promise.all([load(), getPrefs()])
  if (!p) notFound()
  const phone = prefs.phone || FALLBACK_PHONE
  // wa.me wants the number as digits with the country code; a bare 10-digit Indian number gets +91.
  const digits = phone.replace(/\D/g, '')
  const whatsapp = digits.length === 10 ? `91${digits}` : digits
  return <ContactDesk email={prefs.email || FALLBACK_EMAIL} phone={phone} whatsapp={whatsapp} />
}
