import Link from 'next/link'
import { readCart } from '@/lib/cart'
import { getCustomer, getMenu, getPrefs, getSite } from '@/lib/data'
import { MobileNav } from './MobileNav'
import { NavLink } from './NavLink'
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from './Icons'

export async function Header() {
  const [prefs, site, items, cart, customer] = await Promise.all([getPrefs(), getSite(), getMenu('main-menu'), readCart(), getCustomer()])
  const count = cart.reduce((s, l) => s + l.quantity, 0)
  const links = items.filter((i) => !i.parentId)
  const kids = (id: string) => items.filter((i) => i.parentId === id)
  const flat = links.flatMap((l) => [{ id: l.id, label: l.label, url: l.url, sub: false }, ...kids(l.id).map((k) => ({ id: k.id, label: k.label, url: k.url, sub: true }))])
  const account = customer ? '/account' : '/account/login'
  return (
    <>
      {site.announcementOn && site.announcement ? (
        <div className="announce">
          <div className="wrap">
            <p className="announce-msg">{site.announcement}</p>
            <Link href="/track" className="announce-link">Track order</Link>
          </div>
        </div>
      ) : null}
      <header className="site-header">
        <div className="wrap">
          <div className="head-start">
            <MobileNav links={flat} account={account} signedIn={!!customer} />
            <Link href="/" className="head-logo"><img src="/images/brand/logo-dark.png" width={640} height={113} alt={`${prefs.storeName} home`} /></Link>
          </div>
          <nav className="nav" aria-label="Main">
            {links.map((l) => {
              const sub = kids(l.id)
              const heading = l.url === '#' || !l.url
              if (!sub.length) return heading ? null : <NavLink key={l.id} href={l.url}>{l.label}</NavLink>
              return (
                <div className="nav-drop" key={l.id}>
                  {heading ? <span className="nav-drop-label" tabIndex={0}>{l.label}</span> : <NavLink href={l.url}>{l.label}</NavLink>}
                  <div className="nav-drop-menu">{sub.map((k) => <NavLink key={k.id} href={k.url}>{k.label}</NavLink>)}</div>
                </div>
              )
            })}
          </nav>
          <div className="icons">
            <Link href="/search" aria-label="Search"><SearchIcon /></Link>
            {customer ? <Link href="/account/wishlist" aria-label="Wishlist" className="hide-sm"><HeartIcon /></Link> : null}
            <Link href={account} aria-label={customer ? 'Account' : 'Log in'} className="hide-sm"><UserIcon /></Link>
            <Link href="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
              <BagIcon />
              {count > 0 ? <span className="cart-count" data-testid="cart-count">{count}</span> : null}
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
