"use client"

import * as React from "react"

import ProductCard from "@/components/ProductCard"
import type { Produto } from "@/types/produto"

type Props = {
  produtos: Produto[]
  addedIds: Set<string>
  onSelecionar: (produto: Produto) => void
}

function getCategoryPriority(categoria: string) {
  const categoriaNormalizada = categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  if (categoriaNormalizada === "comidas") return 0
  if (categoriaNormalizada === "bebidas") return 1

  return 10
}

export default function CategoriasGrid({ produtos, addedIds, onSelecionar }: Props) {
  const grupos = React.useMemo(() => {
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" })
    const mapa = new Map<string, Produto[]>()

    produtos.forEach((produto) => {
      const categoria = produto.categoria.trim() || "Outros"
      const grupo = mapa.get(categoria)

      if (grupo) {
        grupo.push(produto)
        return
      }

      mapa.set(categoria, [produto])
    })

    return Array.from(mapa.entries())
      .sort(([a], [b]) => {
        const priorityDiff = getCategoryPriority(a) - getCategoryPriority(b)

        if (priorityDiff !== 0) {
          return priorityDiff
        }

        return collator.compare(a, b)
      })
      .map(([categoria, itens]) => ({
        categoria,
        itens: itens.sort((a, b) => collator.compare(a.nome, b.nome)),
      }))
  }, [produtos])

  if (grupos.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Nenhum produto disponivel no momento.
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {grupos.map(({ categoria, itens }) => (
        <section key={categoria} className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{categoria}</h2>
              <p className="text-sm text-muted-foreground">
                {itens.length} {itens.length === 1 ? "item" : "itens"} nesta secao
              </p>
            </div>
          </div>

          <div className="warm-divider h-px w-full" />

          <ul
            role="list"
            className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fit,minmax(230px,1fr))] sm:gap-5"
          >
            {itens.map((produto) => (
              <li key={produto.id} className="h-full">
                <ProductCard
                  produto={produto}
                  onSelecionar={onSelecionar}
                  added={addedIds.has(produto.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
