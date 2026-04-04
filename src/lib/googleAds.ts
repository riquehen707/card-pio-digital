import { GOOGLE_ADS_WHATSAPP_CONVERSION_ID } from "@/lib/site"

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type ReportGoogleAdsConversionOptions = {
  currency?: string
  newCustomer?: boolean
  onComplete?: () => void
  transactionId?: string
  value?: number
}

export function reportGoogleAdsConversion({
  currency = "BRL",
  newCustomer,
  onComplete,
  transactionId = "",
  value = 1,
}: ReportGoogleAdsConversionOptions = {}) {
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    onComplete?.()
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    finish()
    return false
  }

  window.gtag("event", "conversion", {
    send_to: GOOGLE_ADS_WHATSAPP_CONVERSION_ID,
    value,
    currency,
    transaction_id: transactionId,
    event_callback: finish,
    ...(typeof newCustomer === "boolean" ? { new_customer: newCustomer } : {}),
  })

  window.setTimeout(finish, 800)
  return false
}
