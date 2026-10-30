'use server'

export interface TrackedOrder {
  number: number
  placed: string
  stage: 0 | 1 | 2 | 3
  stageLabel: string
  payment: string
  total: number
  items: { title: string; variant: string; quantity: number; image: string | null }[]
  shipments: { company: string; number: string; url: string }[]
  city: string
}

export interface TrackState {
  error?: string
  order?: TrackedOrder
}

export async function trackOrder(_state: TrackState, _form: FormData): Promise<TrackState> {
  return { error: 'Order tracking is unavailable in this read-only demo.' }
}
