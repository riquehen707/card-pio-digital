import { RECHEIOS_PADRAO } from "@/data/recheios"
import type { ItemCarrinho } from "@/types/carrinho"

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
  return [...(recheios ?? [])]
    .map((recheio) => recheio.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
}

function criarDescricao(nome: string, recheios: string[]) {
  if (recheios.length === 0) return `${nome} sem recheios`

  const faltando = RECHEIOS_PADRAO.filter((recheio) => !recheios.includes(recheio))
  if (faltando.length === 0) return `${nome} completo`
  if (faltando.length === RECHEIOS_PADRAO.length) return `${nome} sem recheios`

  return `${nome} com ${recheios.join(", ")}`
}

export function agruparItens(itens: ItemCarrinho[]): GrupoCarrinho[] {
  const grupos = new Map<string, GrupoCarrinho>()

  itens.forEach((item, index) => {
    const recheios = normalizarRecheios(item.recheios)
    const chave = `${item.id}|${recheios.join(",")}`
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
        descricao: criarDescricao(item.nome, recheios),
      })
      return
    }

    grupo.quantidade += 1
    grupo.indices.push(index)
  })

  return Array.from(grupos.values())
}
