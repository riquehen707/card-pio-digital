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
  sessionId?: string | null
  subtotal: number
  deliveryFee: number
  total: number
  whatsappNumber?: string | null
  locationUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  items: LeadCheckoutItemInput[]
}

