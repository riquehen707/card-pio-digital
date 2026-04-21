import { OPCOES_COMIDA } from "@/data/recheios"
import { getCatalogProductById } from "@/lib/catalog"

type Nullable<T> = T | null | undefined

export type OrderItemInput = {
  productId: string
  productName: string
  quantity: number
  unitPrice?: number | null
  category?: string | null
  fillings?: readonly string[] | null
}

export type GroupedOrderItem = {
  key: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number | null
  category: string | null
  fillings: string[]
}

const FOOD_OPTIONS = Array.from(OPCOES_COMIDA)
const FOOD_OPTION_ORDER = new Map(
  FOOD_OPTIONS.map((option, index) => [normalizeOrderText(option), index])
)
const PIMENTA_KEY = normalizeOrderText("Pimenta")
const NON_SPICY_FOOD_OPTIONS = FOOD_OPTIONS.filter(
  (option) => normalizeOrderText(option) !== PIMENTA_KEY
)

export function normalizeOrderText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function compareFoodOptions(left: string, right: string) {
  const leftOrder = FOOD_OPTION_ORDER.get(normalizeOrderText(left)) ?? Number.MAX_SAFE_INTEGER
  const rightOrder = FOOD_OPTION_ORDER.get(normalizeOrderText(right)) ?? Number.MAX_SAFE_INTEGER

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  return left.localeCompare(right, "pt-BR")
}

function resolveCanonicalFoodOption(value: string) {
  const normalizedValue = normalizeOrderText(value)
  const match = FOOD_OPTIONS.find((option) => normalizeOrderText(option) === normalizedValue)
  return match ?? value.trim()
}

export function normalizeOrderFillings(fillings?: Nullable<readonly string[]>) {
  const unique = new Map<string, string>()

  for (const filling of fillings ?? []) {
    const trimmedValue = filling.trim()
    if (!trimmedValue) continue

    const canonicalValue = resolveCanonicalFoodOption(trimmedValue)
    unique.set(normalizeOrderText(canonicalValue), canonicalValue)
  }

  return Array.from(unique.values()).sort(compareFoodOptions)
}

export function readFillingsFromUnknown(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return normalizeOrderFillings(value.filter((entry): entry is string => typeof entry === "string"))
}

export function formatNaturalList(values: readonly string[]) {
  if (values.length === 0) return ""
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]} e ${values[1]}`

  return `${values.slice(0, -1).join(", ")} e ${values.at(-1)}`
}

export function formatCustomizationSummary(
  productId: string,
  fillings?: Nullable<readonly string[]>
) {
  const product = getCatalogProductById(productId)
  if (!product?.permiteRecheios) {
    return null
  }

  const normalizedFillings = normalizeOrderFillings(fillings)
  const selectedFillings = new Set(normalizedFillings.map((filling) => normalizeOrderText(filling)))
  const missingFillings = NON_SPICY_FOOD_OPTIONS.filter(
    (option) => !selectedFillings.has(normalizeOrderText(option))
  )
  const spicyLabel = selectedFillings.has(PIMENTA_KEY) ? "com pimenta" : "sem pimenta"

  if (missingFillings.length === 0) {
    return `completo, ${spicyLabel}`
  }

  return `sem ${formatNaturalList(missingFillings)}, ${spicyLabel}`
}

export function formatOrderItemLabel(item: {
  productId: string
  productName: string
  fillings?: Nullable<readonly string[]>
}) {
  const customizationSummary = formatCustomizationSummary(item.productId, item.fillings)
  return customizationSummary ? `${item.productName} ${customizationSummary}` : item.productName
}

export function formatOrderLine(
  item: {
    productId: string
    productName: string
    quantity: number
    unitPrice?: number | null
    fillings?: Nullable<readonly string[]>
  },
  currencyFormatter?: Intl.NumberFormat
) {
  const label = formatOrderItemLabel(item)
  const line = `${item.quantity}x ${label}`

  if (
    !currencyFormatter ||
    typeof item.unitPrice !== "number" ||
    !Number.isFinite(item.unitPrice)
  ) {
    return line
  }

  return `${line} - ${currencyFormatter.format(item.unitPrice * item.quantity)}`
}

export function groupOrderItems(items: readonly OrderItemInput[]) {
  const groupedItems = new Map<string, GroupedOrderItem>()

  for (const item of items) {
    const normalizedFillings = normalizeOrderFillings(item.fillings)
    const key = `${item.productId}|${normalizedFillings
      .map((filling) => normalizeOrderText(filling))
      .join(",")}`
    const current = groupedItems.get(key)

    if (!current) {
      groupedItems.set(key, {
        key,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice:
          typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)
            ? item.unitPrice
            : null,
        category: item.category ?? null,
        fillings: normalizedFillings,
      })
      continue
    }

    current.quantity += item.quantity
    if (current.unitPrice === null && typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)) {
      current.unitPrice = item.unitPrice
    }
    if (!current.category && item.category) {
      current.category = item.category
    }
  }

  return Array.from(groupedItems.values())
}
