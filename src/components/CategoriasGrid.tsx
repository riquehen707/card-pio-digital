"use client"

import * as React from "react"

import ProductCard from "@/components/ProductCard"
import { Badge } from "@/components/ui/badge"
import type { Produto } from "@/types/produto"

type Props = {
  produtos: Produto[]
  addedIds: Set<string>
  onSelecionar: (produto: Produto) => void
}

function slugify(valor: string) {
  return (
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "categoria"
  )
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
      .sort(([a], [b]) => collator.compare(a, b))
      .map(([categoria, itens]) => ({
        categoria,
        itens: itens.sort((a, b) => collator.compare(a.nome, b.nome)),
      }))
  }, [produtos])

  if (grupos.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Nenhum produto disponível no momento.
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <nav className="mobile-category-nav -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {grupos.map(({ categoria, itens }) => (
          <a
            key={categoria}
            href={`#categoria-${slugify(categoria)}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background/78 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <span>{categoria}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {itens.length}
            </span>
          </a>
        ))}
      </nav>

      {grupos.map(({ categoria, itens }) => (
        <section
          key={categoria}
          id={`categoria-${slugify(categoria)}`}
          className="space-y-4 scroll-mt-28"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{categoria}</h2>
              <p className="text-sm text-muted-foreground">
                {itens.length} {itens.length === 1 ? "item" : "itens"} nesta seção
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80">
                Cardápio atualizado
              </Badge>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/70 sm:hidden">
                Arraste
              </p>
            </div>
          </div>

          <ul
            role="list"
            className="mobile-product-carousel -mx-4 grid snap-x snap-mandatory grid-flow-col gap-3 overflow-x-auto px-4 pb-2 [grid-auto-columns:clamp(10.5rem,43vw,12.5rem)] sm:mx-0 sm:grid-flow-row sm:overflow-visible sm:px-0 sm:pb-0 sm:[grid-auto-columns:auto] sm:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] sm:gap-5"
          >
            {itens.map((produto) => (
              <li key={produto.id} className="snap-start">
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
