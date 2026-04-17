"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAnalytics } from "@/components/AnalyticsProvider"
import {
  DELIVERY_FREE_COUPON_MIN_SUBTOTAL,
  DELIVERY_FREE_COUPON_QUERY_PARAM,
  isDeliveryFreeCouponCode,
  normalizeDeliveryCouponCode,
} from "@/features/carrinho/cupomEntrega"
import { useCarrinho } from "@/hooks/useCarrinho"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function DeliveryCouponBanner() {
  const searchParams = useSearchParams()
  const hidratado = useCarrinho((state) => state.hidratado)
  const cupomEntrega = useCarrinho((state) => state.cupomEntrega)
  const aplicarCupomEntrega = useCarrinho((state) => state.aplicarCupomEntrega)
  const { trackEvent } = useAnalytics()
  const ultimoCupomAplicadoRef = useRef<string | null>(null)

  const cupomDaUrl = searchParams.get(DELIVERY_FREE_COUPON_QUERY_PARAM)
  const cupomNormalizado = normalizeDeliveryCouponCode(cupomDaUrl)

  useEffect(() => {
    if (!hidratado) return
    if (!cupomNormalizado || !isDeliveryFreeCouponCode(cupomNormalizado)) return
    if (cupomEntrega?.codigo === cupomNormalizado) return
    if (ultimoCupomAplicadoRef.current === cupomNormalizado) return

    ultimoCupomAplicadoRef.current = cupomNormalizado
    aplicarCupomEntrega({
      codigo: cupomNormalizado,
      origem: "link",
      aplicadoEm: new Date().toISOString(),
    })

    void trackEvent({
      type: "delivery_coupon_applied",
      metadata: {
        code: cupomNormalizado,
        source: "query_param",
      },
    })

    toast(
      `Cupom aplicado. Em pedidos acima de ${BRL.format(DELIVERY_FREE_COUPON_MIN_SUBTOTAL)}, a entrega sai gratis.`,
      {
        duration: 2600,
      }
    )
  }, [aplicarCupomEntrega, cupomEntrega?.codigo, cupomNormalizado, hidratado, trackEvent])

  return null
}
