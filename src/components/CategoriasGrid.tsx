"use client"

import * as React from "react"

import ProductCard from "@/components/ProductCard"
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
        Nenhum produto disponivel no momento.
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <nav className="flex flex-wrap gap-2">
        {grupos.map(({ categoria }) => (
          <a
            key={categoria}
            href={`#categoria-${slugify(categoria)}`}
            className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {categoria}
          </a>
        ))}
      </nav>

      {grupos.map(({ categoria, itens }) => (
        <section key={categoria} id={`categoria-${slugify(categoria)}`} className="space-y-4 scroll-mt-28">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{categoria}</h2>
            <p className="text-sm text-muted-foreground">
              {itens.length} {itens.length === 1 ? "item" : "itens"} nesta secao
            </p>
          </div>

          <ul
            role="list"
            className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] sm:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]"
          >
            {itens.map((produto) => (
              <li key={produto.id}>
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
