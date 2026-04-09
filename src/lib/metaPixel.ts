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
  value: number
}

type ReportMetaLeadOptions = {
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
  value,
}: ReportMetaAddToCartOptions) {
  if (!canTrackMetaPixel()) return false

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
        item_price: value,
      },
    ],
    num_items: quantity,
  })

  return true
}

export function reportMetaLead({
  currency = "BRL",
  items,
  paymentMethod,
  value,
}: ReportMetaLeadOptions) {
  if (!canTrackMetaPixel()) return false

  window.fbq!("track", "Lead", {
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
  })

  return true
}
