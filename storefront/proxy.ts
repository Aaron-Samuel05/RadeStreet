import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|media/).*)'],
}

export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers)
  headers.delete('x-preview')
  return NextResponse.next({ request: { headers } })
}
