import type { Metadata } from 'next'
import { applyAffiliate } from '@/actions/community'
import { FieldsForm } from '@/components/FieldsForm'

export const metadata: Metadata = { title: 'Become an affiliate', description: 'Share Radestreet with your followers and earn on every order.' }

export default function AffiliatePage() {
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <header className="page-title">
        <p className="eyebrow">Creators</p>
        <h1>Earn with Radestreet</h1>
        <p>Get your own discount code. Your followers save, you earn a share of every order that uses it. We pay out by UPI.</p>
      </header>
      <FieldsForm
        action={applyAffiliate}
        submit="Apply"
        fields={[
          { name: 'name', label: 'Full name', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'handle', label: 'Instagram or YouTube handle' },
          { name: 'platform', label: 'Main platform', type: 'select', options: ['Instagram', 'YouTube', 'Other'] },
          { name: 'upi', label: 'UPI ID for payouts' },
        ]}
      />
      <div style={{ height: 72 }} />
    </div>
  )
}
