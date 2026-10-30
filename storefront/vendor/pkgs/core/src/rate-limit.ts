/**
 * A small sliding-window limiter for public endpoints (logins, sign-ups, beacons).
 * Held in memory, so each server process counts on its own: it stops guessing and
 * floods, which is what it is for, but it is not a shared quota across instances.
 */
const windows = new Map<string, number[]>()
let lastSweep = 0

function recent(key: string, windowMs: number, now: number): number[] {
  const list = (windows.get(key) ?? []).filter((t) => now - t < windowMs)
  if (list.length) windows.set(key, list)
  else windows.delete(key)
  return list
}

/** Forget old keys now and then so the map cannot grow without bound. */
function sweep(windowMs: number, now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const key of windows.keys()) recent(key, windowMs, now)
}

/** Count one attempt against `key`. Returns false once `max` attempts fall inside the window. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(windowMs, now)
  const list = recent(key, windowMs, now)
  if (list.length >= max) return false
  list.push(now)
  windows.set(key, list)
  return true
}

/** Whether `key` is already at its limit, without counting a new attempt. */
export function blocked(key: string, max: number, windowMs: number): boolean {
  return recent(key, windowMs, Date.now()).length >= max
}

/** Count a failed attempt (use with `blocked`, so only failures use up the allowance). */
export function fail(key: string, windowMs: number) {
  const now = Date.now()
  const list = recent(key, windowMs, now)
  list.push(now)
  windows.set(key, list)
}

export function reset(key: string) {
  windows.delete(key)
}

/** The caller's address from the proxy headers, or a shared bucket when there is none. */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}
