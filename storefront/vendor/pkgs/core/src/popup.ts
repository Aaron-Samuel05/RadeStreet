/** What a discount's store pop-up looks like and when it shows. Stored as JSON on the discount. */
export interface PopupConfig {
  heading: string
  message: string
  buttonText: string
  /** Optional picture shown beside the text. */
  image: string
  theme: 'brand' | 'dark' | 'light'
  position: 'center' | 'corner'
  trigger: 'delay' | 'scroll' | 'exit'
  delaySeconds: number
  scrollPercent: number
  pages: 'all' | 'home' | 'shop'
  frequency: 'once' | 'session' | 'always'
  devices: 'all' | 'desktop' | 'mobile'
  /** Show the code itself in the pop-up. */
  showCode: boolean
  /** Changes whenever the pop-up is saved, so people who closed an older version see the new one. */
  rev: number
}

export const DEFAULT_POPUP: PopupConfig = {
  heading: '', message: '', buttonText: 'Apply code', image: '', theme: 'brand', position: 'center',
  trigger: 'delay', delaySeconds: 5, scrollPercent: 40, pages: 'all', frequency: 'once', devices: 'all', showCode: true, rev: 0,
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (allowed.includes(v as T) ? (v as T) : d)
const num = (v: unknown, d: number, lo: number, hi: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d
}

/** Reads stored JSON back into a complete, valid config. */
export function normalizePopup(raw: unknown): PopupConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const d = DEFAULT_POPUP
  const str = (v: unknown, fallback: string, max: number) => (typeof v === 'string' ? v.slice(0, max) : fallback)
  return {
    heading: str(r.heading, d.heading, 80),
    message: str(r.message, d.message, 300),
    buttonText: str(r.buttonText, d.buttonText, 30) || d.buttonText,
    image: str(r.image, d.image, 300),
    theme: pick(r.theme, ['brand', 'dark', 'light'], d.theme),
    position: pick(r.position, ['center', 'corner'], d.position),
    trigger: pick(r.trigger, ['delay', 'scroll', 'exit'], d.trigger),
    delaySeconds: num(r.delaySeconds, d.delaySeconds, 0, 120),
    scrollPercent: num(r.scrollPercent, d.scrollPercent, 5, 95),
    pages: pick(r.pages, ['all', 'home', 'shop'], d.pages),
    frequency: pick(r.frequency, ['once', 'session', 'always'], d.frequency),
    devices: pick(r.devices, ['all', 'desktop', 'mobile'], d.devices),
    showCode: r.showCode === undefined ? d.showCode : Boolean(r.showCode),
    rev: num(r.rev, 0, 0, Number.MAX_SAFE_INTEGER),
  }
}
