/**
 * The pure half of previews: which sections can be previewed and what a draft id looks like.
 * No database import, so the storefront's request proxy can use it.
 */
export const PREVIEW_SECTIONS = ['header', 'footer', 'home', 'navigation', 'hero'] as const
export type PreviewSection = (typeof PREVIEW_SECTIONS)[number]

const ID = /^[A-Za-z0-9_-]{20,64}$/

export const isPreviewId = (v: unknown): v is string => typeof v === 'string' && ID.test(v)
