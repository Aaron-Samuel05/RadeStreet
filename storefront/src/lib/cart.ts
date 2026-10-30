import 'server-only'
import { cookies } from 'next/headers'

export interface CartLineInput {
  variantId: string
  quantity: number
}

const COOKIE = 'rs_cart'
const MAX_LINES = 30

/** The cart is just ids and quantities in a cookie; every price is recomputed on the server. */
export async function readCart(): Promise<CartLineInput[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((l): l is { v: string; q: number } => typeof l?.v === 'string' && Number.isInteger(l?.q) && l.q > 0)
      .slice(0, MAX_LINES)
      .map((l) => ({ variantId: l.v, quantity: Math.min(l.q, 20) }))
  } catch {
    return []
  }
}

export async function writeCart(lines: CartLineInput[]) {
  const jar = await cookies()
  if (lines.length === 0) {
    jar.delete(COOKIE)
    return
  }
  jar.set(COOKIE, JSON.stringify(lines.map((l) => ({ v: l.variantId, q: l.quantity }))), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function addLine(variantId: string, quantity: number) {
  const lines = await readCart()
  const hit = lines.find((l) => l.variantId === variantId)
  if (hit) hit.quantity = Math.min(hit.quantity + quantity, 20)
  else lines.push({ variantId, quantity })
  await writeCart(lines)
}

export async function setQuantity(variantId: string, quantity: number) {
  // Change a line where it sits, so +/- doesn't send it to the bottom of the cart.
  const lines = (await readCart()).flatMap((l) => (l.variantId !== variantId ? [l] : quantity > 0 ? [{ variantId, quantity }] : []))
  await writeCart(lines)
}

const PROMO = 'rs_promo'
export async function readPromo(): Promise<{ code: string; gift: string }> {
  const raw = (await cookies()).get(PROMO)?.value
  try {
    const p = raw ? (JSON.parse(raw) as { code?: string; gift?: string }) : {}
    return { code: String(p.code ?? '').slice(0, 200), gift: String(p.gift ?? '').slice(0, 40) }
  } catch {
    return { code: '', gift: '' }
  }
}

export async function writePromo(p: { code?: string; gift?: string }) {
  const cur = await readPromo()
  const next = { ...cur, ...p }
  const jar = await cookies()
  if (!next.code && !next.gift) jar.delete(PROMO)
  else jar.set(PROMO, JSON.stringify(next), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
}
