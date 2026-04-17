import { SITE_URL } from "@/lib/site"
import type { CupomEntregaAtivo } from "@/types/carrinho"

export const DELIVERY_FREE_COUPON_CODE = "ENTREGAGRATIS"
export const DELIVERY_FREE_COUPON_MIN_SUBTOTAL = 30
export const DELIVERY_FREE_COUPON_QUERY_PARAM = "cupom"
export const DELIVERY_FREE_COUPON_RELATIVE_LINK = `/?${DELIVERY_FREE_COUPON_QUERY_PARAM}=${DELIVERY_FREE_COUPON_CODE}`

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

export function normalizeDeliveryCouponCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? ""
}

export function isDeliveryFreeCouponCode(value?: string | null) {
  return normalizeDeliveryCouponCode(value) === DELIVERY_FREE_COUPON_CODE
}

export function getDeliveryFreeCouponShareLink(baseUrl = SITE_URL) {
  return `${baseUrl.replace(/\/$/, "")}${DELIVERY_FREE_COUPON_RELATIVE_LINK}`
}

type CalcularEntregaComCupomInput = {
  subtotal: number
  originalDeliveryFee?: number | null
  cupomEntrega: CupomEntregaAtivo | null
}

export function calcularEntregaComCupom({
  subtotal,
  originalDeliveryFee,
  cupomEntrega,
}: CalcularEntregaComCupomInput) {
  const cupomAtivo = Boolean(cupomEntrega && isDeliveryFreeCouponCode(cupomEntrega.codigo))
  const elegivel = cupomAtivo && subtotal >= DELIVERY_FREE_COUPON_MIN_SUBTOTAL
  const faltaParaMinimo = cupomAtivo
    ? Math.max(DELIVERY_FREE_COUPON_MIN_SUBTOTAL - subtotal, 0)
    : 0
  const taxaOriginal =
    typeof originalDeliveryFee === "number" && Number.isFinite(originalDeliveryFee)
      ? roundCurrency(originalDeliveryFee)
      : null
  const desconto = elegivel && taxaOriginal !== null ? taxaOriginal : 0
  const taxaFinal = elegivel ? 0 : taxaOriginal ?? 0

  return {
    codigoCupom: cupomAtivo ? DELIVERY_FREE_COUPON_CODE : null,
    cupomAtivo,
    elegivel,
    faltaParaMinimo: roundCurrency(faltaParaMinimo),
    taxaOriginal,
    desconto: roundCurrency(desconto),
    taxaFinal: roundCurrency(taxaFinal),
  }
}
