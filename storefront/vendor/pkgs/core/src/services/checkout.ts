import { db, type Prisma } from '@radestreet/db'
import { createGatewayOrder, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from '../razorpay'
import { esc, sendEmail } from '../email'
import { formatMoney } from '../money'
import { cancelOrder } from './orders'
import { defaultLocationId } from './inventory'
import { priceCart, type CartLineInput } from './pricing'
import { rememberContact } from './customers'

export interface CheckoutAddress {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  country: string
  phone: string
}

export interface CheckoutInput {
  email: string
  address: CheckoutAddress
  lines: CartLineInput[]
  code?: string
  giftCardCode?: string
  acceptsMarketing?: boolean
  customerId?: string | null
  note?: string
}

export interface CheckoutResult {
  orderId: string
  label: string
  /** Paise the gateway will charge. 0 means a gift card covered it all and the order is already paid. */
  amount: number
  gatewayOrderId: string | null
  keyId: string
  /** No Razorpay keys and not production: the page shows a test-pay button instead of the gateway. */
  devMode: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Unpaid online orders hold stock this long. */
const HOLD_MINUTES = 30

export function validateAddress(a: CheckoutAddress): string | null {
  if (a.name.trim().length < 2) return 'Enter the recipient name.'
  if (a.line1.trim().length < 3) return 'Enter the street address.'
  if (!a.city.trim()) return 'Enter the city.'
  if (!a.state.trim()) return 'Select the state.'
  if (!/^\d{6}$/.test(a.pincode.trim())) return 'Enter a 6-digit PIN code.'
  if (!/^\+?\d[\d\s-]{8,13}$/.test(a.phone.trim())) return 'Enter a valid phone number.'
  return null
}

/**
 * Turn a cart into a pending order, hold the stock, and open a Razorpay order for it.
 * Everything is priced again here; the browser only supplies ids, quantities and codes.
 */
export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL.test(email)) throw new Error('Enter a valid email address.')
  const addressError = validateAddress(input.address)
  if (addressError) throw new Error(addressError)

  await releaseStaleOrders().catch((e) => console.error('releaseStaleOrders', e))

  const address = { ...input.address, country: input.address.country || 'India' }
  const price = await priceCart(input.lines, { code: input.code, giftCardCode: input.giftCardCode, state: address.state, country: address.country, email, customerId: input.customerId })
  if (price.lines.length === 0) throw new Error('Your cart is empty.')
  if (price.notices.some((n) => n.startsWith('We do not ship'))) throw new Error('We do not ship to that address yet.')

  const order = await db.$transaction(async (tx) => {
    const locationId = await defaultLocationId(tx)

    // Hold the stock first: the conditional update is what stops two shoppers taking the last unit.
    const variants = await tx.productVariant.findMany({ where: { id: { in: price.lines.map((l) => l.variantId) } } })
    const policy = new Map(variants.map((v) => [v.id, v.trackInventory && !v.continueSelling]))
    for (const l of price.lines) {
      if (!policy.get(l.variantId)) continue
      const held = await tx.inventoryLevel.updateMany({
        where: { variantId: l.variantId, locationId, available: { gte: l.quantity } },
        data: { available: { decrement: l.quantity } },
      })
      if (held.count === 0) throw new Error(`${l.title} just sold out. Please review your cart.`)
    }

    const name = address.name.trim().split(/\s+/)
    const customer = await tx.customer.upsert({
      where: { email },
      update: { phone: address.phone, ...(input.acceptsMarketing ? { acceptsMarketing: true } : {}) },
      create: { email, phone: address.phone, firstName: name[0] ?? '', lastName: name.slice(1).join(' '), acceptsMarketing: Boolean(input.acceptsMarketing) },
    })

    await rememberContact(tx, customer.id, address)

    const gift = price.giftCard > 0 && input.giftCardCode
      ? await tx.giftCard.findFirst({ where: { code: { equals: input.giftCardCode.trim(), mode: 'insensitive' }, active: true } })
      : null
    if (gift) {
      const debited = await tx.giftCard.updateMany({ where: { id: gift.id, balance: { gte: price.giftCard } }, data: { balance: { decrement: price.giftCard } } })
      if (debited.count === 0) throw new Error('That gift card no longer has enough balance.')
    }
    if (price.appliedDiscountIds.length) await tx.discount.updateMany({ where: { id: { in: price.appliedDiscountIds } }, data: { usageCount: { increment: 1 } } })

    const created = await tx.order.create({
      data: {
        isDraft: false,
        channel: 'online_store',
        customerId: input.customerId ?? customer.id,
        email,
        phone: address.phone,
        status: 'open',
        financialStatus: 'pending',
        subtotal: price.subtotal,
        discountTotal: price.discount,
        shippingTotal: price.shipping,
        taxTotal: price.tax,
        total: price.total + price.giftCard,
        discountCode: price.appliedCodes.join(', ') || null,
        discountIds: price.appliedDiscountIds,
        giftCardCode: gift?.code ?? null,
        giftCardAmount: price.giftCard,
        note: input.note?.slice(0, 500) ?? '',
        shippingAddress: address as unknown as Prisma.InputJsonValue,
        billingAddress: address as unknown as Prisma.InputJsonValue,
        shippingMethod: price.shippingName,
        paymentGateway: 'razorpay',
        items: {
          create: price.lines.map((l) => ({
            variantId: l.variantId, productId: l.productId, title: l.title, variantTitle: l.variantTitle, sku: l.sku,
            imageUrl: l.imageUrl, quantity: l.quantity, price: l.price, discount: l.discount,
          })),
        },
        events: { create: { type: 'created', message: 'Order placed on the online store. Awaiting payment.' } },
      },
    })

    for (const l of price.lines) {
      if (!policy.get(l.variantId)) continue
      await tx.inventoryAdjustment.create({ data: { variantId: l.variantId, locationId, delta: -l.quantity, reason: 'sold', reference: `#${created.number}` } })
    }
    return created
  })

  const label = `#${order.number}`
  const toCharge = price.total

  // A gift card can cover the whole order: nothing to charge.
  if (toCharge <= 0) {
    await settlePayment(order.id, { paymentId: null, gateway: 'gift_card' })
    return { orderId: order.id, label, amount: 0, gatewayOrderId: null, keyId: '', devMode: false }
  }

  if (!razorpayConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      await abandonOrder(order.id, 'Payments are not configured.')
      throw new Error('Payments are not available right now. Please try again later.')
    }
    const fake = `order_dev_${order.id}`
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: fake } })
    return { orderId: order.id, label, amount: toCharge, gatewayOrderId: fake, keyId: '', devMode: true }
  }

  const gateway = await createGatewayOrder(toCharge, label)
  if (!gateway.ok || !gateway.id) {
    await abandonOrder(order.id, gateway.error ?? 'Gateway error')
    throw new Error('We could not start the payment. Please try again.')
  }
  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: gateway.id } })
  return { orderId: order.id, label, amount: toCharge, gatewayOrderId: gateway.id, keyId: razorpayKeyId(), devMode: false }
}

/** Checkout callback from the browser: verify the signature, then settle. */
export async function confirmPayment(orderId: string, p: { razorpayOrderId: string; paymentId: string; signature: string }) {
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || order.razorpayOrderId !== p.razorpayOrderId) throw new Error('This payment does not match the order.')
  if (!verifyPaymentSignature(p.razorpayOrderId, p.paymentId, p.signature)) throw new Error('We could not verify the payment.')
  await settlePayment(orderId, { paymentId: p.paymentId, gateway: 'razorpay' })
}

/** Development only, and only while Razorpay keys are absent. */
export async function confirmDevPayment(orderId: string) {
  if (process.env.NODE_ENV === 'production' || razorpayConfigured()) throw new Error('Not available.')
  await settlePayment(orderId, { paymentId: `pay_dev_${Date.now()}`, gateway: 'razorpay' })
}

/** Webhook path: the gateway says this Razorpay order was paid. */
export async function settleByGatewayOrder(razorpayOrderId: string, paymentId: string) {
  const order = await db.order.findFirst({ where: { razorpayOrderId } })
  if (order) await settlePayment(order.id, { paymentId, gateway: 'razorpay' })
}

/** Idempotent: callback and webhook can both arrive. */
export async function settlePayment(orderId: string, p: { paymentId: string | null; gateway: string }) {
  const settled = await db.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } })
    if (!o) throw new Error('Order not found.')
    if (o.financialStatus === 'paid') return null
    // Paid after we released the hold: the shopper's money is real, so reopen the order.
    await tx.order.update({
      where: { id: orderId },
      data: { financialStatus: 'paid', status: 'open', cancelledAt: null, cancelReason: null, paidAt: new Date(), razorpayPaymentId: p.paymentId, paymentGateway: p.gateway },
    })
    await tx.orderEvent.create({ data: { orderId, type: 'paid', message: p.paymentId ? `Payment received (${p.paymentId}).` : 'Paid in full with a gift card.' } })
    await tx.adminNotification.create({ data: { title: `New order #${o.number}`, body: `${formatMoney(o.total)} from ${o.email ?? 'a customer'}`, href: `/orders/${o.id}` } })
    if (o.email) await tx.abandonedCheckout.updateMany({ where: { email: o.email, recoveredAt: null }, data: { recoveredAt: new Date() } })
    return o
  })
  if (settled) await sendOrderEmails(orderId)
}

async function sendOrderEmails(orderId: string) {
  const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!o?.email) return
  const rows = o.items.map((i) => `<tr><td>${esc(i.title)}${i.variantTitle ? ` (${esc(i.variantTitle)})` : ''} × ${i.quantity}</td><td align="right">${formatMoney(i.price * i.quantity - i.discount)}</td></tr>`).join('')
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto"><h1 style="font-family:Impact,sans-serif">THANK YOU. IT'S ORDERED.</h1><p>Order #${o.number} is confirmed. We'll email you again when it ships.</p><table width="100%">${rows}<tr><td>Shipping</td><td align="right">${formatMoney(o.shippingTotal)}</td></tr><tr><td><b>Total</b></td><td align="right"><b>${formatMoney(o.total)}</b></td></tr></table></div>`
  const template = await db.notificationTemplate.findUnique({ where: { key: 'order_confirmation' } })
  if (template && !template.enabled) return
  await sendEmail({ to: o.email, subject: (template?.subject || 'Order #{{order}} confirmed').replace('{{order}}', String(o.number)), html })
  const staff = process.env.STAFF_NOTIFY_EMAIL
  if (staff) await sendEmail({ to: staff, subject: `New order #${o.number} (${formatMoney(o.total)})`, html })
}

/** Release a pending order: stock back on the shelf, gift card and code usage returned. */
async function abandonOrder(orderId: string, reason: string) {
  const o = await db.order.findUnique({ where: { id: orderId } })
  if (!o || o.financialStatus !== 'pending' || o.status === 'cancelled') return
  await cancelOrder(orderId, { reason, restock: true, refund: false })
  if (o.giftCardCode && o.giftCardAmount > 0) {
    await db.giftCard.updateMany({ where: { code: o.giftCardCode }, data: { balance: { increment: o.giftCardAmount } } })
  }
  if (o.discountIds.length) await db.discount.updateMany({ where: { id: { in: o.discountIds }, usageCount: { gt: 0 } }, data: { usageCount: { decrement: 1 } } })
  else if (o.discountCode) await db.discount.updateMany({ where: { code: { equals: o.discountCode, mode: 'insensitive' }, usageCount: { gt: 0 } }, data: { usageCount: { decrement: 1 } } })
}

/** Cancel online orders that never got paid within the hold window. */
export async function releaseStaleOrders(minutes = HOLD_MINUTES) {
  const cutoff = new Date(Date.now() - minutes * 60_000)
  const stale = await db.order.findMany({
    where: { isDraft: false, channel: 'online_store', status: 'open', financialStatus: 'pending', paymentGateway: { in: ['razorpay', 'gift_card'] }, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  })
  for (const s of stale) await abandonOrder(s.id, 'Payment not completed in time').catch((e) => console.error('abandonOrder', e))
  return stale.length
}

/** Save the cart of someone who typed an email but did not pay, so admin can see and recover it. */
export async function captureAbandonedCheckout(p: { email: string; phone?: string; lines: CartLineInput[] }) {
  const email = p.email.trim().toLowerCase()
  if (!EMAIL.test(email)) return
  const price = await priceCart(p.lines)
  if (!price.lines.length) return
  const cartItems = price.lines.map((l) => ({ variantId: l.variantId, title: l.title, variantTitle: l.variantTitle, quantity: l.quantity, price: l.price })) as unknown as Prisma.InputJsonValue
  const existing = await db.abandonedCheckout.findFirst({ where: { email, recoveredAt: null }, orderBy: { createdAt: 'desc' } })
  if (existing) await db.abandonedCheckout.update({ where: { id: existing.id }, data: { cartItems, subtotal: price.subtotal, phone: p.phone || existing.phone } })
  else await db.abandonedCheckout.create({ data: { email, phone: p.phone || null, cartItems, subtotal: price.subtotal } })
}
