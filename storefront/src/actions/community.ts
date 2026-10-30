'use server'

import type { FormState } from './store'

const disabled: FormState = { error: 'Submissions are disabled in this read-only demo.' }

export async function submitReview(_state: FormState, _form: FormData): Promise<FormState> { return disabled }
export async function applyAffiliate(_state: FormState, _form: FormData): Promise<FormState> { return disabled }
export async function applyPartner(_state: FormState, _form: FormData): Promise<FormState> { return disabled }
