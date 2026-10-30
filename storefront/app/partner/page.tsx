import type { Metadata } from 'next'
import { applyPartner } from '@/actions/community'
import { FieldsForm } from '@/components/FieldsForm'

export const metadata: Metadata = { title: 'Partner with us', description: 'Wholesale, reselling and collaborations with Radestreet.' }

export default function PartnerPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <header className="page-title">
        <p className="eyebrow">Wholesale and collabs</p>
        <h1>Partner with us</h1>
        <p>Run a store, a stall or a community? Tell us about it and we will get back to you.</p>
      </header>
      <FieldsForm
        action={applyPartner}
        submit="Send enquiry"
        fields={[
          { name: 'name', label: 'Your name', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'city', label: 'City' },
          { name: 'business', label: 'Business or store name', full: true },
          { name: 'message', label: 'How would you like to work together?', type: 'textarea', maxLength: 1000 },
        ]}
      />
      <div style={{ height: 72 }} />
    </div>
  )
}
