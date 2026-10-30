'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/** A nav link that marks itself as the current page, so CSS can highlight the section the shopper is in. */
export function NavLink({ href, ...props }: ComponentProps<typeof Link>) {
  const path = usePathname()
  const target = (typeof href === 'string' ? href : href.pathname ?? '').split(/[?#]/)[0]
  const active = target === '/' ? path === '/' : !!target && (path === target || path.startsWith(`${target}/`))
  return <Link href={href} aria-current={active ? 'page' : undefined} {...props} />
}
