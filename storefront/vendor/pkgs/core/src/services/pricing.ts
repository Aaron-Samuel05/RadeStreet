import { db } from '@radestreet/db'

export interface CartLineInput {
  variantId: string
  quantity: number
}

export interface PricedLine {
  variantId: string
  productId: string
  handle: string
  title: string
  variantTitle: string
  sku: string
  imageUrl: string | null
  quantity: number
  price: number
  compareAtPrice: number | null
  /** Discount spread onto this line, paise. */
  discount: number
  requiresShipping: boolean
  /** Most units the shopper may buy right now. */
  maxQuantity: number
}

export interface Pricing {
  lines: PricedLine[]
  subtotal: number
  discount: number
  /** Titles of every discount applied, joined with “, ”. */
  discountTitle: string | null
  /** Each applied discount, for showing and removing them in the cart. */
  appliedDiscounts: { id: string; title: string; code: string | null; amount: number }[]
  shipping: number
  shippingName: string
  /** e.g. "3 to 5 days"; null when the rate has no estimate. */
  shippingEta: string | null
  /** Order value (paise) at which a free-shipping rate starts, when the cart is still below it. */
  freeShippingAt: number | null
  /** GST contained in the total (informational when prices include tax). */
  tax: number
  giftCard: number
  total: number
  /** Messages the shopper should see; the cart is still priced. */
  notices: string[]
  /** A code the shopper typed was recognised and applied. */
  codeApplied: boolean
  /** The code as stored on the discount (canonical case), when one applied. */
  appliedCode: string | null
  /** Every code that applied, as stored on the discounts. */
  appliedCodes: string[]
  /** Ids of every discount applied (codes and automatic), saved on the order. */
  appliedDiscountIds: string[]
}

export interface PriceOptions {
  code?: string
  giftCardCode?: string
  state?: string
  country?: string
  email?: string | null
  /** Signed-in customer, for per-account limits and account-only codes. */
  customerId?: string | null
}

const MAX_PER_LINE = 20
const MAX_CODES = 5

/** Zones and tax rates are entered by hand in the admin, so accept the name or the ISO code. */
const countryNames = (c?: string): string[] => {
  const v = (c || 'India').trim()
  return /^(in|india)$/i.test(v) ? ['India', 'IN'] : [v]
}

/**
 * The single source of truth for what a cart costs. The storefront shows it and
 * checkout recomputes it on the server: nothing the browser sends is trusted but ids and quantities.
 */
export async function priceCart(input: CartLineInput[], opts: PriceOptions = {}): Promise<Pricing> {
  const notices: string[] = []
  const wanted = new Map<string, number>()
  for (const l of input) {
    const q = Math.floor(Number(l.quantity))
    if (!l.variantId || !(q > 0)) continue
    wanted.set(l.variantId, Math.min((wanted.get(l.variantId) ?? 0) + q, MAX_PER_LINE))
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: [...wanted.keys()] }, product: { status: 'active' } },
    include: {
      product: { include: { images: { orderBy: { position: 'asc' }, take: 1 }, collections: { select: { collectionId: true } } } },
      levels: { where: { location: { active: true } } },
    },
  })
  const byId = new Map(variants.map((v) => [v.id, v]))

  const lines: PricedLine[] = []
  const collectionsOf = new Map<string, string[]>()
  for (const [variantId, qty] of wanted) {
    const v = byId.get(variantId)
    if (!v) {
      notices.push('An item in your cart is no longer available and was removed.')
      continue
    }
    const tracked = v.trackInventory && !v.continueSelling
    const stock = tracked ? v.levels.reduce((s, l) => s + l.available, 0) : MAX_PER_LINE
    const label = `${v.product.title}${v.title === 'Default Title' ? '' : ` (${v.title})`}`
    if (stock <= 0) {
      notices.push(`${label} is sold out and was removed.`)
      continue
    }
    let quantity = qty
    if (quantity > stock) {
      notices.push(`Only ${stock} of ${label} left. We adjusted your quantity.`)
      quantity = stock
    }
    collectionsOf.set(v.productId, v.product.collections.map((c) => c.collectionId))
    lines.push({
      variantId: v.id,
      productId: v.productId,
      handle: v.product.handle,
      title: v.product.title,
      variantTitle: v.title === 'Default Title' ? '' : v.title,
      sku: v.sku ?? '',
      imageUrl: v.product.images[0]?.url ?? null,
      quantity,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      discount: 0,
      requiresShipping: v.requiresShipping,
      maxQuantity: Math.min(stock, MAX_PER_LINE),
    })
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const units = lines.reduce((s, l) => s + l.quantity, 0)

  // ── Discounts: every code the shopper entered plus automatic discounts. Discounts that allow it
  // stack (each one is taken off what is left after the previous); otherwise the first valid one wins.
  const now = new Date()
  const codes = [...new Set((opts.code ?? '').split(/[\s,]+/).map((c) => c.trim()).filter(Boolean))].slice(0, MAX_CODES)
  const candidates = await db.discount.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        { OR: [{ method: 'automatic' }, ...codes.map((c) => ({ code: { equals: c, mode: 'insensitive' as const } }))] },
      ],
    },
  })
  type Disc = (typeof candidates)[number]
  const say = (d: Disc, msg: string) => (codes.length > 1 && d.code ? `${d.code}: ${msg}` : msg)

  // A typed code that matches nothing at all.
  for (const c of codes) {
    if (!candidates.some((d) => d.method === 'code' && d.code?.toLowerCase() === c.toLowerCase())) notices.push(codes.length > 1 ? `${c.toUpperCase()}: not a valid code.` : 'That discount code is not valid.')
  }

  const lineTotal = lines.map((l) => l.price * l.quantity)
  /** What `d` would take off, given what earlier discounts already took per line. Null when it does not apply. */
  const calc = (d: Disc, taken: number[]) => {
    const eligible = lines.map(
      (l) =>
        d.appliesTo === 'all' ||
        (d.appliesTo === 'products' && d.targetIds.includes(l.productId)) ||
        (d.appliesTo === 'collections' && (collectionsOf.get(l.productId) ?? []).some((c) => d.targetIds.includes(c))),
    )
    const room = lineTotal.map((t, i) => (eligible[i] ? t - taken[i] : 0))
    const base = room.reduce((s, x) => s + x, 0)
    if (d.type !== 'free_shipping' && base <= 0) return null
    let amount = 0
    if (d.type === 'percentage') amount = Math.round((base * Math.min(d.value, 100)) / 100)
    else if (d.type === 'fixed_amount') amount = Math.min(d.value, base)
    const perLine = room.map((r) => (base ? Math.floor((amount * r) / base) : 0))
    // Rounding dust lands on the first eligible line so the line discounts sum to the total.
    const dust = amount - perLine.reduce((s, x) => s + x, 0)
    const first = room.findIndex((r) => r > 0)
    if (dust > 0 && first >= 0) perLine[first] += dust
    return { amount, perLine, freeShipping: d.type === 'free_shipping' }
  }

  // Which discounts are valid for this cart and customer at all.
  const valid: Disc[] = []
  for (const d of candidates) {
    const viaCode = d.method === 'code'
    const reject = (msg: string) => { if (viaCode) notices.push(say(d, msg)) }
    if (d.usageLimit != null && d.usageCount >= d.usageLimit) { reject('That discount code has been fully used.'); continue }
    if (d.minimumSubtotal != null && subtotal < d.minimumSubtotal) { reject('Your cart does not reach the minimum for that code.'); continue }
    if (d.minimumQuantity != null && units < d.minimumQuantity) { reject('Your cart does not reach the minimum quantity for that code.'); continue }
    if (d.requiresAccount && !opts.customerId) { reject('Log in to your account to use that code.'); continue }
    const limit = d.perCustomerLimit ?? (d.oncePerCustomer ? 1 : null)
    if (limit != null && (opts.customerId || opts.email)) {
      const who = [...(opts.customerId ? [{ customerId: opts.customerId }] : []), ...(opts.email ? [{ email: { equals: opts.email, mode: 'insensitive' as const } }] : [])]
      const used = await db.order.count({
        where: {
          isDraft: false, status: { not: 'cancelled' }, OR: who,
          AND: [{ OR: [{ discountIds: { has: d.id } }, ...(d.code ? [{ discountCode: { equals: d.code, mode: 'insensitive' as const } }] : [])] }],
        },
      })
      if (used >= limit) { reject(limit === 1 ? 'You have already used that code.' : `You have already used that code ${limit} times.`); continue }
    }
    if (!calc(d, lineTotal.map(() => 0))) { reject('That code does not apply to anything in your cart.'); continue }
    valid.push(d)
  }

  // Typed codes in the order typed, then automatic discounts, biggest saving first.
  const alone = (d: Disc) => calc(d, lineTotal.map(() => 0))?.amount ?? 0
  const ordered = [
    ...codes.flatMap((c) => valid.filter((d) => d.method === 'code' && d.code?.toLowerCase() === c.toLowerCase())),
    ...valid.filter((d) => d.method === 'automatic').sort((a, b) => alone(b) - alone(a)),
  ]

  let applied: { d: Disc; amount: number; perLine: number[]; freeShipping: boolean }[] = []
  let taken = lineTotal.map(() => 0)
  const take = (d: Disc) => {
    const r = calc(d, taken)
    if (!r) return
    applied.push({ d, ...r })
    taken = taken.map((t, i) => t + r.perLine[i])
  }
  for (const d of ordered) {
    if (!applied.length || (d.combinable && applied.every((a) => a.d.combinable))) { take(d); continue }
    if (d.method === 'code') { notices.push(say(d, `That code can't be used together with ${applied.map((a) => a.d.code ?? a.d.title).join(' and ')}.`)); continue }
    // An automatic discount that cannot stack only replaces what is applied if it saves more.
    const here = alone(d)
    if (here > applied.reduce((s, a) => s + a.amount, 0)) {
      const dropped = applied.filter((a) => a.d.method === 'code').map((a) => a.d.code)
      if (dropped.length) notices.push(`${d.title} saves you more, so ${dropped.join(' and ')} was not applied.`)
      applied = []
      taken = lineTotal.map(() => 0)
      take(d)
    }
  }
  applied.forEach((a) => a.perLine.forEach((x, i) => (lines[i].discount += x)))
  const discount = applied.reduce((s, a) => s + a.amount, 0)
  const afterDiscount = subtotal - discount
  const freeShippingDiscount = applied.some((a) => a.freeShipping)

  // ── Shipping: a zone covering the destination, then the cheapest active rate whose condition the cart meets.
  const needsShipping = lines.some((l) => l.requiresShipping)
  let shipping = 0
  let shippingName = needsShipping ? 'Shipping' : 'No shipping needed'
  let shippingEta: string | null = null
  let freeShippingAt: number | null = null
  if (needsShipping) {
    const grams = lines.reduce((s, l) => s + (l.requiresShipping ? (byId.get(l.variantId)?.weightGrams ?? 0) * l.quantity : 0), 0)
    const zones = await db.shippingZone.findMany({ where: { countries: { hasSome: countryNames(opts.country) } }, include: { rates: { where: { active: true }, orderBy: { position: 'asc' } } } })
    const state = opts.state?.toLowerCase()
    const zone = zones.find((z) => state && z.states.some((s) => s.toLowerCase() === state)) ?? zones.find((z) => z.states.length === 0)
    const inRange = (n: number, lo: number | null, hi: number | null) => (lo == null || n >= lo) && (hi == null || n <= hi)
    const fitsRate = (r: NonNullable<typeof zone>['rates'][number], value = afterDiscount) =>
      r.basis === 'none' ? true : r.basis === 'weight' ? inRange(grams, r.minWeight, r.maxWeight) : inRange(value, r.minSubtotal, r.maxSubtotal)
    const cost = (r: { kind: string; price: number }) => (r.kind === 'free' ? 0 : r.price)
    const rate = (zone?.rates ?? []).filter((r) => fitsRate(r)).sort((a, b) => cost(a) - cost(b))[0]
    if (rate) {
      shipping = cost(rate)
      shippingName = rate.name
      if (rate.minDays != null || rate.maxDays != null) {
        const lo = rate.minDays ?? rate.maxDays!, hi = rate.maxDays ?? rate.minDays!
        shippingEta = lo === hi ? `${lo} day${lo === 1 ? '' : 's'}` : `${lo} to ${hi} days`
      }
    } else if (!zone) notices.push('We do not ship to that address yet.')
    else notices.push('No shipping option is available for this order. Please contact us.')
    // Nudge: the lowest order value at which a free rate (priced by order value) would start applying.
    if (shipping > 0) {
      const ups = (zone?.rates ?? []).filter((r) => cost(r) === 0 && r.basis === 'price' && r.minSubtotal != null && r.minSubtotal > afterDiscount && fitsRate(r, r.minSubtotal))
      freeShippingAt = ups.length ? Math.min(...ups.map((r) => r.minSubtotal!)) : null
    }
    if (freeShippingDiscount) {
      shipping = 0
      shippingName = 'Free shipping'
      freeShippingAt = null
    }
  }

  // ── Tax: GST is already inside shelf prices in India, so "included" is an informational split.
  const taxRates = await db.taxRate.findMany({ where: { active: true, country: { in: countryNames(opts.country) } } })
  const st = opts.state?.toLowerCase()
  const rate = taxRates.find((t) => st && t.state && t.state.toLowerCase() === st) ?? taxRates.find((t) => !t.state)
  let tax = 0
  let extra = 0
  if (rate) {
    if (rate.included) tax = Math.round((afterDiscount * rate.rateBps) / (10000 + rate.rateBps))
    else {
      tax = Math.round((afterDiscount * rate.rateBps) / 10000)
      extra = tax
    }
  }

  const beforeGift = afterDiscount + shipping + extra
  let giftCard = 0
  const gc = opts.giftCardCode?.trim()
  if (gc) {
    const card = await db.giftCard.findFirst({ where: { code: { equals: gc, mode: 'insensitive' }, active: true } })
    if (!card || card.balance <= 0 || (card.expiresAt && card.expiresAt < now)) notices.push('That gift card is not valid or has no balance.')
    else giftCard = Math.min(card.balance, beforeGift)
  }

  const appliedCodes = applied.flatMap((a) => (a.d.code ? [a.d.code] : []))
  return {
    lines, subtotal, discount, discountTitle: applied.length ? applied.map((a) => a.d.title).join(', ') : null,
    appliedDiscounts: applied.map((a) => ({ id: a.d.id, title: a.d.title, code: a.d.code, amount: a.amount })),
    shipping, shippingName, shippingEta, freeShippingAt, tax, giftCard, total: beforeGift - giftCard, notices,
    codeApplied: appliedCodes.length > 0, appliedCode: appliedCodes[0] ?? null, appliedCodes, appliedDiscountIds: applied.map((a) => a.d.id),
  }
}
