import { db } from '@radestreet/db'
import { esc, sendEmail } from '../email'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Whether a customer could buy this variant right now. */
function sellable(v: { trackInventory: boolean; continueSelling: boolean; levels: { available: number }[] }): boolean {
  return !v.trackInventory || v.continueSelling || v.levels.reduce((s, l) => s + l.available, 0) > 0
}

/** "Tell me when it is back." Asking twice for the same item is fine and sends one email. */
export async function requestStockAlert(variantId: string, rawEmail: string): Promise<'saved' | 'in_stock'> {
  const email = rawEmail.trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) throw new Error('Enter a valid email address.')
  const v = await db.productVariant.findFirst({
    where: { id: variantId, product: { status: 'active' } },
    include: { levels: { where: { location: { active: true } }, select: { available: true } } },
  })
  if (!v) throw new Error('This product is no longer available.')
  if (sellable(v)) return 'in_stock'
  // A fresh request after an earlier email re-arms the alert.
  await db.stockAlert.upsert({
    where: { variantId_email: { variantId, email } },
    update: { notifiedAt: null },
    create: { variantId, email },
  })
  return 'saved'
}

/**
 * Email everyone waiting on a variant that can be bought again. Safe to call at any time and from
 * several places: each alert is claimed with one conditional update, so it is mailed at most once.
 */
export async function sweepStockAlerts(): Promise<number> {
  const waiting = await db.stockAlert.findMany({
    where: { notifiedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 500,
    include: {
      variant: { include: { product: { select: { title: true, handle: true, status: true } }, levels: { where: { location: { active: true } }, select: { available: true } } } },
    },
  })
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  let sent = 0
  for (const a of waiting) {
    if (a.variant.product.status !== 'active' || !sellable(a.variant)) continue
    const claimed = await db.stockAlert.updateMany({ where: { id: a.id, notifiedAt: null }, data: { notifiedAt: new Date() } })
    if (claimed.count !== 1) continue
    const name = a.variant.title === 'Default Title' ? a.variant.product.title : `${a.variant.product.title} (${a.variant.title})`
    const link = `${base}/products/${a.variant.product.handle}`
    const delivered = await sendEmail({
      to: a.email,
      subject: `Back in stock: ${name}`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif"><p>Good news. <b>${esc(name)}</b> is back in stock.</p><p><a href="${esc(link)}">Shop it now</a></p><p style="color:#666;font-size:12px">You asked us to tell you when it returned. This is the only email we will send about it.</p></div>`,
    })
    // A failed send (with a mail provider configured) puts the alert back so the next sweep retries it.
    if (!delivered && process.env.RESEND_API_KEY) {
      await db.stockAlert.updateMany({ where: { id: a.id }, data: { notifiedAt: null } })
      continue
    }
    sent++
  }
  return sent
}

/** Run the sweep after a stock change without making the caller wait for it or fail because of it. */
export function sweepStockAlertsSoon() {
  void sweepStockAlerts().catch((e) => console.error('[stock alerts]', e))
}
