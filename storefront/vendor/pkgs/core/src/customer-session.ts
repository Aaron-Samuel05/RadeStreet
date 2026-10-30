import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@radestreet/db'
import { esc, sendEmail } from './email'

export const CUSTOMER_COOKIE = 'rs_customer'
const AUDIENCE = 'radestreet-customer'
const CODE_TTL_MIN = 10
const MAX_ATTEMPTS = 5

/** The shopper-side signing secret. Other shopper tokens (the Google sign-in handshake) derive their own key from it. */
export function customerSecret(): string {
  const secret = process.env.CUSTOMER_AUTH_SECRET ?? process.env.ADMIN_AUTH_SECRET
  if (!secret || secret.length < 32) throw new Error('CUSTOMER_AUTH_SECRET (or ADMIN_AUTH_SECRET) must be set to 32+ characters.')
  return secret
}

function key(): Uint8Array {
  return new TextEncoder().encode(`customer:${customerSecret()}`)
}

export async function createCustomerSession(customerId: string): Promise<string> {
  return new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key())
}

export async function verifyCustomerSession(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

const hash = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest('hex')

/** Email a 6-digit code. Always resolves the same way so the form cannot be used to probe for accounts. */
export async function sendLoginCode(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const recent = await db.loginCode.count({ where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } } })
  if (recent >= 2) throw new Error('Please wait a minute before asking for another code.')

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await db.loginCode.create({ data: { email, codeHash: hash(email, code), expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000) } })
  if (process.env.NODE_ENV !== 'production') console.log(`[login code] ${email}: ${code}`)
  const sent = await sendEmail({
    to: email,
    subject: `Your Radestreet code: ${code}`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif"><p>Your sign-in code is</p><p style="font-size:32px;letter-spacing:6px"><b>${esc(code)}</b></p><p>It expires in ${CODE_TTL_MIN} minutes. If you did not ask for it, ignore this email.</p></div>`,
  })
  // In development the code is in the console. In production a send that failed must not look like success.
  if (!sent && process.env.NODE_ENV === 'production') throw new Error('We could not send the code. Please try again in a moment.')
}

/** Returns the customer id on success. Creates the customer on first sign-in. */
export async function verifyLoginCode(rawEmail: string, code: string): Promise<string> {
  const email = rawEmail.trim().toLowerCase()
  const row = await db.loginCode.findFirst({ where: { email, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } })
  if (!row || row.attempts >= MAX_ATTEMPTS) throw new Error('That code has expired. Ask for a new one.')
  await db.loginCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })

  const a = Buffer.from(hash(email, code.trim()))
  const b = Buffer.from(row.codeHash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('That code is not right.')

  await db.loginCode.update({ where: { id: row.id }, data: { usedAt: new Date() } })
  const customer = await db.customer.upsert({ where: { email }, update: {}, create: { email } })
  return customer.id
}
