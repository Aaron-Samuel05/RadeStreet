/**
 * Razorpay over REST: configuration check, order creation, signature verification, refunds.
 * Nothing here throws on a gateway failure; callers get `{ ok: false, error }`.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function razorpayMode(): 'live' | 'test' | 'unset' {
  const id = process.env.RAZORPAY_KEY_ID ?? ''
  if (id.startsWith('rzp_live_')) return 'live'
  if (id.startsWith('rzp_test_')) return 'test'
  return 'unset'
}

export interface RazorpayRefundResult {
  ok: boolean
  refundId?: string
  error?: string
}

/** Refund `amount` paise against a captured payment. Never throws: the caller records the failure. */
export async function refundPayment(paymentId: string, amount: number): Promise<RazorpayRefundResult> {
  if (!razorpayConfigured()) return { ok: false, error: 'Razorpay keys are not configured.' }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } }
    if (!res.ok) return { ok: false, error: body.error?.description ?? `Razorpay returned ${res.status}` }
    return { ok: true, refundId: body.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID ?? ''
}

/** Create a Razorpay order for `amount` paise. `receipt` is our order label. */
export async function createGatewayOrder(amount: number, receipt: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!razorpayConfigured()) return { ok: false, error: 'Razorpay keys are not configured.' }
  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { authorization: authHeader(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt }),
    })
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } }
    if (!res.ok || !body.id) return { ok: false, error: body.error?.description ?? `Razorpay returned ${res.status}` }
    return { ok: true, id: body.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8')
  const y = Buffer.from(b, 'utf8')
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Checkout callback: HMAC-SHA256 of `order_id|payment_id` with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !signature) return false
  return safeEqualHex(createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'), signature)
}

/** Webhook: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  return safeEqualHex(createHmac('sha256', secret).update(rawBody).digest('hex'), signature)
}
