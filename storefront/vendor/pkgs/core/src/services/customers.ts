import { db, type Prisma } from '@radestreet/db'

type Db = Prisma.TransactionClient | typeof db

export interface SavedAddress {
  name?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
  phone?: string
}

/**
 * Keeps the customer record complete: fills in a missing name, always keeps the latest phone,
 * and saves the delivery address to their address book (once; the same street and PIN is not added twice).
 * The first address a customer gives becomes their default.
 */
export async function rememberContact(tx: Db, customerId: string, a: SavedAddress) {
  const parts = (a.name ?? '').trim().split(/\s+/).filter(Boolean)
  const c = await tx.customer.findUnique({ where: { id: customerId }, include: { addresses: { select: { line1: true, pincode: true } } } })
  if (!c) return
  await tx.customer.update({
    where: { id: customerId },
    data: {
      ...(a.phone?.trim() ? { phone: a.phone.trim() } : {}),
      ...(!c.firstName && !c.lastName && parts.length ? { firstName: parts[0], lastName: parts.slice(1).join(' ') } : {}),
    },
  })
  if (!a.line1?.trim()) return
  const key = (l: string, p: string) => `${l.trim().toLowerCase()}|${p.trim()}`
  if (c.addresses.some((x) => key(x.line1, x.pincode) === key(a.line1, a.pincode))) return
  await tx.address.create({
    data: {
      customerId, name: (a.name ?? '').trim(), line1: a.line1.trim(), line2: (a.line2 ?? '').trim(), city: a.city.trim(), state: a.state.trim(),
      pincode: a.pincode.trim(), country: a.country?.trim() || 'India', phone: (a.phone ?? '').trim(), isDefault: c.addresses.length === 0,
    },
  })
}
