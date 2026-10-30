'use server'

import type { FormState } from './store'

export async function sendContact(_state: FormState, _form: FormData): Promise<FormState> {
  return { error: 'Contact form submissions are disabled in this read-only demo.' }
}
