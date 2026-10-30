import 'server-only'
import { cache } from 'react'
import { db, type MenuItem } from '@radestreet/db'

export interface StorePrefs {
  title: string
  metaDescription: string
  announcement: string
  instagram: string
  storeName: string
  email: string
  phone: string
}

const DEFAULTS: StorePrefs = {
  title: 'Radestreet',
  metaDescription: 'Surprise fashion drops. 1 price. 0 regrets.',
  announcement: 'FREE SHIPPING OVER ₹1499',
  instagram: '',
  storeName: 'Radestreet',
  email: '',
  phone: '',
}

export const getPrefs = cache(async (): Promise<StorePrefs> => {
  const rows = await db.setting.findMany({ where: { key: { in: ['general', 'online-store-preferences'] } } })
  const by = Object.fromEntries(rows.map((r) => [r.key, r.value as Record<string, unknown>]))
  const g = by.general ?? {}
  const p = by['online-store-preferences'] ?? {}
  const s = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v : d)
  return {
    title: s(p.title, DEFAULTS.title),
    metaDescription: s(p.metaDescription, DEFAULTS.metaDescription),
    announcement: s(p.announcement, DEFAULTS.announcement),
    instagram: s(p.instagram, ''),
    storeName: s(g.storeName, DEFAULTS.storeName),
    email: s(g.email, ''),
    phone: s(g.phone, ''),
  }
})

export interface SiteContent {
  announcementOn: boolean; announcement: string; logoText: string
  newsletterOn: boolean; newsletterTitle: string; newsletterText: string; tagline: string
  instagram: string; facebook: string; youtube: string; x: string; showContact: boolean; copyright: string
  dropEyebrow: string; dropTitle: string; dropCount: number
  marqueeOn: boolean; marquee: string[]
  stepsOn: boolean; stepsTitle: string; steps: [string, string][]
  restockOn: boolean; restockEyebrow: string; restockTitle: string; restockText: string; restockButton: string; restockLink: string
}

/** The settings that normally come from the admin. */
const SETTINGS_KEY = { header: 'storefront-header', footer: 'storefront-footer', home: 'storefront-home' } as const

/** Static defaults are used when the demo has no admin/database connection. */
export const getSite = cache(async (): Promise<SiteContent> => {
  const prefs = await getPrefs()
  const rows = await db.setting.findMany({ where: { key: { in: Object.values(SETTINGS_KEY) } } })
  const by = Object.fromEntries(rows.map((r) => [r.key, r.value as Record<string, unknown>]))
  const h = by['storefront-header'] ?? {}, f = by['storefront-footer'] ?? {}, m = by['storefront-home'] ?? {}
  const t = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v.trim() : d)
  const on = (v: unknown) => v !== false
  const steps: [string, string][] = [
    ['Pick a Category', 'Men, women or kids. Tell us the lane you live in.'],
    ['Select Your Bundle', 'Choose your box size. One price, no peeking at the contents.'],
    ['Unbox It', 'Open it up and see what you got. The reveal is the best part.'],
    ['Dress Up The Fit', 'Wear it, mix it, own it. Zero regrets.'],
  ]
  const custom = steps.map(([a, b], i): [string, string] => [t(m[`step${i + 1}Title`], a), t(m[`step${i + 1}Text`], b)])
  const slogans = typeof m.marquee === 'string' ? m.marquee.split('\n').map((x: string) => x.trim()).filter(Boolean) : []
  return {
    announcementOn: on(h.announcementOn), announcement: t(h.announcement, prefs.announcement), logoText: t(h.logoText, prefs.storeName),
    newsletterOn: on(f.newsletterOn),
    newsletterTitle: t(f.newsletterTitle, `Join the ${prefs.storeName === 'Radestreet' ? 'Rade Street' : prefs.storeName} Family`),
    newsletterText: t(f.newsletterText, 'Early access to every Monday drop. No spam, just heat.'),
    tagline: t(f.tagline, 'Surprise fashion drops. 1 price. 0 regrets.'),
    instagram: t(f.instagram, prefs.instagram), facebook: t(f.facebook, ''), youtube: t(f.youtube, ''), x: t(f.x, ''),
    showContact: on(f.showContact), copyright: t(f.copyright, 'All rights reserved.'),
    dropEyebrow: t(m.dropEyebrow, 'Fresh this week'), dropTitle: t(m.dropTitle, 'The drop'),
    dropCount: Math.min(24, Math.max(1, Number(m.dropCount) || 8)),
    marqueeOn: on(m.marqueeOn),
    marquee: slogans.length ? slogans : ['Surprise fashion drops', '1 price', '0 regrets', 'New drops every Monday', 'Open the branded bundle'],
    stepsOn: on(m.stepsOn), stepsTitle: t(m.stepsTitle, 'How it works'), steps: custom,
    restockOn: on(m.restockOn), restockEyebrow: t(m.restockEyebrow, 'Missed it?'), restockTitle: t(m.restockTitle, 'Restock drop'),
    restockText: t(m.restockText, 'Sold-out boxes come back on a short leash. Grab the restock before it vanishes again.'),
    restockButton: t(m.restockButton, 'Shop the restock'), restockLink: t(m.restockLink, '/collections/all'),
  }
})

export const getMenu = cache(async (handle: string): Promise<MenuItem[]> => {
  const menu = await db.menu.findUnique({ where: { handle }, include: { items: { orderBy: { position: 'asc' } } } })
  return (menu?.items ?? []).map(({ id, menuId, label, url, position, parentId }) => ({ id, menuId, label, url, position, parentId }))
})

export interface HeroSlideView {
  id: string; headline: string; subline: string; imageUrl: string; mobileUrl: string | null; alt: string; ctaLabel: string; ctaHref: string
}

/** Active banner slides, ordered by position. The home page has a local fallback banner for the demo. */
export const getHeroSlides = cache(async (): Promise<{ slides: HeroSlideView[]; previewIndex?: number }> => {
  const view = (s: Record<string, any>): HeroSlideView => ({
    id: s.id, headline: s.headline, subline: s.subline, imageUrl: s.imageUrl, mobileUrl: s.mobileUrl, alt: s.alt, ctaLabel: s.ctaLabel, ctaHref: s.ctaHref,
  })
  const live = await db.heroSlide.findMany({ where: { active: true }, orderBy: { position: 'asc' } })
  return { slides: live.map(view) }
})

export const getCustomer = cache(async () => {
  return db.customer.findUnique({ where: { id: 'demo-disabled' } })
})

/** The ids of the products the signed-in customer has saved, so cards can show a filled heart. Empty for guests. */
export const getWishlistIds = cache(async (): Promise<Set<string>> => {
  return new Set()
})

/** Collections that only exist for Shopify plumbing; never offered as a category or a browse link. */
export const HIDDEN_COLLECTIONS = ['frontpage', 'all-mystery-boxes', 'all']

const cardInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 2 },
  variants: { orderBy: { position: 'asc' as const }, include: { levels: { select: { available: true } } } },
}

export type Card = Awaited<ReturnType<typeof listProducts>>[number]

/** Active products, newest first by default. */
export async function listProducts(opts: { collectionId?: string; q?: string; sort?: string; take?: number; skip?: number } = {}) {
  const orderBy =
    opts.sort === 'price-asc' || opts.sort === 'price-desc' ? undefined : opts.sort === 'title' ? { title: 'asc' as const } : { createdAt: 'desc' as const }
  const rows = await db.product.findMany({
    where: {
      status: 'active',
      ...(opts.collectionId ? { collections: { some: { collectionId: opts.collectionId } } } : {}),
      ...(opts.q ? { OR: [{ title: { contains: opts.q, mode: 'insensitive' } }, { tags: { has: opts.q } }, { productType: { contains: opts.q, mode: 'insensitive' } }] } : {}),
    },
    include: cardInclude,
    orderBy,
    take: opts.take,
    skip: opts.skip,
  })
  if (opts.sort === 'price-asc' || opts.sort === 'price-desc') {
    const low = (p: (typeof rows)[number]) => Math.min(...p.variants.map((v) => v.price))
    rows.sort((a, b) => (opts.sort === 'price-asc' ? low(a) - low(b) : low(b) - low(a)))
  }
  return rows
}

/** Products to suggest next to this one: same collection first, then the newest of the rest. */
export async function relatedProducts(productId: string, take = 4): Promise<Card[]> {
  const inCollections = await db.collectionProduct.findMany({ where: { productId }, select: { collectionId: true } })
  const ids = inCollections.map((c) => c.collectionId)
  const same = ids.length
    ? await db.product.findMany({
        where: { status: 'active', id: { not: productId }, collections: { some: { collectionId: { in: ids } } } },
        include: cardInclude, orderBy: { createdAt: 'desc' }, take,
      })
    : []
  if (same.length >= take) return same
  const more = await db.product.findMany({
    where: { status: 'active', id: { notIn: [productId, ...same.map((r) => r.id)] } },
    include: cardInclude, orderBy: { createdAt: 'desc' }, take: take - same.length,
  })
  return [...same, ...more]
}

/** What a product card needs: lowest price, compare-at, and whether anything can be bought. */
export function cardInfo(p: Card) {
  const prices = p.variants.map((v) => v.price)
  const from = prices.length ? Math.min(...prices) : 0
  const lowest = p.variants.find((v) => v.price === from)
  const available = p.variants.some((v) => !v.trackInventory || v.continueSelling || v.levels.some((l) => l.available > 0))
  return {
    from,
    varies: new Set(prices).size > 1,
    compareAt: lowest?.compareAtPrice && lowest.compareAtPrice > from ? lowest.compareAtPrice : null,
    available,
  }
}

/** What the product page promises about delivery, taken from the live shipping rates and settings. */
export const getShippingInfo = cache(async () => {
  const [rates, row] = await Promise.all([
    db.shippingRate.findMany({ where: { active: true, kind: 'free', basis: 'price', minSubtotal: { not: null } }, select: { minSubtotal: true } }),
    db.setting.findUnique({ where: { key: 'shipping' } }),
  ])
  const dispatch = ((row?.value ?? {}) as Record<string, unknown>).dispatchTime
  return {
    freeAt: rates.length ? Math.min(...rates.map((r) => r.minSubtotal!)) : null,
    dispatch: typeof dispatch === 'string' && dispatch.trim() ? dispatch.trim() : '2 to 4 working days',
  }
})

/** Promotions require the connected commerce backend and are off in the frontend demo. */
export const getActivePopup = cache(async () => null)
