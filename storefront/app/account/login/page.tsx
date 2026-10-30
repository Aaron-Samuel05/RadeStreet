import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <div className="wrap auth">
      <div className="auth-card">
        <h1>Sign-in is unavailable</h1>
        <p className="auth-sub">Accounts are disabled in this read-only storefront demo.</p>
        <Link href="/" className="btn-pill">Back to the storefront</Link>
      </div>
    </div>
  )
}
