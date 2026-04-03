import type { Coordenadas } from "@/types/carrinho"

export const SITE_NAME = "Acaraje da Josi"
export const SITE_DESCRIPTION =
  "Cardapio digital com pedido pelo WhatsApp, calculo de entrega e localizacao fixa."
export const SITE_URL = "https://acarajedajosi.com.br"
export const INSTAGRAM_URL = "https://instagram.com/acarajosi"
export const INSTAGRAM_HANDLE = "@acarajosi"
export const DEV_URL = "https://instagram.com/riquehen"
export const DEV_HANDLE = "@riquehen"
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "5575983675164"

export const COORDENADAS_LOJA: Coordenadas = {
  lat: -12.1339986,
  lng: -38.4321097,
}

