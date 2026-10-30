/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise the
 * message is logged so nothing silently disappears in development.
 * Never throws: a failed email must not fail an order.
 */
export interface Mail {
  to: string
  subject: string
  html: string
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[email not sent: RESEND_API_KEY unset] to=${mail.to} subject="${mail.subject}"`)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'Radestreet <orders@radestreet.com>', to: mail.to, subject: mail.subject, html: mail.html }),
    })
    if (!res.ok) console.error('[email] Resend returned', res.status)
    return res.ok
  } catch (e) {
    console.error('[email] failed', e)
    return false
  }
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
