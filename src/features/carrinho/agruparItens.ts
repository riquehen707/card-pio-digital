import type { ItemCarrinho } from "@/types/carrinho"
import {
  formatCustomizationSummary,
  normalizeOrderFillings,
  normalizeOrderText,
} from "@/lib/order-formatting"

export type GrupoCarrinho = {
  chave: string
  productId: string
  nome: string
  precoUnitario: number
  quantidade: number
  recheios: string[]
  indices: number[]
  descricao: string
}

function normalizarRecheios(recheios?: string[]) {
  return normalizeOrderFillings(recheios)
}

function criarDescricao(productId: string, recheios: string[]) {
  return formatCustomizationSummary(productId, recheios) ?? ""
}

export function agruparItens(itens: ItemCarrinho[]): GrupoCarrinho[] {
  const grupos = new Map<string, GrupoCarrinho>()

  itens.forEach((item, index) => {
    const recheios = normalizarRecheios(item.recheios)
    const chave = `${item.id}|${recheios.map((recheio) => normalizeOrderText(recheio)).join(",")}`
    const grupo = grupos.get(chave)

    if (!grupo) {
      grupos.set(chave, {
        chave,
        productId: item.id,
        nome: item.nome,
        precoUnitario: item.preco,
        quantidade: 1,
        recheios,
        indices: [index],
        descricao: criarDescricao(item.id, recheios),
      })
      return
    }

    grupo.quantidade += 1
    grupo.indices.push(index)
  })

  return Array.from(grupos.values())
}
