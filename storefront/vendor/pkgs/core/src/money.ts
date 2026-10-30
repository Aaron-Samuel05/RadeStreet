/**
 * Money is integer paise everywhere in the database. These are the only two
 * places paise become rupees and back.
 */
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export function formatMoney(paise: number): string {
  return inr.format(paise / 100)
}

/** "1,299.50" or 1299.5 (rupees) -> 129950. Returns null for anything that is not a non-negative amount. */
export function toPaise(input: string | number | null | undefined): number | null {
  if (input == null || input === '') return null
  const n = typeof input === 'number' ? input : Number(String(input).replace(/[₹,\s]/g, ''))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/** 129950 -> "1299.50", for pre-filling an input. */
export function fromPaise(paise: number | null | undefined): string {
  return paise == null ? '' : (paise / 100).toFixed(2)
}
