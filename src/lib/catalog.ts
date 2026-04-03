import { produtos } from "@/data/produtos"

const catalogoPorId = new Map(produtos.map((produto) => [produto.id, produto]))

export function getCatalogProductById(id: string) {
  return catalogoPorId.get(id) || null
}

