import { NextResponse } from 'next/server'
import { db } from '@radestreet/db'

/** /r/RIYA10: an affiliate's share link. Applies their code to the shopper's cart, then goes home. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const res = NextResponse.redirect(new URL('/', req.url))
  const d = await db.discount.findFirst({ where: { code: { equals: code.slice(0, 40), mode: 'insensitive' }, active: true } })
  if (d?.code) res.cookies.set('rs_promo', JSON.stringify({ code: d.code, gift: '' }), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}
