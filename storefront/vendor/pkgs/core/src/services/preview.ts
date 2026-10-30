import { randomBytes } from 'node:crypto'
import { db, type Prisma } from '@radestreet/db'
import { PREVIEW_SECTIONS, isPreviewId, type PreviewSection } from '../preview-ids'

/**
 * Previews: the admin saves what is in an edit form, unsaved, as a short-lived draft; the storefront
 * renders the real site with that draft laid over the live data. The draft id is the only key, so it
 * is random, expires, and is never listed anywhere.
 */

const TTL_MS = 2 * 60 * 60_000

/** Create a draft, or replace the one in `id` (and give it a fresh two hours). Returns its id. */
export async function saveDraft(id: string | null, section: PreviewSection, payload: Prisma.InputJsonObject): Promise<string> {
  const now = new Date()
  await db.previewDraft.deleteMany({ where: { expiresAt: { lt: now } } })
  const data = { section, payload, expiresAt: new Date(now.getTime() + TTL_MS) }

  if (isPreviewId(id)) {
    const updated = await db.previewDraft.updateMany({ where: { id, section }, data })
    if (updated.count) return id
  }
  const fresh = randomBytes(18).toString('base64url')
  await db.previewDraft.create({ data: { id: fresh, ...data } })
  return fresh
}

export interface Draft {
  section: PreviewSection
  payload: Record<string, unknown>
}

/** The live draft for `id`, or null if it is unknown or expired. */
export async function readDraft(id: string | null | undefined): Promise<Draft | null> {
  if (!isPreviewId(id)) return null
  const row = await db.previewDraft.findFirst({ where: { id, expiresAt: { gt: new Date() } } })
  if (!row || !(PREVIEW_SECTIONS as readonly string[]).includes(row.section)) return null
  const payload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? (row.payload as Record<string, unknown>) : {}
  return { section: row.section as PreviewSection, payload }
}
