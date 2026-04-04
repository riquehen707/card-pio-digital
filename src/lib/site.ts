import type { Coordenadas } from "@/types/carrinho"

export const SITE_NAME = "Acarajé da Josi"
export const SITE_DESCRIPTION =
  "Cardápio digital com pedido pelo WhatsApp, cálculo de entrega e localização fixa."
export const SITE_URL = "https://acarajedajosi.com.br"
export const INSTAGRAM_URL = "https://instagram.com/acarajosi"
export const INSTAGRAM_HANDLE = "@acarajosi"
export const DEV_URL = "https://instagram.com/riquehen"
export const DEV_HANDLE = "@riquehen"
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-18064251939"
export const GOOGLE_ADS_WHATSAPP_CONVERSION_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION_ID ||
  "AW-18064251939/B5npCN2z25UcEKO42qVD"
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "5575983675164"

export const COORDENADAS_LOJA: Coordenadas = {
  lat: -12.1339986,
  lng: -38.4321097,
}
