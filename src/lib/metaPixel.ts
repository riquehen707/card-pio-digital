declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

type MetaCartItem = {
  id: string
  quantity: number
  itemPrice: number
}

type ReportMetaAddToCartOptions = {
  category?: string
  productId: string
  productName: string
  quantity?: number
  unitPrice: number
}

type ReportMetaCheckoutOptions = {
  currency?: string
  items: MetaCartItem[]
  paymentMethod?: string
  value: number
}

function canTrackMetaPixel() {
  return typeof window !== "undefined" && typeof window.fbq === "function"
}

export function reportMetaAddToCart({
  category,
  productId,
  productName,
  quantity = 1,
  unitPrice,
}: ReportMetaAddToCartOptions) {
  if (!canTrackMetaPixel()) return false

  const value = unitPrice * quantity

  window.fbq!("track", "AddToCart", {
    currency: "BRL",
    value,
    content_ids: [productId],
    content_name: productName,
    content_category: category,
    content_type: "product",
    contents: [
      {
        id: productId,
        quantity,
        item_price: unitPrice,
      },
    ],
    num_items: quantity,
  })

  return true
}

function buildCheckoutPayload({
  currency = "BRL",
  items,
  paymentMethod,
  value,
}: ReportMetaCheckoutOptions) {
  return {
    currency,
    value,
    content_ids: items.map((item) => item.id),
    content_name: "Pedido via WhatsApp",
    content_type: "product",
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.itemPrice,
    })),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    order_source: "whatsapp",
    payment_method: paymentMethod,
  }
}

export function reportMetaInitiateCheckout(options: ReportMetaCheckoutOptions) {
  if (!canTrackMetaPixel()) return false

  window.fbq!("track", "InitiateCheckout", buildCheckoutPayload(options))

  return true
}

export function reportMetaLead(options: ReportMetaCheckoutOptions) {
  if (!canTrackMetaPixel()) return false

  window.fbq!("track", "Lead", buildCheckoutPayload(options))

  return true
}
