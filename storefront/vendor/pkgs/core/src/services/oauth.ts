import { db } from '@radestreet/db'
import type { GoogleProfile } from '../google-oauth'

/** A sign-in the shopper can fix themselves, so the caller shows it rather than a generic failure. */
export class OAuthLinkError extends Error {
  constructor(message: string, readonly code: 'google_unverified' | 'google_linked') {
    super(message)
  }
}

/**
 * The customer for a verified Google account, created on first sign-in.
 *
 * Google's `sub` is what identifies them. Email is used only the first time, to attach Google to
 * a customer who already shopped as a guest. That is safe because the caller has checked
 * `email_verified`; an unverified address would let anyone claim another shopper's order history.
 */
export async function customerForGoogle(p: GoogleProfile): Promise<string> {
  if (!p.emailVerified) throw new OAuthLinkError('Google has not verified that email address.', 'google_unverified')
  const identity = { provider_providerAccountId: { provider: 'google', providerAccountId: p.sub } }

  const known = await db.oAuthIdentity.findUnique({ where: identity })
  if (known) return known.customerId

  try {
    return await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: p.email },
        update: {},
        create: { email: p.email, firstName: p.givenName, lastName: p.familyName },
      })
      // One Google account per customer: if this address already belongs to a different Google
      // account (a recycled work address, say), do not hand the history to the new holder.
      // The same account here means another tab linked it a moment ago, which is fine.
      const linked = await tx.oAuthIdentity.findFirst({ where: { customerId: customer.id, provider: 'google' } })
      if (linked?.providerAccountId === p.sub) return customer.id
      if (linked) throw new OAuthLinkError('That email is already linked to a different Google account.', 'google_linked')
      if (!customer.firstName && !customer.lastName && (p.givenName || p.familyName)) {
        await tx.customer.update({ where: { id: customer.id }, data: { firstName: p.givenName, lastName: p.familyName } })
      }
      await tx.oAuthIdentity.create({ data: { customerId: customer.id, provider: 'google', providerAccountId: p.sub, email: p.email } })
      return customer.id
    })
  } catch (e) {
    if (e instanceof OAuthLinkError) throw e
    // Two tabs finishing at once: the other one linked it first.
    const raced = await db.oAuthIdentity.findUnique({ where: identity })
    if (raced) return raced.customerId
    throw e
  }
}
