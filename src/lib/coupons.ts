export type CouponDefinition = {
  code: string
  label: string
  description: string
  type: "percent" | "fixed"
  value: number
  minSubtotal?: number
  maxDiscount?: number
}

export type CouponEvaluation =
  | {
      status: "invalid"
      normalizedCode: string
      message: string
    }
  | {
      status: "ineligible"
      normalizedCode: string
      coupon: CouponDefinition
      message: string
    }
  | {
      status: "applied"
      normalizedCode: string
      coupon: CouponDefinition
      discount: number
      message: string
    }

export const AVAILABLE_COUPONS: CouponDefinition[] = [
  {
    code: "DENDE10",
    label: "10% no tabuleiro",
    description: "Ganhe 10% de desconto em pedidos a partir de R$ 35.",
    type: "percent",
    value: 10,
    minSubtotal: 35,
    maxDiscount: 12,
  },
  {
    code: "JOSI5",
    label: "R$ 5 no pedido",
    description: "Desconto direto de R$ 5 em compras acima de R$ 25.",
    type: "fixed",
    value: 5,
    minSubtotal: 25,
  },
  {
    code: "TABULEIRO15",
    label: "R$ 15 no combo",
    description: "Leve R$ 15 de desconto em pedidos acima de R$ 80.",
    type: "fixed",
    value: 15,
    minSubtotal: 80,
  },
]

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

export function evaluateCoupon(code: string, subtotal: number): CouponEvaluation {
  const normalizedCode = normalizeCouponCode(code)
  const coupon = AVAILABLE_COUPONS.find((item) => item.code === normalizedCode)

  if (!normalizedCode || !coupon) {
    return {
      status: "invalid",
      normalizedCode,
      message: "Esse cupom nao foi encontrado.",
    }
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      status: "ineligible",
      normalizedCode,
      coupon,
      message: `Esse cupom libera a partir de ${BRL.format(coupon.minSubtotal)}.`,
    }
  }

  const rawDiscount = coupon.type === "percent" ? subtotal * (coupon.value / 100) : coupon.value
  const boundedDiscount = Math.min(rawDiscount, coupon.maxDiscount ?? Number.POSITIVE_INFINITY, subtotal)

  return {
    status: "applied",
    normalizedCode,
    coupon,
    discount: Number(boundedDiscount.toFixed(2)),
    message:
      coupon.type === "percent"
        ? `${coupon.value}% de desconto aplicado.`
        : `${BRL.format(coupon.value)} de desconto aplicado.`,
  }
}
