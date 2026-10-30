import { db, type Prisma } from '@radestreet/db'
import { sweepStockAlertsSoon } from './stock-alerts'

type Tx = Prisma.TransactionClient

export async function defaultLocationId(tx: Tx | typeof db = db): Promise<string> {
  const loc =
    (await tx.location.findFirst({ where: { isDefault: true, active: true } })) ??
    (await tx.location.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } }))
  if (!loc) throw new Error('No active location. Add one in Settings > Locations.')
  return loc.id
}

/** Move a variant's stock at one location and leave a history row. The only writer of `available`. */
export async function adjustInventory(
  tx: Tx,
  p: { variantId: string; locationId: string; delta: number; reason: string; reference?: string; actor?: string },
) {
  await tx.inventoryLevel.upsert({
    where: { variantId_locationId: { variantId: p.variantId, locationId: p.locationId } },
    update: { available: { increment: p.delta } },
    create: { variantId: p.variantId, locationId: p.locationId, available: p.delta },
  })
  await tx.inventoryAdjustment.create({
    data: {
      variantId: p.variantId,
      locationId: p.locationId,
      delta: p.delta,
      reason: p.reason,
      reference: p.reference,
      actor: p.actor,
    },
  })
}

/** Set stock to an exact count (a stock take): records the difference. */
export async function setAvailable(p: { variantId: string; locationId: string; quantity: number; actor?: string }) {
  if (!Number.isInteger(p.quantity)) throw new Error('Quantity must be a whole number.')
  await db.$transaction(async (tx) => {
    const current = await tx.inventoryLevel.findUnique({
      where: { variantId_locationId: { variantId: p.variantId, locationId: p.locationId } },
    })
    const delta = p.quantity - (current?.available ?? 0)
    if (delta === 0) return
    await adjustInventory(tx, { ...p, delta, reason: 'correction' })
  })
  sweepStockAlertsSoon()
}

// ───────────────────────────── Transfers ─────────────────────────────

/** Draft -> in transit: stock leaves the origin now and shows as incoming at the destination. */
export async function shipTransfer(id: string, actor?: string) {
  await db.$transaction(async (tx) => {
    const t = await tx.transfer.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (t.status !== 'draft') throw new Error('Only a draft transfer can be marked in transit.')
    if (!t.items.length) throw new Error('Add at least one item first.')
    if (t.originId === t.destinationId) throw new Error('Origin and destination must differ.')
    for (const i of t.items) {
      await adjustInventory(tx, {
        variantId: i.variantId, locationId: t.originId, delta: -i.quantity,
        reason: 'transfer_out', reference: `T${t.number}`, actor,
      })
      await tx.inventoryLevel.upsert({
        where: { variantId_locationId: { variantId: i.variantId, locationId: t.destinationId } },
        update: { incoming: { increment: i.quantity } },
        create: { variantId: i.variantId, locationId: t.destinationId, incoming: i.quantity },
      })
    }
    await tx.transfer.update({ where: { id }, data: { status: 'in_transit' } })
  })
}

/** Receive every outstanding unit of an in-transit transfer. */
export async function receiveTransfer(id: string, actor?: string) {
  await db.$transaction(async (tx) => {
    const t = await tx.transfer.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (t.status !== 'in_transit') throw new Error('Only an in-transit transfer can be received.')
    for (const i of t.items) {
      const outstanding = i.quantity - i.received
      if (outstanding <= 0) continue
      await adjustInventory(tx, {
        variantId: i.variantId, locationId: t.destinationId, delta: outstanding,
        reason: 'transfer_in', reference: `T${t.number}`, actor,
      })
      await tx.inventoryLevel.update({
        where: { variantId_locationId: { variantId: i.variantId, locationId: t.destinationId } },
        data: { incoming: { decrement: outstanding } },
      })
      await tx.transferItem.update({ where: { id: i.id }, data: { received: i.quantity } })
    }
    await tx.transfer.update({ where: { id }, data: { status: 'received' } })
  })
  sweepStockAlertsSoon()
}

/** Cancel a transfer; if it was in transit the stock returns to the origin. */
export async function cancelTransfer(id: string, actor?: string) {
  await db.$transaction(async (tx) => {
    const t = await tx.transfer.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (t.status === 'received' || t.status === 'cancelled') throw new Error('This transfer can no longer be cancelled.')
    if (t.status === 'in_transit') {
      for (const i of t.items) {
        const outstanding = i.quantity - i.received
        await adjustInventory(tx, {
          variantId: i.variantId, locationId: t.originId, delta: outstanding,
          reason: 'transfer_in', reference: `T${t.number} cancelled`, actor,
        })
        await tx.inventoryLevel.update({
          where: { variantId_locationId: { variantId: i.variantId, locationId: t.destinationId } },
          data: { incoming: { decrement: outstanding } },
        })
      }
    }
    await tx.transfer.update({ where: { id }, data: { status: 'cancelled' } })
  })
  sweepStockAlertsSoon()
}

// ───────────────────────────── Purchase orders ─────────────────────────────

/** Draft -> ordered: the quantities now count as incoming stock. */
export async function placePurchaseOrder(id: string) {
  await db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (po.status !== 'draft') throw new Error('Only a draft purchase order can be placed.')
    if (!po.items.length) throw new Error('Add at least one item first.')
    for (const i of po.items) {
      await tx.inventoryLevel.upsert({
        where: { variantId_locationId: { variantId: i.variantId, locationId: po.locationId } },
        update: { incoming: { increment: i.quantity } },
        create: { variantId: i.variantId, locationId: po.locationId, incoming: i.quantity },
      })
    }
    await tx.purchaseOrder.update({ where: { id }, data: { status: 'ordered' } })
  })
}

/** Receive units. `quantities` maps item id -> units arriving now (capped at what is outstanding). */
export async function receivePurchaseOrder(id: string, quantities: Record<string, number>, actor?: string) {
  await db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (po.status !== 'ordered' && po.status !== 'partial') throw new Error('Place the purchase order before receiving.')
    for (const i of po.items) {
      const qty = Math.min(Math.max(0, Math.floor(quantities[i.id] ?? 0)), i.quantity - i.received)
      if (!qty) continue
      await adjustInventory(tx, {
        variantId: i.variantId, locationId: po.locationId, delta: qty,
        reason: 'received', reference: `PO${po.number}`, actor,
      })
      await tx.inventoryLevel.update({
        where: { variantId_locationId: { variantId: i.variantId, locationId: po.locationId } },
        data: { incoming: { decrement: qty } },
      })
      await tx.purchaseOrderItem.update({ where: { id: i.id }, data: { received: { increment: qty } } })
    }
    const after = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } })
    const all = after.every((i) => i.received >= i.quantity)
    const some = after.some((i) => i.received > 0)
    await tx.purchaseOrder.update({ where: { id }, data: { status: all ? 'received' : some ? 'partial' : po.status } })
  })
  sweepStockAlertsSoon()
}

export async function cancelPurchaseOrder(id: string) {
  await db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { items: true } })
    if (po.status === 'received' || po.status === 'closed' || po.status === 'cancelled') {
      throw new Error('This purchase order can no longer be cancelled.')
    }
    if (po.status === 'ordered' || po.status === 'partial') {
      for (const i of po.items) {
        const outstanding = i.quantity - i.received
        if (outstanding > 0) {
          await tx.inventoryLevel.update({
            where: { variantId_locationId: { variantId: i.variantId, locationId: po.locationId } },
            data: { incoming: { decrement: outstanding } },
          })
        }
      }
    }
    await tx.purchaseOrder.update({ where: { id }, data: { status: 'cancelled' } })
  })
}
