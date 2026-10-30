'use server'

import type { Pricing } from '@/lib/pricing'

export interface FormState {
  error?: string
  ok?: string
}

export type BeginResult = { ok: false; error: string }

const disabled = 'This read-only demo does not support purchases, accounts, or form submissions.'
const formError = (): FormState => ({ error: disabled })

export async function addToCart(_formData: FormData): Promise<void> {}
export async function changeQuantity(_formData: FormData): Promise<void> {}
export async function applyCode(_state: FormState, _formData: FormData): Promise<FormState> { return formError() }
export async function removeCode(_code: string): Promise<void> {}
export async function applyPopupDiscount(_id: string): Promise<{ ok: boolean }> { return { ok: false } }
export async function clearPromo(): Promise<void> {}
export async function subscribe(_state: FormState, _formData: FormData): Promise<FormState> { return formError() }
export async function notifyWhenBack(_state: FormState, _formData: FormData): Promise<FormState> { return formError() }
export async function toggleWishlist(_formData: FormData): Promise<void> {}
export async function beginCheckout(_formData: FormData): Promise<BeginResult> { return { ok: false, error: disabled } }
export async function finishCheckout(_payment: { orderId: string; razorpayOrderId: string; paymentId: string; signature: string }) {
  return { ok: false, error: disabled }
}
export async function finishDevCheckout(_orderId: string) { return { ok: false, error: disabled } }
export async function finishFreeCheckout() { return { ok: false, error: disabled } }
export async function quote(_state: string, _email: string): Promise<Pricing> { throw new Error(disabled) }
export async function rememberCheckout(_email: string, _phone: string): Promise<void> {}
export async function requestLoginCode(_state: FormState, _formData: FormData): Promise<FormState & { email?: string }> { return formError() }
export async function submitLoginCode(_state: FormState, _formData: FormData): Promise<FormState> { return formError() }
export async function logout(): Promise<void> {}
export async function saveProfile(_state: FormState, _formData: FormData): Promise<FormState> { return formError() }
