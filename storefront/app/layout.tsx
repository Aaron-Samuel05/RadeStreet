import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getPrefs } from '@/lib/data'
import { SmoothScroll } from '@/components/SmoothScroll'

export async function generateMetadata(): Promise<Metadata> {
  const p = await getPrefs()
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: `${p.storeName}: ${p.title === p.storeName ? 'Surprise Fashion Drops' : p.title}`, template: `%s · ${p.storeName}` },
    description: p.metaDescription,
    openGraph: { siteName: p.storeName, type: 'website' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <SmoothScroll />
        <p className="demo-notice" role="status">Read-only demo · Shopping, accounts, and form submissions are disabled.</p>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
