import type { MetodoPagamento } from "@/types/carrinho"

export type AttributionSnapshot = {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  gclid?: string | null
  gbraid?: string | null
  wbraid?: string | null
  fbclid?: string | null
  referrer?: string | null
}

export type AnalyticsEventInput = {
  type: string
  pagePath?: string
  productId?: string
  productName?: string
  value?: number
  metadata?: Record<string, unknown>
}

export type LeadCheckoutItemInput = {
  productId: string
  productName: string
  category?: string | null
  quantity: number
  unitPrice: number
  fillings?: string[]
}

export type LeadCheckoutInput = {
  orderReference?: string | null
  sessionId?: string | null
  subtotal: number
  deliveryFee: number
  originalDeliveryFee?: number | null
  total: number
  whatsappNumber?: string | null
  locationUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  paymentMethod?: MetodoPagamento | null
  needsChange?: boolean | null
  cashTendered?: number | null
  changeAmount?: number | null
  couponCode?: string | null
  couponDiscount?: number | null
  couponMinimumSubtotal?: number | null
  couponEligible?: boolean | null
  deliveryPendingQuote?: boolean | null
  items: LeadCheckoutItemInput[]
}
