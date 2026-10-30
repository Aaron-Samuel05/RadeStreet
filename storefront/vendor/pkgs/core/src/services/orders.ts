import { sweepStockAlertsSoon } from './stock-alerts'
import { db, type Prisma } from '@radestreet/db'
import { refundPayment } from '../razorpay'
import { adjustInventory, defaultLocationId } from './inventory'

type Tx = Prisma.TransactionClient

export function orderLabel(o: { number: number; isDraft: boolean }): string {
  return o.isDraft ? `#D${o.number}` : `#${o.number}`
}

async function log(tx: Tx, orderId: string, type: string, message: string, actor?: string) {
  await tx.orderEvent.create({ data: { orderId, type, message, actor } })
}

// ───────────────────────────── Create ─────────────────────────────

export interface DraftInput {
  customerId?: string | null
  email?: string | null
  phone?: string | null
  note?: string
  discountTotal?: number
  shippingTotal?: number
  shippingAddress?: Prisma.InputJsonValue
  items: { variantId: string; quantity: number; price?: number }[]
}

/** A draft holds no stock and counts in no report until it is completed. */
export async function createDraftOrder(input: DraftInput, actor?: string) {
  const lines = input.items.filter((i) => i.variantId && i.quantity > 0)
  if (!lines.length) throw new Error('Add at least one product.')

  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  })
  const byId = new Map(variants.map((v) => [v.id, v]))

  const items = lines.map((l) => {
    const v = byId.get(l.variantId)
    if (!v) throw new Error('A selected product no longer exists.')
    return {
      variantId: v.id,
      productId: v.productId,
      title: v.product.title,
      variantTitle: v.title === 'Default Title' ? '' : v.title,
      sku: v.sku ?? '',
      imageUrl: v.product.images[0]?.url ?? null,
      quantity: l.quantity,
      price: l.price ?? v.price,
    }
  })

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountTotal = Math.min(input.discountTotal ?? 0, subtotal)
  const shippingTotal = input.shippingTotal ?? 0
  const total = subtotal - discountTotal + shippingTotal

  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        isDraft: true,
        channel: 'draft_order',
        customerId: input.customerId ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        note: input.note ?? '',
        subtotal, discountTotal, shippingTotal, total,
        shippingAddress: input.shippingAddress,
        items: { create: items },
      },
    })
    await log(tx, order.id, 'draft_created', 'Draft order created.', actor)
    return order
  })
}

/** Turn a draft into a real order: stock is committed and, optionally, payment recorded. */
export async function completeDraft(id: string, opts: { paid: boolean; actor?: string }) {
  return db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (!o.isDraft) throw new Error('This order is already complete.')
    const locationId = await defaultLocationId(tx)
    for (const i of o.items) {
      if (!i.variantId) continue
      const v = await tx.productVariant.findUnique({ where: { id: i.variantId } })
      if (v?.trackInventory === false) continue
      await adjustInventory(tx, {
        variantId: i.variantId, locationId, delta: -i.quantity,
        reason: 'sold', reference: `#${o.number}`, actor: opts.actor,
      })
    }
    const updated = await tx.order.update({
      where: { id },
      data: {
        isDraft: false,
        createdAt: new Date(),
        ...(opts.paid ? { financialStatus: 'paid', paidAt: new Date(), paymentGateway: 'manual' } : {}),
      },
    })
    await log(tx, id, 'created', 'Order created from draft.', opts.actor)
    if (opts.paid) await log(tx, id, 'paid', 'Payment recorded manually.', opts.actor)
    return updated
  })
}

export async function deleteDraft(id: string) {
  const o = await db.order.findUniqueOrThrow({ where: { id } })
  if (!o.isDraft) throw new Error('Only drafts can be deleted.')
  await db.order.delete({ where: { id } })
}

// ───────────────────────────── Payment / fulfilment ─────────────────────────────

export async function markPaid(id: string, actor?: string) {
  await db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id } })
    if (o.isDraft || o.status === 'cancelled') throw new Error('This order cannot be marked as paid.')
    if (o.financialStatus !== 'pending') throw new Error('This order is not awaiting payment.')
    await tx.order.update({
      where: { id },
      data: { financialStatus: 'paid', paidAt: new Date(), paymentGateway: o.paymentGateway ?? 'manual' },
    })
    await log(tx, id, 'paid', 'Payment marked as received.', actor)
  })
}

export interface FulfillInput {
  /** itemId -> quantity; omitted means everything outstanding. */
  quantities?: Record<string, number>
  trackingCompany?: string
  trackingNumber?: string
  trackingUrl?: string
}

export async function fulfillOrder(id: string, input: FulfillInput, actor?: string) {
  await db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (o.isDraft || o.status === 'cancelled') throw new Error('This order cannot be fulfilled.')
    const shipped: { itemId: string; quantity: number }[] = []
    for (const i of o.items) {
      const outstanding = i.quantity - i.refundedQty - i.fulfilledQty
      const want = input.quantities ? Math.floor(input.quantities[i.id] ?? 0) : outstanding
      const qty = Math.min(Math.max(want, 0), outstanding)
      if (!qty) continue
      shipped.push({ itemId: i.id, quantity: qty })
      await tx.orderItem.update({ where: { id: i.id }, data: { fulfilledQty: { increment: qty } } })
    }
    if (!shipped.length) throw new Error('Nothing to fulfil.')
    await tx.fulfillment.create({
      data: {
        orderId: id,
        trackingCompany: input.trackingCompany ?? '',
        trackingNumber: input.trackingNumber ?? '',
        trackingUrl: input.trackingUrl ?? '',
        items: shipped,
      },
    })
    const after = await tx.orderItem.findMany({ where: { orderId: id } })
    const done = after.every((i) => i.fulfilledQty + i.refundedQty >= i.quantity)
    await tx.order.update({ where: { id }, data: { fulfillmentStatus: done ? 'fulfilled' : 'partial' } })
    const count = shipped.reduce((s, x) => s + x.quantity, 0)
    await log(tx, id, 'fulfilled', `Fulfilled ${count} item${count === 1 ? '' : 's'}${input.trackingNumber ? ` (tracking ${input.trackingNumber})` : ''}.`, actor)
  })
}

// ───────────────────────────── Cancel / refund ─────────────────────────────

async function restock(tx: Tx, order: { id: string; number: number }, items: { variantId: string | null; qty: number }[], actor?: string) {
  const locationId = await defaultLocationId(tx)
  for (const i of items) {
    if (!i.variantId || i.qty <= 0) continue
    const v = await tx.productVariant.findUnique({ where: { id: i.variantId } })
    if (v?.trackInventory === false) continue
    await adjustInventory(tx, { variantId: i.variantId, locationId, delta: i.qty, reason: 'restock', reference: `#${order.number}`, actor })
  }
}

export async function cancelOrder(id: string, opts: { reason: string; restock: boolean; refund: boolean; actor?: string }) {
  let refundAmount = 0
  let paymentId: string | null = null

  await db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true, refunds: true } })
    if (o.isDraft) throw new Error('Delete the draft instead.')
    if (o.status === 'cancelled') throw new Error('This order is already cancelled.')
    if (o.fulfillmentStatus === 'fulfilled') throw new Error('A fulfilled order cannot be cancelled. Refund it instead.')

    if (opts.restock) {
      await restock(tx, o, o.items.map((i) => ({ variantId: i.variantId, qty: i.quantity - i.fulfilledQty - i.refundedQty })), opts.actor)
    }
    const alreadyRefunded = o.refunds.reduce((s, r) => s + r.amount, 0)
    if (opts.refund && o.financialStatus === 'paid') refundAmount = o.total - alreadyRefunded
    paymentId = o.razorpayPaymentId

    await tx.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: opts.reason,
        financialStatus: refundAmount > 0 ? 'refunded' : o.financialStatus === 'pending' ? 'voided' : o.financialStatus,
      },
    })
    await log(tx, id, 'cancelled', `Order cancelled (${opts.reason || 'no reason given'}).`, opts.actor)
  })
  if (opts.restock) sweepStockAlertsSoon()

  if (refundAmount > 0) await recordRefund(id, { amount: refundAmount, reason: 'Order cancelled', restock: false, paymentId, actor: opts.actor })
}

/** Refund an amount, optionally restocking items. Hits Razorpay when the order was paid through it. */
export async function refundOrder(
  id: string,
  opts: { amount: number; reason: string; restock: boolean; itemQuantities?: Record<string, number>; actor?: string },
) {
  const o = await db.order.findUniqueOrThrow({ where: { id }, include: { items: true, refunds: true } })
  if (o.isDraft || o.financialStatus === 'pending' || o.financialStatus === 'voided') throw new Error('This order has no payment to refund.')
  const refunded = o.refunds.reduce((s, r) => s + r.amount, 0)
  if (opts.amount <= 0) throw new Error('Enter an amount to refund.')
  if (opts.amount > o.total - refunded) throw new Error('That is more than the remaining paid amount.')

  const restockItems = o.items.map((i) => ({
    variantId: i.variantId,
    id: i.id,
    qty: Math.min(Math.max(Math.floor(opts.itemQuantities?.[i.id] ?? 0), 0), i.quantity - i.refundedQty),
  }))
  await recordRefund(id, { amount: opts.amount, reason: opts.reason, restock: opts.restock, paymentId: o.razorpayPaymentId, actor: opts.actor, items: restockItems })
}

async function recordRefund(
  id: string,
  p: { amount: number; reason: string; restock: boolean; paymentId: string | null; actor?: string; items?: { id: string; variantId: string | null; qty: number }[] },
) {
  // The gateway call sits outside the transaction: it cannot be rolled back.
  let razorpayRefundId: string | undefined
  let gatewayNote = ''
  if (p.paymentId) {
    const r = await refundPayment(p.paymentId, p.amount)
    if (r.ok) razorpayRefundId = r.refundId
    else gatewayNote = ` Razorpay refund failed (${r.error}); refund it from the Razorpay dashboard.`
  }

  await db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id }, include: { refunds: true } })
    await tx.refund.create({ data: { orderId: id, amount: p.amount, reason: p.reason, restock: p.restock, razorpayRefundId } })
    const totalRefunded = o.refunds.reduce((s, r) => s + r.amount, 0) + p.amount
    await tx.order.update({
      where: { id },
      data: { financialStatus: totalRefunded >= o.total ? 'refunded' : 'partially_refunded' },
    })
    if (p.items) {
      for (const i of p.items) {
        if (i.qty > 0) await tx.orderItem.update({ where: { id: i.id }, data: { refundedQty: { increment: i.qty } } })
      }
      if (p.restock) await restock(tx, o, p.items.map((i) => ({ variantId: i.variantId, qty: i.qty })), p.actor)
    }
    await log(tx, id, 'refunded', `Refunded ${(p.amount / 100).toFixed(2)} INR${p.reason ? ` (${p.reason})` : ''}.${gatewayNote}`, p.actor)
  })
  if (p.restock) sweepStockAlertsSoon()
}

// ───────────────────────────── Small mutations ─────────────────────────────

export async function setArchived(id: string, archived: boolean, actor?: string) {
  await db.$transaction(async (tx) => {
    const o = await tx.order.findUniqueOrThrow({ where: { id } })
    if (o.status === 'cancelled') throw new Error('Cancelled orders cannot be archived.')
    await tx.order.update({ where: { id }, data: { status: archived ? 'archived' : 'open' } })
    await log(tx, id, archived ? 'archived' : 'unarchived', archived ? 'Order archived.' : 'Order restored.', actor)
  })
}

export async function addOrderNote(id: string, note: string, actor?: string) {
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { note } })
    await log(tx, id, 'note', 'Order note updated.', actor)
  })
}

export async function addOrderComment(id: string, message: string, actor?: string) {
  if (!message.trim()) throw new Error('Write a comment first.')
  await db.orderEvent.create({ data: { orderId: id, type: 'comment', message: message.trim(), actor } })
}
