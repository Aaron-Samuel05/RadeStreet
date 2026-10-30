export interface PricingLine {
  variantId: string
  title: string
  variantTitle: string
  quantity: number
  price: number
  discount: number
  imageUrl: string | null
}

export interface Pricing {
  lines: PricingLine[]
  subtotal: number
  discount: number
  discountTitle?: string | null
  shippingName: string
  shippingEta?: string | null
  shipping: number
  giftCard: number
  total: number
  tax: number
  notices: string[]
}
