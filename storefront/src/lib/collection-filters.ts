import { cardInfo, type Card } from './data'
import { formatMoney, str } from './format'

/** What a shopper has asked for on a collection page, as it appears in the address bar. Prices are whole rupees. */
export type Filters = { sizes: string[]; types: string[]; vendors: string[]; inStock: boolean; min: number | null; max: number | null }

/** What the products in a collection could be filtered by. A group is left empty when it could not narrow anything. */
export type Facets = { sizes: string[]; types: string[]; vendors: string[]; hasSoldOut: boolean; priceMin: number; priceMax: number }

type Params = Record<string, string | string[] | undefined>

const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean)
const rupees = (v: string | string[] | undefined) => {
  const n = Number(str(v))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

export function parseFilters(sp: Params): Filters {
  const f: Filters = { sizes: many(sp.size), types: many(sp.type), vendors: many(sp.vendor), inStock: str(sp.stock) === '1', min: rupees(sp.min), max: rupees(sp.max) }
  if (f.min != null && f.max != null && f.min > f.max) [f.min, f.max] = [f.max, f.min]
  return f
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase())
  if (i >= 0) return i
  const n = parseFloat(s)
  return Number.isFinite(n) ? 100 + n : 1000
}

type Variant = Card['variants'][number]
const buyable = (v: Variant) => !v.trackInventory || v.continueSelling || v.levels.some((l) => l.available > 0)

export function facetsOf(products: Card[]): Facets {
  const distinct = (xs: string[]) => [...new Set(xs.filter(Boolean))]
  const sizes = distinct(products.flatMap((p) => p.variants.map((v) => v.option1 ?? ''))).sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b))
  const types = distinct(products.map((p) => p.productType)).sort()
  const vendors = distinct(products.map((p) => p.vendor)).sort()
  const prices = products.map((p) => cardInfo(p).from).filter((n) => n > 0)
  const priceMin = prices.length ? Math.floor(Math.min(...prices) / 100) : 0
  const priceMax = prices.length ? Math.ceil(Math.max(...prices) / 100) : 0
  return {
    sizes: sizes.length > 1 ? sizes : [],
    types: types.length > 1 ? types : [],
    vendors: vendors.length > 1 ? vendors : [],
    hasSoldOut: products.some((p) => !cardInfo(p).available),
    priceMin,
    priceMax: priceMax > priceMin ? priceMax : priceMin,
  }
}

/** The store's own currency symbol, taken from its money formatter so the price boxes never hard-code one. */
export const currencySymbol = () => formatMoney(0).replace(/[\d.,\s ]/g, '')

export const hasGroups =(f: Facets) => f.sizes.length > 0 || f.types.length > 0 || f.vendors.length > 0 || f.hasSoldOut || f.priceMax > f.priceMin

export function applyFilters(products: Card[], f: Filters): Card[] {
  return products.filter((p) => {
    const info = cardInfo(p)
    if (f.inStock && !info.available) return false
    if (f.sizes.length && !p.variants.some((v) => v.option1 && f.sizes.includes(v.option1) && buyable(v))) return false
    if (f.types.length && !f.types.includes(p.productType)) return false
    if (f.vendors.length && !f.vendors.includes(p.vendor)) return false
    if (f.min != null && info.from < f.min * 100) return false
    if (f.max != null && info.from > f.max * 100) return false
    return true
  })
}

export const activeCount = (f: Filters) => f.sizes.length + f.types.length + f.vendors.length + (f.inStock ? 1 : 0) + (f.min != null || f.max != null ? 1 : 0)

/** The query string for these filters, so a link keeps what the shopper already chose. */
export function queryOf(f: Filters, extra: { sort?: string; page?: number } = {}) {
  const q = new URLSearchParams()
  if (extra.sort && extra.sort !== 'newest') q.set('sort', extra.sort)
  f.sizes.forEach((s) => q.append('size', s))
  f.types.forEach((s) => q.append('type', s))
  f.vendors.forEach((s) => q.append('vendor', s))
  if (f.inStock) q.set('stock', '1')
  if (f.min != null) q.set('min', String(f.min))
  if (f.max != null) q.set('max', String(f.max))
  if (extra.page && extra.page > 1) q.set('page', String(extra.page))
  return q.toString()
}

/** One removable chip per active filter; each link is the same page with just that filter dropped. */
export function activeChips(f: Filters, sort: string, base: string): { label: string; href: string }[] {
  const to = (g: Filters) => {
    const q = queryOf(g, { sort })
    return q ? `${base}?${q}` : base
  }
  const money = (n: number) => formatMoney(n * 100).replace(/\.00$/, '')
  const chips = [
    ...f.sizes.map((s) => ({ label: `Size ${s}`, href: to({ ...f, sizes: f.sizes.filter((x) => x !== s) }) })),
    ...f.types.map((s) => ({ label: s, href: to({ ...f, types: f.types.filter((x) => x !== s) }) })),
    ...f.vendors.map((s) => ({ label: s, href: to({ ...f, vendors: f.vendors.filter((x) => x !== s) }) })),
  ]
  if (f.inStock) chips.push({ label: 'In stock', href: to({ ...f, inStock: false }) })
  if (f.min != null || f.max != null) {
    const label = f.min != null && f.max != null ? `${money(f.min)} to ${money(f.max)}` : f.min != null ? `From ${money(f.min)}` : `Up to ${money(f.max!)}`
    chips.push({ label, href: to({ ...f, min: null, max: null }) })
  }
  return chips
}
