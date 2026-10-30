import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose'
import { customerSecret } from './customer-session'

/**
 * "Continue with Google": OpenID Connect authorisation-code flow with PKCE, by hand over fetch
 * (like Razorpay and Resend), with `jose` checking Google's signature on the ID token.
 *
 * Only identity is wanted, so the scope is `openid email profile` and Google's tokens are
 * never stored. Once the ID token checks out the caller issues the same `rs_customer`
 * session cookie that the emailed code does.
 */

export const OAUTH_COOKIE = 'rs_oauth'
export const OAUTH_COOKIE_PATH = '/api/auth/google'
export const HANDSHAKE_SECONDS = 10 * 60
const AUDIENCE = 'radestreet-oauth'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

/** The public address of the storefront. Redirects cannot trust the request URL behind a proxy. */
export function siteOrigin(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_SITE_URL must be set in production.')
  return requestOrigin
}

export const googleRedirectUri = (origin: string) => `${origin}/api/auth/google/callback`

/** Same-origin paths only, so the sign-in cannot be turned into an open redirect. */
export function safeNext(raw: string | null | undefined): string {
  return raw && /^\/(?![/\\])/.test(raw) ? raw : '/account'
}

const handshakeKey = () => new TextEncoder().encode(`oauth:${customerSecret()}`)
const random = () => randomBytes(32).toString('base64url')

export interface Handshake {
  state: string
  verifier: string
  nonce: string
  next: string
}

/** Start a sign-in: the address to send the shopper to, and the signed cookie value that proves it was us. */
export async function beginGoogleSignIn(origin: string, next: string): Promise<{ url: string; cookie: string }> {
  const handshake: Handshake = { state: random(), verifier: random(), nonce: random(), next }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state: handshake.state,
    nonce: handshake.nonce,
    code_challenge: createHash('sha256').update(handshake.verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  const cookie = await new SignJWT({ ...handshake })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${HANDSHAKE_SECONDS}s`)
    .sign(handshakeKey())
  return { url: `${AUTH_URL}?${params}`, cookie }
}

export interface GoogleProfile {
  /** Google's stable id for the person. */
  sub: string
  email: string
  emailVerified: boolean
  givenName: string
  familyName: string
}

async function readHandshake(cookie: string | undefined): Promise<Handshake> {
  if (!cookie) throw new Error('Sign-in expired.')
  const { payload } = await jwtVerify(cookie, handshakeKey(), { algorithms: ['HS256'], audience: AUDIENCE })
  const { state, verifier, nonce, next } = payload as Record<string, unknown>
  if (typeof state !== 'string' || typeof verifier !== 'string' || typeof nonce !== 'string' || typeof next !== 'string') throw new Error('Sign-in expired.')
  return { state, verifier, nonce, next }
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/**
 * Finish a sign-in: check `state` against the cookie, swap the code for an ID token, and verify
 * that token (Google's signature, issuer, audience, expiry and our nonce).
 * Throws on any failure; the caller shows one generic message.
 */
export async function completeGoogleSignIn(
  origin: string,
  cookie: string | undefined,
  params: { code: string | null; state: string | null },
): Promise<{ profile: GoogleProfile; next: string }> {
  const handshake = await readHandshake(cookie)
  if (!params.code || !params.state || !same(params.state, handshake.state)) throw new Error('State mismatch.')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: params.code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: 'authorization_code',
      code_verifier: handshake.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string }
  if (!res.ok || !body.id_token) throw new Error(`Google token exchange failed: ${body.error ?? res.status}`)

  const { payload } = await jwtVerify(body.id_token, jwks, {
    issuer: ISSUERS,
    audience: process.env.GOOGLE_CLIENT_ID!,
    algorithms: ['RS256'],
  })
  if (typeof payload.nonce !== 'string' || !same(payload.nonce, handshake.nonce)) throw new Error('Nonce mismatch.')
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') throw new Error('Google sent no email address.')

  return {
    next: handshake.next,
    profile: {
      sub: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      givenName: typeof payload.given_name === 'string' ? payload.given_name : '',
      familyName: typeof payload.family_name === 'string' ? payload.family_name : '',
    },
  }
}
