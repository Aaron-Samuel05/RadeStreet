'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, MenuIcon } from './Icons'
import { NavLink } from './NavLink'

/** The desktop nav is server-rendered; on phones this adds a toggle that opens the same links in a side drawer. */
export function MobileNav({ links, account, signedIn }: { links: { id: string; label: string; url: string; sub: boolean }[]; account: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [open])
  const close = () => setOpen(false)
  return (
    <>
      <button className="menu-toggle icon-btn" aria-expanded={open} aria-controls="mobile-nav" aria-label="Open menu" onClick={() => setOpen(true)}>
        <MenuIcon />
      </button>
      {/* Portalled to body: the drawer is `position: fixed`, and the header it would otherwise sit inside carries a
          `backdrop-filter`, which (like `transform`/`filter`) turns the header into the fixed element's containing
          block — trapping the drawer inside the header's own short box instead of the full viewport. */}
      {open ? createPortal(
        <>
          <div className="drawer-back" onClick={close} />
          <nav id="mobile-nav" className="drawer" aria-label="Mobile">
            <div className="drawer-head">
              <span className="eyebrow" style={{ margin: 0 }}>Menu</span>
              <button className="icon-btn" aria-label="Close menu" onClick={close}><CloseIcon /></button>
            </div>
            {links.filter((l) => l.url && l.url !== '#' || !l.sub).map((l) => (
              l.url && l.url !== '#'
                ? <NavLink key={l.id} href={l.url} className={l.sub ? 'sub' : undefined} onClick={close}>{l.label}</NavLink>
                : <span key={l.id} className="eyebrow" style={{ marginTop: 18 }}>{l.label}</span>
            ))}
            <div className="drawer-foot">
              <Link href={account} onClick={close}>{signedIn ? 'My account' : 'Log in'}</Link>
              {signedIn ? <Link href="/account/wishlist" onClick={close}>Wishlist</Link> : null}
              <Link href="/track" onClick={close}>Track an order</Link>
            </div>
          </nav>
        </>,
        document.body,
      ) : null}
    </>
  )
}
